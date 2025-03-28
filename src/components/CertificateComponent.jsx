import React, { useState } from 'react';

const CertificateComponent = () => {
  const [activeButton, setActiveButton] = useState('superacion');

  return (
    <div className="flex-1 bg-gradient-to-br from-[#232323] to-[#2d2d2d] p-6 rounded-2xl border border-[#333]">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <button 
          className={`bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-white py-2 px-4 rounded-full text-center border focus:outline-none ${activeButton === 'superacion' ? 'border-cyan-500 border-opacity-50' : 'border-[#333]'}`}
          onClick={() => setActiveButton('superacion')}
        >
          Superación de Challenge
        </button>
        <button 
          className={`bg-transparent text-white py-2 px-4 rounded-full text-center border focus:outline-none ${activeButton === 'pago' ? 'border-cyan-500 border-opacity-50' : 'border-[#333]'}`}
          onClick={() => setActiveButton('pago')}
        >
          Certificado de Pago
        </button>
      </div>

      <div className="flex justify-start">
        <div className="relative">
          <img 
            src="/cert.png" 
            alt="Certificado FundedFy" 
            className="rounded-xl"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='390' height='531' viewBox='0 0 390 531'%3E%3Crect width='390' height='531' fill='%23232323'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3ECertificado%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CertificateComponent;