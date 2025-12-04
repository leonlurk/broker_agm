import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { supabase } from '../supabase/config';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const PasswordReset = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkForEmailRecovery = async () => {
      try {
        // Debug logs
        console.log('[PasswordReset] Full URL:', window.location.href);
        console.log('[PasswordReset] Hash:', window.location.hash);

        // Verificar tokens en el hash (Supabase los envía así)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        // Verificar sesión activa de Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('[PasswordReset] Session exists:', !!session);
        console.log('[PasswordReset] Recovery type:', type);
        console.log('[PasswordReset] Has access token:', !!accessToken);

        if (error) {
          console.error('[PasswordReset] Session error:', error);
          toast.error(t('resetPassword.errors.sessionExpired', 'Enlace expirado. Solicita uno nuevo.'));
          navigate('/forgot-password');
          return;
        }

        // Validar que es un flujo de recuperación válido
        if ((type === 'recovery' && accessToken) || session?.user) {
          console.log('[PasswordReset] Valid recovery session detected');
          setIsValidSession(true);
        } else {
          console.log('[PasswordReset] No valid session, redirecting to forgot-password');
          toast.error(t('resetPassword.errors.invalidToken', 'Enlace inválido. Solicita uno nuevo.'));
          navigate('/forgot-password');
        }
      } catch (error) {
        console.error('[PasswordReset] Error:', error);
        toast.error(t('resetPassword.errors.general', 'Error al procesar. Intenta nuevamente.'));
        navigate('/forgot-password');
      } finally {
        setCheckingSession(false);
      }
    };

    checkForEmailRecovery();
  }, [navigate, t]);

  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };
  };

  const requirements = validatePassword(newPassword);
  const allRequirementsMet = Object.values(requirements).every(req => req);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast.error(t('resetPassword.errors.weakPassword', 'La contraseña no cumple los requisitos'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('resetPassword.errors.passwordMismatch', 'Las contraseñas no coinciden'));
      return;
    }

    setLoading(true);
    const toastId = toast.loading(t('resetPassword.loading', 'Actualizando contraseña...'));

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast.success(t('resetPassword.success', 'Contraseña actualizada exitosamente'), { id: toastId });

      // Cerrar sesión para que inicie con la nueva contraseña
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('[PasswordReset] Update error:', error);
      toast.error(error.message || t('resetPassword.errors.updateFailed', 'Error al actualizar'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Loading mientras verificamos la sesión
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

  // Si no hay sesión válida, no mostrar nada (ya redirigimos)
  if (!isValidSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#232323] border border-[#333] rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('resetPassword.title', 'Nueva Contraseña')}</h1>
            <p className="text-gray-400">
              {t('resetPassword.enterNewPassword', 'Ingresa tu nueva contraseña')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('resetPassword.newPassword', 'Nueva contraseña')}
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
                  {t('resetPassword.requirements.minLength', 'Mínimo 8 caracteres')}
                </p>
                <p className={`text-xs flex items-center gap-1 ${requirements.uppercase ? 'text-green-400' : 'text-gray-400'}`}>
                  {requirements.uppercase ? <Check size={14} /> : <X size={14} />}
                  {t('resetPassword.requirements.uppercase', 'Una mayúscula')}
                </p>
                <p className={`text-xs flex items-center gap-1 ${requirements.lowercase ? 'text-green-400' : 'text-gray-400'}`}>
                  {requirements.lowercase ? <Check size={14} /> : <X size={14} />}
                  {t('resetPassword.requirements.lowercase', 'Una minúscula')}
                </p>
                <p className={`text-xs flex items-center gap-1 ${requirements.number ? 'text-green-400' : 'text-gray-400'}`}>
                  {requirements.number ? <Check size={14} /> : <X size={14} />}
                  {t('resetPassword.requirements.number', 'Un número')}
                </p>
                <p className={`text-xs flex items-center gap-1 ${requirements.special ? 'text-green-400' : 'text-gray-400'}`}>
                  {requirements.special ? <Check size={14} /> : <X size={14} />}
                  {t('resetPassword.requirements.special', 'Un carácter especial (!@#$%^&*)')}
                </p>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('resetPassword.confirmPassword', 'Confirmar contraseña')}
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
                <p className="mt-2 text-sm text-red-400">{t('resetPassword.errors.passwordMismatch', 'Las contraseñas no coinciden')}</p>
              )}
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading || !allRequirementsMet || newPassword !== confirmPassword}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  {t('resetPassword.loading', 'Actualizando...')}
                </>
              ) : (
                <>
                  <Lock size={20} />
                  {t('resetPassword.button', 'Actualizar Contraseña')}
                </>
              )}
            </button>

            {/* Enlace a login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                {t('resetPassword.backToLogin', 'Volver al inicio de sesión')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
