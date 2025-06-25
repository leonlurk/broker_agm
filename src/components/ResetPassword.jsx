import { useState } from 'react';

const ResetPassword = ({ onContinue, onLoginClick }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);
    
    try {
      // Simular actualización de contraseña
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage('Contraseña actualizada exitosamente');
      setTimeout(() => {
        onContinue();
      }, 2000);
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message || 'Error al actualizar la contraseña');
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20"
              placeholder="Contraseña"
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
              placeholder="Confirmar Contraseña"
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
          <span className="relative z-10">{loading ? 'Actualizando...' : 'Continuar'}</span>
        </button>

        <div className="mt-4 text-center">
          <p className="text-gray-400 mt-1">
            ¿Recordaste tu contraseña? <button type="button" onClick={onLoginClick} className="text-white font-semibold bg-transparent">Iniciar Sesión</button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword; 