import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Home from "./components/Home";
import TradingChallenge from './components/TradingChallenge';
import PipCalculator from './components/PipCalculator';
import CertificateComponent from './components/CertificateComponent';
import LeaderboardModal from './components/LeaderboardModal';
import TradingDashboard from './components/TradingDashboard';
import OperationsHistory from './components/OperationsHistory';
import Descargas from './components/Descargas';
import AfiliadosDashboard from './components/AfiliadosDashboard';
import Settings from './components/Settings';
import Noticias from './components/Noticias';
import TradingAccounts from "./components/TradingAccounts";
import CompetitionCards from "./components/CompetitionCards";

const Dashboard = ({ onLogout }) => {
  const [selectedOption, setSelectedOption] = useState("Dashboard");
  const [isMobile, setIsMobile] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
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

  // Abre el modal cuando la opción Leaderboard es seleccionada
  useEffect(() => {
    if (selectedOption === "Leaderboard") {
      setIsLeaderboardOpen(true);
    }
  }, [selectedOption]);

  // Cambia de opción al cerrar el modal
  const handleCloseLeaderboard = () => {
    setIsLeaderboardOpen(false);
    setSelectedOption("Dashboard"); // Regresar a Dashboard al cerrar
  };

  // Manejador para visualizar los detalles de una cuenta
  const handleViewAccountDetails = (accountId) => {
    setSelectedAccount(accountId);
    // No cambiamos de pestaña, solo mostramos los detalles
  };
  
  // Volver a la vista de Home
  const handleBackToAccounts = () => {
    setSelectedAccount(null);
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
    // Si estamos mostrando la configuración
    if (showSettings) {
      return <Settings onBack={handleBackFromSettings} />;
    }
    
    // Si estamos en Dashboard y hay una cuenta seleccionada, mostrar TradingDashboard
    if (selectedOption === "Dashboard" && selectedAccount !== null) {
      return <TradingDashboard accountId={selectedAccount} onBack={handleBackToAccounts} />;
    }
    
    switch (selectedOption) {
      case "Dashboard":
          return <Home 
            onViewDetails={handleViewAccountDetails} 
            onSettingsClick={handleSettingsClick}
          />;
      case "Certificados":
          return <CertificateComponent />;
      case "Pagos":
          return <OperationsHistory />;
      case "Desafio":
          return <TradingChallenge />;
      case "Leaderboard":
          return <Home 
            onViewDetails={handleViewAccountDetails}
            onSettingsClick={handleSettingsClick}
          />;
      case "Calculadora":
          return <PipCalculator />;
      case "Competicion":
          return <CompetitionCards />;
      case "Descargas":
          return <Descargas />;
      case "Afiliados":
          return <AfiliadosDashboard />;
      case "Noticias":
          return <Noticias />;
      case "Cuentas":
          return <TradingAccounts />;
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
        setSelectedOption={setSelectedOption}
        onLogout={onLogout}
      />
      <main className={`flex-1 overflow-y-auto w-full p-4 ${isMobile ? 'ml-0' : ''} transition-all duration-300`}>
        <div className="border border-[#333] rounded-3xl">
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