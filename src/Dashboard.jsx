import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "./contexts/AuthContext";
import Sidebar from "./Sidebar";
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Home from "./components/Home";
import TradingChallenge from './components/TradingChallenge';
import PipCalculator from './components/PipCalculator';
import CertificateComponent from './components/CertificateComponent';
import LeaderboardModal from './components/LeaderboardModal';
import ScrollManager from './components/utils/ScrollManager';
import { scrollToTopManual } from './hooks/useScrollToTop';
import FloatingChatButton from './components/FloatingChatButton';
import { supabase } from './supabase/config';
import { Wallet as WalletIcon } from 'lucide-react';

// Sticky Wallet Balance Component
const StickyWalletBalance = ({ userId, onNavigateToWallet }) => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBalance = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('broker_balance')
          .eq('id', userId)
          .single();

        if (!error && data) {
          setBalance(data.broker_balance || 0);
        }
      } catch (error) {
        console.error('Error loading wallet balance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBalance();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('wallet-balance')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.new.broker_balance !== undefined) {
            setBalance(payload.new.broker_balance);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return (
    <button
      onClick={onNavigateToWallet}
      className="fixed top-4 right-4 z-40 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-cyan-500/30 rounded-full shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all duration-300 hover:scale-105 group"
    >
      <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full">
        <WalletIcon className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Balance</span>
        <span className={`text-sm font-bold ${isLoading ? 'text-gray-400' : 'text-white'}`}>
          {isLoading ? '...' : `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </span>
      </div>
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
    </button>
  );
};

import OperationsHistory from './components/OperationsHistory';
import Descargas from './components/Descargas';
import AfiliadosDashboard from './components/AfiliadosDashboard';
import Settings from './components/Settings';
import Noticias from './components/Noticias2';
import TradingAccounts from "./components/TradingAccounts";
import CompetitionCards from "./components/CompetitionCards";
import Wallet from "./components/Wallet";
import Inversor from "./components/Inversor";
import Gestor from "./components/Gestor";
import PammDashboard from "./components/PammDashboard";
import PammGestorAdminDashboard from "./components/PammGestorAdminDashboard";
import BrokerAccountCreation from "./components/BrokerAccountCreation";

const Dashboard = ({ onLogout }) => {
  const { currentUser, userData } = useAuth();
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Map between sidebar options and URL segments (moved before state)
  const optionToPath = {
    'Dashboard': '',
    'Cuentas': 'accounts',
    'Wallet': 'wallet',
    'Afiliados': 'affiliates',
    'Noticias': 'news',
    'Descargas': 'downloads',
    'Calculadora': 'calculator',
    'Competicion': 'competition',
    'PropFirm': 'propfirm',
    'Broker': 'broker'
  };
  const pathToOption = {
    '': 'Dashboard',
    'accounts': 'Cuentas',
    'wallet': 'Wallet',
    'affiliates': 'Afiliados',
    'news': 'Noticias',
    'downloads': 'Descargas',
    'calculator': 'Calculadora',
    'competition': 'Competicion',
    'propfirm': 'PropFirm',
    'broker': 'Broker'
  };
  
  // Initialize selectedOption from URL on first load
  const getInitialSelectedOption = () => {
    const match = location.pathname.match(/^\/dashboard\/?(.*)$/);
    if (match) {
      const segment = (match[1] || '').replace(/\/$/, '');
      const baseSegment = segment.split('/')[0];
      const opt = pathToOption[baseSegment];
      return opt || "Dashboard";
    }
    return "Dashboard";
  };
  
  const [selectedOption, setSelectedOption] = useState(getInitialSelectedOption());
  const [navigationParams, setNavigationParams] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const mainContentRef = useRef(null);
  
  // Debug: Log userData changes
  useEffect(() => {
    console.log("[Dashboard] userData updated:", {
      exists: !!userData,
      kyc_status: userData?.kyc_status,
      kyc_verified: userData?.kyc_verified,
      email: userData?.email
    });
  }, [userData]);
  
  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Efecto para loguear cambios en selectedOption
  useEffect(() => {
    console.log("[Dashboard - src] selectedOption state updated to:", selectedOption);
  }, [selectedOption]);


  // Sync selectedOption from URL on load and when pathname changes
  useEffect(() => {
    const match = location.pathname.match(/^\/dashboard\/?(.*)$/);
    if (match) {
      const segment = (match[1] || '').replace(/\/$/, '');
      const baseSegment = segment.split('/')[0];
      const opt = pathToOption[baseSegment];
      if (opt && opt !== selectedOption) {
        setSelectedOption(opt);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  
  // Efecto para hacer scroll hacia arriba cuando cambie la sección
  useEffect(() => {
    scrollToTopManual(mainContentRef);
  }, [selectedOption]); 

  // Crear una función para abrir el modal que podemos pasar a cualquier componente
  const openLeaderboardModal = () => {
    setIsLeaderboardOpen(true);
  };

  // Modificamos el Sidebar para controlar directamente la apertura del modal
  // en lugar de cambiar la sección seleccionada
  const handleSidebarOptionChange = (option) => {
    console.log("[Dashboard - src] handleSidebarOptionChange received:", option);
    console.log("[Dashboard - src] Current userData KYC status:", {
      kyc_status: userData?.kyc_status,
      kyc_verified: userData?.kyc_verified,
      userDataExists: !!userData
    });
    
    // Allow "Nueva Cuenta" for all users - KYC restrictions are handled in the form itself
    // Users without KYC can create DEMO accounts only
    
    if (option === "Leaderboard") {
      openLeaderboardModal();
    } else {
      console.log("[Dashboard - src] Calling setSelectedOption with:", option);
      setShowSettings(false); // Reset settings view
      setSelectedOption(option);
      setNavigationParams(null); // Limpiar parámetros al cambiar de sección
      // Update URL to reflect the selected section
      const segment = optionToPath[option];
      if (segment !== undefined) {
        const target = segment ? `/dashboard/${segment}` : '/dashboard';
        if (location.pathname !== target) navigate(target, { replace: false });
      }
    }
  };

  // Función para manejar navegación con parámetros
  const handleNavigationWithParams = (option, params = null) => {
    console.log("[Dashboard - src] handleNavigationWithParams:", option, params);
    
    // Allow "Nueva Cuenta" for all users - KYC restrictions are handled in the form itself
    // Users without KYC can create DEMO accounts only
    
    setSelectedOption(option);
    setNavigationParams(params);
  };

  // Cambia de opción al cerrar el modal
  const handleCloseLeaderboard = () => {
    setIsLeaderboardOpen(false);
    // No necesitamos cambiar la sección al cerrar porque nunca la cambiamos al abrir
  };



  // Manejador para mostrar la pantalla de configuración
  const handleSettingsClick = (showKYCDirectly = false, fromHome = false) => {
    setShowSettings(true);
    if (showKYCDirectly) {
      // Pasaremos este parámetro a Settings indicando también el origen
      setNavigationParams({ openKYC: true, fromHome: fromHome });
    }
  };

  // Manejador para volver de la pantalla de configuración
  const handleBackFromSettings = () => {
    setShowSettings(false);
  };

  // Función para renderizar el contenido según la opción seleccionada
  const renderContent = () => {
    console.log("[Dashboard - src] renderContent checking selectedOption:", selectedOption); // Log antes del switch
    console.log("[Dashboard - src] Current KYC status in renderContent:", {
      userData_exists: !!userData,
      kyc_status: userData?.kyc_status,
      kyc_verified: userData?.kyc_verified,
      selectedOption
    });
    
    // Si estamos mostrando la configuración
    if (showSettings) {
      return <Settings 
        onBack={handleBackFromSettings} 
        openKYC={navigationParams?.openKYC}
        fromHome={navigationParams?.fromHome}
      />;
    }
    

    
    switch (selectedOption) {
      case "Dashboard":
          return <Home 
            onSettingsClick={handleSettingsClick}
            setSelectedOption={handleNavigationWithParams}
            user={userData}
          />;
      case "Certificados":
          return <CertificateComponent />;
      case "Wallet":
          return <Wallet />;
      case "Pagos":
          return <OperationsHistory />;
      case "Nueva Cuenta":
      case "New Account":
          // Allow all users to access account creation
          // KYC restrictions are now handled within the TradingChallenge component
          console.log("[Dashboard - src] Rendering Nueva Cuenta - KYC status:", {
            userData_exists: !!userData,
            kyc_status: userData?.kyc_status,
            isApproved: userData?.kyc_status === 'approved'
          });
          return <TradingChallenge />;
      case "Calculadora":
          return <PipCalculator />;
      case "Competicion":
          return <CompetitionCards onShowLeaderboard={openLeaderboardModal} />;
      case "Descargas":
          return <Descargas />;
      case "Afiliados":
          return <AfiliadosDashboard />;
      case "Noticias":
          return <Noticias />;
      case "Cuentas":
        return <TradingAccounts 
        setSelectedOption={setSelectedOption}
        navigationParams={navigationParams}
        scrollContainerRef={mainContentRef}
      />;
      case "Copytrading Inversor":
          return <Inversor 
            setSelectedOption={setSelectedOption}
            navigationParams={navigationParams}
            setNavigationParams={setNavigationParams}
            scrollContainerRef={mainContentRef}
          />;
      case "Copytrading Gestor":
          return <Gestor 
            setSelectedOption={setSelectedOption}
            navigationParams={navigationParams}
            setNavigationParams={setNavigationParams}
            scrollContainerRef={mainContentRef}
          />;
      case "Pamm Inversor":
        return <PammDashboard 
          setSelectedOption={setSelectedOption}
          navigationParams={navigationParams}
          setNavigationParams={setNavigationParams}
          scrollContainerRef={mainContentRef}
        />;
      case "Pamm Gestor":
        return <PammGestorAdminDashboard 
          setSelectedOption={setSelectedOption}
          navigationParams={navigationParams}
          setNavigationParams={setNavigationParams}
          scrollContainerRef={mainContentRef}
        />;
      case "Inversor": // Fallback for old selections if any
          return <Inversor />;
      case "Gestor": // Fallback for old selections if any
          return <Gestor />;
      case "Pamm": // Fallback for old selections if any
        return <PammDashboard />;
      case "PropFirm":
          return (
            <div className="p-6 bg-[#232323] text-white">
              <h1 className="text-2xl font-semibold mb-4">Prop Firm</h1>
              <p className="text-gray-400">Gestiona tus cuentas de Prop Firm.</p>
            </div>
          );
      case "Broker":
          return (
            <div className="p-6 bg-[#232323] text-white">
              <h1 className="text-2xl font-semibold mb-4">Broker</h1>
              <p className="text-gray-400">Gestiona tus cuentas de Broker.</p>
            </div>
          );
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{selectedOption}</h1>
            <p className="text-gray-600">Contenido en construcción.</p>
          </div>
        );
    }
  };

  // Handler for navigating to Wallet from sticky balance
  const handleNavigateToWallet = () => {
    setSelectedOption('Wallet');
    navigate('/dashboard/wallet');
  };

  return (
    <div className="flex h-screen w-full bg-[#232323] overflow-hidden">
      <ScrollManager navigationDependency={selectedOption} scrollContainerRef={mainContentRef} />

      {/* Sticky Wallet Balance - always visible in top right */}
      {currentUser && (
        <StickyWalletBalance
          userId={currentUser.id}
          onNavigateToWallet={handleNavigateToWallet}
        />
      )}

      <Sidebar
        selectedOption={selectedOption}
        setSelectedOption={handleSidebarOptionChange}
        onLogout={onLogout}
        user={userData}
      />
      <main ref={mainContentRef} className={`flex-1 overflow-y-auto w-full p-4 transition-all duration-300 ${isMobile ? 'ml-0 mt-16' : ''}`}>
        <div>
          {renderContent()}
        </div>
      </main>

      {/* Modal del Leaderboard */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={handleCloseLeaderboard}
      />

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
};

export default Dashboard;