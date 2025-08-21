import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Upload, Check, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import kycService from '../services/kycService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const KYCVerification = ({ onBack }) => {
  const { currentUser } = useAuth();
  const { notifyKYCSubmitted } = useNotifications();
  const { t } = useTranslation('kyc');
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
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,translations');
        const countryData = response.data.map(c => ({
          name: c.translations?.spa?.common || c.name.common // Usar traducción al español si está disponible
        })).sort((a, b) => a.name.localeCompare(b.name, 'es')); // Ordenar con locale español
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
        const status = await kycService.getKYCStatus(currentUser.id || currentUser.uid);
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
      toast.error(t('errors.fileSize'));
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('errors.fileType'));
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
      toast.error(t('errors.missingDocuments'));
      return;
    }
    
    if (!currentUser) {
      toast.error(t('errors.loginRequired'));
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload all documents
      const userId = currentUser.id || currentUser.uid;
      const uploadPromises = [
        kycService.uploadDocument(frontDocument, userId, 'front'),
        kycService.uploadDocument(backDocument, userId, 'back'),
        kycService.uploadDocument(selfieDocument, userId, 'selfie'),
        kycService.uploadDocument(addressDocument, userId, 'address')
      ];
      
      const uploadResults = await Promise.all(uploadPromises);
      
      // Check if all uploads were successful
      const allUploaded = uploadResults.every(result => result.success);
      if (!allUploaded) {
        throw new Error(t('errors.uploadFailed'));
      }
      
      // Submit KYC verification
      const kycData = {
        userId: userId,
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
        toast.success(t('messages.submitted'));
        
        // Send notification
        notifyKYCSubmitted();
        
        // Update status
        setKycStatus({ status: 'pending' });
        
        // Clear form after 2 seconds
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        throw new Error(result.error || t('errors.submitError'));
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast.error(error.message || t('errors.submitError'));
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
        message: t('messages.processing')
      },
      approved: {
        bg: 'bg-green-500/10',
        border: 'border-green-500',
        text: 'text-green-500',
        icon: Check,
        message: t('messages.completed')
      },
      rejected: {
        bg: 'bg-red-500/10',
        border: 'border-red-500',
        text: 'text-red-500',
        icon: X,
        message: `${t('messages.rejected')}: ${kycStatus.details?.rejectionReason || t('errors.invalidDocument')}. ${t('messages.resubmit')}`
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
              {t('status.label')}: {kycStatus.status === 'pending' ? t('status.pending') : 
                      kycStatus.status === 'approved' ? t('status.approved') : t('status.rejected')}
            </p>
            <p className="text-gray-300 text-sm">{config.message}</p>
          </div>
        </div>
      </div>
    );
  };
  
  // Status Card Component (Replaces form when status is pending or approved)
  const StatusCard = () => {
    const statusConfig = {
      pending: {
        bg: 'from-yellow-500/20 to-yellow-600/10',
        borderColor: 'border-yellow-500/50',
        iconBg: 'bg-yellow-500/20',
        icon: AlertCircle,
        iconColor: 'text-yellow-500',
        title: t('status.pending'),
        subtitle: t('statusCard.pending.subtitle'),
        description: t('statusCard.pending.description'),
        showResubmit: false
      },
      approved: {
        bg: 'from-green-500/20 to-green-600/10',
        borderColor: 'border-green-500/50',
        iconBg: 'bg-green-500/20',
        icon: Check,
        iconColor: 'text-green-500',
        title: t('status.approved'),
        subtitle: t('statusCard.approved.subtitle'),
        description: t('statusCard.approved.description'),
        showResubmit: false
      },
      rejected: {
        bg: 'from-red-500/20 to-red-600/10',
        borderColor: 'border-red-500/50',
        iconBg: 'bg-red-500/20',
        icon: X,
        iconColor: 'text-red-500',
        title: t('status.rejected'),
        subtitle: t('statusCard.rejected.subtitle'),
        description: kycStatus?.details?.rejectionReason || t('statusCard.rejected.description'),
        showResubmit: true
      }
    };
    
    const config = statusConfig[kycStatus?.status];
    if (!config) return null;
    
    const Icon = config.icon;
    
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className={`max-w-2xl w-full bg-gradient-to-br ${config.bg} ${config.borderColor} border-2 rounded-2xl p-8`}>
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className={`${config.iconBg} p-6 rounded-full mb-6`}>
              <Icon className={config.iconColor} size={48} />
            </div>
            
            {/* Title & Subtitle */}
            <h2 className="text-3xl font-semibold text-white mb-2">{config.title}</h2>
            <p className="text-lg text-gray-400 mb-6">{config.subtitle}</p>
            
            {/* Description */}
            <p className="text-gray-300 mb-8 max-w-md">{config.description}</p>
            
            {/* Submission Details */}
            {kycStatus?.details?.submittedAt && (
              <div className="bg-black/30 rounded-xl p-4 mb-6 w-full max-w-md">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('dates.submitted')}</span>
                    <span className="text-white">
                      {new Date(kycStatus.details.submittedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {kycStatus?.details?.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('dates.reviewed')}</span>
                      <span className="text-white">
                        {new Date(kycStatus.details.reviewedAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >
                {t('buttons.back')}
              </button>
              {config.showResubmit && (
                <button
                  onClick={() => setKycStatus(null)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl transition-all"
                >
                  {t('buttons.resubmit')}
                </button>
              )}
            </div>
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

  // Check if we should show status card instead of form
  const shouldShowStatusCard = kycStatus?.status === 'pending' || kycStatus?.status === 'approved';
  
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
      
      {/* Show Status Card or Form based on KYC status */}
      {shouldShowStatusCard ? (
        <StatusCard />
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="w-full max-w-5xl bg-[#2D2D2D] p-6 md:p-8 rounded-2xl">
            <h2 className="text-2xl font-semibold text-center mb-6">{t('title')}</h2>
            
            {/* Status Banner for rejected status */}
            {kycStatus?.status === 'rejected' && <StatusBanner />}
            
            {/* Main Container with border */}
            <div className="border border-[#333] rounded-xl bg-gradient-to-br from-[#232323] to-[#2d2d2d] p-4 md:p-8">
            
            <div className="space-y-8">
              
              {/* Sección 1: Verificación de Residencia */}
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold mb-2">{t('subtitle')}</h1>
                <p className="text-xl mb-6">{t('country.description')}</p>
                
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
                            placeholder={t('country.placeholder')}
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
                            {t('country.notFound')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 2: Detalles del Documento */}
              <div>
                <h3 className="text-xl font-medium mb-2">{t('document.title')}</h3>
                <p className="text-gray-300 mb-4">{t('document.issuingCountry')}</p>
                
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
                            placeholder={t('country.placeholder')}
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
                            {t('country.notFound')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
          
                {/* Document Type Selection */}
                <div className="mb-6">
                  <p className="text-lg font-medium mb-3">{t('document.subtitle')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`p-3 border ${selectedDocType === 'identity' ? 'border-cyan-500' : 'border-[#333]'} rounded-lg text-center cursor-pointer hover:bg-[#2a2a2a] transition`}
                      onClick={() => setSelectedDocType('identity')}
                    >
                      {t('document.types.id')}
                    </div>
                    <div 
                      className={`p-3 border ${selectedDocType === 'passport' ? 'border-cyan-500' : 'border-[#333]'} rounded-lg text-center cursor-pointer hover:bg-[#2a2a2a] transition`}
                      onClick={() => setSelectedDocType('passport')}
                    >
                      {t('document.types.passport')}
                    </div>
                    <div 
                      className={`p-3 border ${selectedDocType === 'driverLicense' ? 'border-cyan-500' : 'border-[#333]'} rounded-lg text-center cursor-pointer hover:bg-[#2a2a2a] transition`}
                      onClick={() => setSelectedDocType('driverLicense')}
                    >
                      {t('document.types.driver')}
                    </div>
                    <div 
                      className={`p-3 border ${selectedDocType === 'residencePermit' ? 'border-cyan-500' : 'border-[#333]'} rounded-lg text-center cursor-pointer hover:bg-[#2a2a2a] transition`}
                      onClick={() => setSelectedDocType('residencePermit')}
                    >
                      {t('document.types.residence')}
                    </div>
                  </div>
                </div>
              </div>
          
              {/* Sección 3: Subida de Documentos */}
              <div>
                <h3 className="text-xl font-medium mb-2">{t('document.photoInstruction')}</h3>
                <p className="text-xl mb-2">{t('document.requirements.title')}</p>
                <ul className="list-disc pl-5 mb-4 text-gray-300">
                  <li>{t('document.requirements.clear')}</li>
                  <li>{t('document.requirements.corners')}</li>
                </ul>
          
                {/* Document Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <FileUploadBox
                    title={t('document.upload.front')}
                    inputRef={frontInputRef}
                    file={frontDocument}
                    preview={frontPreview}
                    type="front"
                  />
                  
                  <FileUploadBox
                    title={t('document.upload.back')}
                    inputRef={backInputRef}
                    file={backDocument}
                    preview={backPreview}
                    type="back"
                  />
                </div>
              </div>

              {/* Sección 4: Selfie con Documento */}
              <div>
                <h3 className="text-xl font-medium mb-2">{t('selfie.title')}</h3>
                <p className="text-gray-300 mb-4">{t('selfie.description')}</p>
                <ul className="list-disc pl-5 mb-4 text-gray-300">
                  <li>{t('selfie.requirements.visible')}</li>
                  <li>{t('selfie.requirements.lighting')}</li>
                  <li>{t('selfie.requirements.holding')}</li>
                </ul>
                
                <FileUploadBox
                  title={t('selfie.upload')}
                  inputRef={selfieInputRef}
                  file={selfieDocument}
                  preview={selfiePreview}
                  type="selfie"
                />
              </div>

              {/* Sección 5: Prueba de Dirección */}
              <div>
                <h3 className="text-xl font-medium mb-2">{t('address.title')}</h3>
                <p className="text-gray-300 mb-4">{t('address.description')}</p>
                <p className="text-gray-300 mb-2">{t('address.accepted.title')}</p>
                <ul className="list-disc pl-5 mb-4 text-gray-300">
                  <li>{t('address.accepted.utility')}</li>
                  <li>{t('address.accepted.bank')}</li>
                  <li>{t('address.accepted.lease')}</li>
                  <li>{t('address.accepted.letter')}</li>
                </ul>
                
                <FileUploadBox
                  title={t('address.upload')}
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
                  {loading ? t('buttons.submitting') : 
                   kycStatus?.status === 'pending' ? t('status.pending') :
                   kycStatus?.status === 'approved' ? t('status.approved') :
                   t('buttons.submit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default KYCVerification;