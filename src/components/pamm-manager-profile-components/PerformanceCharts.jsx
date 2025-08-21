import React from 'react';

const PlaceholderChart = ({ title, t }) => (
    <div className="w-full h-80 bg-[#232323] rounded-lg flex items-center justify-center border border-[#333]">
        <div className="text-center">
            <p className="text-gray-400 text-lg">{title}</p>
            <p className="text-gray-500 text-sm">{t('pamm.profile.chartNotImplemented')}</p>
        </div>
    </div>
);

const PerformanceCharts = ({ t }) => {
  return (
    <div className="bg-[#191919] p-6 rounded-lg border border-[#333]">
        <h2 className="text-2xl font-semibold text-white mb-6">{t('pamm.profile.performanceCharts')}</h2>
        <div className="space-y-8">
            <PlaceholderChart title={t('pamm.profile.balanceAndEquityEvolution')} t={t} />
            <PlaceholderChart title={t('pamm.profile.drawdownChart')} t={t} />
        </div>
    </div>
  );
};

export default PerformanceCharts; 