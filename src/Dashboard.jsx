import { useState, useEffect, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import Sidebar from "./Sidebar";
import Home from "./components/Home";
import TradingChallenge from './components/TradingChallenge';
import PipCalculator from './components/PipCalculator';
import CertificateComponent from './components/CertificateComponent';
import LeaderboardModal from './components/LeaderboardModal';
import ScrollManager from './components/utils/ScrollManager';
import { scrollToTopManual } from './hooks/useScrollToTop';
import FloatingChatButton from './components/FloatingChatButton';

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
  const [selectedOption, setSelectedOption] = useState("Dashboard");
  const [navigationParams, setNavigationParams] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const mainContentRef = useRef(null);
  
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
    
    // Bloquear acceso a "Nueva Cuenta" si no tiene KYC aprobado
    if ((option === "Nueva Cuenta" || option === "New Account") && userData?.kyc_status !== 'approved') {
      console.log("[Dashboard - src] Blocking Nueva Cuenta - KYC not approved");
      alert('Debes completar tu verificación KYC antes de poder crear cuentas MT5. Por favor, dirígete a Configuración para completar el proceso.');
      return;
    }
    
    if (option === "Leaderboard") {
      openLeaderboardModal();
    } else {
      console.log("[Dashboard - src] Calling setSelectedOption with:", option);
      setShowSettings(false); // Reset settings view
      setSelectedOption(option);
      setNavigationParams(null); // Limpiar parámetros al cambiar de sección
    }
  };

  // Función para manejar navegación con parámetros
  const handleNavigationWithParams = (option, params = null) => {
    console.log("[Dashboard - src] handleNavigationWithParams:", option, params);
    
    // Bloquear acceso a "Nueva Cuenta" si no tiene KYC aprobado
    if ((option === "Nueva Cuenta" || option === "New Account") && userData?.kyc_status !== 'approved') {
      alert('Debes completar tu verificación KYC antes de poder crear cuentas MT5. Por favor, dirígete a Configuración para completar el proceso.');
      return;
    }
    
    setSelectedOption(option);
    setNavigationParams(params);
  };

  // Cambia de opción al cerrar el modal
  const handleCloseLeaderboard = () => {
    setIsLeaderboardOpen(false);
    // No necesitamos cambiar la sección al cerrar porque nunca la cambiamos al abrir
  };



  // Manejador para mostrar la pantalla de configuración
  const handleSettingsClick = (showKYCDirectly = false) => {
    setShowSettings(true);
    if (showKYCDirectly) {
      // Pasaremos este parámetro a Settings
      setNavigationParams({ openKYC: true });
    }
  };

  // Manejador para volver de la pantalla de configuración
  const handleBackFromSettings = () => {
    setShowSettings(false);
  };

  // Función para renderizar el contenido según la opción seleccionada
  const renderContent = () => {
    console.log("[Dashboard - src] renderContent checking selectedOption:", selectedOption); // Log antes del switch
    // Si estamos mostrando la configuración
    if (showSettings) {
      return <Settings onBack={handleBackFromSettings} openKYC={navigationParams?.openKYC} />;
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
          // Verificar KYC antes de mostrar el componente
          console.log("[Dashboard - src] Rendering Nueva Cuenta - KYC check:", {
            kyc_status: userData?.kyc_status,
            isApproved: userData?.kyc_status === 'approved'
          });
          
          if (userData?.kyc_status !== 'approved') {
            return (
              <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-2xl p-8 max-w-md text-center">
                  <div className="text-yellow-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Verificación KYC Requerida</h2>
                  <p className="text-gray-300 mb-6">
                    {userData?.kyc_status === 'pending' 
                      ? 'Tu documentación está en proceso de revisión. Una vez aprobada, podrás crear cuentas MT5.'
                      : userData?.kyc_status === 'rejected'
                      ? 'Tu documentación fue rechazada. Por favor, envíala nuevamente desde la sección de Configuración.'
                      : 'Para crear cuentas MT5 y comenzar a operar, debes completar el proceso de verificación KYC.'}
                  </p>
                  <button
                    onClick={() => handleSettingsClick(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {userData?.kyc_status === 'pending' 
                      ? 'Ver Estado'
                      : userData?.kyc_status === 'rejected'
                      ? 'Reenviar Documentos'
                      : 'Completar Verificación'}
                  </button>
                </div>
              </div>
            );
          }
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

  return (
    <div className="flex h-screen w-full bg-[#232323] overflow-hidden">
      <ScrollManager navigationDependency={selectedOption} scrollContainerRef={mainContentRef} />
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