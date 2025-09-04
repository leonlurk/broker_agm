import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/config';
import toast from 'react-hot-toast';

const ResetPassword = ({ onContinue, onLoginClick }) => {
  const { t } = useTranslation('auth');
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  
  useEffect(() => {
    // Verificar si llegamos desde el AuthCallback con una sesión válida
    if (location.state?.isValidSession) {
      setIsValidSession(true);
    } else {
      // Si no venimos del callback, verificar si hay una sesión activa
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t('resetPassword.errors.noSession', 'No hay sesión válida. Por favor usa el enlace del email.'));
          navigate('/forgot-password');
        } else {
          setIsValidSession(true);
        }
      };
      checkSession();
    }
  }, [location.state, navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isValidSession) {
      return setError(t('resetPassword.errors.noSession', 'Sesión inválida'));
    }

    if (password !== confirmPassword) {
      return setError(t('resetPassword.errors.passwordMismatch'));
    }

    if (password.length < 12) {
      return setError(t('resetPassword.errors.weakPassword', 'La contraseña debe tener al menos 12 caracteres'));
    }

    setLoading(true);
    
    try {
      // Actualizar la contraseña usando Supabase
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }
      
      toast.success(t('resetPassword.success', 'Contraseña actualizada exitosamente'));
      
      // Cerrar sesión para que el usuario inicie sesión con su nueva contraseña
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: t('resetPassword.loginMessage', 'Tu contraseña ha sido actualizada. Por favor inicia sesión con tu nueva contraseña.') 
          }
        });
      }, 2000);
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message || t('resetPassword.errors.general'));
    } finally {
      setLoading(false);
    }
  };

  // No mostrar el formulario si no hay sesión válida
  if (!isValidSession) {
    return (
      <div className="w-[420px] h-[900px] sm:w-full md:w-[620px] p-6 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">{t('loading', 'Verificando sesión...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[420px] h-[900px] sm:w-full md:w-[620px] p-6 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
      <div className="flex justify-center mb-8">
        <img src="/Capa_x0020_1.svg" alt="Broker Logo" className="h-16" />
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
          
          <div className="relative">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20"
              placeholder={t('fields.confirmPassword')}
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg relative overflow-hidden group"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative z-10">{loading ? t('resetPassword.loading') : t('resetPassword.button')}</span>
        </button>

        <div className="mt-4 text-center">
          <p className="text-gray-400 mt-1">
            {t('resetPassword.backToLogin')} <button type="button" onClick={onLoginClick} className="text-white font-semibold bg-transparent">{t('login.signIn')}</button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword; 