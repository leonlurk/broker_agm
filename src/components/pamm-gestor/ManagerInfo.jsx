import React from 'react';
import { RiUserStarLine, RiBriefcaseLine, RiCpuLine, RiShieldCheckLine, RiMapPinLine, RiAwardLine } from 'react-icons/ri';

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start py-3 border-b border-[#2a2a2a]">
        <div className="text-cyan-400 mt-1 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="font-semibold text-white">{value}</p>
        </div>
    </div>
);

const ManagerInfo = () => {
  return (
    <div className="bg-[#191919] p-6 rounded-lg border border-[#333]">
      <h2 className="text-2xl font-semibold text-white mb-4">Información del Gestor</h2>
      <div className="space-y-2">
        <InfoRow icon={<RiUserStarLine size={20} />} label="Nombre del Gestor" value="Alex 'Momentum' Rodriguez" />
        <InfoRow icon={<RiBriefcaseLine size={20} />} label="Experiencia" value="12 años en mercados de divisas" />
        <InfoRow icon={<RiCpuLine size={20} />} label="Estrategia Utilizada" value="Sistema híbrido (EA + Manual)" />
        <InfoRow icon={<RiShieldCheckLine size={20} />} label="Filosofía de Riesgo" value="Máx. 2% de riesgo por operación" />
        <InfoRow icon={<RiMapPinLine size={20} />} label="Broker Utilizado" value="AGM Markets (Regulado)" />
        <InfoRow icon={<RiAwardLine size={20} />} label="Certificaciones" value="CMT Nivel II" />
      </div>
    </div>
  );
};

export default ManagerInfo; 