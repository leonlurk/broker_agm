import React from 'react';
import { useTranslation } from 'react-i18next';
import HeroSection from './pamm-manager-profile-components/HeroSection';
import Summary from './pamm-manager-profile-components/Summary';
import PerformanceCharts from './pamm-manager-profile-components/PerformanceCharts';
import RecentTrades from './pamm-manager-profile-components/RecentTrades';
import Subscriptions from './pamm-manager-profile-components/Subscriptions';
import ManagerInfo from './pamm-manager-profile-components/ManagerInfo';
import Faqs from './pamm-manager-profile-components/Faqs';

const PammManagerProfile = () => {
  const { t } = useTranslation();
  // Placeholder data for demonstration
  const gestorData = {
    name: "Momentum Alpha Fund",
    strategy: "Swing trading moderado con análisis cuantitativo",
    philosophy: "Maximizamos el crecimiento a largo plazo con un control de riesgo estricto y diversificación inteligente.",
    summary: {
      balance: "125,430.50 USD",
      equity: "128,910.20 USD",
      totalProfit: "25,430.50 USD",
      startDate: "2022-01-15",
      totalProfitability: "25.32%",
      maxDrawdown: "12.5%",
      avgMonthlyROI: "2.1%",
      investors: 42
    },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#191919] text-white min-h-screen font-sans">
      <HeroSection name={gestorData.name} strategy={gestorData.strategy} philosophy={gestorData.philosophy} t={t} />
      
      <div className="mt-8">
        <Summary data={gestorData.summary} t={t} />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <PerformanceCharts t={t} />
          <RecentTrades t={t} />
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <Subscriptions t={t} />
          <ManagerInfo t={t} />
        </div>
      </div>
      
      <div className="mt-8">
        <Faqs t={t} />
      </div>
    </div>
  );
};

export default PammManagerProfile; 