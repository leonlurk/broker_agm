import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Home from "./components/Home";
import TradingChallenge from './components/TradingChallenge';
import PipCalculator from './components/PipCalculator';
import CertificateComponent from './components/CertificateComponent';
import LeaderboardModal from './components/LeaderboardModal';
import TradingDashboard from './components/TradingDashboard';

const Dashboard = ({ onLogout }) => {
  const [selectedOption, setSelectedOption] = useState("Dashboard");
  const [isMobile, setIsMobile] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  
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

  // Función para renderizar el contenido según la opción seleccionada
  const renderContent = () => {
    // Si estamos en Dashboard y hay una cuenta seleccionada, mostrar TradingDashboard
    if (selectedOption === "Dashboard" && selectedAccount !== null) {
      return <TradingDashboard accountId={selectedAccount} onBack={handleBackToAccounts} />;
    }
    
    switch (selectedOption) {
      case "Dashboard":
          return <Home onViewDetails={handleViewAccountDetails} />;
      case "Certificados":
          return <CertificateComponent />;
      case "Desafio":
            return <TradingChallenge />;
      case "Leaderboard":
          return <Home onViewDetails={handleViewAccountDetails} />;
      case "Calculadora":
            return <PipCalculator />;
      case "Descargas":
        return (
          <div className="p-6 bg-[#232323] text-white">
            <h1 className="text-2xl font-semibold mb-4">Descargas</h1>
            <p className="text-gray-400">Contenido en construcción.</p>
          </div>
        );
      case "Noticias":
        return (
          <div className="p-6 bg-[#232323] text-white">
            <h1 className="text-2xl font-semibold mb-4">Noticias</h1>
            <p className="text-gray-400">Contenido en construcción.</p>
          </div>
        );
      case "Cuentas":
        return (
          <div className="p-6 bg-[#232323] text-white">
            <h1 className="text-2xl font-semibold mb-4">Cuentas</h1>
            <p className="text-gray-400">Selecciona una cuenta desde el Dashboard para ver detalles.</p>
          </div>
        );
      case "Plataformas":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Plataformas</h1>
            <p className="text-gray-600">Conecta y gestiona tus plataformas.</p>
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
        <div className="border border-[#333] rounded-xl">
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