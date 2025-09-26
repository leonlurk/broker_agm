import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, ChevronDown, ChevronUp, AlertTriangle, Star, Copy, Target, MessageSquare, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import SeguirTraderModal from './SeguirTraderModal';
import AccountSelectionModal from './AccountSelectionModal';
import CommentsRatingModal from './CommentsRatingModal';
import { useAccounts } from '../contexts/AccountsContext';
import useTranslation from '../hooks/useTranslation';
import { followMaster } from '../services/copytradingService';

const TraderProfileDetail = ({ trader, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('statistics');
  const [showAllTrades, setShowAllTrades] = useState(false);
  const [rentabilidadTab, setRentabilidadTab] = useState('profitability');
  const [rentabilidadRange, setRentabilidadRange] = useState('day');
  const [showSeguirModal, setShowSeguirModal] = useState(false);
  
  // Estados para el modal de selección de cuenta
  const [showAccountSelectionModal, setShowAccountSelectionModal] = useState(false);
  const [selectedAccountForCopy, setSelectedAccountForCopy] = useState(null);
  
  // Colores para el PieChart
  const PIE_COLORS = ['#0e7490', '#2563eb', '#7c3aed', '#dc2626', '#059669', '#d97706'];
  
  // Datos de ejemplo para los gráficos
  const performanceData = [
    { name: 'Jan', value: 8500 },
    { name: 'Feb', value: 12000 },
    { name: 'Mar', value: 10000 },
    { name: 'Apr', value: 15000 },
    { name: 'May', value: 13000 },
    { name: 'Jun', value: 18000 },
    { name: 'Jul', value: 22000 },
    { name: 'Aug', value: 19000 },
    { name: 'Sep', value: 25000 },
    { name: 'Oct', value: 32000 },
    { name: 'Nov', value: 28000 },
    { name: 'Dec', value: 34000 }
  ];
  
  // Datos de ejemplo para las operaciones - podría venir del trader en el futuro
  const trades = [
    { id: 1, symbol: 'EUR/USD', type: 'Compra', size: '0.12 lotes', entry: '1.0835', exit: '1.0892', profit: '+$85.50', date: '12 Abr 2025' },
    { id: 2, symbol: 'GBP/JPY', type: 'Venta', size: '0.25 lotes', entry: '191.420', exit: '190.850', profit: '+$107.50', date: '10 Abr 2025' },
    { id: 3, symbol: 'USD/CAD', type: 'Venta', size: '0.15 lotes', entry: '1.3642', exit: '1.3690', profit: '-$28.80', date: '8 Abr 2025' },
    { id: 4, symbol: 'XAU/USD', type: 'Compra', size: '0.10 lotes', entry: '2381.25', exit: '2395.60', profit: '+$143.50', date: '5 Abr 2025' },
    { id: 5, symbol: 'EUR/GBP', type: 'Compra', size: '0.18 lotes', entry: '0.8590', exit: '0.8640', profit: '+$67.50', date: '2 Abr 2025' },
    { id: 6, symbol: 'AUD/USD', type: 'Venta', size: '0.20 lotes', entry: '0.6720', exit: '0.6690', profit: '+$60.00', date: '1 Abr 2025' },
  ];
  
  // Datos para crear estadísticas específicas según el perfil del trader
  const getTraderStats = () => {
    // Si el trader es de tipo "Premium", retornamos estadísticas más altas
    if (trader.type === "Premium") {
      return {
        totalProfit: trader.rentabilidad || "+187.4%",
        winRate: "68%",
        operations: "324",
        maxDrawdown: "12.4%",
        drawdownDate: "Agosto 2024"
      };
    } else if (trader.type === "Verificado") {
      return {
        totalProfit: trader.rentabilidad || "+142.7%",
        winRate: "62%",
        operations: "256",
        maxDrawdown: "15.8%",
        drawdownDate: "Octubre 2024"
      };
    } else {
      return {
        totalProfit: trader.rentabilidad || "+86.2%",
        winRate: "58%",
        operations: "175",
        maxDrawdown: "10.2%",
        drawdownDate: "Noviembre 2024"
      };
    }
  };
  
  const traderStats = getTraderStats();
  
  const visibleTrades = showAllTrades ? trades : trades.slice(0, 3);
  
  // Determinar el color del tipo de trader
  const getTypeColor = () => {
    switch(trader.type) {
      case "Premium": return "bg-yellow-600";
      case "Verificado": return "bg-blue-600";
      case "Nuevo": return "bg-gray-600";
      default: return "bg-gray-600";
    }
  };
  
  // Determinar el color del riesgo
  const getRiskColor = () => {
    const riesgo = trader.riesgo || "Medio";
    switch(riesgo) {
      case "Alto": return "text-red-400";
      case "Medio-Alto": return "text-orange-400";
      case "Medio": return "text-yellow-400";
      case "Bajo": return "text-green-400";
      default: return "text-yellow-400";
    }
  };
  
  // Nombre a mostrar desde el objeto trader
  const traderName = trader.name || trader.nombre || "Trader";
  
  // Profit a mostrar (siempre con signo)
  const traderProfit = trader.profit || "+0%";

  // Datos de ejemplo para Instrumentos (deberían venir del trader)
  const instrumentData = [
    { name: 'NQM25', value: 71.43 },
    { name: 'EURUSD', value: 28.57 },
  ];

  // Datos de ejemplo para Rentabilidad (deberían venir del trader)
  const rentabilidadData = [
      { date: '01/04', value: 0 },
      { date: '03/04', value: 10 },
      { date: '05/04', value: 5 },
      { date: '07/04', value: -5 },
      { date: '09/04', value: 15 },
      { date: '11/04', value: 12 },
      { date: '13/04', value: -10 },
      { date: '15/04', value: -15 },
      { date: '18/04', value: 20 },
      { date: '20/04', value: 25 },
      { date: '22/04', value: 18 },
      { date: '24/04', value: 22 },
      { date: '26/04', value: 30 },
  ];

  // Datos de ejemplo para Drawdown
  const drawdownData = [
      { date: '01/04', value: 0 },
      { date: '03/04', value: -2.5 },
      { date: '05/04', value: -1.2 },
      { date: '07/04', value: -4.8 },
      { date: '09/04', value: -3.1 },
      { date: '11/04', value: -6.2 },
      { date: '13/04', value: -2.8 },
      { date: '15/04', value: -8.5 },
      { date: '17/04', value: -5.4 },
      { date: '19/04', value: -12.3 },
      { date: '21/04', value: -7.9 },
      { date: '23/04', value: -15.6 },
      { date: '25/04', value: -9.2 },
      { date: '27/04', value: -18.4 },
      { date: '29/04', value: -11.7 },
      { date: '30/04', value: -6.3 }
  ];

  // Datos de ejemplo para Historial (deberían venir del trader)
  const tradeHistoryData = [
      { id: '484247', position: 'XAUUSD', entryValue: 2670.89, entryTime: '10/01/2025 20:20:00', exitValue: 2670.69, exitTime: '10/01/2025 01:26:07', profit: -0.40 },
      { id: '484253', position: 'Índice Alemán', entryValue: 5895.53, entryTime: '10/01/2025 20:20:00', exitValue: 5894.88, exitTime: '10/01/2025 01:26:26', profit: -0.65 },
      { id: '484271', position: 'XAUUSD', entryValue: 2669.51, entryTime: '10/01/2025 21:00:00', exitValue: 2670.73, exitTime: '10/01/2025 02:00:45', profit: 1.22 },
      { id: '499421', position: 'XAUUSD', entryValue: 2898.70, entryTime: '10/01/2025 21:00:00', exitValue: 2870.53, exitTime: '10/01/2025 02:00:48', profit: -4.65 },
      // Añadir más operaciones si es necesario
  ];
  
  // --- Funciones auxiliares (Placeholder) ---
  const copyTraderInfo = () => {
    const info = `Trader: ${trader?.nombre || 'Nombre Trader'}\nCuenta: ${getTraderStats().accountNumber}\nServidor: ${getTraderStats().server}`;
    navigator.clipboard.writeText(info);
  };

  const handleCopyTrader = () => {
    console.log('Copying trader:', trader?.name);
    setShowAccountSelectionModal(true);
  };

  // Estados separados para seguir y copiar
  const [followedTraders, setFollowedTraders] = useState(new Set()); // Solo para botón "Seguir"
  const [copiedTraders, setCopiedTraders] = useState(new Set()); // Solo para botón "Copiar"
  
  // Estados para el modal de comentarios
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const handleFollowTrader = () => {
    if (followedTraders.has(trader?.id)) {
      // Dejar de seguir
      setFollowedTraders(prev => {
        const newSet = new Set(prev);
        newSet.delete(trader?.id);
        return newSet;
      });
      console.log('Dejando de seguir trader:', trader?.name);
    } else {
      // Seguir
      setFollowedTraders(prev => new Set([...prev, trader?.id]));
      console.log('Siguiendo trader:', trader?.name);
    }
  };

  const handleAccountSelected = (account) => {
    console.log('Account selected for copying:', account);
    setSelectedAccountForCopy(account);
    setShowAccountSelectionModal(false);
    setShowSeguirModal(true);
  };

  const handleSubmitComment = async (commentData) => {
    console.log('Comentario enviado para trader:', trader?.name, commentData);
    // Aquí se integraría con la API real para enviar el comentario
    // await submitTraderComment(trader.id, commentData);
    setShowCommentsModal(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };
  
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  return (
    <div className="bg-[#191919] text-white p-4 md:p-6 flex flex-col h-full space-y-6">
      {/* Header con botón de regreso */}
      <div className="mb-4">
        <img 
          src="/Back.svg" 
          alt="Back" 
          onClick={onBack}
          className="w-10 h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
        />
      </div>
      
      {/* Perfil del Trader y Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sección Principal del Perfil */}
        <div className="lg:col-span-8 bg-[#232323] p-6 rounded-xl border border-[#333]">
        {/* Header del Perfil */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <img 
                src={trader?.avatar || '/default-avatar.png'} 
                alt={trader?.nombre || 'Trader'} 
                className="h-12 w-12 rounded-full border-2 border-cyan-500"
                onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23333'/%3E%3C/svg%3E"; }}
            />
              <div>
              <h1 className="text-2xl font-semibold">{trader?.nombre || 'Nombre Trader'}</h1>
              <p className="text-sm text-gray-400">{t('copyTrading.traderDetail.activeSince')} {trader?.activeSince || '51 días'}</p> 
            </div>
                </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-white">
              <Star size={20}/>
            </button>
            <button 
              onClick={handleFollowTrader}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                followedTraders.has(trader?.id)
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
              }`}
            >
              <Target size={16} />
              {followedTraders.has(trader?.id) ? t('copyTrading.traderDetail.following') : t('copyTrading.traderDetail.followTrader')}
            </button>
            <button 
              onClick={handleCopyTrader}
              disabled={copiedTraders.has(trader?.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                copiedTraders.has(trader?.id)
                  ? 'bg-green-600 hover:bg-green-700 cursor-not-allowed'
                  : 'bg-[#333] hover:bg-[#444]'
              }`}
            >
              <Copy size={16} />
              {copiedTraders.has(trader?.id) ? t('copyTrading.traderDetail.copying') : t('copyTrading.traderDetail.copy')}
            </button>
            <button 
              onClick={() => setShowCommentsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-md text-sm transition-colors"
            >
              <MessageSquare size={16} />
              {t('copyTrading.traderDetail.comment')}
            </button>
                </div>
              </div>

        {/* Información y Reglas (2 columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Columna Izquierda: Información */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium mb-2 border-b border-[#333] pb-1">{t('copyTrading.traderDetail.information')}</h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.accountNumber')}</span>
              <span>{trader?.accountNumber || '657237'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.serverName')}</span>
              <span>{trader?.server || 'MT5'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.accountType')}</span>
              <span>{trader?.accountType || 'CopyFX MT5 Prime'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.verified')}</span>
              <span className="text-green-500">{trader?.verified ? t('copyTrading.traderDetail.yes') : t('copyTrading.traderDetail.yes')}</span>
              </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.accountBalance')}</span>
              <span>{formatCurrency(trader?.balance || 5000.23)} USD</span>
              </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.managedCapital')}</span>
              <span>{formatCurrency(trader?.managedCapital || 75009.73)} USD</span>
              </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.leverage')}</span>
              <span>1:{trader?.leverage || '300'}</span>
            </div>
          </div>
          
          {/* Columna Derecha: Reglas */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium mb-2 border-b border-[#333] pb-1">{t('copyTrading.traderDetail.rules')}</h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.strategyName')}</span>
              <span>{trader?.strategyName || 'Nombre estrategia'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.minDeposit')}</span>
              <span>{formatCurrency(trader?.minDeposit || 100)} USD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.commissionType')}</span>
              <span>{trader?.commissionType || '20%'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.paymentFrequency')}</span>
              <span>{trader?.paymentFrequency || '1 semana'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('copyTrading.traderDetail.copyMode')}</span>
              <span>{trader?.copyMode || t('copyTrading.traderDetail.proportional')}</span>
            </div>
          </div>
        </div>

        {/* Métricas de Rendimiento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
            <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.totalProfitability')}</p>
            <p className="text-lg font-medium text-green-500">{formatPercentage(trader?.totalProfitabilityPercent || 191)}</p>
            <p className="text-xs text-gray-500">{formatCurrency(trader?.totalProfitabilityValue || 6238.99)} USD</p>
          </div>
          <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
            <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.currentFollowers')}</p>
            <p className="text-lg font-medium">{trader?.followers || 20}</p>
            <p className={`text-xs ${ (trader?.followersChangePercent || -34.7) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercentage(trader?.followersChangePercent || -34.7)}</p>
          </div>
           <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
            <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.operations')}</p>
            <p className="text-lg font-medium">{trader?.totalTrades || 7}</p>
          </div>
          <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
            <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.winrate')}</p>
             <p className="text-lg font-medium">{formatPercentage(trader?.winRate || 85.71)}</p>
            <p className="text-xs text-gray-500">{trader?.winningTrades || 6} {t('copyTrading.traderDetail.won')}</p>
          </div>
          <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
            <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.maxDrawdown')}</p>
            <p className="text-lg font-medium text-red-500">{formatPercentage(trader?.maxDrawdown || -48.40)}</p>
          </div>
           <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
            <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.avgProfit')}</p>
            <p className="text-lg font-medium text-green-500">{formatPercentage(trader?.avgProfit || 5)}</p>
          </div>
          <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
            <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.profit')}</p>
             <p className="text-sm text-green-500">{t('copyTrading.traderDetail.highest')} {formatCurrency(trader?.maxProfitTrade || 1915.17)}</p>
            <p className="text-sm text-red-500">{t('copyTrading.traderDetail.lowest')} {formatCurrency(trader?.minProfitTrade || -124.75)}</p>
          </div>
           <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
            <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.activeSubscribers')}</p>
            <p className="text-lg font-medium">{trader?.activeSubscribers || 8}</p>
          </div>
        </div>
      </div>
      
      {/* Sección Tabs Rentabilidad y Gráfico */}
        <div className="lg:col-span-4 bg-[#232323] p-6 rounded-xl border border-[#333]">
      {/* Tabs */}
        <div className="flex mb-4 border-b border-[#333] overflow-x-auto">
          {['profitability', 'drawdown', 'totalProfit', 'balanceAndEquity', 'maxRetraction'].map(tab => (
        <button
              key={tab}
              onClick={() => setRentabilidadTab(tab)}
              className={`py-2 px-4 whitespace-nowrap text-sm ${ 
                rentabilidadTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-medium'
              : 'text-gray-400 hover:text-white'
          }`}
        >
              {t(`copyTrading.traderDetail.${tab}`)}
        </button>
          ))}
      </div>
      
         {/* Contenido de Tabs (Gráfico y otros) */}
        <div>
          {rentabilidadTab === 'profitability' && (
            <div>
              <div className="flex justify-end mb-4">
                 {/* TODO: Añadir lógica real al dropdown */}
                <div className="relative">
                  <select 
                    value={rentabilidadRange}
                    onChange={(e) => setRentabilidadRange(e.target.value)}
                    className="appearance-none bg-[#191919] border border-[#333] rounded px-3 py-1 text-xs pr-8 cursor-pointer"
                  >
                    <option value="day">{t('copyTrading.traderDetail.day')}</option>
                    <option value="week">{t('copyTrading.traderDetail.week')}</option>
                    <option value="month">{t('copyTrading.traderDetail.month')}</option>
                    <option value="year">{t('copyTrading.traderDetail.year')}</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={rentabilidadData} // Usar datos dinámicos aquí
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }} // Ajustar margen izquierdo
                >
                  <defs>
                       {/* Puedes definir gradientes si quieres */}
                  </defs>
                  <XAxis 
                      dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      tickFormatter={(value) => `${value}%`} // Formato de porcentaje
                  />
                  <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#232323', 
                        border: '1px solid #333', 
                        borderRadius: '8px', 
                        fontSize: '14px', 
                        color: '#ffffff',
                        padding: '8px'
                      }}
                      labelStyle={{ color: '#ffffff' }}
                      itemStyle={{ color: '#ffffff' }}
                      formatter={(value, name) => [`${value}%`, rentabilidadTab]}
                      labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                      stroke="#22d3ee" // Color Cyan
                      strokeWidth={2}
                      fillOpacity={0.1} // Poca opacidad o ninguna
                      fill="#22d3ee"
                      dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}
          {rentabilidadTab === 'drawdown' && (
            <div>
              <div className="flex justify-end mb-4">
                <div className="relative">
                  <select 
                    value={rentabilidadRange}
                    onChange={(e) => setRentabilidadRange(e.target.value)}
                    className="appearance-none bg-[#191919] border border-[#333] rounded px-3 py-1 text-xs pr-8 cursor-pointer"
                  >
                    <option value="day">{t('copyTrading.traderDetail.day')}</option>
                    <option value="week">{t('copyTrading.traderDetail.week')}</option>
                    <option value="month">{t('copyTrading.traderDetail.month')}</option>
                    <option value="year">{t('copyTrading.traderDetail.year')}</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={drawdownData}>
                    <defs>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151', 
                        borderRadius: '6px',
                        color: '#fff'
                      }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value) => [`${value}%`, 'Drawdown']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fill="url(#drawdownGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Estadísticas de drawdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.maxDrawdownStat')}</p>
                  <p className="text-lg font-medium text-red-500">-18.4%</p>
                </div>
                <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.currentDrawdown')}</p>
                  <p className="text-lg font-medium text-red-400">-6.3%</p>
                </div>
                <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.maxDuration')}</p>
                  <p className="text-lg font-medium text-white">12 {t('copyTrading.time.days')}</p>
                </div>
                <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-gray-400 mb-1">{t('copyTrading.traderDetail.recovery')}</p>
                  <p className="text-lg font-medium text-yellow-500">{t('copyTrading.traderDetail.inProgress')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contenido para las otras pestañas */}
          {!['profitability', 'drawdown'].includes(rentabilidadTab) && (
            <div className="text-center text-gray-500 py-10">
              {t('copyTrading.traderDetail.contentPending', { tab: t(`copyTrading.traderDetail.${rentabilidadTab}`) })}
            </div>
          )}
                </div>
              </div>
              
      {/* Sección Instrumentos y Historial (Layout flexible) */}
        <div className="lg:col-span-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Instrumentos de Trading (Pie Chart) */}
        <div className="lg:col-span-1 bg-[#232323] p-6 rounded-xl border border-[#333]">
          <h2 className="text-lg font-medium mb-4">{t('copyTrading.traderDetail.tradingInstruments')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart> 
                <Pie
                  data={instrumentData} // Usar datos dinámicos trader.instrumentData
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80} // Ajustar tamaño
                  fill="#8884d8"
                  dataKey="value"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                      const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                      return (
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                          {`${(percent * 100).toFixed(2)}%`}
                        </text>
                      );
                  }}
                >
                  {instrumentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="square"
                  formatter={(value, entry, index) => <span className="text-gray-300 text-sm ml-2">{value}</span>}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#232323',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#ffffff',
                    padding: '8px'
                  }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff' }}
                  formatter={(value) => [`${value}%`, t('copyTrading.traderDetail.percentage')]}
                />
              </PieChart>
            </ResponsiveContainer>
                </div>
              </div>
              
         {/* Historial de Operaciones */}
        <div className="lg:col-span-2 bg-[#232323] p-6 rounded-xl border border-[#333]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">{t('copyTrading.traderDetail.operationsHistory')}</h2>
          </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="text-left text-xs text-gray-400 border-b border-[#333]">
                  <tr>
                    <th className="pb-2 font-medium">{t('copyTrading.traderDetail.position')}</th>
                    <th className="pb-2 font-medium">{t('copyTrading.traderDetail.entry')}</th>
                    <th className="pb-2 font-medium">{t('copyTrading.traderDetail.exit')}</th>
                    <th className="pb-2 font-medium">{t('copyTrading.traderDetail.gain')}</th>
                    <th className="pb-2 font-medium">{t('copyTrading.traderDetail.order')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#333]">
                  {tradeHistoryData.map((trade) => (
                    <tr key={trade.id}>
                      <td className="py-3">{trade.position}</td>
                      <td className="py-3">
                        <div>{trade.entryValue}</div>
                        <div className="text-xs text-gray-500">{trade.entryTime}</div>
                      </td>
                      <td className="py-3">
                        <div>{trade.exitValue}</div>
                        <div className="text-xs text-gray-500">{trade.exitTime}</div>
                      </td>
                      <td className={`py-3 font-medium ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(trade.profit)}
                      </td>
                      <td className="py-3 text-gray-400">{trade.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* TODO: Añadir botón "Cargar más" si hay muchas operaciones */}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Selección de Cuenta */}
      <AccountSelectionModal
        isOpen={showAccountSelectionModal}
        onClose={() => {
          setShowAccountSelectionModal(false);
          setSelectedAccountForCopy(null);
        }}
        trader={trader}
        onAccountSelected={handleAccountSelected}
      />

      {/* Modal de Seguir Trader */}
      <SeguirTraderModal 
        isOpen={showSeguirModal}
        onClose={() => {
          setShowSeguirModal(false);
          setSelectedAccountForCopy(null);
        }}
        trader={trader}
        selectedAccount={selectedAccountForCopy}
        onConfirm={async (formData) => {
          try {
            // Llamar al endpoint followMaster del backend
            const response = await followMaster({
              master_user_id: trader.user_id || trader.id,
              follower_mt5_account_id: parseInt(formData.accountId),
              risk_ratio: parseFloat(formData.riskRatio)
            });
            
            if (response.success || response.message) {
              // Mostrar mensaje de éxito
              alert(t('copyTrading.messages.followSuccess') || 'Successfully following trader');
              
              // Marcar el trader como copiado
              if (trader?.id) {
                setCopiedTraders(prev => new Set([...prev, trader.id]));
              }
            } else {
              throw new Error(response.error || 'Error following trader');
            }
          } catch (error) {
            console.error('Error siguiendo trader:', error);
            alert(t('copyTrading.messages.followError') + ': ' + (error.message || 'Error desconocido'));
          } finally {
            setShowSeguirModal(false);
            setSelectedAccountForCopy(null);
          }
        }}
      />

      {/* Modal de Comentarios y Puntuación */}
      <CommentsRatingModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        trader={trader}
        onSubmit={handleSubmitComment}
      />
    </div>
  );
};

export default TraderProfileDetail;