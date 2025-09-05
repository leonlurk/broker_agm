import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const VerifyEmail = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Token de verificación no encontrado');
        setLoading(false);
        return;
      }

      try {
        // Intentar primero con el backend que maneja los emails bonitos
        const API_URL = import.meta.env.VITE_CRYPTO_API_URL || 'https://whapy.apekapital.com:446/api';
        
        console.log('[VerifyEmail] Attempting to verify token via backend:', token);
        
        const response = await fetch(`${API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'omit',
          body: JSON.stringify({ token: token })
        });
        
        if (!response.ok) {
          console.log('[VerifyEmail] Backend returned error:', response.status);
          throw new Error(`Backend error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStatus('success');
          setMessage('¡Tu email ha sido verificado exitosamente! Redirigiendo al login...');
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Email verificado exitosamente. Ya puedes iniciar sesión.' 
              }
            });
          }, 3000);
        } else {
          throw new Error(data.message || 'Verification failed');
        }
      } catch (error) {
        console.error('[VerifyEmail] Backend verification failed:', error);
        console.log('[VerifyEmail] Trying direct Supabase verification as fallback');
        
        // Si el backend falla, intentar con Supabase directamente como fallback
        try {
          const { verifyEmailWithToken } = await import('../supabase/auth');
          const result = await verifyEmailWithToken(token);
          
          if (result.success) {
            setStatus('success');
            setMessage('¡Tu email ha sido verificado exitosamente! Redirigiendo al login...');
            
            setTimeout(() => {
              navigate('/login', { 
                state: { 
                  message: 'Email verificado exitosamente. Ya puedes iniciar sesión.' 
                }
              });
            }, 3000);
          } else {
            setStatus('error');
            setMessage(result.error || 'Error al verificar el email');
          }
        } catch (fallbackError) {
          console.error('[VerifyEmail] Fallback also failed:', fallbackError);
          setStatus('error');
          setMessage('Error al verificar el email. Por favor contacta soporte.');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: 'url(/fondo.png)', width: '100vw', height: '100vh' }}>
      <div className="w-full max-w-md p-8 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/Capa_x0020_1.svg" alt="Broker Logo" className="h-16" />
        </div>

        {/* Content */}
        <div className="text-center">
          {loading ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Verificando tu email...
              </h2>
              <p className="text-gray-400">
                Por favor espera mientras confirmamos tu dirección de correo
              </p>
            </>
          ) : (
            <>
              {status === 'success' && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    ¡Email Verificado!
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {message}
                  </p>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Error de Verificación
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {message}
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-full hover:opacity-90 transition"
                  >
                    Ir al Login
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;