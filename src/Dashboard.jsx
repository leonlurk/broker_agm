import { useState } from "react";
import Sidebar from "./Sidebar";
import Home from "./components/Home";

const Dashboard = ({ onLogout }) => {
  const [selectedOption, setSelectedOption] = useState("Dashboard");
  
  // Función para renderizar el contenido según la opción seleccionada
  const renderContent = () => {
    switch (selectedOption) {
      case "Dashboard":
          return <Home />;
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
    <div className="flex h-screen w-full bg-[#232323]">
      <Sidebar 
            selectedOption={selectedOption} 
            setSelectedOption={setSelectedOption}
            onLogout={onLogout}
            />
      <main className="flex-1 overflow-y-auto w-full p-4">
      <div className="border border-[#333] rounded-xl">
        {renderContent()}
      </div>
      </main>
    </div>
  );
};

export default Dashboard;