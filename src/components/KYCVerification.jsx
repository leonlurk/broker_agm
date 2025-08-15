import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Upload, Check, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import kycService from '../services/kycService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const KYCVerification = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [selectedDocType, setSelectedDocType] = useState('identity');
  const [selectedResidenceCountry, setSelectedResidenceCountry] = useState('Argentina');
  const [selectedDocumentCountry, setSelectedDocumentCountry] = useState('Argentina');
  const [countries, setCountries] = useState([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [isResidenceDropdownOpen, setIsResidenceDropdownOpen] = useState(false);
  const [isDocumentDropdownOpen, setIsDocumentDropdownOpen] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  
  // File states
  const [frontDocument, setFrontDocument] = useState(null);
  const [backDocument, setBackDocument] = useState(null);
  const [selfieDocument, setSelfieDocument] = useState(null);
  const [addressDocument, setAddressDocument] = useState(null);
  
  // File preview states
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [addressPreview, setAddressPreview] = useState(null);
  
  const residenceDropdownRef = useRef(null);
  const documentDropdownRef = useRef(null);
  
  // File input refs
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const selfieInputRef = useRef(null);
  const addressInputRef = useRef(null);

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

  // Check KYC status on mount
  useEffect(() => {
    const checkKYCStatus = async () => {
      if (currentUser?.uid) {
        const status = await kycService.getKYCStatus(currentUser.uid);
        setKycStatus(status);
      }
    };
    checkKYCStatus();
  }, [currentUser]);

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

  // File handling functions
  const handleFileSelect = (file, type) => {
    if (!file) return;
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos JPG, PNG o PDF');
      return;
    }
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        switch(type) {
          case 'front':
            setFrontPreview(reader.result);
            break;
          case 'back':
            setBackPreview(reader.result);
            break;
          case 'selfie':
            setSelfiePreview(reader.result);
            break;
          case 'address':
            setAddressPreview(reader.result);
            break;
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Set the file
    switch(type) {
      case 'front':
        setFrontDocument(file);
        break;
      case 'back':
        setBackDocument(file);
        break;
      case 'selfie':
        setSelfieDocument(file);
        break;
      case 'address':
        setAddressDocument(file);
        break;
    }
  };

  const removeFile = (type) => {
    switch(type) {
      case 'front':
        setFrontDocument(null);
        setFrontPreview(null);
        break;
      case 'back':
        setBackDocument(null);
        setBackPreview(null);
        break;
      case 'selfie':
        setSelfieDocument(null);
        setSelfiePreview(null);
        break;
      case 'address':
        setAddressDocument(null);
        setAddressPreview(null);
        break;
    }
  };

  const handleSubmit = async () => {
    // Validate all required documents
    if (!frontDocument || !backDocument || !selfieDocument || !addressDocument) {
      toast.error('Por favor, suba todos los documentos requeridos');
      return;
    }
    
    if (!currentUser) {
      toast.error('Debe iniciar sesión para continuar');
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload all documents
      const uploadPromises = [
        kycService.uploadDocument(frontDocument, currentUser.uid, 'front'),
        kycService.uploadDocument(backDocument, currentUser.uid, 'back'),
        kycService.uploadDocument(selfieDocument, currentUser.uid, 'selfie'),
        kycService.uploadDocument(addressDocument, currentUser.uid, 'address')
      ];
      
      const uploadResults = await Promise.all(uploadPromises);
      
      // Check if all uploads were successful
      const allUploaded = uploadResults.every(result => result.success);
      if (!allUploaded) {
        throw new Error('Error al subir algunos documentos');
      }
      
      // Submit KYC verification
      const kycData = {
        userId: currentUser.uid,
        email: currentUser.email,
        residenceCountry: selectedResidenceCountry,
        documentCountry: selectedDocumentCountry,
        documentType: selectedDocType,
        frontDocument: uploadResults[0].url,
        backDocument: uploadResults[1].url,
        selfieDocument: uploadResults[2].url,
        addressDocument: uploadResults[3].url
      };
      
      const result = await kycService.submitKYCVerification(kycData);
      
      if (result.success) {
        toast.success('Documentos enviados exitosamente. Le notificaremos cuando se complete la verificación.');
        
        // Update status
        setKycStatus({ status: 'pending' });
        
        // Clear form after 2 seconds
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        throw new Error(result.error || 'Error al enviar la verificación');
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast.error(error.message || 'Error al enviar los documentos');
    } finally {
      setLoading(false);
    }
  };

  // Status banner component
  const StatusBanner = () => {
    if (!kycStatus) return null;
    
    const statusConfig = {
      pending: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500',
        text: 'text-yellow-500',
        icon: AlertCircle,
        message: 'Su verificación KYC está en proceso. Le notificaremos cuando se complete.'
      },
      approved: {
        bg: 'bg-green-500/10',
        border: 'border-green-500',
        text: 'text-green-500',
        icon: Check,
        message: 'Su cuenta ha sido verificada exitosamente.'
      },
      rejected: {
        bg: 'bg-red-500/10',
        border: 'border-red-500',
        text: 'text-red-500',
        icon: X,
        message: `Verificación rechazada: ${kycStatus.details?.rejectionReason || 'Documentos no válidos'}. Por favor, vuelva a enviar.`
      }
    };
    
    const config = statusConfig[kycStatus.status];
    if (!config) return null;
    
    const Icon = config.icon;
    
    return (
      <div className={`${config.bg} ${config.border} border rounded-xl p-4 mb-6`}>
        <div className="flex items-start space-x-3">
          <Icon className={`${config.text} mt-0.5`} size={20} />
          <div className="flex-1">
            <p className={`${config.text} font-medium mb-1`}>
              Estado: {kycStatus.status === 'pending' ? 'En proceso' : 
                      kycStatus.status === 'approved' ? 'Aprobado' : 'Rechazado'}
            </p>
            <p className="text-gray-300 text-sm">{config.message}</p>
          </div>
        </div>
      </div>
    );
  };

  // File upload component
  const FileUploadBox = ({ title, inputRef, file, preview, type, accept = "image/*,application/pdf" }) => (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files[0], type)}
        className="hidden"
      />
      
      {file ? (
        <div className="h-48 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border-2 border-green-500 rounded-lg p-4 relative">
          {preview ? (
            <img src={preview} alt={title} className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Check className="text-green-500 mb-2" size={40} />
              <p className="text-green-500 text-center">{file.name}</p>
            </div>
          )}
          <button
            onClick={() => removeFile(type)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div 
          onClick={() => inputRef.current?.click()}
          className="h-48 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#252525] transition"
        >
          <Upload className="h-10 w-10 mb-2 text-gray-400" />
          <p className="text-gray-300 text-center">{title}</p>
        </div>
      )}
    </div>
  );

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
          
          {/* Status Banner */}
          <StatusBanner />
          
          {/* Main Container with border */}
          <div className="border border-[#333] rounded-xl bg-gradient-to-br from-[#232323] to-[#2d2d2d] p-4 md:p-8">
            
            <div className="space-y-8">
              
              {/* Sección 1: Verificación de Residencia */}
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold mb-2">Vamos a verificarte</h1>
                <p className="text-xl mb-6">Por favor, elija su país de residencia</p>
                
                {/* Country Dropdown for Residence */}
                <div className="relative mb-6" ref={residenceDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResidenceDropdownOpen(!isResidenceDropdownOpen);
                      setIsDocumentDropdownOpen(false);
                      setCountrySearch('');
                    }}
                    className="w-full bg-[#2D2D2D] border border-[#444] rounded-xl px-4 py-3 text-left flex justify-between items-center hover:bg-[#333] transition-colors"
                  >
                    <span className="text-white">{selectedResidenceCountry}</span>
                    <ChevronDown 
                      size={20} 
                      className={`text-gray-400 transition-transform ${isResidenceDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {isResidenceDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-[#1F1F1F] border border-[#444] rounded-xl shadow-lg">
                      <div className="p-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={handleCountrySearchChange}
                            placeholder="Buscar país..."
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
              </div>

              {/* Sección 2: Detalles del Documento */}
              <div>
                <h3 className="text-xl font-medium mb-2">Documento a Verificar</h3>
                <p className="text-gray-300 mb-4">País de emisión del documento</p>
                
                {/* Country Dropdown for Document */}
                <div className="relative mb-6" ref={documentDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDocumentDropdownOpen(!isDocumentDropdownOpen);
                      setIsResidenceDropdownOpen(false);
                      setCountrySearch('');
                    }}
                    className="w-full bg-[#2D2D2D] border border-[#444] rounded-xl px-4 py-3 text-left flex justify-between items-center hover:bg-[#333] transition-colors"
                  >
                    <span className="text-white">{selectedDocumentCountry}</span>
                    <ChevronDown 
                      size={20} 
                      className={`text-gray-400 transition-transform ${isDocumentDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {isDocumentDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-[#1F1F1F] border border-[#444] rounded-xl shadow-lg">
                      <div className="p-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={handleCountrySearchChange}
                            placeholder="Buscar país..."
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
                  <FileUploadBox
                    title="Subir Frente del documento"
                    inputRef={frontInputRef}
                    file={frontDocument}
                    preview={frontPreview}
                    type="front"
                  />
                  
                  <FileUploadBox
                    title="Subir Dorso del documento"
                    inputRef={backInputRef}
                    file={backDocument}
                    preview={backPreview}
                    type="back"
                  />
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
                
                <FileUploadBox
                  title="Subir Selfie con DNI"
                  inputRef={selfieInputRef}
                  file={selfieDocument}
                  preview={selfiePreview}
                  type="selfie"
                />
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
                
                <FileUploadBox
                  title="Subir Prueba de Dirección"
                  inputRef={addressInputRef}
                  file={addressDocument}
                  preview={addressPreview}
                  type="address"
                />
              </div>

              {/* Sección 6: Envío */}
              <div className="mt-8">
                <button 
                  onClick={handleSubmit}
                  disabled={loading || kycStatus?.status === 'pending' || kycStatus?.status === 'approved'}
                  className={`w-full font-medium py-3 px-6 rounded-xl transition-all duration-200 ${
                    loading || kycStatus?.status === 'pending' || kycStatus?.status === 'approved'
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                  } text-white`}
                >
                  {loading ? 'Enviando...' : 
                   kycStatus?.status === 'pending' ? 'Verificación en Proceso' :
                   kycStatus?.status === 'approved' ? 'Verificación Completada' :
                   'Enviar Documentos para Verificación'}
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