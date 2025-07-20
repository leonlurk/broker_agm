import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import axios from 'axios';

const KYCVerification = ({ onBack }) => {
  const [selectedDocType, setSelectedDocType] = useState('identity');
  const [selectedResidenceCountry, setSelectedResidenceCountry] = useState('Argentina');
  const [selectedDocumentCountry, setSelectedDocumentCountry] = useState('Argentina');
  const [countries, setCountries] = useState([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [isResidenceDropdownOpen, setIsResidenceDropdownOpen] = useState(false);
  const [isDocumentDropdownOpen, setIsDocumentDropdownOpen] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const residenceDropdownRef = useRef(null);
  const documentDropdownRef = useRef(null);

  // Fetch countries from REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name');
        const countryData = response.data.map(c => ({
          name: c.name.common
        })).sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryData);
        setFilteredCountries(countryData);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };
    fetchCountries();
  }, []);

  // Filter countries based on search
  useEffect(() => {
    if (!countrySearch) {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(countrySearch.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [countrySearch, countries]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (residenceDropdownRef.current && !residenceDropdownRef.current.contains(event.target)) {
        setIsResidenceDropdownOpen(false);
        setCountrySearch('');
      }
      if (documentDropdownRef.current && !documentDropdownRef.current.contains(event.target)) {
        setIsDocumentDropdownOpen(false);
        setCountrySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResidenceCountrySelect = (countryName) => {
    setSelectedResidenceCountry(countryName);
    setIsResidenceDropdownOpen(false);
    setCountrySearch('');
  };

  const handleDocumentCountrySelect = (countryName) => {
    setSelectedDocumentCountry(countryName);
    setIsDocumentDropdownOpen(false);
    setCountrySearch('');
  };

  const handleCountrySearchChange = (e) => {
    setCountrySearch(e.target.value);
  };

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
            
            <div className="space-y-8">
              
              {/* Sección 1: Verificación de Residencia */}
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold mb-2">Vamos a verificarte</h1>
                <p className="text-gray-300">Confirme su país de residencia para saber cómo se tratarán sus datos personales</p>
          
          {/* Country Dropdown - Residencia */}
          <div className="mt-4 relative" ref={residenceDropdownRef}>
            <button
              type="button"
              onClick={() => setIsResidenceDropdownOpen(!isResidenceDropdownOpen)}
              className="w-full py-3 px-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-full text-white focus:outline-none focus:border-cyan-500 flex items-center justify-between"
            >
              <span>{selectedResidenceCountry}</span>
              <ChevronDown 
                size={20} 
                className={`text-gray-400 transition-transform ${isResidenceDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {isResidenceDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#404040] border border-[#333] rounded-xl shadow-lg z-50 max-h-60 overflow-hidden">
                <div className="p-3 border-b border-[#333]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar país..."
                      value={countrySearch}
                      onChange={(e) => {
                        handleCountrySearchChange(e);
                        if (!isResidenceDropdownOpen) setIsResidenceDropdownOpen(true);
                      }}
                      className="w-full bg-[#2D2D2D] border border-[#444] rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={country.name}
                        type="button"
                        onClick={() => handleResidenceCountrySelect(country.name)}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#2D2D2D] transition-colors"
                      >
                        {country.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      No se encontraron países
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
                {/* Privacy Agreement */}
                <div className="mt-4 flex items-start">
                  <input 
                    type="checkbox" 
                    id="privacyAgreement" 
                    className="mr-2 mt-1"
                  />
                  <label htmlFor="privacyAgreement" className="text-sm text-gray-300">
                    Confirmo que he leído el <span className="text-cyan-500 cursor-pointer">Aviso de privacidad</span> y los <span className="text-cyan-500 cursor-pointer">Términos y condiciones</span> y doy mi consentimiento al tratamiento de mis datos personales
                  </label>
                </div>
              </div>
        
              {/* Sección 2: Documento de Identidad */}
              <div>
                <h2 className="text-3xl font-semibold mb-2">Documento de identidad</h2>
                <p className="text-gray-300 mb-4">Seleccione el país emisor</p>
          
                {/* Country Selector - Documento */}
                <div className="relative mb-6" ref={documentDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDocumentDropdownOpen(!isDocumentDropdownOpen)}
              className="flex items-center justify-between w-full py-3 px-4 bg-[#2a2a2a] border border-[#333] rounded-xl cursor-pointer focus:outline-none focus:border-cyan-500"
            >
              <span>{selectedDocumentCountry}</span>
              <ChevronDown 
                className={`h-5 w-5 text-gray-400 transition-transform ${isDocumentDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {isDocumentDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#404040] border border-[#333] rounded-xl shadow-lg z-50 max-h-60 overflow-hidden">
                <div className="p-3 border-b border-[#333]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar país..."
                      value={countrySearch}
                      onChange={(e) => {
                        handleCountrySearchChange(e);
                        if (!isDocumentDropdownOpen) setIsDocumentDropdownOpen(true);
                      }}
                      className="w-full bg-[#2D2D2D] border border-[#444] rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={country.name}
                        type="button"
                        onClick={() => handleDocumentCountrySelect(country.name)}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#2D2D2D] transition-colors"
                      >
                        {country.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      No se encontraron países
                    </div>
                  )}
                </div>
              </div>
            )}
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
              </div>
          
              {/* Sección 3: Subida de Documentos */}
              <div>
                <h3 className="text-xl font-medium mb-2">Haga una foto de su documento de identidad.</h3>
                <p className="text-xl mb-2">La foto debe:</p>
                <ul className="list-disc pl-5 mb-4 text-gray-300">
                  <li>Estar bien iluminada y ser clara.</li>
                  <li>Todas las esquinas del documento se deben ver bien</li>
                </ul>
          
                {/* Document Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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

              {/* Sección 4: Selfie con Documento */}
              <div>
                <h3 className="text-xl font-medium mb-2">Selfie con documento de identidad</h3>
                <p className="text-gray-300 mb-4">Tome una selfie sosteniendo su documento de identidad junto a su rostro</p>
                <ul className="list-disc pl-5 mb-4 text-gray-300">
                  <li>Su rostro y el documento deben ser claramente visibles</li>
                  <li>Asegúrese de que la foto esté bien iluminada</li>
                  <li>Sostenga el documento al lado de su rostro</li>
                </ul>
                
                <div className="h-48 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#252525] transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-gray-300 text-center">
                    Subir Selfie con DNI
                  </p>
                </div>
              </div>

              {/* Sección 5: Prueba de Dirección */}
              <div>
                <h3 className="text-xl font-medium mb-2">Prueba de dirección</h3>
                <p className="text-gray-300 mb-4">Suba un documento que compruebe su dirección de residencia</p>
                <p className="text-gray-300 mb-2">Documentos aceptados:</p>
                <ul className="list-disc pl-5 mb-4 text-gray-300">
                  <li>Factura de servicios públicos (luz, agua, gas) - no mayor a 3 meses</li>
                  <li>Estado de cuenta bancario - no mayor a 3 meses</li>
                  <li>Contrato de arrendamiento</li>
                  <li>Carta del banco con dirección</li>
                </ul>
                
                <div className="h-48 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#252525] transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-gray-300 text-center">
                    Subir Prueba de Dirección
                  </p>
                </div>
              </div>

              {/* Sección 6: Envío */}
              <div className="mt-8">
                <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200">
                  Enviar Documentos para Verificación
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;