import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowUp, TrendingUp, TrendingDown, Users, MoreHorizontal, Pause, StopCircle, Eye, Search, Filter, SlidersHorizontal, Star, Copy, TrendingUp as TrendingUpIcon, BarChart3, Activity, History, MessageSquare, Shield, Award, Calendar, DollarSign, Plus, Target, UserMinus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, Legend } from 'recharts';
import CombinedCopyTradingModal from './CombinedCopyTradingModal';
import CommentsRatingModal from './CommentsRatingModal';
import { useAccounts } from '../contexts/AccountsContext';
import { scrollToTopManual } from '../hooks/useScrollToTop';
import { useTranslation } from 'react-i18next';
import { getMasterTraders, getMySubscriptions, getInvestorPortfolio, followMaster, unfollowMaster } from '../services/copytradingService';
import toast from 'react-hot-toast';

// Estados iniciales vacíos para datos dinámicos
const initialPortfolioData = {
  totalBalance: 0,
  totalPnL: 0,
  totalPnLPercentage: 0,
  activeCapital: 0
};

const initialHistoricalData = [];

// Los traders se cargarán dinámicamente desde la API

const Inversor = () => {
  const { t } = useTranslation('copytrading');
  const [view, setView] = useState('dashboard'); // dashboard, explorer, traderProfile
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('1M');
  const [showDropdown, setShowDropdown] = useState({});
  
  // Explorer states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    performance: { min: '', max: '' },
    riskLevel: '',
    assets: '',
    aum: { min: '', max: '' },
    followers: { min: '' },
    maxDrawdown: { max: '' }
  });
  const [filteredTraders, setFilteredTraders] = useState([]);
  const [realTraders, setRealTraders] = useState([]);
  const [isLoadingTraders, setIsLoadingTraders] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [portfolioData, setPortfolioData] = useState(initialPortfolioData);
  const [historicalData, setHistoricalData] = useState(initialHistoricalData);
  
  // Estados para el modal combinado de copy trading
  const [showCombinedModal, setShowCombinedModal] = useState(false);
  const [selectedTraderForCopy, setSelectedTraderForCopy] = useState(null);
  
  // Estados para el modal de comentarios
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState([]);
  
  // Estados separados para seguir y copiar
  const [followedTraders, setFollowedTraders] = useState(new Set()); // Solo para botón "Seguir"
  const [copiedTraders, setCopiedTraders] = useState(new Set()); // Solo para botón "Copiar"
  
  // Trader Profile states
  const [activeTab, setActiveTab] = useState('performance');

  // Efecto para hacer scroll hacia arriba cuando cambie la vista
  useEffect(() => {
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [view, selectedTrader]);

  // Sincronizar copiedTraders con subscriptions
  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      console.log('[Inversor] 🔄 Syncing copiedTraders from subscriptions:', subscriptions);

      // Extraer IDs de masters de las suscripciones
      const copiedTraderIds = subscriptions.map(sub => {
        console.log('[Inversor] Extracting master ID from sub:', {
          master_id: sub.master_id,
          master_user_id: sub.master_user_id,
          master_obj_id: sub.master?.id,
          id: sub.id
        });
        // Puede venir como sub.master_id, sub.master_user_id, sub.master?.id o sub.id
        const extractedId = sub.master_id || sub.master_user_id || sub.master?.id || sub.id;
        console.log('[Inversor] Extracted ID:', extractedId);
        return extractedId;
      }).filter(Boolean);

      console.log('[Inversor] ✅ Traders copiados sincronizados:', copiedTraderIds);
      console.log('[Inversor] copiedTraders Set will contain:', Array.from(new Set(copiedTraderIds)));
      setCopiedTraders(new Set(copiedTraderIds));
    } else {
      console.log('[Inversor] No subscriptions, clearing copiedTraders');
      setCopiedTraders(new Set());
    }
  }, [subscriptions]);

  // Cargar datos reales de la API
  useEffect(() => {
    const fetchTradersData = async () => {
      try {
        setIsLoadingTraders(true);
        // Cargar traders, suscripciones y portfolio en paralelo
        const [tradersData, subsData, portfolioApiData] = await Promise.all([
          getMasterTraders(),
          getMySubscriptions(),
          getInvestorPortfolio().catch(() => null) // No fallar si portfolio endpoint no está disponible
        ]);

        console.log('[Inversor] 🔍 RAW API DATA:');
        console.log('[Inversor] Traders from API:', tradersData);
        console.log('[Inversor] First trader structure:', tradersData[0]);
        console.log('[Inversor] Subscriptions from API:', subsData);
        console.log('[Inversor] First subscription structure:', subsData[0]);
        console.log('[Inversor] Subscription has master_user_id?', subsData[0]?.master_user_id);
        console.log('[Inversor] Subscription fields:', Object.keys(subsData[0] || {}));

        // Formatear los traders para el componente
        const formattedTraders = tradersData.map(trader => ({
          id: trader.id,
          name: trader.name || trader.username || 'Trader',
          avatar: trader.photo_url || '/Avatar1.png',
          monthlyPerformance: trader.performance?.monthly_pnl_percentage || 0,
          riskLevel: trader.risk_level || 'Moderado',
          aum: trader.aum || 0,
          followers: trader.follower_count || 0,
          maxDrawdown: trader.max_drawdown || 0,
          winRate: trader.win_rate || 0,
          avgHoldTime: trader.avg_hold_time || 'N/A',
          rating: trader.rating || 0,
          strategy: trader.strategy || 'N/A',
          isVerified: trader.is_verified || false
        }));

        console.log('[Inversor] Formatted traders:', formattedTraders);
        console.log('[Inversor] Follower counts:', formattedTraders.map(t => ({ name: t.name, followers: t.followers })));
        
        setRealTraders(formattedTraders);
        setFilteredTraders(formattedTraders);

        // ALWAYS format and set subscriptions from subsData first
        console.log('[Inversor] 📝 Formatting subscriptions from API');
        console.log('[Inversor] subsData to format:', subsData);

        const formattedSubs = subsData.map(sub => ({
          id: sub.id,
          master_id: sub.master_user_id || sub.master_id, // IMPORTANTE: Preservar para sincronizar copiedTraders
          master_user_id: sub.master_user_id || sub.master_id, // También guardar master_user_id
          name: sub.master?.name || sub.master?.username || 'Unknown Trader',
          avatar: sub.master?.photo_url || '/Avatar1.png',
          personalPnL: sub.pnl || 0,
          personalPnLPercentage: sub.pnl_percentage || 0,
          assignedCapital: sub.assigned_capital || 0,
          status: sub.status || 'active'
        }));

        console.log('[Inversor] 💾 Setting subscriptions to state:', formattedSubs);
        setSubscriptions(formattedSubs);

        // Usar portfolio data del API si está disponible
        if (portfolioApiData) {
          console.log('[Inversor] Portfolio API data available:', portfolioApiData);
          const currentBalance = portfolioApiData.total_balance || 0;

          setPortfolioData({
            totalBalance: currentBalance,
            totalPnL: portfolioApiData.total_pnl || 0,
            totalPnLPercentage: portfolioApiData.total_pnl_percentage || 0,
            activeCapital: portfolioApiData.active_capital || 0
          });

          // Generar datos históricos basados en balance actual
          const generateHistoricalData = (currentValue, pnlPercentage) => {
            const data = [];
            const dates = ['01/12', '05/12', '10/12', '15/12', '20/12', '25/12', '30/12'];
            const startValue = currentValue / (1 + (pnlPercentage / 100));

            dates.forEach((date, index) => {
              const progress = (index + 1) / dates.length;
              const value = startValue + ((currentValue - startValue) * progress);
              data.push({
                date,
                value: Math.round(value * 100) / 100
              });
            });

            return data;
          };

          setHistoricalData(generateHistoricalData(currentBalance, portfolioApiData.total_pnl_percentage || 0));
        } else {
          console.log('[Inversor] No portfolio API data, using subscription-based calculations');
          
          // Calcular portfolio data basado en suscripciones
          if (formattedSubs.length > 0) {
            const totalBalance = formattedSubs.reduce((sum, sub) => sum + sub.assignedCapital, 0);
            const totalPnL = formattedSubs.reduce((sum, sub) => sum + sub.personalPnL, 0);
            const totalPnLPercentage = totalBalance > 0 ? (totalPnL / totalBalance) * 100 : 0;
            
            setPortfolioData({
              totalBalance,
              totalPnL,
              totalPnLPercentage,
              activeCapital: totalBalance
            });
          }
        }
      } catch (error) {
        console.error('Error loading traders data:', error);
        console.error('Error details:', error.response?.data || error.message);
        // En caso de error, usar arrays vacíos
        setFilteredTraders([]);
        setPortfolioData(initialPortfolioData);
      } finally {
        setIsLoadingTraders(false);
      }
    };
    
    fetchTradersData();
  }, []);

  // Efecto para inicializar comentarios - vacío hasta cargarlos de la API
  useEffect(() => {
    // Los comentarios se cargarán dinámicamente desde la API cuando se implemente
    setComments([]);
  }, []);

  const handleExploreTraders = () => {
    setView('explorer');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedTrader(null);
  };

  const handleViewTraderDetails = (trader) => {
    console.log('Viewing trader details:', trader);
    if (trader && trader.id) {
      setSelectedTrader(trader);
      setView('traderProfile');
    } else {
      console.error('Invalid trader data:', trader);
    }
  };

  const toggleDropdown = (traderId) => {
    setShowDropdown(prev => ({
      ...prev,
      [traderId]: !prev[traderId]
    }));
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%';
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatAUM = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0';
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Bajo': return 'text-green-400';
      case 'Moderado': return 'text-yellow-400';
      case 'Alto': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const handleCopyTrader = (trader) => {
    if (copiedTraders.has(trader.id)) {
      return; // Ya está siendo copiado
    }
    console.log('Copiando trader:', trader.name);
    setSelectedTraderForCopy(trader);
    setShowCombinedModal(true);
  };

  const handleUnfollowTrader = async (trader) => {
    try {
      console.log('[Inversor] Unfollowing trader:', trader.name);

      // Buscar la suscripción activa para este trader
      const subscription = subscriptions.find(sub =>
        sub.master_id === trader.id || sub.master_user_id === trader.id
      );

      if (!subscription) {
        toast.error('No se encontró la suscripción activa');
        return;
      }

      // Confirmar antes de dejar de seguir
      if (!window.confirm(`¿Estás seguro de que deseas dejar de seguir a ${trader.name}? Se cerrarán todas las posiciones abiertas copiadas de este trader.`)) {
        return;
      }

      // Llamar al servicio de unfollow
      // La API del backend obtiene el follower_mt5_account_id del token de autenticación
      await unfollowMaster(trader.id, subscription.follower_mt5_account_id);

      // Actualizar estado local
      setCopiedTraders(prev => {
        const newSet = new Set(prev);
        newSet.delete(trader.id);
        return newSet;
      });

      // Recargar suscripciones
      const subsData = await getMySubscriptions();
      const formattedSubs = subsData.map(sub => ({
        id: sub.id,
        master_id: sub.master_user_id || sub.master_id,
        master_user_id: sub.master_user_id || sub.master_id,
        name: sub.master?.name || sub.master?.username || 'Unknown Trader',
        avatar: sub.master?.photo_url || '/Avatar1.png',
        personalPnL: sub.pnl || 0,
        personalPnLPercentage: sub.pnl_percentage || 0,
        assignedCapital: sub.assigned_capital || 0,
        status: sub.status || 'active'
      }));

      setSubscriptions(formattedSubs);

      toast.success(`Has dejado de seguir a ${trader.name}`);
    } catch (error) {
      console.error('[Inversor] Error unfollowing trader:', error);
      toast.error(error.message || 'Error al dejar de seguir al trader');
    }
  };

  const handleCombinedModalConfirm = async (formData, trader, account) => {
    console.log('[Inversor] Combined modal confirmed:', { formData, trader, account });

    // Marcar el trader como copiado inmediatamente para UI feedback
    setCopiedTraders(prev => new Set([...prev, trader.id]));

    // Recargar suscripciones desde el backend
    try {
      const subsData = await getMySubscriptions();
      console.log('[Inversor] Subscriptions reloaded after copy:', subsData);

      // Formatear correctamente las suscripciones
      const formattedSubs = subsData.map(sub => ({
        id: sub.id,
        master_id: sub.master_user_id || sub.master_id,
        master_user_id: sub.master_user_id || sub.master_id,
        name: sub.master?.name || sub.master?.username || 'Unknown Trader',
        avatar: sub.master?.photo_url || '/Avatar1.png',
        personalPnL: sub.pnl || 0,
        personalPnLPercentage: sub.pnl_percentage || 0,
        assignedCapital: sub.assigned_capital || 0,
        status: sub.status || 'active'
      }));

      setSubscriptions(formattedSubs);
    } catch (error) {
      console.error('[Inversor] Error reloading subscriptions:', error);
    }
  };

  const handleFollowTrader = (trader) => {
    if (followedTraders.has(trader.id)) {
      // Dejar de seguir
      setFollowedTraders(prev => {
        const newSet = new Set(prev);
        newSet.delete(trader.id);
        return newSet;
      });
      console.log('Dejando de seguir trader:', trader.name);
    } else {
      // Seguir
      setFollowedTraders(prev => new Set([...prev, trader.id]));
      console.log('Siguiendo trader:', trader.name);
    }
  };

  const handleSubmitComment = async (commentData) => {
    // Simular un envío a API
    const newComment = {
      id: comments.length + 1,
      user: 'Usuario Actual', // En producción vendría del contexto de usuario
      avatar: '/current-user.png',
      date: new Date().toISOString().split('T')[0],
      rating: commentData.rating,
      comment: commentData.comment
    };

    setComments(prev => [newComment, ...prev]);
    console.log('Comentario enviado:', commentData);
    
    // Aquí se integraría con la API real
    // await submitTraderComment(commentData);
  };

  // Datos del perfil del trader - completamente dinámicos desde la API
  const traderProfileData = selectedTrader ? {
    performance: {
      chartData: selectedTrader.performanceChart || [],
      periods: selectedTrader.performancePeriods || {
        '1M': { return: 0, sharpe: 0, volatility: 0 },
        '3M': { return: 0, sharpe: 0, volatility: 0 },
        '6M': { return: 0, sharpe: 0, volatility: 0 },
        '1Y': { return: 0, sharpe: 0, volatility: 0 }
      }
    },
    statistics: selectedTrader.statistics || {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      avgWinAmount: 0,
      avgLossAmount: 0,
      largestWin: 0,
      largestLoss: 0,
      avgTradeDuration: 'N/A',
      profitFactor: 0,
      recoveryFactor: 0,
      calmarRatio: 0
    },
    tradeHistory: selectedTrader.tradeHistory || [],
    comments: comments, // Usar el estado de comentarios dinámico
    instruments: selectedTrader?.instruments || []
  } : {
    performance: { chartData: [], periods: {} },
    statistics: {},
    trades: [],
    comments: [],
    instruments: []
  };

  // Colores para el PieChart de instrumentos
  const PIE_COLORS = ['#0e7490', '#2563eb', '#7c3aed', '#dc2626', '#059669', '#d97706'];

  if (view === 'dashboard') {
    return (
      <>
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold mb-3">{t('copyTrading.dashboard')}</h1>
              <div className="space-y-2">
                <p className="text-gray-300 font-medium">{t('copyTrading.title')}</p>
                <p className="text-gray-400 max-w-2xl">
                  {t('copyTrading.description')}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={handleExploreTraders}
                className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-8 rounded-xl hover:opacity-90 transition-opacity text-lg font-medium flex items-center gap-2"
              >
                <Eye size={20} />
                {t('copyTrading.investor.exploreTraders')}
              </button>
            </div>
          </div>
        </div>

        {/* Widget 1: Resumen de Portafolio */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">{t('copyTrading.investor.portfolio')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm mb-1">{t('copyTrading.investor.totalBalance')}</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(portfolioData.total_balance || portfolioData.totalBalance || 0)}</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm mb-1">{t('copyTrading.investor.totalPnL')}</p>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <p className={`text-2xl font-bold ${(portfolioData.total_pnl || portfolioData.totalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(portfolioData.total_pnl || portfolioData.totalPnL || 0)}
                </p>
                <div className={`flex items-center gap-1 ${(portfolioData.total_pnl || portfolioData.totalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(portfolioData.total_pnl || portfolioData.totalPnL || 0) >= 0 ? <ArrowUp size={20} /> : <TrendingDown size={20} />}
                  <span className="text-sm font-medium">({formatPercentage(portfolioData.total_pnl_percentage || portfolioData.totalPnLPercentage || 0)})</span>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm mb-1">{t('copyTrading.investor.activeCapital')}</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(portfolioData.active_capital || portfolioData.activeCapital || 0)}</p>
            </div>
          </div>
        </div>

        {/* Widget 2: Mis Traders Copiados */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">{t('copyTrading.investor.copiedTraders')}</h2>
          <div className="space-y-4">
            {subscriptions.map((trader) => (
              <div key={trader.id} className="bg-[#1C1C1C] rounded-xl border border-[#333] p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Trader Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">{trader.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{trader.name}</h3>
                      <p className="text-sm text-gray-400">{t('copyTrading.investor.capital')}: {formatCurrency(trader.assignedCapital)}</p>
                    </div>
                  </div>
                  
                  {/* Performance */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{t('copyTrading.stats.performance')}</p>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${trader.personalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(trader.personalPnL)}
                        </p>
                        <span className={`text-sm ${trader.personalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ({formatPercentage(trader.personalPnLPercentage)})
                        </span>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        trader.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {trader.status === 'active' ? t('copyTrading.status.active') : t('copyTrading.status.paused')}
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewTraderDetails(trader)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        {t('copyTrading.actions.manage')}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(trader.id)}
                          className="p-2 hover:bg-[#333] rounded-lg transition-colors"
                        >
                          <MoreHorizontal size={16} className="text-gray-400" />
                        </button>
                        {showDropdown[trader.id] && (
                          <div className="absolute right-0 mt-2 w-40 bg-[#2a2a2a] border border-[#333] rounded-lg shadow-lg z-10">
                            <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333] rounded-t-lg flex items-center gap-2">
                              <Pause size={14} />
                              {t('copyTrading.actions.pauseCopy')}
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#333] rounded-b-lg flex items-center gap-2">
                              <StopCircle size={14} />
                              {t('copyTrading.actions.stopCopy')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: Gráfico de Rendimiento Histórico */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-xl font-semibold text-cyan-400 mb-4 sm:mb-0">{t('copyTrading.investor.historicalPerformance')}</h2>
            <div className="flex gap-2">
              {['1M', '3M', '6M', '1A'].map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    chartPeriod === period
                      ? 'bg-cyan-600 text-white'
                      : 'bg-[#333] text-gray-400 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1C1C1C', 
                    border: '1px solid #333', 
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value) => [formatCurrency(value), t('copyTrading.investor.portfolioValue')]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22d3ee" 
                  strokeWidth={2}
                  fill="#22d3ee" 
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Botón CTA Principal */}
        <div className="text-center">
          <button
            onClick={handleExploreTraders}
            className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-8 rounded-xl hover:opacity-90 transition-opacity text-lg font-medium"
          >
            {t('copyTrading.investor.exploreTraders')}
          </button>
        </div>
      </div>
      
      {/* Global Modals */}
      <CombinedCopyTradingModal
        isOpen={showCombinedModal}
        onClose={() => {
          setShowCombinedModal(false);
          setSelectedTraderForCopy(null);
        }}
        trader={selectedTraderForCopy}
        onConfirm={handleCombinedModalConfirm}
      />

      <CommentsRatingModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        trader={selectedTraderForCopy || selectedTrader}
        onSubmit={handleSubmitComment}
      />
      </>
    );
  }

  // Explorer View
  if (view === 'explorer') {
    return (
      <>
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
          >
            ← {t('copyTrading.navigation.backToDashboard')}
          </button>
          <h1 className="text-3xl font-semibold mb-2">{t('copyTrading.investor.exploreTraders')}</h1>
          <p className="text-gray-400">{t('copyTrading.investor.discoverAndCopyBestTraders')}</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t('copyTrading.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                showFilters 
                  ? 'bg-cyan-600 border-cyan-600 text-white' 
                  : 'bg-[#1C1C1C] border-[#333] text-gray-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal size={20} />
              {t('copyTrading.search.filters')}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-[#333]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Performance Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('copyTrading.filters.performance')} (%)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t('copyTrading.filters.min')}
                      className="flex-1 bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="number"
                      placeholder={t('copyTrading.filters.max')}
                      className="flex-1 bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Risk Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('copyTrading.filters.risk')}</label>
                  <select className="w-full bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                    <option value="">{t('copyTrading.filters.all')}</option>
                    <option value="Bajo">{t('copyTrading.risk.low')}</option>
                    <option value="Moderado">{t('copyTrading.risk.moderate')}</option>
                    <option value="Alto">{t('copyTrading.risk.high')}</option>
                  </select>
                </div>

                {/* AUM Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('copyTrading.filters.aum')}</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t('copyTrading.filters.min')}
                      className="flex-1 bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="number"
                      placeholder={t('copyTrading.filters.max')}
                      className="flex-1 bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Min Followers */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('copyTrading.filters.minFollowers')}</label>
                  <input
                    type="number"
                    placeholder="10"
                    className="w-full bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Max Drawdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('copyTrading.filters.maxDrawdown')} (%)</label>
                  <input
                    type="number"
                    placeholder="20"
                    className="w-full bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Asset Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('copyTrading.filters.assets')}</label>
                  <select className="w-full bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                    <option value="">{t('copyTrading.filters.all')}</option>
                    <option value="forex">{t('copyTrading.assets.forex')}</option>
                    <option value="crypto">{t('copyTrading.assets.crypto')}</option>
                    <option value="stocks">{t('copyTrading.assets.stocks')}</option>
                    <option value="commodities">{t('copyTrading.assets.commodities')}</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 mt-4">
                <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                  {t('copyTrading.actions.apply')}
                </button>
                <button className="px-4 py-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors">
                  {t('copyTrading.actions.clear')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Traders Grid */}
        {console.log('[Inversor] 🎨 Rendering traders grid. copiedTraders Set:', Array.from(copiedTraders))}
        {isLoadingTraders ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#333] rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-[#333] rounded w-24 mb-2"></div>
                    <div className="h-3 bg-[#333] rounded w-32"></div>
                  </div>
                  <div className="h-4 bg-[#333] rounded w-12"></div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="h-3 bg-[#333] rounded w-full"></div>
                  <div className="h-3 bg-[#333] rounded w-full"></div>
                  <div className="h-3 bg-[#333] rounded w-full"></div>
                  <div className="h-3 bg-[#333] rounded w-full"></div>
                  <div className="h-3 bg-[#333] rounded w-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#1C1C1C] rounded-lg">
                  <div className="h-8 bg-[#333] rounded"></div>
                  <div className="h-8 bg-[#333] rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-[#333] rounded-lg"></div>
                  <div className="h-10 w-24 bg-[#333] rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTraders.map((trader) => {
              const isCopied = copiedTraders.has(trader.id);
              console.log('[Inversor] 🔍 Checking trader:', trader.id, trader.name, 'isCopied?', isCopied, 'copiedTraders has:', Array.from(copiedTraders));
              return (
            <div key={trader.id} className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 hover:border-cyan-500/50 transition-colors">
              {/* Trader Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center relative">
                  <span className="text-white font-semibold">{trader.name.charAt(0)}</span>
                  {trader.isVerified && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{trader.name}</h3>
                  <p className="text-sm text-gray-400">{trader.strategy}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-400">{trader.rating}</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{t('copyTrading.stats.performance')}</span>
                  <span className={`font-semibold ${trader.monthlyPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(trader.monthlyPerformance)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{t('copyTrading.stats.riskLevel')}</span>
                  <span className={`font-medium ${getRiskColor(trader.riskLevel)}`}>
                    {trader.riskLevel}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{t('copyTrading.stats.aum')}</span>
                  <span className="font-medium text-white">{formatAUM(trader.aum)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{t('copyTrading.stats.followers')}</span>
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-gray-400" />
                    <span className="font-medium text-white">{trader.followers}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{t('copyTrading.stats.drawdown')}</span>
                  <span className="font-medium text-red-400">-{trader.maxDrawdown}%</span>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#1C1C1C] rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-400">{t('copyTrading.stats.winRate')}</p>
                  <p className="font-semibold text-white">{trader.winRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">{t('copyTrading.stats.avgDuration')}</p>
                  <p className="font-semibold text-white">{trader.avgHoldTime}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {copiedTraders.has(trader.id) ? (
                  <button
                    onClick={() => handleUnfollowTrader(trader)}
                    className="flex-1 py-2 px-4 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700"
                  >
                    <UserMinus size={16} />
                    Dejar de seguir
                  </button>
                ) : (
                  <button
                    onClick={() => handleCopyTrader(trader)}
                    className="flex-1 py-2 px-4 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white hover:opacity-90"
                  >
                    <Copy size={16} />
                    {t('copyTrading.copyNow')}
                  </button>
                )}
                <button
                  onClick={() => handleViewTraderDetails(trader)}
                  className="px-4 py-2 border border-[#333] text-gray-400 rounded-lg hover:text-white hover:border-gray-300 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  {t('copyTrading.actions.viewProfile')}
                </button>
              </div>
            </div>
          );
            })}
          </div>
        )}

        {/* Results Count */}
        {!isLoadingTraders && (
          <div className="mt-6 text-center text-gray-400">
            {filteredTraders.length} {t('copyTrading.trader.available')}
          </div>
        )}
      </div>
      
      {/* Global Modals */}
      <CombinedCopyTradingModal
        isOpen={showCombinedModal}
        onClose={() => {
          setShowCombinedModal(false);
          setSelectedTraderForCopy(null);
        }}
        trader={selectedTraderForCopy}
        onConfirm={handleCombinedModalConfirm}
      />

      <CommentsRatingModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        trader={selectedTraderForCopy || selectedTrader}
        onSubmit={handleSubmitComment}
      />
      </>
    );
  }

  // Trader Profile View
  if (view === 'traderProfile' && selectedTrader) {
    const renderStarRating = (rating) => {
      return Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={16}
          className={`${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
        />
      ));
    };

    return (
      <>
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
          >
            ← {t('copyTrading.navigation.backToExplorer')}
          </button>
        </div>

        {/* Trader Info Header */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center text-center lg:text-left">
              <div className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center relative mb-4">
                <span className="text-white font-bold text-2xl">{(selectedTrader.name || 'T').charAt(0)}</span>
                {(selectedTrader.isVerified) && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield size={16} className="text-white" />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2">{selectedTrader.name || 'Trader'}</h1>
              <p className="text-gray-400 mb-3">{selectedTrader.strategy || 'Estrategia no disponible'}</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">{renderStarRating(Math.floor(selectedTrader.rating || 0))}</div>
                <span className="text-sm text-gray-400">({selectedTrader.rating || 0}/5)</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-400 mb-1">{t('copyTrading.stats.performance')}</p>
                  <p className={`text-xl font-bold ${(selectedTrader.monthlyPerformance || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(selectedTrader.monthlyPerformance || 0)}
                  </p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-400 mb-1">{t('copyTrading.stats.followers')}</p>
                  <p className="text-xl font-bold text-white">{selectedTrader.followers || 0}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-400 mb-1">{t('copyTrading.stats.aum')}</p>
                  <p className="text-xl font-bold text-white">{formatAUM(selectedTrader.aum || 0)}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-400 mb-1">{t('copyTrading.stats.drawdown')}</p>
                  <p className="text-xl font-bold text-red-400">-{selectedTrader.maxDrawdown || 0}%</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => handleCopyTrader(selectedTrader)}
                  className={`py-3 px-8 rounded-xl transition-all font-medium flex items-center gap-2 ${
                    copiedTraders.has(selectedTrader.id)
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white hover:opacity-90'
                  }`}
                  disabled={copiedTraders.has(selectedTrader.id)}
                >
                  <Copy size={20} />
                  {copiedTraders.has(selectedTrader.id) ? t('copyTrading.status.copyingTrader') : t('copyTrading.actions.copyTrader')}
                </button>
                <button 
                  onClick={() => handleFollowTrader(selectedTrader)}
                  className={`py-3 px-6 rounded-xl transition-colors font-medium ${
                    followedTraders.has(selectedTrader.id)
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10'
                  }`}
                >
                  {followedTraders.has(selectedTrader.id) ? t('copyTrading.status.following') : t('copyTrading.follow')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
          <div className="flex flex-wrap gap-2 mb-6 border-b border-[#333] pb-4">
            {[
              { id: 'performance', label: t('copyTrading.tabs.performance'), icon: BarChart3 },
              { id: 'drawdown', label: t('copyTrading.tabs.drawdown'), icon: TrendingDown },
              { id: 'statistics', label: t('copyTrading.tabs.statistics'), icon: Activity },
              { id: 'instruments', label: t('copyTrading.tabs.instruments'), icon: Target },
              { id: 'comments', label: t('copyTrading.tabs.comments'), icon: MessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#333]'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Performance Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">{t('copyTrading.tabs.performance')}</h3>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={traderProfileData?.performance?.chartData || []}>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1C1C1C', 
                          border: '1px solid #333', 
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                        formatter={(value) => [formatCurrency(value), t('copyTrading.investor.portfolioValue')]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#22d3ee" 
                        strokeWidth={2}
                        fill="#22d3ee" 
                        fillOpacity={0.1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Metrics by Period */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">{t('copyTrading.metrics.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(traderProfileData?.performance?.periods || {}).map(([period, data]) => (
                    <div key={period} className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                      <h4 className="font-semibold text-white mb-3">{period}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">{t('copyTrading.metrics.return')}</span>
                          <span className={`text-sm font-medium ${data.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercentage(data.return)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">{t('copyTrading.metrics.sharpe')}</span>
                          <span className="text-sm font-medium text-white">{data.sharpe}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">{t('copyTrading.metrics.volatility')}</span>
                          <span className="text-sm font-medium text-white">{data.volatility}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-cyan-400">{t('copyTrading.tabs.statistics')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Trading Stats */}
                <div className="bg-[#1C1C1C] rounded-xl p-6 border border-[#333]">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-cyan-400" />
                    {t('copyTrading.stats.trading')}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.totalTrades')}</span>
                      <span className="text-white font-medium">{traderProfileData?.statistics?.totalTrades || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.winningTrades')}</span>
                      <span className="text-green-400 font-medium">{traderProfileData?.statistics?.winningTrades || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.losingTrades')}</span>
                      <span className="text-red-400 font-medium">{traderProfileData?.statistics?.losingTrades || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.winRate')}</span>
                      <span className="text-white font-medium">{selectedTrader.winRate || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* P&L Stats */}
                <div className="bg-[#1C1C1C] rounded-xl p-6 border border-[#333]">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign size={18} className="text-cyan-400" />
                    {t('copyTrading.stats.pnl')}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.avgWin')}</span>
                      <span className="text-green-400 font-medium">${traderProfileData?.statistics?.avgWinAmount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.avgLoss')}</span>
                      <span className="text-red-400 font-medium">${traderProfileData?.statistics?.avgLossAmount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.largestWin')}</span>
                      <span className="text-green-400 font-medium">${traderProfileData?.statistics?.largestWin || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.largestLoss')}</span>
                      <span className="text-red-400 font-medium">${traderProfileData?.statistics?.largestLoss || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="bg-[#1C1C1C] rounded-xl p-6 border border-[#333]">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Award size={18} className="text-cyan-400" />
                    {t('copyTrading.stats.risk')}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.profitFactor')}</span>
                      <span className="text-white font-medium">{traderProfileData?.statistics?.profitFactor || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.recoveryFactor')}</span>
                      <span className="text-white font-medium">{traderProfileData?.statistics?.recoveryFactor || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.calmarRatio')}</span>
                      <span className="text-white font-medium">{traderProfileData?.statistics?.calmarRatio || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('copyTrading.stats.avgDuration')}</span>
                      <span className="text-white font-medium">{traderProfileData?.statistics?.avgTradeDuration || '0h'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'instruments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-cyan-400">{t('copyTrading.tabs.instruments')}</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-white">EURUSD</span>
                    <span className="text-white font-medium">31.31%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                    <span className="text-white">XAUUSD</span>
                    <span className="text-white font-medium">68.69%</span>
                  </div>
                </div>
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'EURUSD', value: 31.31 },
                          { name: 'XAUUSD', value: 68.69 }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#22d3ee" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'drawdown' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-cyan-400">{t('copyTrading.tabs.drawdown')}</h3>
              
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={traderProfileData?.performance?.chartData || []}>
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
                        backgroundColor: '#1C1C1C', 
                        border: '1px solid #333', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value) => [`${value}%`, t('copyTrading.tabs.drawdown')]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fill="url(#drawdownGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Estadísticas de drawdown */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                  <p className="text-sm text-gray-400 mb-1">{t('copyTrading.stats.maxDrawdown')}</p>
                  <p className="text-lg font-medium text-red-500">-{selectedTrader.maxDrawdown || 18.4}%</p>
                </div>
                <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                  <p className="text-sm text-gray-400 mb-1">{t('copyTrading.stats.currentDrawdown')}</p>
                  <p className="text-lg font-medium text-red-400">-6.3%</p>
                </div>
                <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                  <p className="text-sm text-gray-400 mb-1">{t('copyTrading.stats.maxDuration')}</p>
                  <p className="text-lg font-medium text-white">12 {t('copyTrading.time.days')}</p>
                </div>
                <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                  <p className="text-sm text-gray-400 mb-1">{t('copyTrading.stats.recovery')}</p>
                  <p className="text-lg font-medium text-yellow-500">{t('copyTrading.status.inProgress')}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-cyan-400">{t('copyTrading.tabs.comments')}</h3>
                <button
                  onClick={() => setShowCommentsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <Plus size={16} />
                  {t('copyTrading.actions.addComment')}
                </button>
              </div>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-[#1C1C1C] rounded-xl p-6 border border-[#333]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{comment.user.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{comment.user}</span>
                          <div className="flex items-center gap-1">
                            {renderStarRating(comment.rating)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar size={14} />
                          {comment.date}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Global Modals */}
      <CombinedCopyTradingModal
        isOpen={showCombinedModal}
        onClose={() => {
          setShowCombinedModal(false);
          setSelectedTraderForCopy(null);
        }}
        trader={selectedTraderForCopy}
        onConfirm={handleCombinedModalConfirm}
      />

      <CommentsRatingModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        trader={selectedTraderForCopy || selectedTrader}
        onSubmit={handleSubmitComment}
      />
      </>
    );
  }

  // Fallback
  return (
    <>
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        <p className="text-gray-400">{t('copyTrading.errors.viewNotFound')}</p>
      </div>
      
      {/* Global Modals */}
      <CombinedCopyTradingModal
        isOpen={showCombinedModal}
        onClose={() => {
          setShowCombinedModal(false);
          setSelectedTraderForCopy(null);
        }}
        trader={selectedTraderForCopy}
        onConfirm={handleCombinedModalConfirm}
      />

      <CommentsRatingModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        trader={selectedTraderForCopy || selectedTrader}
        onSubmit={handleSubmitComment}
      />
    </>
  );
};

export default Inversor;