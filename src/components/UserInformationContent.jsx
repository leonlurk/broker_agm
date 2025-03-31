import React, { useState } from 'react';
import { ChevronDown, Calendar, ArrowLeft } from 'lucide-react';

const UserInformationContent = ({ onBack }) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('');
  const [pais, setPais] = useState('Argentina');
  const [ciudad, setCiudad] = useState('Concepcion del uruguay');
  const [telefono, setTelefono] = useState('');

  return (
    <div className="border border-[#333] rounded-3xl bg-gradient-to-br from-[#232323] to-[#2d2d2d] bg-opacity-20 p-4 md:p-6 shadow-xl">
      <div className="border border-[#333] rounded-3xl bg-gradient-to-br from-[#232323] to-[#343434] bg-opacity-90 p-6 md:p-8">
        {/* Header con botón de volver */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-cyan-500 hover:text-cyan-400 transition mr-4 focus:outline-none"
          >
            <ArrowLeft size={20} className="mr-1" />
            <span>Volver</span>
          </button>
          <h1 className="text-3xl text-white font-medium">Informacion de usuario</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Nombre */}
          <div>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              className="w-full py-6 px-6 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] text-white text-xl focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          {/* Apellido */}
          <div>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Apellido"
              className="w-full py-6 px-6 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] text-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Fecha de nacimiento */}
          <div className="relative">
            <input
              type="text"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              placeholder="Fecha de nacimiento"
              className="w-full py-6 px-6 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] text-white text-xl focus:outline-none focus:border-cyan-500 pr-12"
            />
            <Calendar size={20} className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          {/* Género */}
          <div className="relative">
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="appearance-none w-full py-6 px-6 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] text-[#a3a3a3] text-xl focus:outline-none focus:border-cyan-500 pr-12"
            >
              <option value="" disabled selected hidden>Genero</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
            <ChevronDown size={20} className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* País */}
          <div className="relative">
            <select
              value={pais}
              onChange={(e) => setPais(e.target.value)}
              className="appearance-none w-full py-6 px-6 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] text-white text-xl focus:outline-none focus:border-cyan-500 pr-12"
            >
              <option value="Argentina">Argentina</option>
              <option value="Uruguay">Uruguay</option>
              <option value="Chile">Chile</option>
              <option value="Brasil">Brasil</option>
              <option value="Paraguay">Paraguay</option>
            </select>
            <ChevronDown size={20} className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          {/* Ciudad */}
          <div>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ciudad"
              className="w-full py-6 px-6 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] text-white text-xl focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
        
        <div className="mb-8">
          {/* Teléfono */}
          <div className="relative">
            <select
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="appearance-none w-full py-6 text-xl px-6 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] text-white focus:outline-none focus:border-cyan-500 pr-12"
            >
              <option value="" disabled selected hidden>Telefono</option>
              <option value="+54">+54 (Argentina)</option>
              <option value="+598">+598 (Uruguay)</option>
              <option value="+56">+56 (Chile)</option>
            </select>
            <ChevronDown size={20} className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={onBack}
            className="py-4 px-8 rounded-full border border-cyan-500 text-white bg-transparent hover:bg-cyan-500/10 transition-colors focus:outline-none"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInformationContent;