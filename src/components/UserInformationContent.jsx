import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Camera, Mail, X, Loader, UploadCloud, Trash2 } from 'lucide-react';
import axios from 'axios';
import { z } from 'zod';

// Validation Schema with Zod
const profileSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  apellido: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres" }),
  pais: z.string().min(1, { message: "Debes seleccionar un país" }),
  ciudad: z.string().min(2, { message: "La ciudad debe tener al menos 2 caracteres" }),
  phoneCode: z.string(),
  phoneNumber: z.string().min(6, { message: "El número de teléfono parece demasiado corto" }),
  // Acepta URLs completas (https://...) o rutas relativas (/imagen.png)
  photoURL: z.string().refine(
    (val) => {
      if (!val) return true; // Permite valores vacíos
      // Acepta URLs completas o rutas que empiecen con /
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
    },
    { message: "Formato de imagen inválido" }
  ).optional().nullable(),
});

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
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    pais: '',
    ciudad: '',
    phoneCode: '+54',
    phoneNumber: '',
    photoURL: '',
  });
  const [initialData, setInitialData] = useState({});
  const [countries, setCountries] = useState([]);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        const userData = docSnap.exists() ? docSnap.data() : {};
        
        const fullData = {
          nombre: userData.nombre || '',
          apellido: userData.apellido || '',
          pais: userData.pais || '',
          ciudad: userData.ciudad || '',
          phoneCode: userData.phoneCode || '+54',
          phoneNumber: userData.phoneNumber || '',
          photoURL: userData.photoURL || currentUser.photoURL || '/IconoPerfil.png',
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
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast.error('No se pudieron cargar los países.');
      }
    };
    fetchCountries();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleCountryChange = (e) => {
    const { name, value } = e.target;
    const selectedCountry = countries.find(c => c.name === value);
    setFormData(prev => ({
      ...prev,
      [name]: value,
      phoneCode: selectedCountry ? selectedCountry.code : '',
      ciudad: ''
    }));
    if (errors.pais) setErrors(prev => ({ ...prev, pais: null }));
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
        const storageRef = ref(storage, `profile_pictures/${currentUser.uid}/${fileName}`);
        await uploadBytes(storageRef, profileImageFile);
        const newPhotoURL = await getDownloadURL(storageRef);
        updatedData.photoURL = newPhotoURL;
        toast.success('Imagen subida', { id: toastIdUpload });
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, updatedData, { merge: true });
      
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
    <div className="bg-[#1C1C1C] text-white p-4 sm:p-6 md:p-8 rounded-2xl max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Configuración de Perfil</h1>
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Profile Picture Section */}
        <section className="flex-shrink-0 flex flex-col items-center gap-4 w-full lg:w-64">
          <h2 className="text-xl font-semibold text-gray-300 self-start lg:self-center">Foto de Perfil</h2>
          <div className="relative w-40 h-40">
            <img 
              src={preview}
              alt="User profile" 
              className="w-full h-full rounded-full object-cover border-4 border-gray-600"
            />
          </div>
          <div 
            {...getRootProps()} 
            className={`w-full p-6 text-center border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragActive ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-600 hover:border-cyan-400'}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <UploadCloud size={32}/>
              {isDragActive ?
                <p>Suelta la imagen aquí...</p> :
                <p>Arrastra una foto o haz clic para seleccionarla</p>
              }
              <span className="text-xs">PNG, JPG, WEBP hasta 5MB</span>
            </div>
          </div>
          {preview && preview !== '/IconoPerfil.png' && (
             <button type="button" onClick={() => {
                setFormData(prev => ({ ...prev, photoURL: '/IconoPerfil.png'}));
                setPreview('/IconoPerfil.png');
                // We set the file to null, but also change formData, so hasChanges will be true
                setProfileImageFile(null); 
             }} className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 py-2 px-4 rounded-lg hover:bg-red-500/40 transition-colors">
                <Trash2 size={16}/>
                Eliminar Foto
            </button>
          )}
        </section>

        {/* Form Fields Section */}
        <section className="flex-grow w-full">
          <div className="space-y-6">
            {/* --- Personal Information --- */}
            <div className="bg-[#2D2D2D] p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Email */}
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm text-gray-400 mb-2">Email</label>
                  <div className="relative">
                    <input type="email" id="email" value={currentUser.email} readOnly className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl p-3 text-sm text-gray-400 focus:outline-none cursor-not-allowed" />
                    <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="block text-sm text-gray-400 mb-2">Nombre</label>
                  <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} className={`w-full bg-[#1C1C1C] border ${errors.nombre ? 'border-red-500' : 'border-[#333]'} rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500`} />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                </div>
                {/* Apellido */}
                <div>
                  <label htmlFor="apellido" className="block text-sm text-gray-400 mb-2">Apellido</label>
                  <input type="text" id="apellido" name="apellido" value={formData.apellido} onChange={handleInputChange} className={`w-full bg-[#1C1C1C] border ${errors.apellido ? 'border-red-500' : 'border-[#333]'} rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500`} />
                  {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>}
                </div>
              </div>
            </div>

             {/* --- Location Information --- */}
            <div className="bg-[#2D2D2D] p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">Ubicación y Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* País */}
                <div>
                    <label htmlFor="pais" className="block text-sm text-gray-400 mb-2">País</label>
                    <select id="pais" name="pais" value={formData.pais} onChange={handleCountryChange} className={`w-full appearance-none bg-[#1C1C1C] border ${errors.pais ? 'border-red-500' : 'border-[#333]'} rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500`}>
                        <option value="" disabled>Seleccionar país</option>
                        {countries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    {errors.pais && <p className="text-red-500 text-xs mt-1">{errors.pais}</p>}
                </div>
                {/* Ciudad */}
                <div>
                    <label htmlFor="ciudad" className="block text-sm text-gray-400 mb-2">Ciudad</label>
                    <input type="text" id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleInputChange} placeholder="Ej: Buenos Aires" className={`w-full bg-[#1C1C1C] border ${errors.ciudad ? 'border-red-500' : 'border-[#333]'} rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500`} />
                    {errors.ciudad && <p className="text-red-500 text-xs mt-1">{errors.ciudad}</p>}
                </div>
                {/* Teléfono */}
                <div className="md:col-span-2">
                    <label htmlFor="telefono" className="block text-sm text-gray-400 mb-2">Teléfono</label>
                    <div className="flex">
                        <input type="text" value={formData.phoneCode} readOnly className="w-20 bg-[#1C1C1C] border-t border-b border-l border-[#333] rounded-l-xl p-3 text-sm text-center text-gray-400 cursor-not-allowed"/>
                        <input type="tel" id="telefono" name="phoneNumber" placeholder="Número de teléfono" value={formData.phoneNumber} onChange={handleInputChange} className={`w-full bg-[#1C1C1C] border-t border-b border-r ${errors.phoneNumber ? 'border-red-500' : 'border-[#333]'} rounded-r-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500`} />
                    </div>
                     {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                </div>
              </div>
            </div>

            {/* --- Actions --- */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
              <button type="button" onClick={handleCancel} disabled={!hasChanges || formSaving} className="w-full sm:w-auto bg-transparent border border-gray-600 text-white py-3 px-8 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Cancelar
              </button>
              <button 
                type="submit" 
                disabled={!hasChanges || formSaving} 
                className="w-full sm:w-auto bg-cyan-600 text-white py-3 px-8 rounded-xl hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                  {formSaving ? <><Loader size={20} className="animate-spin" /> Guardando...</> : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default UserInformationContent;