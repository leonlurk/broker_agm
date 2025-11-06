import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { 
  getLeaderboardData, 
  formatTraderName, 
  getCountryFlag, 
  formatPnL, 
  formatPnLPercentage, 
  getMedalEmoji,
  formatLastUpdated,
  formatBalanceHistoryForChart
} from '../services/leaderboardService';

// Modal del Leaderboard
const LeaderboardModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('month');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [competitionPeriod, setCompetitionPeriod] = useState('');
  
  // Efecto para cargar datos cuando se abre el modal o cambia el tab
  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, activeTab]);

  // Función para obtener datos del leaderboard
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const result = await getLeaderboardData(activeTab, 10);
      
      if (result.success) {
        setLeaderboardData(result.data.leaderboard || []);
        setTotalParticipants(result.data.total_participants || 0);
        setCompetitionPeriod(result.data.competition_period || '');
        setLastUpdated(result.data.last_updated);
      } else {
        toast.error(result.error || 'Error al cargar el leaderboard');
        setLeaderboardData([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Error al cargar el leaderboard');
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  // Separar top 3 del resto
  const topTraders = leaderboardData.slice(0, 3);
  const tableData = leaderboardData.slice(3, 10);
  
  // Datos para el gráfico del trader seleccionado (primer lugar por defecto)
  const selectedTrader = leaderboardData[0];
  const rendimientoData = selectedTrader 
    ? formatBalanceHistoryForChart(selectedTrader.balance_history)
    : [];
  
  // Función para cambiar entre pestañas de periodo
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Mapeo de tabs a labels
  const tabLabels = {
    'week': 'Semana',
    'month': 'Mes',
    'all': 'Todo'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-auto">
        {/* Header con título y botón de cierre */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-[#333]">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Demo Competition Leaderboard</h1>
            {competitionPeriod && (
              <p className="text-sm text-gray-400 mt-1">{competitionPeriod}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 md:p-6">
          {/* Pestañas de filtrado por periodo */}
          <div className="flex flex-wrap gap-2 md:gap-4 mb-6 overflow-x-auto pb-2">
            {['week', 'month', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`focus:outline-none px-4 md:px-6 py-2 rounded-full text-md md:text-base ${
                  activeTab === tab
                    ? 'bg-gradient-to-br from-[#232323] to-[#2d2d2d] border-cyan-500 text-white'
                    : 'bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-gray-300 hover:border-cyan-500'
                } transition-colors`}
              >
                {tabLabels[tab] || tab}
              </button>
            ))}
          </div>

          {/* Contenido principal (dos columnas en desktop, apiladas en móvil) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Columna izquierda - Clasificación */}
            <div className="bg-[#232323] rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Clasificación</h2>
                {lastUpdated && (
                  <span className="text-xs text-gray-400">
                    {formatLastUpdated(lastUpdated)}
                  </span>
                )}
              </div>
              
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                </div>
              )}
              
              {!loading && leaderboardData.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>No hay datos disponibles</p>
                  <p className="text-sm mt-2">Inicia una cuenta demo para participar</p>
                </div>
              )}
              
              {!loading && leaderboardData.length > 0 && (
              
              <>
                {/* Top 3 traders cards */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {topTraders.map((trader) => {
                    const pnlFormatted = formatPnL(trader.pnl);
                    const pnlPercentage = formatPnLPercentage(trader.pnl_percentage);
                    
                    return (
                      <div key={trader.rank} className="bg-[#1e3a4c] rounded-lg p-3 relative overflow-hidden">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-lg">{getMedalEmoji(trader.rank)}</span>
                          <span className="text-sm text-gray-300 truncate">
                            {formatTraderName(trader.trader_name, trader.account_number)}
                          </span>
                        </div>
                        <div className="text-gray-400 text-xs mb-1">Ganancia</div>
                        <div className="flex justify-between items-center">
                          <div className={`font-bold text-sm ${pnlFormatted.className}`}>
                            {pnlFormatted.value}
                          </div>
                          <div className={`text-xs px-2 py-0.5 rounded ${pnlPercentage.className}`}>
                            {pnlPercentage.value}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              
                {/* Tabla de clasificación */}
                <table className="w-full text-white">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="py-2 px-2 font-medium">#</th>
                      <th className="py-2 font-medium">Nombre</th>
                      <th className="py-2 font-medium text-right">PnL</th>
                      <th className="py-2 font-medium text-center">País</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row) => {
                      const pnlFormatted = formatPnL(row.pnl);
                      const flag = getCountryFlag(row.country);
                      
                      return (
                        <tr key={row.rank} className="border-b border-gray-800 text-sm hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-2">{row.rank}</td>
                          <td className="py-3 truncate max-w-[120px]">
                            {formatTraderName(row.trader_name, row.account_number)}
                          </td>
                          <td className={`py-3 text-right font-medium ${pnlFormatted.className}`}>
                            {pnlFormatted.value}
                          </td>
                          <td className="py-3 text-center text-lg">{flag}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
              )}
            </div>

            {/* Columna derecha - Gráfico de rendimiento */}
            <div className="bg-[#232323] rounded-xl p-4">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Rendimiento</h2>
                {selectedTrader && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">
                      {formatTraderName(selectedTrader.trader_name, selectedTrader.account_number)}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <div>
                        <span className="text-gray-400">Trades: </span>
                        <span className="text-white font-medium">{selectedTrader.total_trades}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Win Rate: </span>
                        <span className="text-white font-medium">{selectedTrader.win_rate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Live: </span>
                        <span className="text-cyan-400 font-medium">{selectedTrader.live_trades?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Gráfico de área */}
              <div className="h-72">
                {loading && (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                  </div>
                )}
                
                {!loading && rendimientoData.length === 0 && (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    <p>No hay datos de rendimiento disponibles</p>
                  </div>
                )}
                
                {!loading && rendimientoData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={rendimientoData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorRendimiento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={false} 
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#232323',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#ffffff'
                      }}
                      labelStyle={{ color: '#ffffff' }}
                      itemStyle={{ color: '#ffffff' }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Equity']}
                      labelFormatter={(label) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0a84ff"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRendimiento)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;