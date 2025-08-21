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


const Summary = ({ data, t }) => {
  const stats = [
    { label: t('pamm.profile.currentBalance'), value: data.balance, icon: <RiWalletLine /> },
    { label: t('pamm.profile.currentEquity'), value: data.equity, icon: <RiBarChart2Line /> },
    { label: t('pamm.profile.totalProfits'), value: data.totalProfit, icon: <RiArrowUpSLine /> },
    { label: t('pamm.profile.activityStart'), value: data.startDate, icon: <RiCalendarLine /> },
    { label: t('pamm.profile.totalProfitability'), value: data.totalProfitability, icon: <RiPercentLine /> },
    { label: t('pamm.profile.maxDrawdown'), value: data.maxDrawdown, icon: <RiArrowDownSLine /> },
    { label: t('pamm.profile.avgMonthlyROI'), value: data.avgMonthlyROI, icon: <RiTimeLine /> },
    { label: t('pamm.profile.investors'), value: data.investors, icon: <RiTeamLine /> },
  ];

  return (
    <div>
        <h2 className="text-2xl font-semibold text-white mb-4">{t('pamm.profile.generalSummary')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(stat => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
            ))}
        </div>
    </div>
  );
};

export default Summary; 