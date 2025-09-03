import { useState } from 'react';
import { AuthAdapter } from '../services/database.adapter';
import emailServiceProxy from '../services/emailServiceProxy';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const ForgotPassword = ({ onContinue, onLoginClick }) => {
  const { t } = useTranslation('auth');
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
      
      // Supabase already sends the reset email, no need for Brevo
      console.log('[ForgotPassword] Password reset email sent via Supabase');
      
      toast.success(t('forgotPassword.success'));
      setTimeout(() => {
        onLoginClick();
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      toast.error(err.message || t('forgotPassword.errors.general'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[330px] h-[700px] sm:w-full md:w-[490px] p-5 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
      <div className="flex justify-center mb-6">
        <img src="/Capa_x0020_1.svg" alt="Broker Logo" className="h-16" />
      </div>
      
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
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