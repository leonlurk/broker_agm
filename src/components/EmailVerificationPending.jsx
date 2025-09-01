import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { resendVerificationEmail } from '../supabase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { DatabaseAdapter } from '../services/database.adapter';

const EmailVerificationPending = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  // Si el usuario no está autenticado, redirigir al login
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);
  
  // Countdown timer para rate limiting visual
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleResendEmail = async () => {
    if (resending || countdown > 0) return;
    
    setResending(true);
    setResendMessage('');
    setResendError('');
    
    try {
      const result = await resendVerificationEmail(currentUser?.email);
      
      if (result.success) {
        setResendMessage('¡Email de verificación enviado! Revisa tu bandeja de entrada.');
        setCountdown(60); // 60 segundos de espera antes de poder reenviar
      } else {
        if (result.rateLimited && result.remainingSeconds) {
          setCountdown(result.remainingSeconds);
          setResendError(result.error);
        } else {
          setResendError(result.error || 'Error al enviar el email de verificación');
        }
      }
    } catch (error) {
      setResendError('Error inesperado. Por favor intenta más tarde.');
    } finally {
      setResending(false);
    }
  };
  
  const handleGoToLogin = async () => {
    // Verificar si el email ya fue verificado antes de navegar
    setResending(true);
    setResendError('');
    
    try {
      // Verificar el estado actual del usuario
      const { data: userData } = await DatabaseAdapter.users.getById(currentUser?.id || currentUser?.uid);
      
      if (userData && userData.email_verified === true) {
        // Email verificado, puede ir al dashboard
        navigate('/dashboard');
      } else {
        // Email aún no verificado
        setResendError('Tu email aún no ha sido verificado. Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación.');
      }
    } catch (error) {
      console.error('Error verificando estado:', error);
      setResendError('Error al verificar el estado. Por favor intenta nuevamente.');
    } finally {
      setResending(false);
    }
  };
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: 'url(/fondo.png)', width: '100vw', height: '100vh' }}>
      <div className="w-[330px] h-[700px] sm:w-full md:w-[490px] p-5 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="AGM Logo" className="h-16" />
          </div>
          
          {/* Icono y título */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">!</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-white text-center mb-3">
            Verificación de Email Pendiente
          </h1>
          
          {/* Mensaje principal */}
          <p className="text-gray-300 text-center mb-6">
            Hemos enviado un email de verificación a:
          </p>
          
          {/* Email del usuario */}
          <div className="bg-gray-900 bg-opacity-20 border border-gray-700 rounded-lg p-3 mb-4">
            <p className="text-cyan-400 text-center text-sm font-medium">
              {currentUser?.email}
            </p>
          </div>
          
          {/* Instrucciones */}
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-xs">
                Revisa tu bandeja de entrada y haz clic en el enlace de verificación
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-xs">
                Si no encuentras el email, revisa tu carpeta de spam
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-xs">
                Una vez verificado, podrás acceder al broker
              </p>
            </div>
          </div>
          
          {/* Mensaje de éxito o error */}
          {resendMessage && (
            <div className="bg-green-500 bg-opacity-20 border border-green-600 text-white px-4 py-2 rounded-lg mb-4">
              <p className="text-sm text-center">{resendMessage}</p>
            </div>
          )}
          
          {resendError && (
            <div className="bg-red-500 bg-opacity-20 border border-red-600 text-white px-4 py-2 rounded-lg mb-4">
              <p className="text-sm text-center">{resendError}</p>
            </div>
          )}
          
          {/* Botones de acción */}
          <div className="space-y-3">
            {/* Botón de reenviar */}
            <button
              onClick={handleResendEmail}
              disabled={resending || countdown > 0}
              className={`w-full py-3 px-4 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2
                ${countdown > 0 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : resending 
                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90'
                }`}
            >
              {resending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Reenviar email ({countdown}s)
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Reenviar email de verificación
                </>
              )}
            </button>
            
            {/* Botón para verificar */}
            <button
              onClick={handleGoToLogin}
              disabled={resending}
              className="w-full py-3 px-4 rounded-full font-medium bg-gray-900 bg-opacity-20 border border-gray-700 text-gray-300 hover:bg-gray-800 hover:bg-opacity-30 transition-colors flex items-center justify-center gap-2"
            >
              {resending ? 'Verificando...' : 'Ya verifiqué mi email'}
              {!resending && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Nota adicional */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              ¿Problemas? Contacta a{' '}
              <a href="mailto:soporte@agmbroker.com" className="text-cyan-400 hover:text-cyan-300">
                soporte@agmbroker.com
              </a>
            </p>
          </div>
      </div>
    </div>
  );
};

export default EmailVerificationPending;