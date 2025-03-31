import React, { useState } from 'react';
import Settings from './Settings';
import UserInformationContent from './UserInformationContent';
import NotificationsModal from './NotificationsModal';
import { ChevronDown, Calendar, ArrowLeft } from 'lucide-react';

const fondoTarjetaUrl = "/fondoTarjeta.png";

const Home = ({ onViewDetails, onSettingsClick, setSelectedOption }) => {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('ES');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
        <div className="absolute inset-0 border-solid border-t border-l border-r border-cyan-500 border-opacity-50 rounded-xl"></div>

        <div className="mb-3 sm:mb-0">
          <h1 className="text-xl md:text-2xl font-semibold">Hola, Isaac</h1>
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
  <div className="flex items-center space-x-1 md:space-x-2 relative">
    <button 
      onClick={toggleLanguageMenu}
      className="flex items-center space-x-1 focus:outline-none bg-transparent p-1 hover:ring-1 hover:ring-cyan-400 rounded-full transition-all duration-200"
    >
      <img 
        src={`/Idioma${currentLanguage}.png`} 
        alt="Language" 
        className="w-6 h-6 md:w-8 md:h-8 rounded-full" 
        onError={(e) => {
          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23555'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3ES%3C/text%3E%3C/svg%3E";
        }}
      />
      <span className="text-sm md:text-base text-gray-300">{currentLanguage}</span>
    </button>
    
    {showLanguageMenu && (
      <div className="absolute top-full right-0 mt-2 bg-transparent rounded-md overflow-hidden z-20 min-w-32">
        <button 
          className="focus:outline-none flex items-center space-x-2 px-4 py-2 w-full text-left bg-transparent hover:ring-1 hover:border-cyan-400 transition-all duration-200"
          onClick={() => changeLanguage('ES')}
        >
          <img src="/IdiomaES.png" className="w-6 h-6 rounded-full" alt="Spanish" />
          <span className="text-sm md:text-base text-white text-opacity-90">ES</span>
        </button>
        <button 
          className="focus:outline-none flex items-center space-x-2 px-4 py-2 w-full text-left bg-transparent hover:ring-1 hover:border-cyan-400 transition-all duration-200"
          onClick={() => changeLanguage('EN')}
        >
          <img src="/IdiomaEN.png" className="w-6 h-6 rounded-full" alt="English" />
          <span className="text-sm md:text-base text-white text-opacity-90">EN</span>
        </button>
      </div>
    )}
  </div>
</div>
      </div>

      {/* Tarjeta principal con fondo de imagen */}
      <div 
        className="mb-4 md:mb-6 p-4 md:p-6 rounded-2xl relative h-auto md:h-80 flex flex-col justify-center border border-cyan-500 border-opacity-30 shadow-lg shadow-cyan-900/20"
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
        <div className="max-w-lg relative z-10 py-8 md:py-0">
          <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4">Impulsa tu trading con AGM Prop Firm</h2>
          <p className="text-base md:text-xl mb-4 md:mb-6">¡Obtén hasta un 90% de profit split y gestiona cuentas de hasta $200,000</p>
          <button 
          className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-4 md:px-6 rounded-md hover:opacity-90 transition"
          style={{ outline: 'none' }}
          onClick={() => setSelectedOption && setSelectedOption("Desafio")}
        >
          Empezar
        </button>
        </div>
      </div>
      
      {/* Sección de cuentas */}
      <div className="mb-4 md:mb-6 border border-[#333] p-3 md:p-4 rounded-xl flex-grow flex flex-col bg-gradient-to-br from-[#232323] to-[#202020]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-2xl md:text-4xl font-semibold mb-2 sm:mb-0">Tus Cuentas</h2>
          <button className="text-white bg-[#232323] rounded-full py-1 md:py-2 px-3 md:px-4 text-base md:text-lg font-regular border border-gray-700 w-full sm:w-auto sm:min-w-24 hover:bg-gray-800 transition"
          style={{ outline: 'none' }}>
            Ver Todo
          </button>
        </div>
        
        {/* Tarjetas de cuentas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 flex-grow">
          {[1, 2, 3].map((accountId) => (
            <div key={accountId} className="bg-gradient-to-br from-[#232323] to-[#2d2d2d] p-3 md:p-4 rounded-3xl border border-[#333] flex flex-col h-48 md:h-72">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <h3 className="font-medium text-lg md:text-2xl lg:text-4xl mb-1 sm:mb-0">ONE STEP CHALLENGE 100K</h3>
                <span className="text-gray-400 text-base md:text-xl">#{657230 + accountId}</span>
              </div>
              <div className="flex justify-center mt-auto pt-4">
                <button 
                  className="border border-cyan-500 border-opacity-50 text-white py-1 md:py-2 px-3 md:px-4 rounded-full hover:bg-gray-800 transition"
                  style={{ outline: 'none' }}
                  onClick={() => onViewDetails && onViewDetails(accountId)}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showNotifications && (
  <NotificationsModal onClose={() => setShowNotifications(false)} />
)}
    </div>
  );
};

export default Home;