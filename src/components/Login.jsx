import { useState } from 'react';
import { AuthAdapter } from '../services/database.adapter';
import { useTranslation } from 'react-i18next';
import twoFactorService from '../services/twoFactorService';
import TwoFactorEmailModal from './TwoFactorEmailModal';
import { Shield } from 'lucide-react';

const Login = ({ onRegisterClick, onForgotClick, onLoginSuccess }) => {
  const { t } = useTranslation('auth');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempUser, setTempUser] = useState(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState(null);
  const [showEmail2FA, setShowEmail2FA] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { user, error } = await AuthAdapter.loginUser(username, password);
      
      if (error) {
        throw new Error(error.message || t('errors.loginFailed'));
      }
      
      // Check if user has 2FA enabled
      const userId = user.id || user.uid;
      const twoFAStatus = await twoFactorService.get2FAStatus(userId);
      
      if (twoFAStatus.enabled) {
        // Get 2FA method
        const methodResult = await twoFactorService.get2FAMethod(userId);
        setTwoFactorMethod(methodResult.method);
        setTempUser(user);
        
        if (methodResult.method === 'email') {
          // Show email 2FA modal
          setShowEmail2FA(true);
        } else {
          // Show authenticator 2FA
          setShow2FA(true);
        }
        setLoading(false);
      } else {
        // No 2FA, proceed with login
        console.log('Login successful:', user);
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Login component error:', err);
      setError(err.message || t('errors.unexpected'));
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      setError(t('twoFactor.errors.invalidCode'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      const userId = tempUser.id || tempUser.uid;
      const twoFAStatus = await twoFactorService.get2FAStatus(userId);
      
      // Verify the code
      const isValid = await twoFactorService.verifyToken(twoFactorCode, twoFAStatus.secret, userId);
      
      if (!isValid) {
        // Try backup code
        const backupValid = await twoFactorService.verifyBackupCode(userId, twoFactorCode);
        
        if (!backupValid) {
          setError(t('twoFactor.errors.incorrectCode'));
          setLoading(false);
          return;
        }
      }
      
      // 2FA verified, proceed with login
      console.log('Login successful with 2FA:', tempUser);
      onLoginSuccess();
    } catch (err) {
      console.error('2FA verification error:', err);
      setError(t('twoFactor.errors.verifyFailed'));
      setLoading(false);
    }
  };

  return (
    <div className="w-[330px] h-[700px] sm:w-full md:w-[490px] p-5 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="Broker Logo" className="h-16" />
      </div>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-600 text-white px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {!show2FA ? (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20"
              placeholder={t('fields.emailOrUsername')}
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20"
              placeholder={t('fields.password')}
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <input
              id="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember_me" className="ml-2 block text-gray-300">
              {t('login.rememberMe')}
            </label>
          </div>
          <button
            type="button"
            onClick={onForgotClick}
            className="text-white hover:text-blue-500 bg-transparent whitespace-nowrap"
          >
            {t('login.forgotPassword')}
          </button>
        </div>

        <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg relative overflow-hidden group"
            >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10">{loading ? t('login.loggingIn') : t('login.signIn')}</span>
        </button>

        <div className="mt-4 text-center">
          <p className="text-gray-400 mt-1">
            {t('login.noAccount')} <button type="button" onClick={onRegisterClick} className="text-white font-semibold bg-transparent">{t('login.signUp')}</button>
          </p>
        </div>
      </form>
      ) : (
        <div className="space-y-5">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 text-cyan-500 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">{t('twoFactor.title')}</h3>
            <p className="text-gray-400 text-sm">{t('twoFactor.enterCode')}</p>
          </div>
          
          <div className="flex justify-center">
            <input
              type="text"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl font-mono w-40 px-4 py-3 bg-gray-900 bg-opacity-20 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              maxLength="6"
              autoFocus
            />
          </div>
          
          <button
            onClick={handleVerify2FA}
            disabled={loading || twoFactorCode.length !== 6}
            className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg relative overflow-hidden group disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10">
              {loading ? t('twoFactor.verifying') : t('twoFactor.verify')}
            </span>
          </button>
          
          <button
            onClick={() => {
              setShow2FA(false);
              setTwoFactorCode('');
              setError('');
            }}
            className="w-full py-2 text-gray-400 hover:text-white transition-colors"
          >
            {t('twoFactor.back')}
          </button>
        </div>
      )}

      {/* Email 2FA Modal */}
      {showEmail2FA && tempUser && (
        <TwoFactorEmailModal
          isOpen={showEmail2FA}
          onClose={() => {
            setShowEmail2FA(false);
            setError('');
          }}
          onSuccess={() => {
            setShowEmail2FA(false);
            console.log('Login successful with email 2FA:', tempUser);
            onLoginSuccess();
          }}
          isSetup={false}
          currentUser={tempUser}
          userData={{ email: tempUser.email, nombre: tempUser.display_name }}
        />
      )}
    </div>
  );
};

export default Login;