import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowUp, TrendingUp, TrendingDown, Users, MoreHorizontal, Pause, StopCircle, Eye, Search, Filter, SlidersHorizontal, Star, Copy, TrendingUp as TrendingUpIcon, BarChart3, Activity, History, MessageSquare, Shield, Award, Calendar, DollarSign, Plus, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, Legend } from 'recharts';
import SeguirTraderModal from './SeguirTraderModal';
import AccountSelectionModal from './AccountSelectionModal';
import CommentsRatingModal from './CommentsRatingModal';
import { useAccounts } from '../contexts/AccountsContext';
import { scrollToTopManual } from '../hooks/useScrollToTop';
import useTranslation from '../hooks/useTranslation';
import { getMasterTraders, getMySubscriptions, getInvestorPortfolio } from '../services/copytradingService';

// Mock data para el dashboard del inversor (TEMPORAL - será reemplazado por datos reales)
const mockPortfolioData = {
  totalBalance: 15250.75,
  totalPnL: 2100.50,
  totalPnLPercentage: 16.7,
  activeCapital: 13000.00
};

const mockCopiedTraders = [
  {
    id: 1,
    name: "Maestro FX",
    avatar: "/Avatar1.png",
    personalPnL: 520.10,
    personalPnLPercentage: 8.3,
    assignedCapital: 5000.00,
    status: "active"
  },
  {
    id: 2,
    name: "CryptoKing",
    avatar: "/Avatar2.png", 
    personalPnL: 1280.20,
    personalPnLPercentage: 12.8,
    assignedCapital: 4500.00,
    status: "active"
  },
  {
    id: 3,
    name: "Piloto de Ganancias",
    avatar: "/Avatar3.png",
    personalPnL: 300.20,
    personalPnLPercentage: 8.6,
    assignedCapital: 3500.00,
    status: "paused"
  }
];

const mockHistoricalData = [
  { date: '01/12', value: 13150 },
  { date: '05/12', value: 13350 },
  { date: '10/12', value: 14100 },
  { date: '15/12', value: 13850 },
  { date: '20/12', value: 14500 },
  { date: '25/12', value: 15000 },
  { date: '30/12', value: 15250 },
];

const mockTradersForExplorer = [
  {
    id: 1,
    name: "Maestro FX Pro",
    avatar: "/Avatar1.png",
    monthlyPerformance: 24.5,
    riskLevel: "Moderado",
    aum: 125000,
    followers: 45,
    maxDrawdown: 8.2,
    winRate: 78,
    avgHoldTime: "2.5h",
    rating: 4.8,
    strategy: "Scalping EUR/USD",
    isVerified: true
  },
  {
    id: 2,
    name: "CryptoKing Elite",
    avatar: "/Avatar2.png",
    monthlyPerformance: 18.3,
    riskLevel: "Alto",
    aum: 89000,
    followers: 32,
    maxDrawdown: 15.7,
    winRate: 65,
    avgHoldTime: "6.2h",
    rating: 4.5,
    strategy: "Swing Trading BTC",
    isVerified: true
  },
  {
    id: 3,
    name: "SafeTrader",
    avatar: "/Avatar3.png",
    monthlyPerformance: 12.1,
    riskLevel: "Bajo",
    aum: 95000,
    followers: 67,
    maxDrawdown: 4.3,
    winRate: 85,
    avgHoldTime: "12h",
    rating: 4.9,
    strategy: "Conservador Diversificado",
    isVerified: true
  },
  {
    id: 4,
    name: "TechAnalyst",
    avatar: "/Avatar4.png",
    monthlyPerformance: 31.2,
    riskLevel: "Alto",
    aum: 156000,
    followers: 28,
    maxDrawdown: 22.1,
    winRate: 72,
    avgHoldTime: "4.8h",
    rating: 4.3,
    strategy: "Análisis Técnico Avanzado",
    isVerified: false
  },
  {
    id: 5,
    name: "DiversifiedPro",
    avatar: "/Avatar5.png",
    monthlyPerformance: 16.8,
    riskLevel: "Moderado",
    aum: 203000,
    followers: 89,
    maxDrawdown: 11.4,
    winRate: 74,
    avgHoldTime: "8.1h",
    rating: 4.7,
    strategy: "Portafolio Diversificado",
    isVerified: true
  },
  {
    id: 6,
    name: "QuickGains",
    avatar: "/Avatar6.png",
    monthlyPerformance: 27.9,
    riskLevel: "Alto",
    aum: 67000,
    followers: 23,
    maxDrawdown: 18.9,
    winRate: 68,
    avgHoldTime: "1.2h",
    rating: 4.1,
    strategy: "Day Trading Agresivo",
    isVerified: false
  }
];

const Inversor = () => {
  const { t } = useTranslation();
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
  const [portfolioData, setPortfolioData] = useState(mockPortfolioData); // Temporal hasta tener endpoint de portfolio
  const [historicalData, setHistoricalData] = useState(mockHistoricalData);
  
  // Estados para el modal de seguir trader
  const [showSeguirModal, setShowSeguirModal] = useState(false);
  const [selectedTraderForCopy, setSelectedTraderForCopy] = useState(null);
  
  // Estados para el modal de selección de cuenta
  const [showAccountSelectionModal, setShowAccountSelectionModal] = useState(false);
  const [selectedAccountForCopy, setSelectedAccountForCopy] = useState(null);
  
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
        
        setRealTraders(formattedTraders);
        setFilteredTraders(formattedTraders);
        
        // Usar portfolio data del API si está disponible
        if (portfolioApiData) {
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

          // Usar los traders copiados del portfolio API
          if (portfolioApiData.copied_traders) {
            const formattedCopiedTraders = portfolioApiData.copied_traders.map(trader => ({
              id: trader.id,
              name: trader.name,
              avatar: trader.avatar || '/Avatar1.png',
              personalPnL: trader.personal_pnl || 0,
              personalPnLPercentage: trader.personal_pnl_percentage || 0,
              assignedCapital: trader.assigned_capital || 0,
              status: trader.status || 'active'
            }));
            
            setSubscriptions(formattedCopiedTraders);
          }
        } else {
          // Fallback: formatear suscripciones tradicionales
          const formattedSubs = subsData.map(sub => ({
            id: sub.id,
            name: sub.master?.name || sub.master?.username || 'Unknown Trader',
            avatar: sub.master?.photo_url || '/Avatar1.png',
            personalPnL: sub.pnl || 0,
            personalPnLPercentage: sub.pnl_percentage || 0,
            assignedCapital: sub.assigned_capital || 0,
            status: sub.status || 'active'
          }));
          
          setSubscriptions(formattedSubs);
          
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
        // En caso de error, usar datos mock como fallback
        setFilteredTraders(mockTradersForExplorer);
        setPortfolioData(mockPortfolioData);
      } finally {
        setIsLoadingTraders(false);
      }
    };
    
    fetchTradersData();
  }, []);

  // Efecto para inicializar comentarios con datos mock
  useEffect(() => {
    // Initialize comments with mock data when component mounts
    const mockComments = [
      {
        id: 1,
        user: 'InvestorPro',
        avatar: '/user1.png',
        date: '2024-01-10',
        rating: 5,
        comment: 'Excelente trader, muy consistente en sus estrategias. He estado copiándolo por 3 meses y los resultados son fantásticos.'
      },
      {
        id: 2,
        user: 'TradingNewbie',
        avatar: '/user2.png',
        date: '2024-01-08',
        rating: 4,
        comment: 'Buen rendimiento general, aunque a veces las operaciones duran más de lo esperado. Recomendado para perfiles conservadores.'
      },
      {
        id: 3,
        user: 'CopyMaster',
        avatar: '/user3.png',
        date: '2024-01-05',
        rating: 5,
        comment: 'Profesional serio con una estrategia bien definida. El análisis de riesgo es impecable.'
      }
    ];
    setComments(mockComments);
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
    if (followedTraders.has(trader.id)) {
      return; // Ya está siendo seguido
    }
    console.log('Copiando trader:', trader.name);
    setSelectedTraderForCopy(trader);
    setShowAccountSelectionModal(true);
  };

  const handleAccountSelected = (account) => {
    console.log('Account selected for copying:', account);
    setSelectedAccountForCopy(account);
    setShowAccountSelectionModal(false);
    setShowSeguirModal(true);
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

  const mockTraderProfileData = {
    performance: {
      chartData: [
        { date: '01/12', value: 10000, drawdown: 0 },
        { date: '05/12', value: 10350, drawdown: -2.1 },
        { date: '10/12', value: 11200, drawdown: -1.5 },
        { date: '15/12', value: 10950, drawdown: -3.2 },
        { date: '20/12', value: 11800, drawdown: -0.8 },
        { date: '25/12', value: 12300, drawdown: -1.2 },
        { date: '30/12', value: 12450, drawdown: 0 },
      ],
      periods: {
        '1M': { return: 24.5, sharpe: 1.8, volatility: 12.3 },
        '3M': { return: 68.2, sharpe: 2.1, volatility: 11.8 },
        '6M': { return: 142.7, sharpe: 2.3, volatility: 13.1 },
        '1Y': { return: 284.6, sharpe: 2.0, volatility: 14.2 }
      }
    },
    statistics: {
      totalTrades: 1247,
      winningTrades: 973,
      losingTrades: 274,
      avgWinAmount: 125.50,
      avgLossAmount: -89.30,
      largestWin: 890.20,
      largestLoss: -456.80,
      avgTradeDuration: '2.5h',
      profitFactor: 1.95,
      recoveryFactor: 2.8,
      calmarRatio: 3.2
    },
    tradeHistory: [
      {
        id: 1,
        symbol: 'EUR/USD',
        type: 'BUY',
        openTime: '2024-01-15 09:30',
        closeTime: '2024-01-15 12:45',
        openPrice: 1.0875,
        closePrice: 1.0912,
        lotSize: 0.5,
        pnl: 185.00,
        pnlPercentage: 1.7
      },
      {
        id: 2,
        symbol: 'GBP/USD',
        type: 'SELL',
        openTime: '2024-01-14 14:20',
        closeTime: '2024-01-14 16:10',
        openPrice: 1.2654,
        closePrice: 1.2598,
        lotSize: 0.3,
        pnl: 168.00,
        pnlPercentage: 2.1
      },
      {
        id: 3,
        symbol: 'USD/JPY',
        type: 'BUY',
        openTime: '2024-01-13 08:15',
        closeTime: '2024-01-13 11:30',
        openPrice: 149.75,
        closePrice: 148.92,
        lotSize: 0.2,
        pnl: -166.00,
        pnlPercentage: -1.3
      }
    ],
    comments: [
      {
        id: 1,
        user: 'InvestorPro',
        avatar: '/user1.png',
        date: '2024-01-10',
        rating: 5,
        comment: 'Excelente trader, muy consistente en sus estrategias. He estado copiándolo por 3 meses y los resultados son fantásticos.'
      },
      {
        id: 2,
        user: 'TradingNewbie',
        avatar: '/user2.png',
        date: '2024-01-08',
        rating: 4,
        comment: 'Buen rendimiento general, aunque a veces las operaciones duran más de lo esperado. Recomendado para perfiles conservadores.'
      },
      {
        id: 3,
        user: 'CopyMaster',
        avatar: '/user3.png',
        date: '2024-01-05',
        rating: 5,
        comment: 'Profesional serio con una estrategia bien definida. El análisis de riesgo es impecable.'
      }
    ],
    instruments: [
      { name: 'EUR/USD', value: 35.2 },
      { name: 'GBP/USD', value: 28.7 },
      { name: 'USD/JPY', value: 18.5 },
      { name: 'XAU/USD', value: 12.3 },
      { name: 'US100', value: 5.3 }
    ]
  };

  // Colores para el PieChart de instrumentos
  const PIE_COLORS = ['#0e7490', '#2563eb', '#7c3aed', '#dc2626', '#059669', '#d97706'];

  if (view === 'dashboard') {
    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold mb-3">Tablero Copy Trading</h1>
              <div className="space-y-2">
                <p className="text-gray-300 font-medium">Copy Trading</p>
                <p className="text-gray-400 max-w-2xl">
                  Replica estrategias de traders profesionales verificados. 
                  Diversifica tu portafolio con control total sobre tu capital.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={handleExploreTraders}
                className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-8 rounded-xl hover:opacity-90 transition-opacity text-lg font-medium flex items-center gap-2"
              >
                <Eye size={20} />
                {t('investor.exploreTraders')}
              </button>
            </div>
          </div>
        </div>

        {/* Widget 1: Resumen de Portafolio */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Portafolio Copy Trading</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm mb-1">Balance Total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(mockPortfolioData.totalBalance)}</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm mb-1">P&L Total</p>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <p className={`text-2xl font-bold ${mockPortfolioData.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(mockPortfolioData.totalPnL)}
                </p>
                <div className={`flex items-center gap-1 ${mockPortfolioData.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {mockPortfolioData.totalPnL >= 0 ? <ArrowUp size={20} /> : <TrendingDown size={20} />}
                  <span className="text-sm font-medium">({formatPercentage(mockPortfolioData.totalPnLPercentage)})</span>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm mb-1">Capital Activo</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(mockPortfolioData.activeCapital)}</p>
            </div>
          </div>
        </div>

        {/* Widget 2: Mis Traders Copiados */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Traders Copiados</h2>
          <div className="space-y-4">
            {(subscriptions.length > 0 ? subscriptions : mockCopiedTraders).map((trader) => (
              <div key={trader.id} className="bg-[#1C1C1C] rounded-xl border border-[#333] p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Trader Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">{trader.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{trader.name}</h3>
                      <p className="text-sm text-gray-400">Capital: {formatCurrency(trader.assignedCapital)}</p>
                    </div>
                  </div>
                  
                  {/* Performance */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Rendimiento</p>
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
                        {trader.status === 'active' ? 'Activo' : 'Pausado'}
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewTraderDetails(trader)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Gestionar
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
                              Pausar Copia
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#333] rounded-b-lg flex items-center gap-2">
                              <StopCircle size={14} />
                              Detener Copia
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
            <h2 className="text-xl font-semibold text-cyan-400 mb-4 sm:mb-0">Rendimiento Histórico</h2>
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
                  formatter={(value) => [formatCurrency(value), 'Valor del Portafolio']}
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
            {t('investor.exploreTraders')}
          </button>
        </div>

        {/* Modal de Selección de Cuenta */}
        <AccountSelectionModal
          isOpen={showAccountSelectionModal}
          onClose={() => {
            setShowAccountSelectionModal(false);
            setSelectedTraderForCopy(null);
            setSelectedAccountForCopy(null);
          }}
          trader={selectedTraderForCopy}
          onAccountSelected={handleAccountSelected}
        />

        {/* Modal de Seguir Trader */}
        <SeguirTraderModal 
          isOpen={showSeguirModal}
          onClose={() => {
            setShowSeguirModal(false);
            setSelectedTraderForCopy(null);
            setSelectedAccountForCopy(null);
          }}
          trader={selectedTraderForCopy}
          selectedAccount={selectedAccountForCopy}
          onConfirm={(formData) => {
            console.log('Copiar trader confirmado desde dashboard:', formData);
            console.log('Cuenta seleccionada:', selectedAccountForCopy);
            
            // Marcar el trader como copiado
            if (selectedTraderForCopy) {
              setCopiedTraders(prev => new Set([...prev, selectedTraderForCopy.id]));
            }
            
            setShowSeguirModal(false);
            setSelectedTraderForCopy(null);
            setSelectedAccountForCopy(null);
          }}
        />

        {/* Modal de Comentarios y Puntuación */}
        <CommentsRatingModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          trader={selectedTraderForCopy}
          onSubmit={handleSubmitComment}
        />
      </div>
    );
  }

  // Explorer View
  if (view === 'explorer') {
    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
          >
            ← Volver al Dashboard
          </button>
          <h1 className="text-3xl font-semibold mb-2">{t('investor.exploreTraders')}</h1>
          <p className="text-gray-400">{t('investor.discoverAndCopyBestTraders')}</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar trader o estrategia..."
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
              Filtros
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-[#333]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Performance Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rendimiento (%)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="flex-1 bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Risk Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Riesgo</label>
                  <select className="w-full bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                    <option value="">Todos</option>
                    <option value="Bajo">Bajo</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>

                {/* AUM Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">AUM</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="flex-1 bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Min Followers */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Min. Seguidores</label>
                  <input
                    type="number"
                    placeholder="Ej: 10"
                    className="w-full bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Max Drawdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Drawdown Máx. (%)</label>
                  <input
                    type="number"
                    placeholder="Ej: 20"
                    className="w-full bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Asset Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Activos</label>
                  <select className="w-full bg-[#1C1C1C] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                    <option value="">Todos</option>
                    <option value="forex">Forex</option>
                    <option value="crypto">Criptomonedas</option>
                    <option value="stocks">Acciones</option>
                    <option value="commodities">Commodities</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 mt-4">
                <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                  Aplicar
                </button>
                <button className="px-4 py-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors">
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Traders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTraders.map((trader) => (
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
                  <span className="text-sm text-gray-400">Rendimiento</span>
                  <span className={`font-semibold ${trader.monthlyPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(trader.monthlyPerformance)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Riesgo</span>
                  <span className={`font-medium ${getRiskColor(trader.riskLevel)}`}>
                    {trader.riskLevel}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">AUM</span>
                  <span className="font-medium text-white">{formatAUM(trader.aum)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Seguidores</span>
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-gray-400" />
                    <span className="font-medium text-white">{trader.followers}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Drawdown</span>
                  <span className="font-medium text-red-400">-{trader.maxDrawdown}%</span>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#1C1C1C] rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Tasa de Éxito</p>
                  <p className="font-semibold text-white">{trader.winRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Duración Avg</p>
                  <p className="font-semibold text-white">{trader.avgHoldTime}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyTrader(trader)}
                  className={`flex-1 py-2 px-4 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                    copiedTraders.has(trader.id)
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white hover:opacity-90'
                  }`}
                  disabled={copiedTraders.has(trader.id)}
                >
                  <Copy size={16} />
                  {copiedTraders.has(trader.id) ? 'Copiando' : 'Copiar'}
                </button>
                <button
                  onClick={() => handleViewTraderDetails(trader)}
                  className="px-4 py-2 border border-[#333] text-gray-400 rounded-lg hover:text-white hover:border-gray-300 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Ver Perfil
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Results Count */}
        <div className="mt-6 text-center text-gray-400">
          {filteredTraders.length} traders disponibles
        </div>

        {/* Modal de Selección de Cuenta */}
        <AccountSelectionModal
          isOpen={showAccountSelectionModal}
          onClose={() => {
            setShowAccountSelectionModal(false);
            setSelectedTraderForCopy(null);
            setSelectedAccountForCopy(null);
          }}
          trader={selectedTraderForCopy}
          onAccountSelected={handleAccountSelected}
        />

        {/* Modal de Seguir Trader */}
        <SeguirTraderModal 
          isOpen={showSeguirModal}
          onClose={() => {
            setShowSeguirModal(false);
            setSelectedTraderForCopy(null);
            setSelectedAccountForCopy(null);
          }}
          trader={selectedTraderForCopy}
          selectedAccount={selectedAccountForCopy}
          onConfirm={(formData) => {
            console.log('Copiar trader confirmado desde explorer:', formData);
            console.log('Cuenta seleccionada:', selectedAccountForCopy);
            
            // Marcar el trader como copiado
            if (selectedTraderForCopy) {
              setCopiedTraders(prev => new Set([...prev, selectedTraderForCopy.id]));
            }
            
            setShowSeguirModal(false);
            setSelectedTraderForCopy(null);
            setSelectedAccountForCopy(null);
          }}
        />

        {/* Modal de Comentarios y Puntuación */}
        <CommentsRatingModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          trader={selectedTraderForCopy}
          onSubmit={handleSubmitComment}
        />
      </div>
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
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
          >
            ← Volver al Explorador
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
                  <p className="text-sm text-gray-400 mb-1">Rendimiento</p>
                  <p className={`text-xl font-bold ${(selectedTrader.monthlyPerformance || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(selectedTrader.monthlyPerformance || 0)}
                  </p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-400 mb-1">Seguidores</p>
                  <p className="text-xl font-bold text-white">{selectedTrader.followers || 0}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-400 mb-1">AUM</p>
                  <p className="text-xl font-bold text-white">{formatAUM(selectedTrader.aum || 0)}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-400 mb-1">Drawdown</p>
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
                  {copiedTraders.has(selectedTrader.id) ? 'Copiando Trader' : 'Copiar Trader'}
                </button>
                <button 
                  onClick={() => handleFollowTrader(selectedTrader)}
                  className={`py-3 px-6 rounded-xl transition-colors font-medium ${
                    followedTraders.has(selectedTrader.id)
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10'
                  }`}
                >
                  {followedTraders.has(selectedTrader.id) ? 'Siguiendo' : 'Seguir'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
          <div className="flex flex-wrap gap-2 mb-6 border-b border-[#333] pb-4">
            {[
              { id: 'performance', label: 'Rendimiento', icon: BarChart3 },
              { id: 'drawdown', label: 'Drawdown', icon: TrendingDown },
              { id: 'statistics', label: 'Estadísticas', icon: Activity },
              { id: 'instruments', label: 'Instrumentos', icon: Target },
              { id: 'comments', label: 'Comentarios', icon: MessageSquare }
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
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">Rendimiento</h3>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockTraderProfileData.performance.chartData}>
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
                        formatter={(value) => [formatCurrency(value), 'Valor del Portafolio']}
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
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">Métricas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(mockTraderProfileData.performance.periods).map(([period, data]) => (
                    <div key={period} className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                      <h4 className="font-semibold text-white mb-3">{period}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Retorno</span>
                          <span className={`text-sm font-medium ${data.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercentage(data.return)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Sharpe</span>
                          <span className="text-sm font-medium text-white">{data.sharpe}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Volatilidad</span>
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
              <h3 className="text-lg font-semibold text-cyan-400">Estadísticas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Trading Stats */}
                <div className="bg-[#1C1C1C] rounded-xl p-6 border border-[#333]">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-cyan-400" />
                    Trading
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Trades</span>
                      <span className="text-white font-medium">{mockTraderProfileData.statistics.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trades Ganadores</span>
                      <span className="text-green-400 font-medium">{mockTraderProfileData.statistics.winningTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trades Perdedores</span>
                      <span className="text-red-400 font-medium">{mockTraderProfileData.statistics.losingTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tasa de Éxito</span>
                      <span className="text-white font-medium">{selectedTrader.winRate || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* P&L Stats */}
                <div className="bg-[#1C1C1C] rounded-xl p-6 border border-[#333]">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign size={18} className="text-cyan-400" />
                    P&L
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ganancia Promedio</span>
                      <span className="text-green-400 font-medium">${mockTraderProfileData.statistics.avgWinAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pérdida Promedio</span>
                      <span className="text-red-400 font-medium">${mockTraderProfileData.statistics.avgLossAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mayor Ganancia</span>
                      <span className="text-green-400 font-medium">${mockTraderProfileData.statistics.largestWin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mayor Pérdida</span>
                      <span className="text-red-400 font-medium">${mockTraderProfileData.statistics.largestLoss}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="bg-[#1C1C1C] rounded-xl p-6 border border-[#333]">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Award size={18} className="text-cyan-400" />
                    Riesgo
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Factor de Ganancia</span>
                      <span className="text-white font-medium">{mockTraderProfileData.statistics.profitFactor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recovery Factor</span>
                      <span className="text-white font-medium">{mockTraderProfileData.statistics.recoveryFactor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Calmar Ratio</span>
                      <span className="text-white font-medium">{mockTraderProfileData.statistics.calmarRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duración Promedio</span>
                      <span className="text-white font-medium">{mockTraderProfileData.statistics.avgTradeDuration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'instruments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-cyan-400">Instrumentos de Trading</h3>
              
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
              <h3 className="text-lg font-semibold text-cyan-400">Drawdown</h3>
              
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTraderProfileData.performance.chartData}>
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
                      formatter={(value) => [`${value}%`, 'Drawdown']}
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
                  <p className="text-sm text-gray-400 mb-1">Drawdown Máximo</p>
                  <p className="text-lg font-medium text-red-500">-{selectedTrader.maxDrawdown || 18.4}%</p>
                </div>
                <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                  <p className="text-sm text-gray-400 mb-1">Drawdown Actual</p>
                  <p className="text-lg font-medium text-red-400">-6.3%</p>
                </div>
                <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                  <p className="text-sm text-gray-400 mb-1">Duración Máx</p>
                  <p className="text-lg font-medium text-white">12 días</p>
                </div>
                <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                  <p className="text-sm text-gray-400 mb-1">Recuperación</p>
                  <p className="text-lg font-medium text-yellow-500">En curso</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-cyan-400">Comentarios</h3>
                <button
                  onClick={() => setShowCommentsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <Plus size={16} />
                  Agregar Comentario
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

        {/* Modal de Selección de Cuenta */}
        <AccountSelectionModal
          isOpen={showAccountSelectionModal}
          onClose={() => {
            setShowAccountSelectionModal(false);
            setSelectedTraderForCopy(null);
            setSelectedAccountForCopy(null);
          }}
          trader={selectedTraderForCopy}
          onAccountSelected={handleAccountSelected}
        />

        {/* Modal de Seguir Trader */}
        <SeguirTraderModal 
          isOpen={showSeguirModal}
          onClose={() => {
            setShowSeguirModal(false);
            setSelectedTraderForCopy(null);
            setSelectedAccountForCopy(null);
          }}
          trader={selectedTraderForCopy}
          selectedAccount={selectedAccountForCopy}
          onConfirm={(formData) => {
            console.log('Copiar trader confirmado desde trader profile:', formData);
            console.log('Cuenta seleccionada:', selectedAccountForCopy);
            
            // Marcar el trader como copiado
            if (selectedTraderForCopy) {
              setCopiedTraders(prev => new Set([...prev, selectedTraderForCopy.id]));
            }
            
            setShowSeguirModal(false);
            setSelectedTraderForCopy(null);
            setSelectedAccountForCopy(null);
          }}
        />

        {/* Modal de Comentarios y Puntuación */}
        <CommentsRatingModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          trader={selectedTrader}
          onSubmit={handleSubmitComment}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
      <p className="text-gray-400">Vista no encontrada</p>
      
      {/* Modal de Selección de Cuenta */}
      <AccountSelectionModal
        isOpen={showAccountSelectionModal}
        onClose={() => {
          setShowAccountSelectionModal(false);
          setSelectedTraderForCopy(null);
          setSelectedAccountForCopy(null);
        }}
        trader={selectedTraderForCopy}
        onAccountSelected={handleAccountSelected}
      />

      {/* Modal de Seguir Trader */}
      <SeguirTraderModal 
        isOpen={showSeguirModal}
        onClose={() => {
          setShowSeguirModal(false);
          setSelectedTraderForCopy(null);
          setSelectedAccountForCopy(null);
        }}
        trader={selectedTraderForCopy}
        selectedAccount={selectedAccountForCopy}
        onConfirm={(formData) => {
          console.log('Copiar trader confirmado desde inversor:', formData);
          console.log('Cuenta seleccionada:', selectedAccountForCopy);
          // Aquí integrarías con tu API para copiar al trader
          
          // Marcar el trader como copiado
          if (selectedTraderForCopy) {
            setCopiedTraders(prev => new Set([...prev, selectedTraderForCopy.id]));
          }
          
          setShowSeguirModal(false);
          setSelectedTraderForCopy(null);
          setSelectedAccountForCopy(null);
        }}
      />

      {/* Modal de Comentarios y Puntuación */}
      <CommentsRatingModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        trader={selectedTraderForCopy}
        onSubmit={handleSubmitComment}
      />
    </div>
  );
};

export default Inversor;