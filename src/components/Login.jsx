import { useState } from 'react';
import { loginUser } from '../firebase/auth';

const Login = ({ onRegisterClick, onForgotClick, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { user, error } = await loginUser(username, password);
      
      if (error) {
        throw new Error(error.message || 'Error al iniciar sesión');
      }
      
      console.log('Login successful:', user);
      onLoginSuccess();
    } catch (err) {
      console.error('Login component error:', err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[330px] h-[700px] sm:w-full md:w-[490px] p-5 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="Broker Logo" className="h-16" />
      </div>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-600 text-white px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20"
              placeholder="Usuario o Email"
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          
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
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <input
              id="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember_me" className="ml-2 block text-gray-300">
              Recuérdame
            </label>
          </div>
          <button
            type="button"
            onClick={onForgotClick}
            className="text-white hover:text-blue-500 bg-transparent whitespace-nowrap"
          >
            ¿Olvidaste la contraseña?
          </button>
        </div>

        <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg relative overflow-hidden group"
            >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10">{loading ? 'Iniciando...' : 'Iniciar Sesión'}</span>
        </button>

        <div className="mt-4 text-center">
          <p className="text-gray-400 mt-1">
            ¿No tienes cuenta de broker? <button type="button" onClick={onRegisterClick} className="text-white font-semibold bg-transparent">Regístrate</button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;