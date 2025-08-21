import { useState } from 'react';
import { AuthAdapter } from '../services/database.adapter';
import emailServiceProxy from '../services/emailServiceProxy';
import { useTranslation } from 'react-i18next';

const ForgotPassword = ({ onContinue, onLoginClick }) => {
  const { t } = useTranslation('auth');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const { success, error } = await AuthAdapter.resetPassword(email);
      
      if (error) {
        throw new Error(error.message || t('forgotPassword.errors.sendFailed'));
      }
      
      // Send password reset email through Brevo
      try {
        const resetLink = `https://alphaglobalmarket.io/reset-password?email=${encodeURIComponent(email)}`;
        await emailServiceProxy.sendPasswordResetEmail(
          { email: email, name: username || t('common.user') },
          resetLink
        );
        console.log('[ForgotPassword] Password reset email sent via Brevo');
      } catch (emailError) {
        console.error('[ForgotPassword] Error sending reset email via Brevo:', emailError);
        // Don't block the flow if Brevo fails, Firebase already sent one
      }
      
      setMessage(t('forgotPassword.success'));
      setTimeout(() => {
        onContinue();
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || t('forgotPassword.errors.general'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[420px] h-[900px] sm:w-full md:w-[620px] p-6 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
      <div className="flex justify-center mb-8">
        <img src="/logo.png" alt="AGM Logo" className="h-25" />
      </div>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-600 text-white px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-500 bg-opacity-20 border border-green-600 text-white px-4 py-2 rounded-lg mb-4">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">          
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20"
              placeholder={t('fields.username')}
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20"
              placeholder={t('fields.email')}
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>

        <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg relative overflow-hidden group"
        >
        <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        <span className="relative z-10">{loading ? t('forgotPassword.loading') : t('forgotPassword.button')}</span>
        </button>

        <div className="mt-4 text-center">
          <p className="text-gray-400 mt-1">
            {t('forgotPassword.backToLogin')} <button type="button" onClick={onLoginClick} className="text-white font-semibold bg-transparent">{t('login.signIn')}</button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;