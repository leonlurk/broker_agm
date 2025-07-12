import React from 'react';
import { RiWalletLine, RiBarChart2Line, RiArrowUpSLine, RiCalendarLine, RiPercentLine, RiArrowDownSLine, RiTimeLine, RiTeamLine } from 'react-icons/ri';

const StatCard = ({ label, value, icon }) => (
  <div className="bg-[#232323] p-4 rounded-lg flex items-center space-x-4 border border-[#333] transition-all hover:border-cyan-500 hover:shadow-cyan-500/10">
    <div className="p-3 bg-[#191919] rounded-full text-white">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  </div>
);


const Summary = ({ data }) => {
  const stats = [
    { label: "Balance actual", value: data.balance, icon: <RiWalletLine /> },
    { label: "Equidad actual", value: data.equity, icon: <RiBarChart2Line /> },
    { label: "Ganancias totales", value: data.totalProfit, icon: <RiArrowUpSLine /> },
    { label: "Inicio de actividad", value: data.startDate, icon: <RiCalendarLine /> },
    { label: "Rentabilidad total", value: data.totalProfitability, icon: <RiPercentLine /> },
    { label: "Drawdown máximo", value: data.maxDrawdown, icon: <RiArrowDownSLine /> },
    { label: "ROI mensual prom.", value: data.avgMonthlyROI, icon: <RiTimeLine /> },
    { label: "Inversores", value: data.investors, icon: <RiTeamLine /> },
  ];

  return (
    <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Resumen General</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(stat => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
            ))}
        </div>
    </div>
  );
};

export default Summary; 