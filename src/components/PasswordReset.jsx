import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { AuthAdapter } from '../services/database.adapter';
import { supabase } from '../supabase/config';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const PasswordReset = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validCode, setValidCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);
  const [isEmailRecovery, setIsEmailRecovery] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkForEmailRecovery = async () => {
      try {
        // Debug logs
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Pathname:', window.location.pathname);
        
        // Verificar si viene del email con tokens en el hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        // También verificar si ya hay una sesión activa (Supabase puede haber procesado el token)
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Current session:', session);
        console.log('Session error:', error);
        
        // Verificar si estamos en la ruta de reset password
        const isOnResetRoute = window.location.pathname.includes('reset-password');
        
        // Si hay token de recuperación O sesión activa Y estamos en la página de reset
        if ((type === 'recovery' && accessToken) || (session && isOnResetRoute)) {
          console.log('Email recovery flow detected!');
          setIsEmailRecovery(true);
          setIsValidSession(true);
          setValidCode(true); // Para habilitar el formulario
        } else {
          // Flujo normal con código de verificación
          console.log('Normal verification code flow');
          const urlCode = searchParams.get('code');
          if (urlCode) {
            setCode(urlCode);
            validateCode(urlCode);
          } else {
            setIsEmailRecovery(false);
            setIsValidSession(false);
          }
        }
      } catch (error) {
        console.error('Error checking email recovery:', error);
        setIsEmailRecovery(false);
        setIsValidSession(false);
      } finally {
        setCheckingSession(false);
      }
    };

    checkForEmailRecovery();
  }, [searchParams, navigate, t]);

  const validateCode = (inputCode) => {
    try {
      const storedData = localStorage.getItem('passwordResetCode');
      if (!storedData) {
        setCodeError(t('resetPassword.errors.tokenExpired'));
        setValidCode(false);
        setIsValidSession(false);
        return false;
      }

      const { code: storedCode, timestamp, expiresIn } = JSON.parse(storedData);
      
      // Verificar si el código ha expirado
      if (Date.now() - timestamp > expiresIn) {
        setCodeError(t('resetPassword.errors.tokenExpired'));
        setValidCode(false);
        setIsValidSession(false);
        localStorage.removeItem('passwordResetCode');
        return false;
      }

      // Verificar si el código coincide
      if (inputCode !== storedCode) {
        setCodeError(t('resetPassword.errors.tokenInvalid'));
        setValidCode(false);
        setIsValidSession(false);
        return false;
      }

      setCodeError('');
      setValidCode(true);
      setIsValidSession(true);
      return true;
    } catch (error) {
      setCodeError(t('resetPassword.errors.tokenInvalid'));
      setValidCode(false);
      setIsValidSession(false);
      return false;
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    if (value.length === 6) {
      validateCode(value);
    }
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };
    return requirements;
  };

  const requirements = validatePassword(newPassword);
  const allRequirementsMet = Object.values(requirements).every(req => req);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Solo validar código si no es recuperación desde email
    if (!isEmailRecovery && !validCode) {
      toast.error(t('resetPassword.errors.tokenInvalid'));
      return;
    }

    if (!allRequirementsMet) {
      toast.error(t('resetPassword.errors.weakPassword'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('resetPassword.errors.passwordMismatch'));
      return;
    }

    setLoading(true);
    const toastId = toast.loading(t('resetPassword.loading'));

    try {
      let result;
      
      if (isEmailRecovery) {
        // Usar Supabase para actualizar contraseña
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) {
          throw error;
        }
        
        result = { success: true };
      } else {
        // Flujo normal con código
        const storedData = JSON.parse(localStorage.getItem('passwordResetCode'));
        result = await AuthAdapter.updatePassword(storedData.email, newPassword);
      }

      if (result.success) {
        toast.success(t('resetPassword.success'), { id: toastId });
        localStorage.removeItem('passwordResetCode');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(result.error || t('resetPassword.errors.updateFailed'), { id: toastId });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(t('resetPassword.errors.general'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras verificamos la sesión
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">{t('loading', 'Verificando sesión...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#232323] border border-[#333] rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('resetPassword.title')}</h1>
            <p className="text-gray-400">
              {isEmailRecovery 
                ? t('resetPassword.enterNewPassword', 'Ingresa tu nueva contraseña')
                : t('resetPassword.description')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Código de verificación - Solo mostrar si NO es recuperación desde email */}
            {!isEmailRecovery && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('resetPassword.verificationCode')}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="123456"
                  className={`w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border ${
                    codeError ? 'border-red-500' : validCode ? 'border-green-500' : 'border-[#333]'
                  } text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                  maxLength="6"
                  required={!isEmailRecovery}
                />
                {codeError && (
                  <p className="mt-2 text-sm text-red-400">{codeError}</p>
                )}
                {validCode && (
                  <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                    <Check size={16} /> Código válido
                  </p>
                )}
              </div>
            )}

            {/* Nueva contraseña - Mostrar si es recuperación desde email O si el código es válido */}
            {(isEmailRecovery || validCode) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('resetPassword.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#333] text-white pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Requisitos de contraseña */}
                  <div className="mt-3 space-y-1">
                    <p className={`text-xs flex items-center gap-1 ${requirements.length ? 'text-green-400' : 'text-gray-400'}`}>
                      {requirements.length ? <Check size={14} /> : <X size={14} />}
                      {t('resetPassword.requirements.minLength')}
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${requirements.uppercase ? 'text-green-400' : 'text-gray-400'}`}>
                      {requirements.uppercase ? <Check size={14} /> : <X size={14} />}
                      {t('resetPassword.requirements.uppercase')}
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${requirements.lowercase ? 'text-green-400' : 'text-gray-400'}`}>
                      {requirements.lowercase ? <Check size={14} /> : <X size={14} />}
                      {t('resetPassword.requirements.lowercase')}
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${requirements.number ? 'text-green-400' : 'text-gray-400'}`}>
                      {requirements.number ? <Check size={14} /> : <X size={14} />}
                      {t('resetPassword.requirements.number')}
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${requirements.special ? 'text-green-400' : 'text-gray-400'}`}>
                      {requirements.special ? <Check size={14} /> : <X size={14} />}
                      {t('resetPassword.requirements.special')}
                    </p>
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('resetPassword.confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border ${
                        confirmPassword && confirmPassword !== newPassword ? 'border-red-500' : 'border-[#333]'
                      } text-white pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="mt-2 text-sm text-red-400">{t('resetPassword.errors.passwordMismatch')}</p>
                  )}
                </div>
              </>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading || (!isEmailRecovery && !isValidSession) || !allRequirementsMet || newPassword !== confirmPassword}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  {t('resetPassword.loading')}
                </>
              ) : (
                <>
                  <Lock size={20} />
                  {t('resetPassword.button')}
                </>
              )}
            </button>

            {/* Enlaces adicionales */}
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                {t('resetPassword.backToLogin')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;