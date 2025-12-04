import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/config';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Obtener los parámetros de la URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Supabase puede enviar los tokens en el hash o en los parámetros de búsqueda
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const type = hashParams.get('type') || searchParams.get('type');
        
        if (type === 'recovery' && accessToken) {
          // Es un reseteo de contraseña
          // Validar que la sesión sea válida
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error validando sesión:', error);
            toast.error(t('resetPassword.errors.invalidToken', 'Enlace inválido o expirado'));
            navigate('/forgot-password');
            return;
          }
          
          if (session && session.user) {
            // Sesión válida, redirigir a la página de cambio de contraseña
            navigate('/password-reset', {
              state: {
                isValidSession: true,
                accessToken: accessToken
              }
            });
          } else {
            // No hay sesión válida
            toast.error(t('resetPassword.errors.sessionExpired', 'Sesión expirada. Por favor solicita un nuevo enlace.'));
            navigate('/forgot-password');
          }
        } else if (type === 'signup') {
          // Es una verificación de email
          toast.success(t('emailVerification.success', 'Email verificado exitosamente'));
          navigate('/login');
        } else {
          // Tipo desconocido o sin tokens
          console.error('Callback type desconocido o sin tokens');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error en AuthCallback:', error);
        toast.error(t('errors.general', 'Ocurrió un error. Por favor intenta nuevamente.'));
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">{t('loading', 'Procesando...')}</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;