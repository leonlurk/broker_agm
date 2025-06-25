import React, { useState, useRef, useEffect } from 'react';
import Settings from './Settings';
import UserInformationContent from './UserInformationContent';
import NotificationsModal from './NotificationsModal';
import { ChevronDown, ArrowDown, ArrowUp, SlidersHorizontal } from 'lucide-react';

const fondoTarjetaUrl = "/fondoTarjeta.png";

// Datos de ejemplo para las cuentas (reemplazar con datos dinámicos)
const exampleAccounts = {
  'Cuentas Reales': [
    { id: 'real1', name: 'CUENTA 1', balance: 0.01189933, change: '+0.91%' },
    { id: 'real2', name: 'CUENTA 2', balance: 12300, change: '+1.23%' },
    { id: 'real3', name: 'CUENTA 3', balance: 8450, change: '-0.41%' },
  ],
  'Cuentas Demo': [
    { id: 'demo1', name: 'DEMO A', balance: 10000, change: '+1.5%' },
  ],
  'Copytrading': [
     { id: 'copy1', name: 'STRATEGY X', balance: 500, change: '+8%' },
  ],
  'Pamm': [
     { id: 'pamm1', name: 'PAMM ACCOUNT', balance: 2500, change: '+5.2%' },
  ]
};

const Home = ({ onViewDetails, onSettingsClick, setSelectedOption, user }) => {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('ES');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('Mes actual');
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [activeAccountTab, setActiveAccountTab] = useState('Cuentas Reales');
  const [selectedWalletAccount, setSelectedWalletAccount] = useState(null);
  const dropdownRef = useRef(null);

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

  const handleBackFromUserInfo = () => {
    setShowUserInfo(false);
  };

  const handleAccountTabChange = (tabName) => {
    setActiveAccountTab(tabName);
  };

  const toggleAccountSelector = () => {
    setShowAccountSelector(prev => !prev);
    console.log("Toggle account selector. New state:", !showAccountSelector);
  };

  const handleDeposit = () => {
    console.log("Deposit button clicked");
  };

  const handleWithdraw = () => {
    console.log("Withdraw button clicked");
  };

  const handleWalletAccountSelect = (account) => {
    console.log("Selected wallet account:", account);
    setSelectedWalletAccount(account);
    setShowAccountSelector(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountSelector(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const accountsToShow = exampleAccounts[activeAccountTab] || [];

  if (showUserInfo) {
    return (
      <UserInformationContent onBack={handleBackFromUserInfo} />
    );
  }

  return (
    <div className="border border-[#333] rounded-3xl p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white min-h-screen flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl relative">
        <div className="absolute inset-0 border-solid border-t border-l border-r border-cyan-500 rounded-2xl"></div>

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

      <div className="mb-6">
        <div 
          className="p-4 md:p-6 rounded-2xl relative flex flex-col justify-center border-solid border-t border-l border-r border-cyan-500"
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
            <h2 className="text-xl md:text-3xl font-bold mb-3">Impulsa tu trading con AGM Prop Firm</h2>
            <p className="text-base md:text-lg mb-4">¡Obtén hasta un 90% de profit split y gestiona cuentas de hasta $200,000</p>
            <button 
              className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-4 rounded-md hover:opacity-90 transition"
              style={{ outline: 'none' }}
              onClick={() => setSelectedOption && setSelectedOption("Desafio")}
            >
              Comenzar
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 md:p-6 border-solid border-t border-l border-r border-cyan-500 rounded-2xl bg-gradient-to-br from-[#232323] to-[#2b2b2b]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
          <div className="flex-1 space-y-3">
            <div className="relative inline-block w-full max-w-xs" ref={dropdownRef}>
              <button
                onClick={() => setShowAccountSelector(prev => !prev)}
                className="flex items-center w-full px-9 py-3.5 rounded-full border border-[#333] bg-gradient-to-br from-[#232323] to-[#202020] hover:bg-[#2a2a2a] transition text-sm gap-x-4 md:gap-x-0 md:justify-between"
                style={{ outline: 'none' }}
              >
                <span className="truncate">{selectedWalletAccount ? selectedWalletAccount.name : 'Seleccionar Cuenta'}</span>
                <img src='/Filter.svg' width={23} />
              </button>
              {showAccountSelector && (
                  <div className="absolute top-full left-0 z-10 mt-1 w-full max-w-xs bg-[#232323] border border-[#444] rounded-md shadow-lg text-sm py-1 overflow-y-auto max-h-60">
                    {Object.keys(exampleAccounts).map(category => (
                      <div key={category} className="px-2 pt-2">
                        <div className="px-2 pb-1 text-xs text-gray-500 font-semibold uppercase">{category}</div>
                        {exampleAccounts[category].map(account => (
                          <button
                            key={account.id}
                            onClick={() => handleWalletAccountSelect(account)}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-[#333] text-gray-300 hover:text-white block truncate"
                          >
                             {account.name} - ${account.balance.toFixed(2)}
                          </button>
                        ))}
                      </div>
                    ))}
                    {Object.values(exampleAccounts).flat().length === 0 && (
                         <div className="px-4 py-2 text-gray-500">No hay cuentas disponibles.</div>
                    )}
                  </div>
              )}
            </div>

            <div className="space-y-1 pt-3">
              <h3 className="text-base text-gray-400">ID de billetera:</h3>
              <p className="text-lg font-medium text-white">{selectedWalletAccount?.id || '123456789'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-base text-gray-400">Balance (USD)</h3>
              <p className="text-3xl font-bold text-white">${(selectedWalletAccount?.balance || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
             <button
               onClick={handleDeposit}
               className="bg-[#2a2a2a] border border-cyan-500/50 hover:border-cyan-500/80 text-white py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base"
               style={{ outline: 'none' }}
             >
               Depositar
               <ArrowDown size={16} className="transform -rotate-90"/>
             </button>
             <button
               onClick={handleWithdraw}
               className="bg-[#2a2a2a] border-cyan-500/50 hover:border-cyan-500/80 text-gray-300 hover:text-white py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base"
               style={{ outline: 'none' }}
             >
               Retirar
                <ArrowUp size={16} className="transform -rotate-90"/>
             </button>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-3xl border border-[#333]"> 
         <h2 className="text-2xl font-semibold text-white mb-4">Tus Cuentas</h2>
         <div className="flex flex-wrap items-center gap-3 mb-5">
             {['Cuentas Reales', 'Cuentas Demo', 'Copytrading', 'Pamm'].map((tab) => (
                 <button
                     key={tab}
                     onClick={() => handleAccountTabChange(tab)}
                     className={`py-2 px-6 bg-gradient-to-br from-[#232323] to-[#202020] text-sm md:text-base font-medium rounded-full transition-colors focus:outline-none border ${ 
                         activeAccountTab === tab
                             ? 'border-cyan-500 text-white' 
                             : 'border-[#333] text-gray-500 hover:text-gray-300 hover:border-gray-500' 
                     }`}
                 >
                     {tab}
                 </button>
             ))}
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
             {accountsToShow.length > 0 ? accountsToShow.map((account) => (
                 <div
                     key={account.id}
                     className="p-4 md:p-5 bg-gradient-to-br from-[#232323] to-[#2b2b2b] border border-[#333] flex flex-col justify-between hover:border-cyan-500 transition-colors rounded-2xl min-h-60"
                 >
                     <div className="mb-4">
                         <h3 className="text-lg font-semibold text-white mb-2">{account.name}</h3>
                         <p className="text-xl font-medium text-white">{account.balance} USD <span className={`text-sm ${account.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{account.change}</span></p>
                     </div>
                     <button
                         onClick={() => {
                             console.log(`View Details clicked for account ID: ${account.id}`);
                             if (onViewDetails) { 
                                 onViewDetails(account.id);
                             } else {
                                 console.warn("onViewDetails prop not provided to Home component");
                             }
                         }}
                         className="w-full bg-[#2a2a2a] border border-[#444] hover:border-cyan-600 hover:text-cyan-400 text-gray-300 py-2 rounded-full transition text-sm"
                         style={{ outline: 'none' }}
                     >
                         Ver Detalles
                     </button>
                 </div>
             )) : (
                   <p className="text-gray-500 sm:col-span-2 lg:col-span-3 text-center py-4">No hay cuentas para mostrar en esta categoría.</p>
              )}
         </div>
      </div>

      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default Home;