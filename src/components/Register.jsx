import { useState, useEffect } from 'react';
import { registerUser } from '../firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';

const Register = ({ onLoginClick }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refId, setRefId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setRefId(ref);
      console.log("[Register] Referral ID detected:", ref);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage(''); // Clear previous message
    console.log(`[Register] handleSubmit initiated. Username: ${username}, Email: ${email}, RefId: ${refId}`);
    
    if (password !== confirmPassword) {
      console.log("[Register] Password mismatch.");
      return setError('Las contraseñas no coinciden');
    }
    
    setLoading(true);
    console.log("[Register] Calling registerUser function...");
    try {
      // Pass refId to registerUser
      const { user, error } = await registerUser(username, email, password, refId); 
      
      if (error) {
        console.error("[Register] registerUser returned error:", error);
        // Handle specific Firebase errors if needed
        let friendlyError = 'Error al registrar. Intente de nuevo.';
        if (error.code === 'auth/email-already-in-use') {
          friendlyError = 'El correo electrónico ya está en uso.';
        } else if (error.code === 'auth/weak-password') {
          friendlyError = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (error.code === 'auth/invalid-email') {
          friendlyError = 'El formato del correo electrónico no es válido.';
        } else if (error.message) {
          // Use the message from the error if available (like permission denied)
          friendlyError = error.message;
        }
        throw new Error(friendlyError);
      }
      
      // Success
      console.log('[Register] Registration successful, user object:', user);
      setMessage('¡Registro exitoso! Por favor verifica tu correo electrónico para activar tu cuenta.');
      setUsername(''); // Clear form on success
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // Navigate immediately to the main dashboard route after successful registration
      navigate('/'); // Changed from /login and removed setTimeout
    } catch (err) {
      console.error('[Register] handleSubmit caught error:', err);
      setError(err.message || 'Ocurrió un error inesperado durante el registro.');
    } finally {
      console.log("[Register] handleSubmit finished.");
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
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 bg-opacity-20"
              placeholder="Usuario"
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border border-gray-700 bg-opacity-20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
              placeholder="Correo Electronico"
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-gray-900 border bg-opacity-20 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
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
              className="w-full px-4 py-3 rounded-full bg-gray-900 border bg-opacity-20 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
              placeholder="Confirmar Contraseña"
              required
            />
            <svg className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember_me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
          />
          <label htmlFor="remember_me" className="ml-2 block text-gray-300 text-sm">
            Recuérdame
          </label>
        </div>

        <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg relative overflow-hidden group"
            >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10">{loading ? 'Procesando...' : 'Continuar'}</span>
        </button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onLoginClick}
            className="text-gray-300 hover:text-white bg-transparent"
          >
            Verificar Ahora
          </button>
          <p className="text-gray-400 mt-1">
            ¿Ya estás registrado? <button type="button" onClick={onLoginClick} className="text-white font-semibold bg-transparent">Login</button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register;