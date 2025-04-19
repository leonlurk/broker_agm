import React, { useState } from 'react';
import Settings from './Settings';
import UserInformationContent from './UserInformationContent';
import NotificationsModal from './NotificationsModal';
import { ChevronDown, ArrowDown, ArrowUp } from 'lucide-react';

const fondoTarjetaUrl = "/fondoTarjeta.png";

const Home = ({ onViewDetails, onSettingsClick, setSelectedOption, user }) => {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('ES');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('Mes actual');

  const toggleLanguageMenu = () => {
    setShowLanguageMenu(!showLanguageMenu);
  };

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    setShowLanguageMenu(false);
  };
  
  const toggleUserInfo = () => {
    setShowUserInfo(!showUserInfo);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const toggleMonthMenu = () => {
    setShowMonthMenu(!showMonthMenu);
  };

  // Handle going back from user information
  const handleBackFromUserInfo = () => {
    setShowUserInfo(false);
  };

  // If user info is being shown, display the UserInformation component
  if (showUserInfo) {
    return (
      <UserInformationContent onBack={handleBackFromUserInfo} />
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[#232323] text-white min-h-screen flex flex-col">
      {/* Header con saludo y fecha */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-[#232323] to-[#202020] border border-[#333] rounded-xl relative">
        <div className="absolute inset-0 border-solid border-t border-l border-r border-cyan-500  rounded-xl"></div>

        <div className="mb-3 sm:mb-0">
          <h1 className="text-xl md:text-2xl font-semibold">Hola, {user?.username || 'Usuario'}</h1>
          <p className="text-sm md:text-base text-gray-400">Miércoles, 8 de diciembre 2025</p>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4 w-full sm:w-auto justify-end">
          <button 
            className="relative rounded-full bg-transparent focus:outline-none p-2 hover:ring-1 hover:ring-cyan-400 transition-all duration-200"
            onClick={toggleNotifications}
          >
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"></span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button 
            className="relative rounded-full bg-transparent p-2 hover:ring-1 hover:ring-cyan-400 transition-all duration-200"
            style={{ outline: 'none' }}
            onClick={() => onSettingsClick && onSettingsClick()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="flex items-center space-x-2 relative">
            <button 
              onClick={toggleUserInfo}
              className="focus:outline-none bg-transparent p-1 hover:ring-1 hover:ring-cyan-400 rounded-full transition-all duration-200"
            >
              <img src="/Perfil.png" alt="Avatar" className="w-8 h-8 md:w-12 md:h-12 rounded-full" 
                onError={(e) => {
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23555'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3ES%3C/text%3E%3C/svg%3E";
                }}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Tarjeta principal con fondo de imagen */}
        <div 
          className="md:col-span-2 p-4 md:p-6 rounded-xl relative flex flex-col justify-center border-solid border-t border-l border-r border-cyan-500 shadow-2xl shadow-cyan-900/20"
        >
          <div 
            className="absolute inset-0 rounded-md"
            style={{ 
              backgroundImage: `url(${fondoTarjetaUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.2,
              zIndex: 0
            }}
          ></div>
          <div className="relative z-10 py-4">
            <h2 className="text-xl md:text-3xl font-bold mb-3">Impulsa tu trading con <br/>AGM Prop Firm</h2>
            <p className="text-base md:text-lg mb-4">¡Obtén hasta un 90% de profit split y gestiona<br/>cuentas de hasta $200,000</p>
            <button 
              className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-4 rounded-md hover:opacity-90 transition"
              style={{ outline: 'none' }}
              onClick={() => setSelectedOption && setSelectedOption("Desafio")}
            >
              Empezar
            </button>
          </div>
        </div>

        {/* Tarjeta de soporte */}
        <div className="p-4 md:p-6 rounded-xl flex flex-col justify-between border-solid border-t border-l border-r border-cyan-500 shadow-lg shadow-cyan-900/20 bg-gradient-to-br from-[#232323] to-[#202020]">
          <div>
            <h2 className="text-xl md:text-3xl font-bold mb-2">Soporte 24/7</h2>
            <p className="text-base mb-6">Contáctanos y te ayudaremos con tus preguntas.</p>
          </div>
          <div>
            <button 
              className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-4 rounded-md hover:opacity-90 transition"
              style={{ outline: 'none' }}
            >
              Contacto
            </button>
          </div>
        </div>
      </div>

      {/* Sección de billetera */}
      <div className="mb-6 p-4 rounded-xl border border-cyan-500 border-opacity-30 shadow-lg shadow-cyan-900/20 bg-gradient-to-br from-[#232323] to-[#202020]">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <h3 className="text-2xl text-white mb-1">ID de billetera:</h3>
            <p className="text-xl font-medium text-gray-400">123456789</p>
          </div>
          <div>
            <h3 className="text-lg text-gray-400 mb-1">Balance (USD)</h3>
            <p className="text-3xl font-bold">$0</p>
          </div>
          <div className="flex flex-col gap-2 mt-4 md:mt-0">
            <button className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] border border-cyan-500 border-opacity-50 text-white py-2 px-16 focus:outline-none rounded-md transition flex items-center justify-center gap-2">
              Depositar
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            <button className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] border border-cyan-500 border-opacity-50 text-white py-2 px-4 rounded-md focus:outline-none transition flex items-center justify-center gap-2">
              Retirar
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de mes */}
      <div className="relative mb-6">
        <button 
          className="border border-cyan-500 border-opacity-30 bg-gradient-to-br from-[#232323] to-[#202020] rounded-md py-2 px-4 w-full md:w-64 flex items-center justify-between"
          onClick={toggleMonthMenu}
        >
          <span>{currentMonth}</span>
          <ChevronDown size={18} />
        </button>
        {showMonthMenu && (
          <div className="absolute z-10 mt-1 w-full md:w-64 bg-gradient-to-br from-[#232323] to-[#202020] border border-cyan-500 border-opacity-30 rounded-md shadow-lg">
            <button 
              className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-all duration-200"
              onClick={() => {
                setCurrentMonth('Mes actual');
                setShowMonthMenu(false);
              }}
            >
              Mes actual
            </button>
            <button 
              className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-all duration-200"
              onClick={() => {
                setCurrentMonth('Noviembre');
                setShowMonthMenu(false);
              }}
            >
              Noviembre
            </button>
            <button 
              className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-all duration-200"
              onClick={() => {
                setCurrentMonth('Octubre');
                setShowMonthMenu(false);
              }}
            >
              Octubre
            </button>
          </div>
        )}
      </div>

      {/* Estadísticas de depósitos y retiros */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
        {/* Depósitos */}
        <div className="p-6 rounded-xl border border-[#333] bg-gradient-to-br from-[#232323] to-[#202020] min-h-48">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <h3 className="text-xl font-medium">Depósitos</h3>
          </div>
          <p className="text-2xl font-bold text-green-500 mb-2">$0</p>
          <div className="flex items-center text-gray-400">
            <ArrowUp className="text-green-500 mr-2" size={16} />
            <span>0% en comparación con el mes pasado</span>
          </div>
        </div>
        
        {/* Retiros */}
        <div className="p-6 rounded-xl border border-[#333] bg-gradient-to-br from-[#232323] to-[#202020] min-h-60">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <h3 className="text-xl font-medium">Retiros</h3>
          </div>
          <p className="text-2xl font-bold text-red-500 mb-2">$0</p>
          <div className="flex items-center text-gray-400">
            <ArrowDown className="text-red-500 mr-2" size={16} />
            <span>0% en comparación con el mes pasado</span>
          </div>
        </div>
      </div>

      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default Home;