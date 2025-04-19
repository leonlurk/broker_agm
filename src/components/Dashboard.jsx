import React, { useState, useEffect } from 'react';
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

const Dashboard = () => {
  const [selectedOption, setSelectedOption] = useState('Dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const { logout, userData } = useAuth();

  // Effect to log changes in selectedOption
  useEffect(() => {
    console.log("[Dashboard] selectedOption state updated to:", selectedOption);
  }, [selectedOption]);

  const renderContent = () => {
    console.log("[Dashboard] renderContent checking selectedOption:", selectedOption); // Log before switch
    if (showSettings) {
      return <Settings onBack={() => setShowSettings(false)} />;
    }

    switch (selectedOption) {
      case 'Dashboard':
        return <Home user={userData} setSelectedOption={setSelectedOption} onSettingsClick={() => setShowSettings(true)} />;
      case 'Cuentas':
        return <Accounts />;
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
         return <div className="p-6 text-white">Pamm Component</div>; // Placeholder
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
       default:
        return <Home user={userData} setSelectedOption={setSelectedOption} onSettingsClick={() => setShowSettings(true)} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        selectedOption={selectedOption} 
        setSelectedOption={setSelectedOption} 
        onLogout={logout} 
      />
      <main className="flex-1 overflow-y-auto bg-[#232323]">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard; 