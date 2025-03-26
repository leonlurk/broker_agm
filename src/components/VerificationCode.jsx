import { useState } from 'react';

const VerificationCode = ({ onContinue }) => {
  const [code, setCode] = useState(['', '', '', '']);

  const handleChange = (index, value) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Move focus to next input
    if (value && index < 3) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add verification logic here
    const verificationCode = code.join('');
    console.log('Verification code submitted:', verificationCode);
    onContinue();
  };

  const handleResendCode = () => {
    console.log('Resending verification code');
    // Add resend code logic here
  };

  return (
    <div className="w-[420px] h-[900px] sm:w-full md:w-[620px] p-6 rounded-3xl bg-black bg-opacity-60 border border-gray-800 shadow-xl flex flex-col justify-center">
      <div className="flex justify-center mb-8">
        <img src="/logo.png" alt="AGM Logo" className="h-25" />
      </div>
      
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white">Ingresa el código de verificación</h2>
        <p className="text-gray-400 mt-2 text-sm">
          Si no has recibido el código, <button 
            type="button" 
            onClick={handleResendCode}
            className="text-white hover:text-white bg-transparent">
            reenviar
          </button>
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center space-x-4">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              className="w-12 h-12 text-center text-white text-xl font-semibold rounded-full bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          ))}
        </div>

        <button
        type="submit"
        className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg relative overflow-hidden group"
        >
        <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        <span className="relative z-10">Continuar</span>
        </button>
      </form>
    </div>
  );
};

export default VerificationCode;