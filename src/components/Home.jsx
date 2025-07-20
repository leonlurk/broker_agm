import React, { useState, useRef, useEffect } from 'react';
import Settings from './Settings';
import UserInformationContent from './UserInformationContent';
import NotificationsModal from './NotificationsModal';
import LanguageSelector from './LanguageSelector';
import { ChevronDown, ArrowDown, ArrowUp, SlidersHorizontal, Settings as SettingsIcon, Bell } from 'lucide-react';
import { useAccounts, WALLET_OPERATIONS, ACCOUNT_CATEGORIES } from '../contexts/AccountsContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import useTranslation from '../hooks/useTranslation';

const fondoTarjetaUrl = "/fondoTarjeta.png";

const Home = ({ onSettingsClick, setSelectedOption, user }) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { 
    accounts, 
    selectedAccount, 
    activeCategory, 
    isLoading,
    error,
    selectAccount, 
    setActiveCategory,
    startWalletOperation,
    getAllAccounts,
    getAccountsByCategory,
    getTotalBalance,
    WALLET_OPERATIONS: WOP,
    ACCOUNT_CATEGORIES: ACC_CAT
  } = useAccounts();
  
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead 
  } = useNotifications();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('ES');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('Mes actual');
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [userProfileData, setUserProfileData] = useState({
    photoURL: '/Perfil.png',
    nombre: '',
    apellido: ''
  });
  const dropdownRef = useRef(null);

  // Cargar datos del usuario desde Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserProfileData({
            photoURL: userData.photoURL || currentUser.photoURL || '/Perfil.png',
            nombre: userData.nombre || '',
            apellido: userData.apellido || ''
          });
        } else {
          // Si no hay datos en Firestore, usar los datos del Auth
          setUserProfileData({
            photoURL: currentUser.photoURL || '/Perfil.png',
            nombre: currentUser.displayName?.split(' ')[0] || '',
            apellido: currentUser.displayName?.split(' ')[1] || ''
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback en caso de error
        setUserProfileData({
          photoURL: '/Perfil.png',
          nombre: '',
          apellido: ''
        });
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Refrescar datos cuando se regresa de la configuración de perfil
  useEffect(() => {
    if (!showUserInfo && currentUser) {
      // Recargar datos cuando se cierra el modal de configuración
      const fetchUserData = async () => {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserProfileData({
              photoURL: userData.photoURL || currentUser.photoURL || '/Perfil.png',
              nombre: userData.nombre || '',
              apellido: userData.apellido || ''
            });
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      };
      
      fetchUserData();
    }
  }, [showUserInfo, currentUser]);

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
    if (!showNotifications && unreadCount > 0) {
      setTimeout(() => {
        markAllAsRead();
      }, 1000);
    }
  };

  const toggleMonthMenu = () => {
    setShowMonthMenu(!showMonthMenu);
  };

  const handleBackFromUserInfo = () => {
    setShowUserInfo(false);
  };

  const handleAccountTabChange = (tabName) => {
    setActiveCategory(tabName);
  };

  const toggleAccountSelector = () => {
    setShowAccountSelector(prev => !prev);
    console.log("Toggle account selector. New state:", !showAccountSelector);
  };

  const handleDeposit = () => {
    console.log("Deposit button clicked for account:", selectedAccount?.accountName);
    const operationData = startWalletOperation(WOP.DEPOSIT, selectedAccount);
    if (setSelectedOption) {
      setSelectedOption("Wallet", operationData);
    }
  };

  const handleWithdraw = () => {
    console.log("Withdraw button clicked for account:", selectedAccount?.accountName);
    const operationData = startWalletOperation(WOP.WITHDRAW, selectedAccount);
    if (setSelectedOption) {
      setSelectedOption("Wallet", operationData);
    }
  };

  const handleTransfer = () => {
    console.log("Transfer button clicked for account:", selectedAccount?.accountName);
    const operationData = startWalletOperation(WOP.TRANSFER, selectedAccount);
    if (setSelectedOption) {
      setSelectedOption("Wallet", operationData);
    }
  };

  const handleWalletAccountSelect = (account) => {
    console.log("Selected wallet account:", account);
    selectAccount(account);
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

  // Obtener cuentas dinámicamente
  const accountsToShow = getAccountsByCategory(activeCategory);
  const allAccountsForSelector = getAllAccounts();

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
          <h1 className="text-xl md:text-2xl font-semibold">
            {t('dashboard.welcome')}, {userProfileData.nombre || currentUser?.displayName?.split(' ')[0] || user?.username || 'Usuario'}
          </h1>
          <p className="text-sm md:text-base text-gray-400">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}</p>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4 w-full sm:w-auto justify-end">
          <button 
            className="relative rounded-full bg-transparent p-2 hover:ring-1 hover:ring-cyan-400 transition-all duration-200"
            style={{ outline: 'none' }}
            onClick={() => onSettingsClick && onSettingsClick()}
          >
            <SettingsIcon className="h-6 w-6 text-white" />
          </button>
          
          <button 
            className="relative rounded-full bg-transparent p-2 hover:ring-1 hover:ring-cyan-400 transition-all duration-200"
            style={{ outline: 'none' }}
            onClick={toggleNotifications}
          >
            <div className="relative">
              <Bell className="h-6 w-6 text-white" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border border-[#2B2B2B]"></div>
              )}
            </div>
          </button>
          
          <div className="flex items-center space-x-2 relative">
            <button 
              onClick={toggleUserInfo}
              className="focus:outline-none bg-transparent p-1 hover:ring-1 hover:ring-cyan-400 rounded-full transition-all duration-200"
            >
              <img 
                src={userProfileData.photoURL} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover" 
                onError={(e) => {
                  e.target.src = "/Perfil.png"; // Fallback a la imagen por defecto
                }}
              />
            </button>
          </div>
          
          {/* Language Selector - 4ta opción (última) */}
          <LanguageSelector />
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
            <h2 className="text-xl md:text-3xl font-bold mb-3">{t('home.welcomeTitle')}</h2>
            <p className="text-base md:text-lg mb-4">{t('home.welcomeSubtitle')}</p>
            <button 
              className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-4 rounded-md hover:opacity-90 transition"
              style={{ outline: 'none' }}
              onClick={() => setSelectedOption && setSelectedOption("Nueva Cuenta")}
            >
              {t('home.getStarted')}
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
                className="flex items-center w-full px-9 py-3.5 rounded-xl border border-[#333] bg-gradient-to-br from-[#232323] to-[#202020] hover:bg-[#2a2a2a] transition text-sm gap-x-4 md:gap-x-0 md:justify-between"
                style={{ outline: 'none' }}
                disabled={isLoading}
              >
                <span className="truncate">
                  {selectedAccount ? selectedAccount.accountName : t('withdrawal.selectAccount')}
                </span>
                <img src='/Filter.svg' width={23} />
              </button>
              {showAccountSelector && (
                  <div className="absolute top-full left-0 z-10 mt-1 w-full max-w-xs bg-[#232323] border border-[#444] rounded-md shadow-lg text-sm py-1 overflow-y-auto max-h-60">
                    {isLoading ? (
                      <div className="px-4 py-2 text-gray-500">{t('common.loading')}</div>
                    ) : error ? (
                      <div className="px-4 py-2 text-red-400">{t('common.error')}: {error}</div>
                    ) : Object.keys(accounts).filter(category => accounts[category].length > 0).length > 0 ? (
                      Object.keys(accounts).map(category => 
                        accounts[category].length > 0 && (
                      <div key={category} className="px-2 pt-2">
                        <div className="px-2 pb-1 text-xs text-gray-500 font-semibold uppercase">{category}</div>
                            {accounts[category].map(account => (
                          <button
                            key={account.id}
                            onClick={() => handleWalletAccountSelect(account)}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-[#333] text-gray-300 hover:text-white block truncate"
                          >
                                 {account.accountName} - ${(account.balance || 0).toFixed(2)}
                          </button>
                        ))}
                      </div>
                        )
                      )
                    ) : (
                         <div className="px-4 py-2 text-gray-500">{t('common.noAccountsAvailable')}</div>
                    )}
                  </div>
              )}
            </div>

            <div className="space-y-1 pt-3">
              <h3 className="text-base text-gray-400">{t('accounts.accountNumber')}:</h3>
              <p className="text-lg font-medium text-white">
                {selectedAccount?.accountNumber || t('common.selectAccount')}
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-base text-gray-400">{t('accounts.balance')} (USD)</h3>
              <p className="text-3xl font-bold text-white">
                ${(selectedAccount?.balance || 0).toFixed(2)}
              </p>
              {selectedAccount && (
                <p className="text-sm text-gray-400">
                  {selectedAccount.accountType} • {selectedAccount.accountTypeSelection}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
             <button
               onClick={handleDeposit}
               className={`bg-[#2a2a2a] border py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base ${
                 selectedAccount 
                   ? 'border-cyan-500/50 hover:border-cyan-500/80 text-white hover:bg-[#333] cursor-pointer' 
                   : 'border-gray-600/50 text-gray-500 cursor-not-allowed opacity-50'
               }`}
               style={{ outline: 'none' }}
               disabled={!selectedAccount}
             >
               {t('wallet.deposit')}
               <ArrowDown size={16} className="transform -rotate-90"/>
             </button>
             <button
               onClick={handleWithdraw}
               className={`bg-[#2a2a2a] border py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base ${
                 selectedAccount 
                   ? 'border-cyan-500/50 hover:border-cyan-500/80 text-gray-300 hover:text-white hover:bg-[#333] cursor-pointer' 
                   : 'border-gray-600/50 text-gray-500 cursor-not-allowed opacity-50'
               }`}
               style={{ outline: 'none' }}
               disabled={!selectedAccount}
             >
               {t('wallet.withdraw')}
                <ArrowUp size={16} className="transform -rotate-90"/>
             </button>
             <button
               onClick={handleTransfer}
               className={`bg-[#2a2a2a] border py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base ${
                 selectedAccount 
                   ? 'border-cyan-500/50 hover:border-cyan-500/80 text-gray-300 hover:text-white hover:bg-[#333] cursor-pointer' 
                   : 'border-gray-600/50 text-gray-500 cursor-not-allowed opacity-50'
               }`}
               style={{ outline: 'none' }}
               disabled={!selectedAccount}
             >
               {t('trading.transfer')}
               <SlidersHorizontal size={16} className="transform rotate-90"/>
             </button>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-3xl border border-[#333]"> 
         <h2 className="text-2xl font-semibold text-white mb-4">{t('home.yourAccounts')}</h2>
         <div className="flex flex-wrap items-center gap-3 mb-5">
             {Object.keys(ACC_CAT).map((categoryKey) => {
               const categoryName = ACC_CAT[categoryKey];
               const categoryAccounts = getAccountsByCategory(categoryName);
               
               return (
                 <button
                     key={categoryName}
                     onClick={() => handleAccountTabChange(categoryName)}
                     className={`py-2 px-6 bg-gradient-to-br from-[#232323] to-[#202020] text-sm md:text-base font-medium rounded-full transition-colors focus:outline-none border ${ 
                         activeCategory === categoryName
                             ? 'border-cyan-500 text-white' 
                             : 'border-[#333] text-gray-500 hover:text-gray-300 hover:border-gray-500' 
                     }`}
                 >
                     {categoryName} ({categoryAccounts.length})
                 </button>
               );
             })}
         </div>

         {isLoading ? (
           <div className="text-center py-8">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
             <p className="text-gray-400">{t('common.loading')}</p>
           </div>
         ) : error ? (
           <div className="text-center py-8">
             <p className="text-red-400">{t('common.error')}: {error}</p>
           </div>
         ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
             {accountsToShow.length > 0 ? accountsToShow.slice(0, 3).map((account) => {
               return (
                 <div
                     key={account.id}
                   className="p-5 bg-[#1C1E1E] border border-gray-700 flex flex-col hover:border-sky-500 transition-colors rounded-2xl"
                 >
                   <div className="flex-grow">
                     <h3 className="text-xl font-bold text-white mb-1 uppercase">
                           {account.accountName}
                         </h3>
                     <p className="text-sm text-gray-300">{t('dashboard.totalBalance')}</p>
                     <div className="flex items-baseline gap-2 mb-4">
                       <p className="text-2xl text-white">
                         {(account.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                       </p>
                       <span className="text-sm font-semibold text-green-500">+0.5%</span>
                     </div>
                     <div className="grid grid-cols-3 gap-2 text-center mb-4">
                       <div>
                         <p className="text-xs text-gray-300 mb-1">PNL Hoy</p>
                         <p className="text-sm font-semibold text-green-500">+0.91%</p>
                         <p className="text-xs text-gray-200">+$7.07</p>
                       </div>
                       <div>
                         <p className="text-xs text-gray-300 mb-1">PNL 7 días</p>
                         <p className="text-sm font-semibold text-green-500">+8.95%</p>
                         <p className="text-xs text-gray-200">+$64.39</p>
                       </div>
                       <div>
                         <p className="text-xs text-gray-300 mb-1">PNL 30 días</p>
                         <p className="text-sm font-semibold text-green-500">+2.91%</p>
                         <p className="text-xs text-gray-200">+$38.51</p>
                       </div>
                     </div>
                   </div>
                     <button
                         onClick={() => {
                             if (setSelectedOption) {
                                 setSelectedOption("Cuentas", { 
                                     accountId: account.id, 
                                       viewMode: 'details',
                                   directNavigation: true
                                 });
                             }
                         }}
                     className="w-full bg-transparent border border-sky-500 text-sky-500 py-2 rounded-full transition-colors hover:bg-sky-500 hover:text-white text-sm"
                         style={{ outline: 'none' }}
                     >
                         {t('common.view')} {t('common.details')}
                     </button>
                 </div>
               );
             }) : (
                   <p className="text-gray-500 sm:col-span-2 lg:col-span-3 text-center py-4">
                     {t('common.noAccountsInCategory')}
                   </p>
              )}
         </div>
         )}
      </div>

      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default Home;