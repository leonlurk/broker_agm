import React, { useState } from 'react';
import { ChevronLeft, Camera, Calendar, ChevronDown } from 'lucide-react';

const UserInformationContent = ({ onBack }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    genero: '',
    pais: 'Argentina',
    ciudad: 'Concepción del Uruguay',
    telefono: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-[#2D2D2D] text-white p-4 sm:p-6 md:p-8 rounded-2xl max-w-4xl mx-auto w-full">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 hover:bg-[#3f3f3f] rounded-full">
          <ChevronLeft size={24} />
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-8">Información de usuario</h1>

      <div className="flex flex-col lg:flex-row items-start gap-10">
        {/* Profile Picture */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4 w-full lg:w-auto">
          <div className="relative w-32 h-32">
            <img 
              src="/woman-profile.jpg" // Placeholder image
              alt="User profile" 
              className="w-full h-full rounded-full object-cover"
            />
            <button className="absolute bottom-1 right-1 bg-[#232323] p-2 rounded-full border-2 border-[#2D2D2D] hover:bg-[#3f3f3f]">
              <Camera size={20} />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex-grow w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm text-gray-400 mb-2">Nombre</label>
              <input type="text" id="nombre" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleInputChange} className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
            </div>

            {/* Apellido */}
            <div>
              <label htmlFor="apellido" className="block text-sm text-gray-400 mb-2">Apellido</label>
              <input type="text" id="apellido" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleInputChange} className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
            </div>
            
            {/* Fecha de nacimiento */}
            <div>
              <label htmlFor="fechaNacimiento" className="block text-sm text-gray-400 mb-2">Fecha de nacimiento</label>
              <div className="relative">
                <input type="text" id="fechaNacimiento" name="fechaNacimiento" placeholder="DD/MM/AAAA" value={formData.fechaNacimiento} onChange={handleInputChange} className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl p-3 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Género */}
            <div>
                <label htmlFor="genero" className="block text-sm text-gray-400 mb-2">Género</label>
                <div className="relative">
                    <select id="genero" name="genero" value={formData.genero} onChange={handleInputChange} className="w-full appearance-none bg-[#1C1C1C] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500">
                        <option value="" disabled>Seleccionar género</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* País */}
            <div>
                <label htmlFor="pais" className="block text-sm text-gray-400 mb-2">País</label>
                <div className="relative">
                    <select id="pais" name="pais" value={formData.pais} onChange={handleInputChange} className="w-full appearance-none bg-[#1C1C1C] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500">
                        <option value="Argentina">Argentina</option>
                        <option value="Uruguay">Uruguay</option>
                        <option value="Chile">Chile</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Ciudad */}
            <div>
                <label htmlFor="ciudad" className="block text-sm text-gray-400 mb-2">Ciudad</label>
                 <div className="relative">
                    <select id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleInputChange} className="w-full appearance-none bg-[#1C1C1C] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500">
                        <option value="Concepción del Uruguay">Concepción del Uruguay</option>
                        <option value="Buenos Aires">Buenos Aires</option>
                        <option value="Montevideo">Montevideo</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>
            
            {/* Teléfono */}
            <div className="md:col-span-1">
                <label htmlFor="telefono" className="block text-sm text-gray-400 mb-2">Teléfono</label>
                <div className="flex">
                    <div className="relative">
                         <select className="appearance-none bg-[#1C1C1C] border-t border-b border-l border-[#333] rounded-l-xl p-3 text-sm pr-8 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                            <option>+54</option>
                            <option>+598</option>
                         </select>
                         <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <input type="tel" id="telefono" name="telefono" placeholder="Número de teléfono" value={formData.telefono} onChange={handleInputChange} className="w-full bg-[#1C1C1C] border-t border-b border-r border-[#333] rounded-r-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                </div>
            </div>

            {/* Empty div for grid alignment */}
            <div className="hidden md:block"></div>

            {/* Botón Guardar */}
            <div className="md:col-span-2 flex justify-end">
                <button className="w-full md:w-auto bg-transparent border border-cyan-500 text-white py-3 px-12 rounded-xl hover:bg-cyan-500/20 transition-colors">
                    Guardar Cambios
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInformationContent;