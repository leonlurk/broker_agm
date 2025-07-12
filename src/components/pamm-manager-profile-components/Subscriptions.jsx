import React from 'react';
import { RiPercentLine, RiMoneyDollarCircleLine, RiCalendarEventLine, RiLockPasswordLine, RiTimeLine, RiBankLine } from 'react-icons/ri';

const InfoRow = ({ icon, label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center text-gray-400">
            {React.cloneElement(icon, { className: "mr-3" })}
            <span>{label}</span>
        </div>
        <span className="font-semibold text-white">{value}</span>
    </div>
);

const Subscriptions = () => {
  return (
    <div className="bg-[#191919] p-6 rounded-lg border border-[#333] space-y-8">
      {/* Distribución de Beneficios */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Distribución de Beneficios</h2>
        <div className="space-y-2">
            <InfoRow icon={<RiPercentLine />} label="Beneficio para inversor" value="70%" />
            <InfoRow icon={<RiMoneyDollarCircleLine />} label="Comisión del gestor" value="30%" />
            <InfoRow icon={<RiCalendarEventLine />} label="Frecuencia de reparto" value="Mensual" />
            <InfoRow icon={<RiLockPasswordLine />} label="Penalización retiro" value="5% (primeros 3 meses)" />
        </div>
      </div>
      
      {/* Condiciones para Invertir */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Condiciones para Invertir</h2>
        <div className="space-y-2">
            <InfoRow icon={<RiMoneyDollarCircleLine />} label="Monto mínimo" value="1,000 USD" />
            <InfoRow icon={<RiTimeLine />} label="Tiempo mínimo" value="3 meses" />
            <InfoRow icon={<RiBankLine />} label="Broker requerido" value="AGM Markets" />
        </div>
      </div>

    </div>
  );
};

export default Subscriptions; 