import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar'; 
import Home from './Home';
import Accounts from './Accounts';
import Wallet from './Wallet';
// ... otros imports ...
import Inversor from './Inversor'; // Asumiendo que Inversor ya estaba importado
import Gestor from './Gestor'; // Importar el nuevo componente Gestor
import Settings from './Settings'; 
import UserInformationContent from './UserInformationContent'; 
import { useAuth } from '../contexts/AuthContext';
import ScrollManager from './ScrollManager';
import TradingAccounts from './TradingAccounts';
import PammDashboard from './PammDashboard';
import BrokerAccountCreation from './BrokerAccountCreation';

const Dashboard = ({ onLogout }) => {
  const { currentUser, userData } = useAuth();
  const [selectedOption, setSelectedOption] = useState('Dashboard');
  const [navigationParams, setNavigationParams] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const mainContentRef = useRef(null);

  // Effect to log changes in selectedOption
  useEffect(() => {
    console.log("[Dashboard] selectedOption state updated to:", selectedOption);
  }, [selectedOption]);

  const renderContent = () => {
    console.log("[Dashboard] renderContent checking selectedOption:", selectedOption); // Log before switch
    console.log("[Dashboard] Is Nueva Cuenta?", selectedOption === 'Nueva Cuenta');
    
    if (showSettings) {
      return <Settings onBack={() => setShowSettings(false)} />;
    }

    switch (selectedOption) {
      case 'Dashboard':
        return <Home user={userData} setSelectedOption={setSelectedOption} onSettingsClick={() => setShowSettings(true)} />;
      case 'Cuentas':
        return <TradingAccounts 
          setSelectedOption={setSelectedOption}
          navigationParams={navigationParams}
          scrollContainerRef={mainContentRef}
        />;
      case 'Wallet':
        return <Wallet />;
      // Añadir casos para subopciones si es necesario o manejarlos dentro de los componentes
      case 'Calculadora':
        // return <Calculadora />; 
        return <div className="p-6 text-white">Calculadora Component</div>; // Placeholder
      case 'Descargas':
         // return <Descargas />;
        return <div className="p-6 text-white">Descargas Component</div>; // Placeholder
       case 'Noticias':
         // return <Noticias />; 
         return <div className="p-6 text-white">Noticias Component</div>; // Placeholder
      case 'Afiliados':
         // return <Afiliados />; 
         return <div className="p-6 text-white">Afiliados Component</div>; // Placeholder
      case 'Inversor':
        return <Inversor />;
      case 'Gestor': // Añadir caso para Gestor
        console.log("[Dashboard] Rendering Gestor component for selectedOption:", selectedOption); // <-- DEBUG LOG
        return <Gestor />;
      case 'Pamm':
         // return <Pamm />;
         return <PammDashboard />;
       // Casos para PropFirm y Broker (si no se manejan dentro de otro componente)
      case 'PropFirm':
         // return <PropFirm />; 
         return <div className="p-6 text-white">Prop Firm Component</div>; // Placeholder
       case 'Broker':
         // return <Broker />; 
         return <div className="p-6 text-white">Broker Component</div>; // Placeholder
       case 'Desafio':
         // return <Desafio />; 
         return <div className="p-6 text-white">Nuevo Desafío Component</div>; // Placeholder
       case 'Nueva Cuenta':
         console.log('[Dashboard] Rendering BrokerAccountCreation component');
         return <BrokerAccountCreation
           onAccountCreated={(account) => {
             console.log('Account created:', account);
             // Redirect to accounts view after creation
             setSelectedOption('Cuentas');
           }}
           onCancel={() => setSelectedOption('Dashboard')}
         />;
       default:
        return <Home user={userData} setSelectedOption={setSelectedOption} onSettingsClick={() => setShowSettings(true)} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#232323] overflow-hidden">
      <ScrollManager navigationDependency={selectedOption} scrollContainerRef={mainContentRef} />
      <Sidebar 
        selectedOption={selectedOption} 
        setSelectedOption={setSelectedOption} 
        onLogout={onLogout} 
        user={userData}
      />
      <main ref={mainContentRef} className={`flex-1 overflow-y-auto w-full p-4 transition-all duration-300 ${isMobile ? 'ml-0 mt-16' : ''}`}>
        <div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 