import React from 'react';

const PlaceholderChart = ({ title }) => (
    <div className="w-full h-80 bg-[#232323] rounded-lg flex items-center justify-center border border-[#333]">
        <div className="text-center">
            <p className="text-gray-400 text-lg">{title}</p>
            <p className="text-gray-500 text-sm">(Gráfico no implementado. Requiere librería externa como Recharts o Chart.js)</p>
        </div>
    </div>
);

const PerformanceCharts = () => {
  return (
    <div className="bg-[#191919] p-6 rounded-lg border border-[#333]">
        <h2 className="text-2xl font-semibold text-white mb-6">Gráficos de Rendimiento</h2>
        <div className="space-y-8">
            <PlaceholderChart title="Evolución de Balance y Equidad" />
            <PlaceholderChart title="Gráfico de Drawdown" />
        </div>
    </div>
  );
};

export default PerformanceCharts; 