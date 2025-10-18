import React, { useState, useEffect } from 'react';

const SSLHelper = ({ onSuccess }) => {
  const [checking, setChecking] = useState(true);
  const [sslAccepted, setSslAccepted] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443'; // Fallback to localhost for SSL testing

  useEffect(() => {
    checkSSL();
  }, []);

  const checkSSL = async () => {
    try {
      const response = await fetch(`${apiUrl}/health/`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (response.ok) {
        setSslAccepted(true);
        if (onSuccess) {
          setTimeout(onSuccess, 1000);
        }
      }
    } catch (error) {
      console.log('SSL not accepted yet');
      setSslAccepted(false);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '500px'
        }}>
          <h2>Verificando conexión segura...</h2>
          <p>Por favor espere...</p>
        </div>
      </div>
    );
  }

  if (!sslAccepted) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>
            ⚠️ Certificado SSL Requerido
          </h2>
          
          <p style={{ marginBottom: '1.5rem' }}>
            Para usar la aplicación, necesitas aceptar el certificado SSL del servidor.
          </p>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <h3>Pasos a seguir:</h3>
            <ol>
              <li>Haz clic en el botón de abajo para abrir la API en una nueva pestaña</li>
              <li>Verás una advertencia de seguridad del navegador</li>
              <li>Haz clic en "Avanzado" o "Advanced"</li>
              <li>Luego haz clic en "Continuar a 62.171.177.212 (inseguro)"</li>
              <li>Cuando veas el JSON con "status": "healthy", cierra esa pestaña</li>
              <li>Vuelve aquí y haz clic en "Verificar Conexión"</li>
            </ol>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a
              href={`${apiUrl}/health/`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block',
                fontWeight: 'bold'
              }}
            >
              Abrir API (Nueva Pestaña)
            </a>

            <button
              onClick={() => {
                setChecking(true);
                setTimeout(checkSSL, 1000);
              }}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Verificar Conexión
            </button>
          </div>

          <p style={{ 
            marginTop: '1rem', 
            fontSize: '0.9rem', 
            color: '#6c757d' 
          }}>
            Nota: Esto es necesario solo una vez por sesión del navegador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#28a745' }}>✅ Conexión Establecida</h2>
        <p>El certificado SSL ha sido aceptado. Redirigiendo...</p>
      </div>
    </div>
  );
};

export default SSLHelper;