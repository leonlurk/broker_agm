import { useState, useEffect, useRef } from 'react';
import { AuthAdapter, DatabaseAdapter } from '../services/database.adapter';
import { useTranslation } from 'react-i18next';
import twoFactorService from '../services/twoFactorService';
import TwoFactorEmailModal from './TwoFactorEmailModal';
import { Shield, Mail, Eye, EyeOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resendVerificationEmail } from '../supabase/auth';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const Login = ({ onRegisterClick, onForgotClick, onLoginSuccess }) => {
  const { t } = useTranslation('auth');
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, refreshUserData } = useAuth();
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
  const [showVerificationNeeded, setShowVerificationNeeded] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const toastShownRef = useRef(false);

  // Check for messages from register page
  useEffect(() => {
    if (location.state?.message && !toastShownRef.current) {
      // Show as toast instead of inline message (only once)
      toast.success(location.state.message);
      toastShownRef.current = true;
      
      if (location.state.email) {
        setVerificationEmail(location.state.email);
      }
      // Clear the state to prevent showing again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);
  
  // Auto-navigate when authentication state changes
  useEffect(() => {
    if (isAuthenticated && !show2FA && !showEmail2FA) {
      // User is authenticated and not in 2FA flow, navigate to dashboard
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, show2FA, showEmail2FA]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { user, error } = await AuthAdapter.loginUser(username, password);
      
      if (error) {
        // Check if error is due to unverified email
        if (error.message?.includes('email not confirmed') || error.message?.includes('Email not verified')) {
          setShowVerificationNeeded(true);
          setVerificationEmail(username.includes('@') ? username : user?.email || '');
          toast.error('Tu email no está verificado. Por favor verifica tu email antes de iniciar sesión.');
          setLoading(false);
          return;
        }
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
        // No 2FA, check email verification before proceeding
        console.log('Login successful, checking email verification:', user);
        
        // Check if email is verified in the database
        const userId = user.id || user.uid;
        const { data: userData } = await DatabaseAdapter.users.getById(userId);
        
        if (userData && userData.email_verified === false) {
          // Email not verified, redirect to verification pending page
          console.log('Email not verified, redirecting to verification page');
          navigate('/verify-email-pending');
        } else {
          // Email verified or old user, proceed to dashboard
          console.log('Email verified, proceeding to dashboard');
          
          // Force refresh user data in AuthContext
          if (refreshUserData) {
            await refreshUserData();
          }
          
          // The useEffect will handle navigation when isAuthenticated becomes true
          // But also call onLoginSuccess as fallback
          setTimeout(() => {
            if (!isAuthenticated) {
              onLoginSuccess();
            }
          }, 100);
        }
      }
    } catch (err) {
      console.error('Login component error:', err);
      toast.error(err.message || t('errors.unexpected'));
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      toast.error(t('twoFactor.errors.invalidCode'));
      return;
    }

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
          toast.error(t('twoFactor.errors.incorrectCode'));
          setLoading(false);
          return;
        }
      }
      
      // 2FA verified, check email verification before proceeding
      console.log('Login successful with 2FA, checking email verification:', tempUser);
      
      // Check if email is verified in the database
      const { data: userData } = await DatabaseAdapter.users.getById(userId);
      
      if (userData && userData.email_verified === false) {
        // Email not verified, redirect to verification pending page
        console.log('Email not verified, redirecting to verification page');
        navigate('/verify-email-pending');
      } else {
        // Email verified or old user, proceed to dashboard
        console.log('Email verified, proceeding to dashboard');
        
        // Force refresh user data in AuthContext
        if (refreshUserData) {
          await refreshUserData();
        }
        
        // The useEffect will handle navigation when isAuthenticated becomes true
        // But also call onLoginSuccess as fallback
        setTimeout(() => {
          if (!isAuthenticated) {
            onLoginSuccess();
          }
        }, 100);
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      toast.error(t('twoFactor.errors.verifyFailed'));
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) {
      toast.error('Por favor ingresa tu email primero');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const result = await resendVerificationEmail(verificationEmail);
      
      if (result.success) {
        setMessage('Email de verificación reenviado exitosamente. Por favor revisa tu correo.');
        setShowVerificationNeeded(false);
      } else {
        toast.error(result.error || 'Error al reenviar el email de verificación');
      }
    } catch (err) {
      console.error('Error resending verification:', err);
      toast.error('Error al reenviar el email de verificación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] md:max-w-[490px] min-h-[500px] p-6 sm:p-8 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
      <div className="flex justify-center mb-4 sm:mb-6">
        <img src="/Capa_x0020_1.svg" alt="Broker Logo" className="h-12 sm:h-16" />
      </div>
      

      {showVerificationNeeded && (
        <div className="bg-yellow-500 bg-opacity-20 border border-yellow-600 text-white px-4 py-2 rounded-lg mb-4">
          <div className="text-sm mb-2">Email no verificado</div>
          <button
              onClick={handleResendVerification}
              disabled={loading}
              className="mt-2 w-full py-2 px-4 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 transition flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {loading ? 'Enviando...' : 'Reenviar email de verificación'}
            </button>
        </div>
      )}
      
      {!show2FA ? (
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 pr-12 bg-opacity-20"
              placeholder={t('fields.password')}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-400 hover:text-gray-300 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-sm">
          <div className="flex items-center">
            <input
              id="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember_me" className="ml-2 block text-gray-300 whitespace-nowrap">
              {t('login.rememberMe')}
            </label>
          </div>
          <button
            type="button"
            onClick={onForgotClick}
            className="text-white hover:text-blue-500 bg-transparent text-left sm:text-right"
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
          onSuccess={async () => {
            setShowEmail2FA(false);
            console.log('Login successful with email 2FA, checking email verification:', tempUser);
            
            // Check if email is verified in the database
            const userId = tempUser.id || tempUser.uid;
            const { data: userData } = await DatabaseAdapter.users.getById(userId);
            
            if (userData && userData.email_verified === false) {
              // Email not verified, redirect to verification pending page
              console.log('Email not verified, redirecting to verification page');
              navigate('/verify-email-pending');
            } else {
              // Email verified or old user, proceed to dashboard
              console.log('Email verified, proceeding to dashboard');
              
              // Force refresh user data in AuthContext
              if (refreshUserData) {
                await refreshUserData();
              }
              
              // The useEffect will handle navigation when isAuthenticated becomes true
              // But also call onLoginSuccess as fallback
              setTimeout(() => {
                if (!isAuthenticated) {
                  onLoginSuccess();
                }
              }, 100);
            }
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