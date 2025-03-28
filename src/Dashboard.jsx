import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Home from "./components/Home";
import TradingChallenge from './components/TradingChallenge';
import PipCalculator from './components/PipCalculator';
import CertificateComponent from './components/CertificateComponent';
import LeaderboardModal from './components/LeaderboardModal';

const Dashboard = ({ onLogout }) => {
  const [selectedOption, setSelectedOption] = useState("Dashboard");
  const [isMobile, setIsMobile] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  
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

  // Función para renderizar el contenido según la opción seleccionada
  const renderContent = () => {
    switch (selectedOption) {
      case "Dashboard":
          return <Home />;
      case "Certificados":
          return <CertificateComponent />;
      case "Desafio":
            return <TradingChallenge />;
      case "Leaderboard":
          // Aquí ya no renderizamos nada porque usamos el modal
          return <Home />; // Mantenemos Home como contenido de fondo
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
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Cuentas</h1>
            <p className="text-gray-600">Gestiona tus cuentas aquí.</p>
          </div>
        );
      case "Plataformas":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Plataformas</h1>
            <p className="text-gray-600">Conecta y gestiona tus plataformas.</p>
          </div>
        );
      // Puedes añadir más casos según necesites
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