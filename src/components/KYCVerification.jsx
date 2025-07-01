import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const KYCVerification = ({ onBack }) => {
  const [selectedDocType, setSelectedDocType] = useState('identity');

  return (
    <div className="p-4 md:p-6 bg-[#232323] text-white flex flex-col">
      {/* Header with back button */}
      <div className="mb-4">
        <img 
          src="/Back.svg" 
          alt="Back" 
            onClick={onBack}
          className="w-10 h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
        />
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl bg-[#2D2D2D] p-6 md:p-8 rounded-2xl">
          <h2 className="text-2xl font-semibold text-center mb-6">Verificación KYC</h2>
      {/* Main Container with border */}
          <div className="border border-[#333] rounded-xl bg-gradient-to-br from-[#232323] to-[#2d2d2d] p-4 md:p-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
              
              {/* Columna Izquierda: Verificación */}
              <div className="lg:border-r lg:border-gray-700 lg:pr-12 mb-8 lg:mb-0">
        {/* Title and Description */}
                <div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-2">Vamos a verificarte</h1>
          <p className="text-gray-300">Confirme su país de residencia para saber cómo se tratarán sus datos personales</p>
          
          {/* Country Input */}
          <div className="mt-4">
            <input 
              type="text" 
              placeholder="Ingrese su país de residencia" 
              className="w-full py-3 px-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-full text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          {/* Privacy Agreement */}
          <div className="mt-4 flex items-start">
            <input 
              type="checkbox" 
              id="privacyAgreement" 
              className="mr-2 mt-1"
            />
            <label htmlFor="privacyAgreement" className="text-sm text-gray-300">
              Confirmo que he leído el <span className="text-cyan-500 cursor-pointer">Aviso de privacidad</span> y doy mi consentimiento al tratamiento de mis datos personales
            </label>
                  </div>
          </div>
        </div>
        
              {/* Columna Derecha: Documentos */}
              <div>
        {/* Document Section */}
                <div>
                  <h2 className="text-3xl font-semibold mb-2">Documento de identidad</h2>
          <p className="text-gray-300 mb-4">Seleccione el país emisor</p>
          
          {/* Country Selector */}
          <div className="relative mb-6">
            <div className="flex items-center justify-between w-full py-3 px-4 bg-[#2a2a2a] border border-[#333] rounded-xl cursor-pointer">
              <div className="flex items-center">
                <img src="/arg.png" alt="Argentina flag" className="w-6 h-6 rounded-full mr-2" 
                  onError={(e) => {
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' fill='%23555'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='white'%3EAR%3C/text%3E%3C/svg%3E";
                  }}
                />
                <span>Argentina</span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Document Type Selection */}
          <div className="mb-6">
            <p className="text-lg font-medium mb-3">Elija su tipo de documento</p>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={`p-3 border ${selectedDocType === 'identity' ? 'border-cyan-500' : 'border-[#333]'} rounded-lg text-center cursor-pointer hover:bg-[#2a2a2a] transition`}
                onClick={() => setSelectedDocType('identity')}
              >
                Documento de identidad
              </div>
              <div 
                className={`p-3 border ${selectedDocType === 'passport' ? 'border-cyan-500' : 'border-[#333]'} rounded-lg text-center cursor-pointer hover:bg-[#2a2a2a] transition`}
                onClick={() => setSelectedDocType('passport')}
              >
                Pasaporte
              </div>
              <div 
                className={`p-3 border ${selectedDocType === 'driverLicense' ? 'border-cyan-500' : 'border-[#333]'} rounded-lg text-center cursor-pointer hover:bg-[#2a2a2a] transition`}
                onClick={() => setSelectedDocType('driverLicense')}
              >
                Permiso de conducir
              </div>
              <div 
                className={`p-3 border ${selectedDocType === 'residencePermit' ? 'border-cyan-500' : 'border-[#333]'} rounded-lg text-center cursor-pointer hover:bg-[#2a2a2a] transition`}
                onClick={() => setSelectedDocType('residencePermit')}
              >
                Permiso de residencia
              </div>
            </div>
          </div>
          
          {/* Photo Instructions */}
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">Haga una foto de su documento de identidad.</h3>
            <p className="text-xl mb-2">La foto debe:</p>
            <ul className="list-disc pl-5 mb-4 text-gray-300">
              <li>Estar bien iluminada y ser clara.</li>
              <li>Todas las esquinas del documento se deben ver bien</li>
            </ul>
          </div>
          
          {/* Document Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#252525] transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-gray-300 text-center">
                Subir Frente del<br />documento
              </p>
            </div>
            
            <div className="h-48 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#252525] transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-gray-300 text-center">
                Subir Dorso del<br />documento
              </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;