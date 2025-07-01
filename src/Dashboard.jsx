import { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import Sidebar from "./Sidebar";
import Home from "./components/Home";
import TradingChallenge from './components/TradingChallenge';
import PipCalculator from './components/PipCalculator';
import CertificateComponent from './components/CertificateComponent';
import LeaderboardModal from './components/LeaderboardModal';

import OperationsHistory from './components/OperationsHistory';
import Descargas from './components/Descargas';
import AfiliadosDashboard from './components/AfiliadosDashboard';
import Settings from './components/Settings';
import Noticias from './components/Noticias';
import TradingAccounts from "./components/TradingAccounts";
import CompetitionCards from "./components/CompetitionCards";
import Wallet from "./components/Wallet";
import Inversor from "./components/Inversor";
import Gestor from "./components/Gestor";
import PammDashboard from "./components/PammDashboard";

const Dashboard = ({ onLogout }) => {
  const { currentUser, userData } = useAuth();
  const [selectedOption, setSelectedOption] = useState("Dashboard");
  const [navigationParams, setNavigationParams] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
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

  // Crear una función para abrir el modal que podemos pasar a cualquier componente
  const openLeaderboardModal = () => {
    setIsLeaderboardOpen(true);
  };

  // Modificamos el Sidebar para controlar directamente la apertura del modal
  // en lugar de cambiar la sección seleccionada
  const handleSidebarOptionChange = (option) => {
    console.log("[Dashboard - src] handleSidebarOptionChange received:", option);
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
    setSelectedOption(option);
    setNavigationParams(params);
  };

  // Cambia de opción al cerrar el modal
  const handleCloseLeaderboard = () => {
    setIsLeaderboardOpen(false);
    // No necesitamos cambiar la sección al cerrar porque nunca la cambiamos al abrir
  };



  // Manejador para mostrar la pantalla de configuración
  const handleSettingsClick = () => {
    setShowSettings(true);
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
      return <Settings onBack={handleBackFromSettings} />;
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
      />;
      case "Inversor":
          return <Inversor />;
      case "Gestor":
          console.log("[Dashboard - src] Rendering Gestor component for selectedOption:", selectedOption); // Log
          return <Gestor />;
      case "Pamm":
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
      <Sidebar 
        selectedOption={selectedOption} 
        setSelectedOption={handleSidebarOptionChange}
        onLogout={onLogout}
        user={userData}
      />
      <main className={`flex-1 overflow-y-auto w-full p-4 transition-all duration-300 ${isMobile ? 'ml-0 mt-16' : ''}`}>
        <div>
          {renderContent()}
        </div>
      </main>

      {/* Modal del Leaderboard */}
      <LeaderboardModal 
        isOpen={isLeaderboardOpen} 
        onClose={handleCloseLeaderboard} 
      />
    </div>
  );
};

export default Dashboard;