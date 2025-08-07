import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseAdapter, StorageAdapter } from '../services/database.adapter';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Camera, Mail, ArrowLeft, Loader, UploadCloud, Trash2, Search, ChevronDown, Calendar } from 'lucide-react';
import axios from 'axios';
import { z } from 'zod';
import useTranslation from '../hooks/useTranslation';

// Validation Schema with Zod - will be created inside component to use translations

const SkeletonLoader = () => (
    <div className="bg-[#1C1C1C] text-white p-4 sm:p-6 md:p-8 rounded-2xl max-w-7xl mx-auto w-full animate-pulse">
      <div className="h-8 w-3/4 mb-8 bg-gray-700 rounded"></div>
      <div className="flex flex-col lg:flex-row items-start gap-10 w-full">
        <div className="flex-shrink-0 flex flex-col items-center gap-4 w-full lg:w-auto">
          <div className="w-32 h-32 bg-gray-700 rounded-full"></div>
        </div>
        <div className="flex-grow w-full space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 w-1/4 bg-gray-700 rounded"></div>
              <div className="h-12 w-full bg-gray-700 rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-1/4 bg-gray-700 rounded"></div>
              <div className="h-12 w-full bg-gray-700 rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-1/4 bg-gray-700 rounded"></div>
              <div className="h-12 w-full bg-gray-700 rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-1/4 bg-gray-700 rounded"></div>
              <div className="h-12 w-full bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

const UserInformationContent = ({ onBack }) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  
  // Validation Schema with Zod using translations
  const profileSchema = z.object({
    nombre: z.string().min(2, { message: t('validation.nameMinLength') }),
    apellido: z.string().min(2, { message: t('validation.lastNameMinLength') }),
    pais: z.string().min(1, { message: t('validation.countryRequired') }),
    ciudad: z.string().min(2, { message: t('validation.cityMinLength') }),
    phoneCode: z.string(),
    phoneNumber: z.string().min(6, { message: t('validation.phoneNumberTooShort') }),
    photoURL: z.string().refine(
      (val) => {
        if (!val) return true;
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
      },
      { message: t('validation.invalidImageFormat') }
    ).optional().nullable(),
  });
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    pais: '',
    ciudad: '',
    phoneCode: '+54',
    phoneNumber: '',
    photoURL: '',
    fechaNacimiento: '',
  });
  const [initialData, setInitialData] = useState({});
  const [countries, setCountries] = useState([]);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDateFocused, setIsDateFocused] = useState(false);
  
  // Country selector states
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const countryDropdownRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const userId = currentUser.uid || currentUser.id;
        const { data: userData, error } = await DatabaseAdapter.users.getById(userId);
        if (error) throw error;
        
        const fullData = {
          nombre: userData.nombre || '',
          apellido: userData.apellido || '',
          pais: userData.pais || '',
          ciudad: userData.ciudad || '',
          phoneCode: userData.phoneCode || '+54',
          phoneNumber: userData.phoneNumber || '',
          photoURL: userData.photoURL || currentUser.photoURL || '/IconoPerfil.svg',
        };

        setFormData(fullData);
        setInitialData(fullData);
        setPreview(fullData.photoURL);
        
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error('No se pudo cargar tu información.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);
  
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,idd');
        const countryData = response.data.map(c => ({
          name: c.name.common,
          code: `${c.idd.root}${c.idd.suffixes ? c.idd.suffixes[0] : ''}`
        })).sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryData);
        setFilteredCountries(countryData);
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast.error('No se pudieron cargar los países.');
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
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleCountrySelect = (countryName) => {
    const selectedCountry = countries.find(c => c.name === countryName);
    setFormData(prev => ({
      ...prev,
      pais: countryName,
      phoneCode: selectedCountry ? selectedCountry.code : '',
      ciudad: ''
    }));
    setCountrySearch('');
    setIsCountryDropdownOpen(false);
    if (errors.pais) setErrors(prev => ({ ...prev, pais: null }));
  };

  const handleCountrySearchChange = (e) => {
    setCountrySearch(e.target.value);
    if (!isCountryDropdownOpen) {
      setIsCountryDropdownOpen(true);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("La imagen no puede pesar más de 5MB.");
        return;
      }
      setProfileImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    multiple: false,
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const validationResult = profileSchema.safeParse(formData);

    if (!validationResult.success) {
      const fieldErrors = {};
      validationResult.error.errors.forEach(err => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      toast.error('Por favor, corrige los errores del formulario.');
      return;
    }

    setFormSaving(true);
    const toastId = toast.loading('Guardando cambios...');

    try {
      let updatedData = { ...formData };

      if (profileImageFile) {
        const toastIdUpload = toast.loading('Subiendo imagen...');
        // Generar nombre único para evitar conflictos
        const fileName = `${Date.now()}_${profileImageFile.name}`;
        const userId = currentUser.uid || currentUser.id;
        const uploadResult = await StorageAdapter.uploadProfilePicture(userId, profileImageFile, fileName);
        if (!uploadResult.success) throw new Error(uploadResult.error);
        updatedData.photoURL = uploadResult.url;
        toast.success('Imagen subida', { id: toastIdUpload });
      }

      const userId = currentUser.uid || currentUser.id;
      const { error: updateError } = await DatabaseAdapter.users.update(userId, updatedData);
      if (updateError) throw updateError;
      
      setFormData(updatedData);
      setInitialData(updatedData);
      setProfileImageFile(null);

      toast.success('Perfil actualizado con éxito', { id: toastId });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error('No se pudieron guardar los cambios.', { id: toastId });
    } finally {
      setFormSaving(false);
    }
  };
  
  const handleCancel = () => {
    setFormData(initialData);
    setPreview(initialData.photoURL);
    setProfileImageFile(null);
    setErrors({});
  }

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData) || profileImageFile !== null;

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="text-white p-8 rounded-[40px] mx-auto w-full border border-[#3C3C3C]" style={{ background: 'linear-gradient(122.63deg, rgba(34, 34, 34, 0.5) 0%, rgba(53, 53, 53, 0.5) 100%)' }}>
      <div className="flex items-center mb-8">
        <img 
          src="/Back.svg" 
          alt="Back" 
          onClick={onBack}
          className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity mr-6" 
        />
        <h1 className="text-2xl font-semibold text-white">{t('profile.userInformation')}</h1>
      </div>

      <form onSubmit={handleSave}>
        {/* Profile and Basic Info Section */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            <div className="relative w-24 h-24">
              <img 
                src={preview}
                alt="User profile" 
                className="w-full h-full rounded-full object-cover border-2 border-white"
              />
              <div 
                {...getRootProps()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#404040] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#505050] transition-colors"
              >
                <input {...getInputProps()} />
                <Camera size={16} className="text-white" />
              </div>
            </div>
          </div>
          
          {/* Name Fields */}
          <div className="flex-grow sm:ml-4 sm:mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-[43%_55%] gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">{t('profile.name')}</label>
                <input 
                  type="text" 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleInputChange}
                  placeholder={t('profile.name')}
                  className={`w-full border ${errors.nombre ? 'border-red-500' : 'border-[rgba(60,60,60,1)]'} rounded-50 px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  style={{ 
                    fontFamily: 'Poppins', 
                    fontWeight: 400, 
                    fontSize: '16px',
                    background: 'linear-gradient(122.63deg, rgba(34, 34, 34, 1) 0%, rgba(53, 53, 53, 1) 100%)'
                  }}
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">{t('profile.lastName')}</label>
                <input 
                  type="text" 
                  name="apellido" 
                  value={formData.apellido} 
                  onChange={handleInputChange}
                  placeholder={t('profile.lastName')}
                  className={`w-full border ${errors.apellido ? 'border-red-500' : 'border-[rgba(60,60,60,1)]'} rounded-50 px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  style={{ 
                    fontFamily: 'Poppins', 
                    fontWeight: 400, 
                    fontSize: '16px',
                    background: 'linear-gradient(122.63deg, rgba(34, 34, 34, 1) 0%, rgba(53, 53, 53, 1) 100%)'
                  }}
                />
                {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Fecha de nacimiento */}
          <div className="relative">
            <input 
              type="text"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleInputChange}
              placeholder="Fecha de nacimiento"
              onFocus={(e) => {
                e.target.type = 'date';
                setIsDateFocused(true);
              }}
              onBlur={(e) => {
                if (!e.target.value) {
                  e.target.type = 'text';
                }
                setIsDateFocused(false);
              }}
              className="w-full border border-[rgba(60,60,60,1)] rounded-50 px-6 py-3 text-gray-400 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              style={{ 
                fontFamily: 'Poppins', 
                fontWeight: 400, 
                fontSize: '16px',
                background: 'linear-gradient(122.63deg, rgba(34, 34, 34, 1) 0%, rgba(53, 53, 53, 1) 100%)'
              }}
            />
            {!isDateFocused && !formData.fechaNacimiento && (
              <Calendar size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            )}
          </div>
          
          {/* Género */}
          <div className="relative">
            <select 
              className="w-full border border-[rgba(60,60,60,1)] rounded-50 px-6 py-3 text-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 appearance-none" 
              style={{ 
                fontFamily: 'Poppins', 
                fontWeight: 400, 
                fontSize: '16px',
                background: 'linear-gradient(122.63deg, rgba(34, 34, 34, 1) 0%, rgba(53, 53, 53, 1) 100%)'
              }}
            >
              <option value="">Género</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
            <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          {/* País */}
          <div className="relative" ref={countryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className={`w-full border ${errors.pais ? 'border-red-500' : 'border-[rgba(60,60,60,1)]'} rounded-50 px-6 py-3 text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-cyan-500`}
              style={{ 
                fontFamily: 'Poppins', 
                fontWeight: 400, 
                fontSize: '16px',
                background: 'linear-gradient(122.63deg, rgba(34, 34, 34, 1) 0%, rgba(53, 53, 53, 1) 100%)'
              }}
            >
              <span className={formData.pais ? 'text-white' : 'text-gray-400'}>
                {formData.pais || 'Argentina'}
              </span>
              <ChevronDown 
                size={20} 
                className={`text-gray-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {isCountryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#404040] border border-[#333] rounded-xl shadow-lg z-50 max-h-60 overflow-hidden">
                <div className="p-3 border-b border-[#333]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar país..."
                      value={countrySearch}
                      onChange={handleCountrySearchChange}
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
                        onClick={() => handleCountrySelect(country.name)}
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
            {errors.pais && <p className="text-red-500 text-xs mt-1">{errors.pais}</p>}
          </div>
          
          {/* Ciudad */}
          <div>
            <input 
              type="text" 
              name="ciudad" 
              value={formData.ciudad} 
              onChange={handleInputChange}
              placeholder="Concepción del Uruguay"
              className={`w-full border ${errors.ciudad ? 'border-red-500' : 'border-[rgba(60,60,60,1)]'} rounded-50 px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
              style={{ 
                fontFamily: 'Poppins', 
                fontWeight: 400, 
                fontSize: '16px',
                background: 'linear-gradient(122.63deg, rgba(34, 34, 34, 1) 0%, rgba(53, 53, 53, 1) 100%)'
              }}
            />
            {errors.ciudad && <p className="text-red-500 text-xs mt-1">{errors.ciudad}</p>}
          </div>
          
          {/* Teléfono */}
          <div className="relative">
            <input 
              type="tel" 
              name="phoneNumber" 
              placeholder="Teléfono" 
              value={formData.phoneNumber} 
              onChange={handleInputChange} 
              className={`w-full border ${errors.phoneNumber ? 'border-red-500' : 'border-[rgba(60,60,60,1)]'} rounded-50 px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500`}
              style={{ 
                fontFamily: 'Poppins', 
                fontWeight: 400, 
                fontSize: '16px',
                background: 'linear-gradient(122.63deg, rgba(34, 34, 34, 1) 0%, rgba(53, 53, 53, 1) 100%)'
              }}
            />
            <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
          </div>
          
          {/* Save Button */}
          <div className="flex justify-center items-center sm:col-span-1">
            <button 
              type="submit" 
              disabled={formSaving} 
              className="w-full sm:w-full bg-transparent text-white py-3 px-8 rounded-50 hover:bg-cyan-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-cyan-500"
              style={{ fontFamily: 'Poppins', fontWeight: 400, fontSize: '16px' }}
            >
              {formSaving ? <><Loader size={20} className="animate-spin" /> {t('profile.saving')}</> : t('profile.saveChanges')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserInformationContent;