import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
  const [selectedTraderIndex, setSelectedTraderIndex] = useState(0);
  
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
        // Debug: Log raw data from API
        console.log('[LEADERBOARD DEBUG] Raw API data:', result.data.leaderboard);
        result.data.leaderboard?.forEach((trader, idx) => {
          console.log(`[LEADERBOARD DEBUG] Trader ${idx + 1}: ${trader.trader_name} - win_rate=${trader.win_rate}, total_trades=${trader.total_trades}`);
        });

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
  
  // Datos para el gráfico del trader seleccionado
  const selectedTrader = leaderboardData[selectedTraderIndex];
  const rendimientoData = selectedTrader 
    ? formatBalanceHistoryForChart(selectedTrader.balance_history)
    : [];
  
  // Calcular estadísticas del trader seleccionado
  const traderStats = selectedTrader ? {
    profitFactor: selectedTrader.average_win && selectedTrader.average_loss 
      ? (selectedTrader.average_win / Math.abs(selectedTrader.average_loss)).toFixed(2)
      : 'N/A',
    sharpeRatio: selectedTrader.total_trades > 10 
      ? ((selectedTrader.pnl_percentage / 100) / Math.sqrt(selectedTrader.total_trades)).toFixed(2)
      : 'N/A',
    maxDrawdown: selectedTrader.worst_trade 
      ? `$${Math.abs(selectedTrader.worst_trade).toFixed(2)}`
      : 'N/A',
    avgTradeSize: selectedTrader.total_trades > 0
      ? `$${(selectedTrader.pnl / selectedTrader.total_trades).toFixed(2)}`
      : 'N/A'
  } : null;
  
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-[#1a1a1a] via-[#1e1e1e] to-[#1a1a1a] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-auto shadow-2xl border border-gray-800/50 animate-slideUp">
        {/* Header con título y botón de cierre */}
        <div className="relative flex justify-between items-center p-4 md:p-6 border-b border-gray-800/50 bg-gradient-to-r from-transparent via-cyan-900/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">Demo Competition</h1>
              {competitionPeriod && (
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {competitionPeriod}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none transition-all hover:rotate-90 duration-300 p-2 hover:bg-red-500/10 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 md:p-6">
          {/* Stats Overview */}
          {!loading && leaderboardData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-xl p-4">
                <div className="text-xs text-cyan-400 mb-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Participantes
                </div>
                <div className="text-2xl font-bold text-white">{totalParticipants}</div>
              </div>
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-4">
                <div className="text-xs text-green-400 mb-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  Top PnL
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {formatPnL(leaderboardData[0]?.pnl || 0).value}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-4">
                <div className="text-xs text-purple-400 mb-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Avg Win Rate
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  {(leaderboardData.reduce((sum, t) => sum + t.win_rate, 0) / leaderboardData.length).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border border-orange-500/30 rounded-xl p-4">
                <div className="text-xs text-orange-400 mb-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Total Trades
                </div>
                <div className="text-2xl font-bold text-orange-400">
                  {leaderboardData.reduce((sum, t) => sum + t.total_trades, 0)}
                </div>
              </div>
            </div>
          )}

          {/* Pestañas de filtrado por periodo */}
          <div className="flex flex-wrap gap-2 md:gap-3 mb-6 overflow-x-auto pb-2">
            {['week', 'month', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`focus:outline-none px-5 md:px-7 py-2.5 rounded-xl text-sm md:text-base font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-gray-800/80 text-white border-2 border-cyan-500'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white border border-gray-700/50'
                }`}
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
              
              <>                {/* Top 3 traders cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  {topTraders.map((trader, idx) => {
                    const pnlFormatted = formatPnL(trader.pnl);
                    const pnlPercentage = formatPnLPercentage(trader.pnl_percentage);
                    const isSelected = selectedTraderIndex === idx;
                    
                    return (
                      <button
                        key={trader.rank}
                        onClick={() => setSelectedTraderIndex(idx)}
                        className={`bg-gradient-to-br rounded-xl p-4 relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer group ${
                          trader.rank === 1 ? 'from-yellow-900/30 to-amber-900/30 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20' :
                          trader.rank === 2 ? 'from-gray-700/30 to-gray-800/30 border-2 border-gray-400/50 shadow-lg shadow-gray-400/20' :
                          'from-orange-900/30 to-orange-800/30 border-2 border-orange-600/50 shadow-lg shadow-orange-600/20'
                        } ${
                          isSelected ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#232323]' : ''
                        }`}
                      >
                        <div className="absolute top-0 right-0 text-6xl opacity-10 transform translate-x-4 -translate-y-2">
                          {getMedalEmoji(trader.rank)}
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{getMedalEmoji(trader.rank)}</span>
                            <div className={`text-xs px-2 py-1 rounded-full font-medium ${pnlPercentage.className}`}>
                              {pnlPercentage.value}
                            </div>
                          </div>
                          <div className="text-sm text-gray-300 truncate mb-1 font-medium">
                            {formatTraderName(trader.trader_name, trader.account_number)}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">Ganancia Total</div>
                          <div className={`font-bold text-lg ${pnlFormatted.className}`}>
                            {pnlFormatted.value}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-between text-xs">
                            <div>
                              <div className="text-gray-500">Trades</div>
                              <div className="text-white font-medium">{trader.total_trades}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Win Rate</div>
                              <div className="text-cyan-400 font-medium">{trader.win_rate.toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              
                {/* Tabla de clasificación */}
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="py-3 px-2 font-medium text-xs uppercase tracking-wider">#</th>
                        <th className="py-3 font-medium text-xs uppercase tracking-wider">Trader</th>
                        <th className="py-3 font-medium text-right text-xs uppercase tracking-wider">PnL</th>
                        <th className="py-3 font-medium text-center text-xs uppercase tracking-wider">Win%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, idx) => {
                        const pnlFormatted = formatPnL(row.pnl);
                        const traderIdx = idx + 3;
                        const isSelected = selectedTraderIndex === traderIdx;
                        
                        return (
                          <tr 
                            key={row.rank} 
                            onClick={() => setSelectedTraderIndex(traderIdx)}
                            className={`border-b border-gray-800/50 text-sm transition-all duration-200 cursor-pointer ${
                              isSelected 
                                ? 'bg-cyan-900/20 border-l-4 border-l-cyan-500' 
                                : 'hover:bg-gray-800/30'
                            }`}
                          >
                            <td className="py-4 px-2">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 font-medium">{row.rank}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="font-medium truncate max-w-[120px]">
                                  {formatTraderName(row.trader_name, row.account_number)}
                                </span>
                                <span className="text-xs text-gray-500">{row.total_trades} trades</span>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <div className={`font-bold ${pnlFormatted.className}`}>
                                {pnlFormatted.value}
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                row.win_rate >= 60 ? 'bg-green-900/30 text-green-400' :
                                row.win_rate >= 40 ? 'bg-yellow-900/30 text-yellow-400' :
                                'bg-red-900/30 text-red-400'
                              }`}>
                                {row.win_rate.toFixed(1)}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
              )}
            </div>

            {/* Columna derecha - Gráfico de rendimiento */}
            <div className="bg-gradient-to-br from-[#232323] to-[#1a1a1a] rounded-xl p-5 border border-gray-800/50">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Análisis de Performance
                  </h2>
                  {selectedTrader && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedTrader.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                      selectedTrader.rank === 2 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' :
                      selectedTrader.rank === 3 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    }`}>
                      Rank #{selectedTrader.rank}
                    </div>
                  )}
                </div>
                {selectedTrader && (
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">
                        {formatTraderName(selectedTrader.trader_name, selectedTrader.account_number)}
                      </p>
                      {selectedTrader.live_trades?.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400 font-medium">{selectedTrader.live_trades.length} Live</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-800/50 rounded p-2">
                        <div className="text-gray-400 mb-1">Total Trades</div>
                        <div className="text-white font-bold text-lg">{selectedTrader.total_trades}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2">
                        <div className="text-gray-400 mb-1">Win Rate</div>
                        <div className={`font-bold text-lg ${
                          selectedTrader.win_rate >= 60 ? 'text-green-400' :
                          selectedTrader.win_rate >= 40 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {selectedTrader.win_rate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2">
                        <div className="text-gray-400 mb-1">Best Trade</div>
                        <div className="text-green-400 font-bold">${selectedTrader.best_trade?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2">
                        <div className="text-gray-400 mb-1">Worst Trade</div>
                        <div className="text-red-400 font-bold">${selectedTrader.worst_trade?.toFixed(2) || '0.00'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Advanced Stats */}
              {selectedTrader && traderStats && (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-3">
                    <div className="text-xs text-purple-400 mb-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
                      </svg>
                      Profit Factor
                    </div>
                    <div className="text-lg font-bold text-white">{traderStats.profitFactor}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-3">
                    <div className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      Avg Trade
                    </div>
                    <div className="text-lg font-bold text-white">{traderStats.avgTradeSize}</div>
                  </div>
                </div>
              )}
              
              {/* Gráfico de área mejorado */}
              <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Equity Curve</div>
                  {selectedTrader && (
                    <div className={`text-xs font-bold ${
                      formatPnL(selectedTrader.pnl).isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPnL(selectedTrader.pnl).value}
                    </div>
                  )}
                </div>
                <div className="h-64">
                  {loading && (
                    <div className="flex flex-col justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mb-3"></div>
                      <p className="text-sm text-gray-400">Cargando datos...</p>
                    </div>
                  )}
                  
                  {!loading && rendimientoData.length === 0 && (
                    <div className="flex flex-col justify-center items-center h-full text-gray-400">
                      <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-sm">No hay datos de rendimiento</p>
                      <p className="text-xs mt-1">Selecciona otro trader</p>
                    </div>
                  )}
                  
                  {!loading && rendimientoData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={rendimientoData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRendimiento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        dy={5}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          padding: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                        }}
                        labelStyle={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}
                        itemStyle={{ color: '#06b6d4', fontSize: '14px', fontWeight: 'bold' }}
                        formatter={(value) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Equity']}
                        labelFormatter={(label) => `📅 ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRendimiento)"
                        filter="url(#glow)"
                        animationDuration={1000}
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
    </div>
  );
};

export default LeaderboardModal;