import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { resendVerificationEmail } from '../supabase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { AuthAdapter } from '../services/database.adapter';
import toast from 'react-hot-toast';

const EmailVerificationPending = () => {
  const { t, ready, i18n } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [pendingUser, setPendingUser] = useState(null);
  
  // Log para debug
  useEffect(() => {
    console.log('EmailVerificationPending - i18n ready:', ready);
    console.log('EmailVerificationPending - current language:', i18n.language);
    console.log('EmailVerificationPending - test translation:', t('emailPending.title'));
  }, [ready, i18n.language, t]);
  
  // Handle email from login redirect
  useEffect(() => {
    console.log('EmailVerificationPending - Location state:', location.state);
    
    if (location.state?.email && location.state?.fromLogin) {
      console.log('EmailVerificationPending - Processing email from login:', location.state.email);
      
      // SECURITY FIX: Only use login state email if no pending user data exists
      // This prevents referral bug where referrer's email overwrites registering user's email
      const existingPendingUser = localStorage.getItem('pending_verification_user');
      
      if (!existingPendingUser) {
        const newPendingUser = { email: location.state.email };
        setPendingUser(newPendingUser);
        console.log('EmailVerificationPending - pendingUser set to:', newPendingUser);
        
        // Store fresh email data only if none exists
        localStorage.setItem('pending_verification_user', JSON.stringify({
          ...newPendingUser,
          timestamp: Date.now()
        }));
      } else {
        console.log('EmailVerificationPending - Existing pending user found, not overwriting with login state');
      }
      
      // Clear the location state to prevent reprocessing
      window.history.replaceState({}, document.title);
    } else {
      console.log('EmailVerificationPending - No email from login state');
    }
  }, [location.state]);
  
  // Rate limit configuration - Prioritize pending user email from registration
  // Fix for referral bug: Always prioritize the email from localStorage (actual registering user)
  // over location.state which might contain referrer's email
  const userEmail = pendingUser?.email || currentUser?.email || location.state?.email;
  const RATE_LIMIT_KEY = `email_verification_${userEmail}`;
  const MAX_ATTEMPTS = 3; // Máximo 3 intentos
  const COOLDOWN_TIME = 60; // 60 segundos entre intentos
  const BLOCK_TIME = 300; // 5 minutos de bloqueo después de 3 intentos
  
  // Load rate limit state from localStorage on mount
  useEffect(() => {
    if (userEmail) {
      const storedData = localStorage.getItem(RATE_LIMIT_KEY);
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          const now = Date.now();
          
          // Check if user is blocked (after max attempts)
          if (data.attempts >= MAX_ATTEMPTS && data.blockedUntil > now) {
            const remainingSeconds = Math.ceil((data.blockedUntil - now) / 1000);
            setCountdown(remainingSeconds);
            setAttemptCount(data.attempts);
            // No mostrar toast aquí, solo setear el contador
          }
          // Check if still in cooldown
          else if (data.lastAttempt && (now - data.lastAttempt) < COOLDOWN_TIME * 1000) {
            const remainingSeconds = Math.ceil((COOLDOWN_TIME * 1000 - (now - data.lastAttempt)) / 1000);
            setCountdown(remainingSeconds);
            setAttemptCount(data.attempts || 0);
          }
          // Reset if block time has passed
          else if (data.attempts >= MAX_ATTEMPTS && data.blockedUntil <= now) {
            localStorage.removeItem(RATE_LIMIT_KEY);
            setAttemptCount(0);
          } else {
            setAttemptCount(data.attempts || 0);
          }
        } catch (e) {
          console.error('Error parsing rate limit data:', e);
        }
      }
    }
  }, [userEmail, RATE_LIMIT_KEY]);
  
  // Cargar información del usuario pendiente de verificación (solo una vez)
  useEffect(() => {
    const tempUserData = localStorage.getItem('pending_verification_user');
    if (tempUserData) {
      try {
        const userData = JSON.parse(tempUserData);
        // Verificar que los datos no sean muy antiguos (máximo 1 hora)
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - userData.timestamp < oneHour) {
          setPendingUser(userData);
        } else {
          // Datos expirados, limpiar
          localStorage.removeItem('pending_verification_user');
        }
      } catch (error) {
        console.error('Error parsing pending user data:', error);
        localStorage.removeItem('pending_verification_user');
      }
    }
  }, []); // Sin dependencias, solo ejecutar una vez

  // Redirigir al login si no hay usuario ni datos temporales
  useEffect(() => {
    // Add a small delay to allow pendingUser state to be set
    const checkRedirect = () => {
      const tempUserData = localStorage.getItem('pending_verification_user');
      
      // DEBUG: Log all conditions with more detail
      console.log('EmailVerificationPending - Checking redirect conditions:', {
        hasCurrentUser: !!currentUser,
        hasTempUserData: !!tempUserData,
        hasPendingUser: !!pendingUser,
        currentUserEmail: currentUser?.email,
        tempUserData: tempUserData ? JSON.parse(tempUserData) : null,
        pendingUserEmail: pendingUser?.email,
        locationStateEmail: location.state?.email,
        locationFromLogin: location.state?.fromLogin,
        shouldRedirect: !currentUser && !tempUserData && !pendingUser && !location.state?.fromLogin
      });
      
      // Don't redirect if we're coming from login or have any user data
      if (!currentUser && !tempUserData && !pendingUser && !location.state?.fromLogin) {
        console.log('EmailVerificationPending - REDIRECTING TO LOGIN - No user data found');
        navigate('/login');
      } else {
        console.log('EmailVerificationPending - STAYING ON PAGE - User data found or coming from login');
      }
    };
    
    // Small delay to ensure all state updates have completed
    const timeoutId = setTimeout(checkRedirect, 100);
    
    return () => clearTimeout(timeoutId);
  }, [currentUser, navigate, pendingUser, location.state]);
  
  // Countdown timer para rate limiting visual
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // Save rate limit state to localStorage
  const saveRateLimitState = (attempts, blockedUntil = null) => {
    const data = {
      attempts,
      lastAttempt: Date.now(),
      blockedUntil
    };
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  };
  
  const handleResendEmail = async () => {
    if (resending || countdown > 0) return;
    
    // Check if user has reached max attempts
    if (attemptCount >= MAX_ATTEMPTS) {
      const storedData = localStorage.getItem(RATE_LIMIT_KEY);
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.blockedUntil > Date.now()) {
          toast.error(t('emailPending.messages.rateLimited', `Has alcanzado el límite de ${MAX_ATTEMPTS} intentos. Por favor espera antes de intentar nuevamente.`, { max: MAX_ATTEMPTS }));
          return;
        }
      }
    }
    
    setResending(true);
    
    try {
      const result = await resendVerificationEmail(userEmail);
      
      if (result.success) {
        // Increment attempt count
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        
        // Set appropriate cooldown
        if (newAttemptCount >= MAX_ATTEMPTS) {
          // Block for 5 minutes after max attempts
          const blockedUntil = Date.now() + (BLOCK_TIME * 1000);
          saveRateLimitState(newAttemptCount, blockedUntil);
          setCountdown(BLOCK_TIME);
          toast.success(t('emailPending.messages.limitReached', '¡Email enviado! Has alcanzado el límite de intentos. Espera 5 minutos antes de intentar nuevamente.'));
        } else {
          // Normal cooldown
          saveRateLimitState(newAttemptCount);
          setCountdown(COOLDOWN_TIME);
          toast.success(t('emailPending.messages.emailSent', `¡Email de verificación enviado! Revisa tu bandeja de entrada. (Intento ${newAttemptCount}/${MAX_ATTEMPTS})`, { current: newAttemptCount, max: MAX_ATTEMPTS }));
        }
      } else {
        if (result.rateLimited && result.remainingSeconds) {
          setCountdown(result.remainingSeconds);
          toast.error(result.error);
        } else {
          toast.error(result.error || t('auth.errors.general', 'Ocurrió un error'));
        }
      }
    } catch (error) {
      toast.error(t('auth.errors.unexpected', 'Error inesperado'));
    } finally {
      setResending(false);
    }
  };
  
  const handleGoToLogin = async () => {
    // Con "Confirm email" activado en Supabase, si el usuario hace clic aquí
    // es porque cree que ya verificó su email pero sigue viendo esta pantalla
    setResending(true);
    
    try {
      // Hacer logout y redirigir al login para que vuelva a intentar autenticarse
      // Si realmente verificó su email, ahora podrá entrar sin problemas
      await AuthAdapter.logoutUser();
      
      // Limpiar datos temporales y rate limit
      localStorage.removeItem('pending_verification_user');
      if (RATE_LIMIT_KEY) {
        localStorage.removeItem(RATE_LIMIT_KEY);
      }
      
      navigate('/login', { 
        state: { 
          message: 'Por favor inicia sesión nuevamente. Si ya verificaste tu email, podrás acceder normalmente.' 
        }
      });
      
    } catch (error) {
      console.error('Error al hacer logout:', error);
      toast.error(t('emailPending.messages.verifyError', 'Error al verificar el estado. Por favor intenta de nuevo.'));
    } finally {
      setResending(false);
    }
  };
  
  // Si las traducciones no están listas, mostrar un loading o contenido en español por defecto
  if (!ready) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: 'url(/fondo.png)', width: '100vw', height: '100vh' }}>
        <div className="w-[330px] h-[700px] sm:w-full md:w-[490px] p-5 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex items-center justify-center">
          <div className="text-white">Cargando...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: 'url(/fondo.png)', width: '100vw', height: '100vh' }}>
      <div className="w-[330px] h-[700px] sm:w-full md:w-[490px] p-5 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/Capa_x0020_1.svg" alt="Broker Logo" className="h-16" />
          </div>
          
          {/* Icono y título */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">!</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-white text-center mb-3">
            {t('emailPending.title', 'Verificación de Email Pendiente')}
          </h1>
          
          {/* Mensaje principal */}
          <p className="text-gray-300 text-center mb-6">
            {t('emailPending.sentTo', 'Hemos enviado un email de verificación a:')}
          </p>
          
          {/* Email del usuario */}
          <div className="bg-gray-900 bg-opacity-20 border border-gray-700 rounded-lg p-3 mb-4">
            <p className="text-white text-center text-sm font-medium">
              {userEmail}
            </p>
          </div>
          
          {/* Instrucciones */}
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-xs">
                {t('emailPending.instructions.checkInbox', 'Revisa tu bandeja de entrada y haz clic en el enlace de verificación')}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-xs">
                {t('emailPending.instructions.checkSpam', 'Si no encuentras el email, revisa tu carpeta de spam')}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-xs">
                {t('emailPending.instructions.accessBroker', 'Una vez verificado, podrás acceder al broker')}
              </p>
            </div>
          </div>
          
          {/* Contador de intentos */}
          {attemptCount > 0 && attemptCount < MAX_ATTEMPTS && (
            <div className="bg-blue-500 bg-opacity-20 border border-blue-600 text-white px-4 py-2 rounded-lg mb-4">
              <p className="text-xs text-center">
                {t('emailPending.attempts', `Intentos de reenvío: ${attemptCount}/${MAX_ATTEMPTS}`, { current: attemptCount, max: MAX_ATTEMPTS })}
              </p>
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
                  {t('emailPending.resending', 'Enviando...')}
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  {countdown > COOLDOWN_TIME ? 
                    t('emailPending.blockedTime', `Bloqueado (${Math.ceil(countdown / 60)}min ${countdown % 60}s)`, { minutes: Math.ceil(countdown / 60), seconds: countdown % 60 }) : 
                    t('emailPending.cooldown', `Reenviar email (${countdown}s)`, { seconds: countdown })
                  }
                </>
              ) : attemptCount >= MAX_ATTEMPTS ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  {t('emailPending.limitReached', 'Límite de intentos alcanzado')}
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  {t('emailPending.resendButton', 'Reenviar email de verificación')}
                </>
              )}
            </button>
            
            {/* Botón para verificar */}
            <button
              onClick={handleGoToLogin}
              disabled={resending}
              className="w-full py-3 px-4 rounded-full font-medium bg-gray-900 bg-opacity-20 border border-gray-700 text-gray-300 hover:bg-gray-800 hover:bg-opacity-30 transition-colors flex items-center justify-center gap-2"
            >
              {resending ? t('emailPending.verifyingStatus', 'Verificando...') : t('emailPending.alreadyVerified', 'Ya verifiqué mi email')}
              {!resending && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Nota adicional */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              {t('emailPending.support', '¿Necesitas ayuda? Contacta a')}{' '}
              <a href="mailto:support@alphaglobalmarket.io" className="text-cyan-400 hover:text-cyan-300">
                support@alphaglobalmarket.io
              </a>
            </p>
          </div>
      </div>
    </div>
  );
};

export default EmailVerificationPending;