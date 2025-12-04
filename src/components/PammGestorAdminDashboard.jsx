import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, DollarSign, TrendingUp, TrendingDown, Users, Award, Activity, Eye, Settings, Plus, MoreHorizontal, Loader2, RefreshCw, Briefcase, Percent, Zap, AlertTriangle, BarChart2 } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

// Mini sparkline chart component (from EnhancedPAMMCard)
const PerformanceSparkline = ({ data, color = '#22d3ee' }) => {
  const chartData = data || generateSamplePerformanceData();

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gestorGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              backgroundColor: '#191919',
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value) => [`${value.toFixed(1)}%`, 'Return']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gestorGradient-${color.replace('#', '')})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Generate sample performance data
const generateSamplePerformanceData = () => {
  const data = [];
  let value = 0;
  for (let i = 0; i < 30; i++) {
    value = value + (Math.random() - 0.4) * 3;
    data.push({ day: i + 1, value: value });
  }
  return data;
};

// Calculate aggregated performance from all funds
const calculateAggregatedPerformance = (funds) => {
  if (!funds || funds.length === 0) return [];

  // Filter funds with valid performance data
  const fundsWithData = funds.filter(fund => fund.performanceHistory && fund.performanceHistory.length > 0);

  if (fundsWithData.length === 0) return [];

  // Get the maximum length of performance data
  const maxLength = Math.max(...fundsWithData.map(fund => fund.performanceHistory.length));

  // Aggregate performance data weighted by AUM
  const aggregated = [];
  for (let i = 0; i < maxLength; i++) {
    let totalWeightedValue = 0;
    let totalWeight = 0;

    fundsWithData.forEach(fund => {
      if (fund.performanceHistory[i]) {
        const weight = fund.aum || 1; // Use AUM as weight, default to 1
        totalWeightedValue += fund.performanceHistory[i].value * weight;
        totalWeight += weight;
      }
    });

    if (totalWeight > 0) {
      aggregated.push({
        day: i + 1,
        value: totalWeightedValue / totalWeight
      });
    }
  }

  return aggregated;
};

// Circular progress indicator for returns
const ReturnCircle = ({ percentage, size = 'normal' }) => {
  const isPositive = percentage >= 0;
  const radius = size === 'large' ? 24 : size === 'small' ? 14 : 20;
  const circumference = 2 * Math.PI * radius;
  const displayPercentage = Math.min(Math.abs(percentage), 100);
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference;
  const dimensions = size === 'large' ? 'w-14 h-14' : size === 'small' ? 'w-8 h-8' : 'w-12 h-12';
  const cx = size === 'large' ? 28 : size === 'small' ? 16 : 24;
  const cy = size === 'large' ? 28 : size === 'small' ? 16 : 24;
  const strokeWidth = size === 'small' ? 2 : 4;
  const textSize = size === 'small' ? 'text-[8px]' : 'text-xs';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className={`transform -rotate-90 ${dimensions}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#333"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className={`absolute ${textSize} font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{percentage.toFixed(0)}%
      </span>
    </div>
  );
};

// KPI Badge component
const KpiBadge = ({ icon: Icon, label, value, color = 'cyan' }) => {
  const colorClasses = {
    cyan: 'text-cyan-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400'
  };
  const textColor = colorClasses[color] || colorClasses.cyan;

  return (
    <div className="flex flex-col items-center p-2 bg-[#232323]/50 rounded-lg backdrop-blur-sm border border-[#333]/50 hover:border-[#444] transition-all duration-300 hover:scale-105">
      <div className={`flex items-center gap-1 ${textColor} mb-1`}>
        <Icon size={12} />
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
      </div>
      <span className={`text-sm font-bold ${textColor}`}>{value}</span>
    </div>
  );
};

// Risk indicator component
const RiskIndicator = ({ level }) => {
  const levels = {
    'Bajo': { bgColor: 'bg-green-500', textColor: 'text-green-400', bars: 1 },
    'Moderado': { bgColor: 'bg-yellow-500', textColor: 'text-yellow-400', bars: 2 },
    'Medio-Alto': { bgColor: 'bg-orange-500', textColor: 'text-orange-400', bars: 3 },
    'Alto': { bgColor: 'bg-red-500', textColor: 'text-red-400', bars: 4 }
  };

  const config = levels[level] || levels['Moderado'];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-full transition-all duration-300 ${
              bar <= config.bars ? config.bgColor : 'bg-[#333]'
            }`}
            style={{ height: `${bar * 3 + 4}px` }}
          />
        ))}
      </div>
      <span className={`text-xs ${config.textColor}`}>{level}</span>
    </div>
  );
};

import CrearPAMMModal from './CrearPAMMModal';
import CopiarEstrategiaModal from './CopiarEstrategiaModal';
import InvestorActionsMenu from './InvestorActionsMenu';
import { getManagerStats, getFundActivities, getFundWithdrawals } from '../services/pammService';
import PAMMWithdrawalApprovalModal from './PAMMWithdrawalApprovalModal';
import { scrollToTopManual } from '../hooks/useScrollToTop';
import { getPerformanceSparklineData } from '../services/accountHistory';

// Datos iniciales vacíos - se cargarán dinámicamente desde la API
const initialPAMMGestorData = {
  totalCapital: 0,
  rendimiento: 0,
  numeroInversores: 0,
  comisionesGeneradas: 0,
  drawdownMaximo: 0,
  sharpeRatio: 0,
  nombreFondo: "",
  tipoEstrategia: "",
  managementFee: 0,
  performanceFee: 0,
  lockupPeriod: 0,
  mercadosOperados: [],
  rendimientoMensual: [],
  operacionesExitosas: 0,
  operacionesTotales: 0,
  winRate: 0,
  volumenOperado: 0,
  tiempoPromedioOperacion: "N/A",
  pairesOperados: [],
  inversores: [],
  tradersDisponibles: []
};

// Enhanced StatCard with gradients, hover effects, and sparklines
const EnhancedStatCard = ({ icon, title, value, detail, color = 'cyan', trend, sparklineData }) => {
  const Icon = icon;
  const [isHovered, setIsHovered] = useState(false);

  const colorConfig = {
    cyan: {
      gradient: 'from-cyan-500/10 to-blue-500/10',
      border: 'border-cyan-500/30',
      icon: 'text-cyan-400',
      glow: 'shadow-cyan-500/20'
    },
    green: {
      gradient: 'from-green-500/10 to-emerald-500/10',
      border: 'border-green-500/30',
      icon: 'text-green-400',
      glow: 'shadow-green-500/20'
    },
    blue: {
      gradient: 'from-blue-500/10 to-indigo-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-400',
      glow: 'shadow-blue-500/20'
    },
    yellow: {
      gradient: 'from-yellow-500/10 to-orange-500/10',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-400',
      glow: 'shadow-yellow-500/20'
    },
    purple: {
      gradient: 'from-purple-500/10 to-pink-500/10',
      border: 'border-purple-500/30',
      icon: 'text-purple-400',
      glow: 'shadow-purple-500/20'
    },
    red: {
      gradient: 'from-red-500/10 to-rose-500/10',
      border: 'border-red-500/30',
      icon: 'text-red-400',
      glow: 'shadow-red-500/20'
    }
  };

  const config = colorConfig[color] || colorConfig.cyan;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${config.gradient} p-6 rounded-2xl border ${config.border} flex flex-col justify-between transition-all duration-300 ${
        isHovered ? `transform scale-[1.02] shadow-lg ${config.glow}` : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background glow effect */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${config.gradient} rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-gray-400 uppercase tracking-wider">{title}</h3>
          <div className={`p-2 rounded-lg bg-[#191919]/50 ${config.icon}`}>
            <Icon size={20} />
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {detail && (
            <div className="flex items-center gap-2">
              {trend !== undefined && (
                <span className={`flex items-center text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(trend)}%
                </span>
              )}
              <p className="text-sm text-gray-500">{detail}</p>
            </div>
          )}
        </div>

        {/* Mini sparkline */}
        {sparklineData && (
          <div className="mt-3">
            <PerformanceSparkline data={sparklineData} color={config.icon.includes('cyan') ? '#22d3ee' : config.icon.includes('green') ? '#22c55e' : '#a78bfa'} />
          </div>
        )}
      </div>
    </div>
  );
};

// Keep the original StatCard for backward compatibility
const StatCard = ({ icon, title, value, detail }) => {
  return <EnhancedStatCard icon={icon} title={title} value={value} detail={detail} />;
};

const PammGestorAdminDashboard = ({ setSelectedOption, navigationParams, setNavigationParams, scrollContainerRef }) => {
  const { t } = useTranslation('pamm');
  const [view, setView] = useState('dashboard'); // dashboard, investorDetail
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [gestorData, setGestorData] = useState(initialPAMMGestorData);
  const [investors, setInvestors] = useState([]);
  const [tradersDisponibles, setTradersDisponibles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCrearFondoModal, setShowCrearFondoModal] = useState(false);
  const [showCopiarEstrategiaModal, setShowCopiarEstrategiaModal] = useState(false);
  const [showFundConfigModal, setShowFundConfigModal] = useState(false);
  const [selectedFundForConfig, setSelectedFundForConfig] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fundDetails, setFundDetails] = useState(null);
  const [loadingFundDetails, setLoadingFundDetails] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedInvestorForMessage, setSelectedInvestorForMessage] = useState(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [aggregatedPerformance, setAggregatedPerformance] = useState([]);

  const data = gestorData;

  // Cargar datos del gestor PAMM desde la API
  useEffect(() => {
    const fetchGestorData = async () => {
      try {
        console.log('[PammGestorAdmin] Fetching manager stats...');
        setIsLoading(true);
        setError(null);
        // ✅ ACTIVADO: Cargar datos REALES desde la API
        const { getManagerStats } = await import('../services/pammService');
        const response = await getManagerStats();

        console.log('[PammGestorAdmin] Manager stats response:', response);

        if (response && response.overview) {
          // Mapear la respuesta del backend al formato del frontend
          const investors = response.investors || [];
          const traders = response.funds || [];

          console.log('[PammGestorAdmin] Funds found:', traders.length);
          console.log('[PammGestorAdmin] Investors found:', investors.length);

          // Actualizar gestorData con datos reales del overview
          setGestorData({
            totalCapital: response.overview.total_aum || 0,
            rendimiento: response.overview.total_return_percentage || 0,
            numeroInversores: response.overview.total_investors || 0,
            comisionesGeneradas: response.overview.monthly_commissions || response.overview.total_commissions || 0,
            drawdownMaximo: response.overview.max_drawdown || 0,
            sharpeRatio: response.overview.sharpe_ratio || 0,
            // Nuevas métricas desde account_metrics_mv
            winRate: response.overview.win_rate || 0,
            totalTrades: response.overview.total_trades || 0,
            profitFactor: response.overview.profit_factor || 0,
            managerPnL: response.overview.manager_performance || 0,
            dataSource: response.overview.data_source || 'unavailable'
          });

          // Actualizar estado con datos reales
          setInvestors(investors);

          // Fetch performance history for all manager's funds
          if (traders.length > 0) {
            const performancePromises = traders.map(async (fund) => {
              const mt5Account = fund.manager_mt5_account_id ||
                                fund.manager_mt5_account ||
                                fund.mt5_account_id;

              if (!mt5Account) return { ...fund, performanceHistory: null };

              try {
                const performanceData = await getPerformanceSparklineData(mt5Account, 30);
                return { ...fund, performanceHistory: performanceData };
              } catch (error) {
                console.warn(`[PammGestorAdmin] Could not load performance for account ${mt5Account}:`, error);
                return { ...fund, performanceHistory: null };
              }
            });

            const tradersWithPerformance = await Promise.all(performancePromises);
            setTradersDisponibles(tradersWithPerformance);

            // Calculate aggregated performance data from all funds
            const aggregated = calculateAggregatedPerformance(tradersWithPerformance);
            setAggregatedPerformance(aggregated);

            // Cargar solicitudes de retiro pendientes para todos los fondos
            loadPendingWithdrawals(tradersWithPerformance);
          } else {
            setTradersDisponibles(traders);
          }
        }
      } catch (error) {
        console.error('[PammGestorAdmin] Error loading PAMM gestor data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGestorData();
  }, [refreshTrigger]);

  // Cargar solicitudes de retiro pendientes
  const loadPendingWithdrawals = async (funds) => {
    try {
      setLoadingWithdrawals(true);
      const allWithdrawals = [];
      
      for (const fund of funds) {
        const response = await getFundWithdrawals(fund.id, 'pending');
        if (response.success && response.withdrawals) {
          allWithdrawals.push(...response.withdrawals);
        }
      }
      
      setPendingWithdrawals(allWithdrawals);
    } catch (error) {
      console.error('[PammGestorAdmin] Error loading withdrawals:', error);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  // Efecto para hacer scroll hacia arriba cuando cambie la vista
  useEffect(() => {
    scrollToTopManual(scrollContainerRef);
  }, [view, selectedInvestor]);

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

  const handleConfigureContract = () => {
    console.log('Opening contract configuration modal');
    setShowCrearFondoModal(true);
  };

  const handleManageFund = async (fund) => {
    console.log('[PammGestorAdmin] Loading fund details for:', fund.id);
    setLoadingFundDetails(true);
    setLoadingActivities(true);
    setSelectedInvestor(fund);
    setView('fundDetail');
    
    try {
      const { getManagerFundDetails } = await import('../services/pammService');
      const details = await getManagerFundDetails(fund.id);
      console.log('[PammGestorAdmin] Fund details loaded:', details);
      setFundDetails(details);
      
      // Cargar actividades
      try {
        const activitiesResponse = await getFundActivities(fund.id, 10);
        if (activitiesResponse.success) {
          setActivities(activitiesResponse.activities);
        }
      } catch (actError) {
        console.error('[PammGestorAdmin] Error loading activities (endpoint may not be deployed yet):', actError);
        setActivities([]);
      }
    } catch (error) {
      console.error('[PammGestorAdmin] Error loading fund details:', error);
      setFundDetails(null);
      setActivities([]);
    } finally {
      setLoadingFundDetails(false);
      setLoadingActivities(false);
    }
  };

  const handleConfigureFund = (fund) => {
    console.log('Configuring individual fund:', fund);
    setSelectedFundForConfig(fund);
    setShowFundConfigModal(true);
    // Force the modal to appear on top by ensuring other modals are closed
    setShowCrearFondoModal(false);
    setShowCopiarEstrategiaModal(false);
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedInvestor(null);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFundCreated = () => {
    // Trigger refresh after fund creation
    setRefreshTrigger(prev => prev + 1);
  };

  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = searchTerm === '' || 
      investor.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || 
      investor.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Dynamic accounts data from PAMM manager dashboard API
  // Use tradersDisponibles which is populated from response.funds
  const accountsData = tradersDisponibles || [];
  
  console.log('[PammGestorAdmin] Rendering with accountsData:', accountsData.length, 'funds');

  if (view === 'fundDetail' && selectedInvestor) {
    // Use real fund details if available, otherwise use basic fund data
    const fund = fundDetails || selectedInvestor;
    const isLoading = loadingFundDetails;
    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white border border-[#333] rounded-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="p-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors"
            >
              <ArrowUp className="rotate-[-90deg]" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">{fund.name}</h1>
              <p className="text-gray-400">{t('pamm.manager.fundDetail.title')}</p>
            </div>
          </div>
          <button
            onClick={() => handleConfigureFund(fund)}
            className="flex items-center gap-2 bg-[#0F7490] hover:bg-[#0A5A72] text-white py-2 px-4 rounded-lg transition-colors"
          >
            <Settings size={16} />
            {t('pamm.manager.fundDetail.configure')}
          </button>
        </div>

        {/* Fund Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#2a2a2a] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">AUM</span>
              <DollarSign className="text-cyan-500" size={16} />
            </div>
            <div className="text-xl font-bold">{formatCurrency(fund.current_aum || fund.aum || 0)}</div>
          </div>
          
          <div className="bg-[#2a2a2a] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t('pamm.manager.fundDetail.totalReturn')}</span>
              <TrendingUp className="text-green-500" size={16} />
            </div>
            <div className="text-xl font-bold text-green-500">{formatPercentage(fund.total_return_percentage || 0)}</div>
          </div>
          
          <div className="bg-[#2a2a2a] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t('pamm.manager.fundDetail.investors')}</span>
              <Users className="text-blue-500" size={16} />
            </div>
            <div className="text-xl font-bold">{fund.total_investors || fund.investors_count || 0}</div>
          </div>
          
          <div className="bg-[#2a2a2a] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t('pamm.manager.fundDetail.successRate')}</span>
              <Award className="text-yellow-500" size={16} />
            </div>
            <div className="text-xl font-bold">{(parseFloat(fund.win_rate) || 0).toFixed(1)}%</div>
          </div>
        </div>

        {/* Fund Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">{t('pamm.manager.fundDetail.fundInformation')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.strategy')}</span>
                <span className="font-medium">{fund.strategy || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.riskLevel')}</span>
                <span className={`font-medium ${
                  fund.risk_level === 'Alto' ? 'text-red-400' :
                  fund.risk_level === 'Medio' ? 'text-yellow-400' : 'text-green-400'
                }`}>{fund.risk_level || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.maxDrawdown')}</span>
                <span className="font-medium text-red-400">{(parseFloat(fund.max_drawdown) || 0).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.sharpeRatio')}</span>
                <span className="font-medium">{(parseFloat(fund.sharpe_ratio) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.totalTrades')}</span>
                <span className="font-medium">{fund.total_trades || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.creationDate')}</span>
                <span className="font-medium">{fund.created_at ? new Date(fund.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.tradedVolume')}</span>
                <span className="font-medium">{formatCurrency(fund.traded_volume || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.successfulTrades')}</span>
                <span className="font-medium">{fund.successful_trades || 0}/{fund.total_trades || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">{t('pamm.manager.fundDetail.commissionConfiguration')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.managementFee')}</span>
                <span className="font-medium">{(parseFloat(fund.management_fee) || 0).toFixed(2)}% {t('pamm.manager.fundDetail.annual')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.performanceFee')}</span>
                <span className="font-medium">{(parseFloat(fund.performance_fee) || 0).toFixed(2)}% {t('pamm.manager.fundDetail.profits')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.lockupPeriod')}</span>
                <span className="font-medium">{fund.lockup_period || 0} {t('pamm.manager.fundDetail.days')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.minInvestment')}</span>
                <span className="font-medium">{formatCurrency(fund.min_investment || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.maxInvestment')}</span>
                <span className="font-medium">{formatCurrency(fund.max_investment || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.highWaterMark')}</span>
                <span className="font-medium text-green-400">{t('pamm.manager.fundDetail.active')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.paymentFrequency')}</span>
                <span className="font-medium">{t('pamm.manager.fundDetail.monthly')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('pamm.manager.fundDetail.nextClosure')}</span>
                <span className="font-medium">{fund.next_closure ? new Date(fund.next_closure).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Investors List - Enhanced */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] p-6 rounded-xl border border-[#333]/50">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="text-cyan-400" size={20} />
              {t('pamm.manager.fundDetail.fundInvestors')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#333]/50">
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="pb-3">{t('pamm.manager.fundDetail.investor')}</th>
                    <th className="pb-3">{t('pamm.manager.fundDetail.investment')}</th>
                    <th className="pb-3">{t('pamm.manager.fundDetail.gain')}</th>
                    <th className="pb-3">{t('pamm.manager.fundDetail.performance')}</th>
                    <th className="pb-3">{t('pamm.manager.fundDetail.entryDate')}</th>
                    <th className="pb-3">{t('pamm.manager.fundDetail.status')}</th>
                    <th className="pb-3">{t('pamm.manager.fundDetail.actions')}</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-[#333]">
                {isLoading ? (
                  // Skeleton loader
                  [...Array(3)].map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-700 rounded"></div>
                            <div className="h-3 w-24 bg-gray-700 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3"><div className="h-4 w-20 bg-gray-700 rounded"></div></td>
                      <td className="py-3"><div className="h-4 w-20 bg-gray-700 rounded"></div></td>
                      <td className="py-3"><div className="h-4 w-16 bg-gray-700 rounded"></div></td>
                      <td className="py-3"><div className="h-4 w-24 bg-gray-700 rounded"></div></td>
                      <td className="py-3"><div className="h-6 w-16 bg-gray-700 rounded-full"></div></td>
                      <td className="py-3"><div className="h-6 w-6 bg-gray-700 rounded"></div></td>
                    </tr>
                  ))
                ) : (fund.investors || []).length > 0 ? (
                  (fund.investors || []).map((investor) => (
                    <tr key={investor.id} className="hover:bg-[#333]/50 transition-all duration-300 group">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {investor.avatar ? (
                            <img
                              src={investor.avatar}
                              alt={investor.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500/30 group-hover:border-cyan-500 transition-colors"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold group-hover:scale-110 transition-transform">
                              {investor.name?.charAt(0)?.toUpperCase() || 'I'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{investor.name}</p>
                            {investor.email && <p className="text-xs text-gray-500">{investor.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-medium">{formatCurrency(investor.invested_amount)}</td>
                      <td className={`py-3 font-medium flex items-center gap-1 ${investor.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {investor.profit_loss >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {formatCurrency(investor.profit_loss)}
                      </td>
                      <td className="py-3">
                        <ReturnCircle percentage={investor.profit_loss_percentage || 0} size="small" />
                      </td>
                      <td className="py-3 text-gray-400 text-sm">{new Date(investor.joined_date).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                          investor.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 group-hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${investor.status === 'active' ? 'bg-green-400' : 'bg-gray-400'}`} />
                          {investor.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3">
                        <InvestorActionsMenu
                          investor={investor}
                          onSendMessage={(inv) => setSelectedInvestorForMessage(inv)}
                          onViewDetails={(inv) => console.log('View details:', inv)}
                          onRequestWithdrawal={(inv) => {
                            setSelectedInvestorForWithdrawal(inv);
                            setShowWithdrawalModal(true);
                          }}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-400">
                      <Users className="mx-auto mb-2 text-gray-500" size={32} />
                      <p>No hay inversores en este fondo aún</p>
                      <p className="text-sm mt-1">Los inversores aparecerán aquí cuando se unan al fondo</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">{t('pamm.manager.fundDetail.monthlyPerformance')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(fund.monthly_performance || []).map((item) => ({
                  mes: new Date(item.month).toLocaleDateString('es', { month: 'short' }),
                  rendimiento: item.return
                }))}>
                  <defs>
                    <linearGradient id="colorRendimiento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F7490" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0F7490" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mes" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    formatter={(value) => [`${parseFloat(value).toFixed(2)}%`, t('pamm.manager.fundDetail.performance')]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rendimiento" 
                    stroke="#0F7490" 
                    fillOpacity={1} 
                    fill="url(#colorRendimiento)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">{t('pamm.manager.fundDetail.marketDistribution')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(fund.market_distribution || []).map((market, idx) => ({
                      name: market.name,
                      value: market.percentage,
                      color: ['#0F7490', '#FFB800', '#10B981', '#8B5CF6'][idx % 4]
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(fund.market_distribution || []).map((market, index) => (
                      <Cell key={`cell-${index}`} fill={['#0F7490', '#FFB800', '#10B981', '#8B5CF6'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Activity & Messaging System */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="text-cyan-500" size={20} />
              Actividad Reciente
            </h3>
            <div className="space-y-3">
              {loadingActivities ? (
                [...Array(3)].map((_, idx) => (
                  <div key={idx} className="animate-pulse flex items-center gap-3 p-3 bg-[#333] rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-gray-700 rounded"></div>
                      <div className="h-3 w-24 bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-4 w-16 bg-gray-700 rounded"></div>
                  </div>
                ))
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              ) : (
                activities.map((activity) => {
                  const getActivityIcon = (type) => {
                    switch (type) {
                      case 'investment': return '💰';
                      case 'withdrawal': return '💸';
                      case 'partial_withdrawal': return '📤';
                      case 'commission_charged': return '💵';
                      case 'fund_created': return '🎉';
                      case 'performance_update': return '📈';
                      default: return '📋';
                    }
                  };

                  const getActivityColor = (type) => {
                    switch (type) {
                      case 'investment': return 'text-green-400';
                      case 'withdrawal': return 'text-red-400';
                      case 'commission_charged': return 'text-cyan-400';
                      case 'fund_created': return 'text-yellow-400';
                      case 'performance_update': return 'text-blue-400';
                      default: return 'text-gray-400';
                    }
                  };

                  return (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-[#333] rounded-lg hover:bg-[#3a3a3a] transition-colors">
                      <div className="flex-shrink-0">
                        {activity.user_avatar ? (
                          <img 
                            src={activity.user_avatar} 
                            alt={activity.user_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xl">
                            {getActivityIcon(activity.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.description}</p>
                        <p className="text-xs text-gray-400">{activity.user_name} • {activity.time_ago}</p>
                      </div>
                      {activity.amount && (
                        <div className={`text-sm font-semibold ${getActivityColor(activity.type)}`}>
                          {activity.amount > 0 ? '+' : ''}{formatCurrency(activity.amount)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'investorDetail') {
    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white border border-[#333] rounded-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="p-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors"
            >
              <ArrowUp className="rotate-[-90deg]" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">Mis Inversores</h1>
              <p className="text-gray-400">Gestiona los inversores de tus fondos PAMM</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar inversores..."
              className="w-full p-3 bg-[#191919] border border-[#333] rounded-lg text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 bg-[#191919] border border-[#333] rounded-lg text-white"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Pausado">Pausado</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {/* All Investors Table - Enhanced */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-[#333]">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10">
            <div className="p-4 border-b border-[#333]/50">
              <div className="flex items-center gap-2">
                <Users className="text-purple-400" size={20} />
                <h3 className="text-lg font-semibold">Todos los Inversores</h3>
              </div>
              <p className="text-sm text-gray-400 mt-1">Gestiona todos los inversores de tus fondos PAMM</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#191919]/50 border-b border-[#333]/50">
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4">Inversor</th>
                    <th className="p-4">Fondo</th>
                    <th className="p-4">Inversión</th>
                    <th className="p-4">Ganancia</th>
                    <th className="p-4">Rendimiento</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]/30">
                  {filteredInvestors.map((investor, index) => {
                    // Assign fund based on investor ID for demonstration
                    const assignedFund = accountsData[index % accountsData.length];
                    const isPositive = investor.gananciaActual >= 0;

                    return (
                      <tr
                        key={investor.id}
                        className="hover:bg-[#333]/50 transition-all duration-300 group cursor-pointer"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform duration-300">
                              {investor.nombre?.charAt(0)?.toUpperCase() || 'I'}
                            </div>
                            <div>
                              <div className="font-medium text-white">{investor.nombre}</div>
                              <div className="text-xs text-gray-500">{investor.email || 'inversor@email.com'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm text-gray-400">{assignedFund?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-white">{formatCurrency(investor.montoInvertido)}</div>
                        </td>
                        <td className="p-4">
                          <div className={`font-medium flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {formatCurrency(investor.gananciaActual)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <ReturnCircle percentage={investor.rendimientoPersonal || 0} size="small" />
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                            investor.estado === 'Activo'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30 group-hover:bg-green-500/30'
                              : investor.estado === 'Pausado'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 group-hover:bg-yellow-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 group-hover:bg-gray-500/30'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              investor.estado === 'Activo' ? 'bg-green-400' :
                              investor.estado === 'Pausado' ? 'bg-yellow-400' : 'bg-gray-400'
                            }`} />
                            {investor.estado}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-400">
                            {new Date(investor.fechaEntrada).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[#232323] text-white border border-[#333] rounded-3xl space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">{t('pamm.manager.dashboard')}</h1>
          <p className="text-sm md:text-base text-gray-400">
            {t('pamm.manager.description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 bg-[#2a2a2a] hover:bg-[#333] text-gray-400 hover:text-white rounded-lg transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Actualizar datos"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCrearFondoModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-5 rounded-lg hover:opacity-90 transition"
          >
            <Plus size={18} />
            {t('pamm.manager.createFund')}
          </button>
        </div>
      </div>

      {/* Pending Withdrawals Alert */}
      {pendingWithdrawals.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <DollarSign className="text-yellow-400" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-yellow-400 font-semibold mb-1">
                {pendingWithdrawals.length} Solicitud{pendingWithdrawals.length > 1 ? 'es' : ''} de Retiro Pendiente{pendingWithdrawals.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                Tienes solicitudes de retiro que requieren tu aprobación.
              </p>
              <div className="space-y-2">
                {pendingWithdrawals.slice(0, 3).map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between bg-[#2a2a2a] p-3 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {withdrawal.investor_profile?.display_name || withdrawal.investor_profile?.email || 'Inversor'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {withdrawal.withdrawal_type === 'full' ? 'Retiro Total' : 'Retiro Parcial'} • {formatCurrency(withdrawal.requested_amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedWithdrawal(withdrawal);
                        setShowWithdrawalModal(true);
                      }}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Revisar
                    </button>
                  </div>
                ))}
                {pendingWithdrawals.length > 3 && (
                  <p className="text-xs text-gray-400 text-center pt-2">
                    +{pendingWithdrawals.length - 3} más
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Section - Enhanced with glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] p-6 rounded-2xl border border-[#333]">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity className="text-cyan-400" size={24} />
            {t('pamm.manager.portfolio')}
          </h2>

          {/* Enhanced KPIs with sparklines */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <EnhancedStatCard
              icon={DollarSign}
              title={t('pamm.manager.totalAUM')}
              value={formatCurrency(data.totalCapital)}
              color="cyan"
              sparklineData={aggregatedPerformance}
            />

            <EnhancedStatCard
              icon={TrendingUp}
              title={t('pamm.manager.performance')}
              value={formatPercentage(data.rendimiento)}
              color="green"
              sparklineData={aggregatedPerformance}
            />

            <EnhancedStatCard
              icon={Users}
              title={t('pamm.manager.fundDetail.investors')}
              value={data.numeroInversores}
              color="blue"
            />

            <EnhancedStatCard
              icon={Award}
              title={t('pamm.manager.commissions')}
              value={formatCurrency(data.comisionesGeneradas)}
              color="yellow"
            />
          </div>

          {/* Additional KPIs row - Métricas Reales */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <KpiBadge
              icon={Percent}
              label="Win Rate"
              value={`${(data.winRate || 0).toFixed(1)}%`}
              color="green"
            />
            <KpiBadge
              icon={BarChart2}
              label="Trades"
              value={data.totalTrades || 0}
              color="cyan"
            />
            <KpiBadge
              icon={Zap}
              label="Profit Factor"
              value={(data.profitFactor || 0).toFixed(2)}
              color="purple"
            />
            <KpiBadge
              icon={TrendingDown}
              label="Max Drawdown"
              value={`${(data.drawdownMaximo || 0).toFixed(1)}%`}
              color="red"
            />
            <KpiBadge
              icon={Briefcase}
              label="Fondos Activos"
              value={tradersDisponibles.length}
              color="blue"
            />
            <KpiBadge
              icon={Activity}
              label="Retiros Pend."
              value={pendingWithdrawals.length}
              color="yellow"
            />
          </div>
        </div>
      </div>

      {/* Mis Fondos PAMM Section */}
      <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-[#333]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{t('pamm.manager.myFunds')}</h2>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#333] p-6 rounded-xl border border-[#444] animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-5 bg-[#444] rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-[#444] rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-16 bg-[#444] rounded-full"></div>
                </div>
                <div className="space-y-3 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-4 bg-[#444] rounded w-1/3"></div>
                      <div className="h-4 bg-[#444] rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
                <div className="h-10 bg-[#444] rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 bg-opacity-10 rounded-full mb-4">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Error al cargar fondos</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-[#333] hover:bg-[#444] text-white py-2 px-4 rounded-lg transition-colors mx-auto"
            >
              <RefreshCw size={16} />
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && accountsData.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full mb-6">
              <Briefcase className="text-purple-400" size={40} />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">No tienes fondos PAMM</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Crea tu primer fondo PAMM para comenzar a gestionar capital de inversores y generar comisiones por tu experiencia en trading.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Comisiones de gestión</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Comisiones de rendimiento</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Control total</span>
              </div>
            </div>
            <button
              onClick={() => setShowCrearFondoModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-6 rounded-lg hover:opacity-90 transition mx-auto text-base font-medium"
            >
              <Plus size={20} />
              Crear mi primer fondo PAMM
            </button>
          </div>
        )}

        {/* Funds Grid - Enhanced with EnhancedPAMMCard style */}
        {!isLoading && !error && accountsData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {accountsData.map((account) => {
              const totalReturn = account.total_return_percentage || 0;
              const chartColor = totalReturn >= 0 ? '#22c55e' : '#ef4444';

              return (
                <div
                  key={account.id}
                  className="relative overflow-hidden rounded-2xl transition-all duration-500 hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 group"
                >
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] opacity-50" />
                  <div className="absolute inset-0 backdrop-blur-xl bg-[#191919]/80" />

                  {/* Animated border gradient on hover */}
                  <div className="absolute inset-0 rounded-2xl transition-opacity duration-500 opacity-0 group-hover:opacity-100">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 animate-pulse" />
                  </div>

                  {/* Content */}
                  <div className="relative p-5 border border-[#333]/50 rounded-2xl">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg font-bold">
                          {(account.name || 'F').charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Users size={12} className="text-gray-500" />
                            <span className="text-xs text-gray-400">
                              {account.investors_count || 0} inversores
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        account.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {account.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Performance Chart */}
                    <div className="mb-4 bg-[#232323]/30 rounded-xl p-3 border border-[#333]/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Activity size={10} />
                          Rendimiento Total
                        </span>
                        <span className={`text-sm font-bold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercentage(totalReturn)}
                        </span>
                      </div>
                      <PerformanceSparkline data={account.performanceHistory || []} color={chartColor} />
                    </div>

                    {/* KPIs Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="flex flex-col items-center p-2 bg-[#232323]/50 rounded-lg">
                        <div className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg border border-purple-500/30">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">AUM</p>
                          <p className="text-sm font-bold text-purple-400">${((account.aum || 0)/1000).toFixed(0)}K</p>
                        </div>
                      </div>

                      <KpiBadge
                        icon={Percent}
                        label="Mgmt Fee"
                        value={`${(parseFloat(account.management_fee) || 0).toFixed(1)}%`}
                        color="cyan"
                      />

                      <KpiBadge
                        icon={Award}
                        label="Perf Fee"
                        value={`${(parseFloat(account.performance_fee) || 0).toFixed(1)}%`}
                        color="yellow"
                      />

                      <KpiBadge
                        icon={DollarSign}
                        label="Comisiones"
                        value={`$${((account.monthly_commissions || 0)/1000).toFixed(1)}K`}
                        color="green"
                      />
                    </div>

                    {/* Additional info row */}
                    <div className="flex justify-between items-center mb-4 px-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} className="text-gray-500" />
                          <span className="text-xs text-gray-400">Min: {formatCurrency(account.min_investment || 0)}</span>
                        </div>
                        <RiskIndicator level={account.risk_level || 'Moderado'} />
                      </div>
                      <span className="text-xs text-gray-500">
                        {account.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManageFund(account)}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-500/25"
                      >
                        <Eye size={16} />
                        {t('pamm.manager.manageFund')}
                      </button>

                      <button
                        onClick={() => handleConfigureFund(account)}
                        className="px-4 py-2.5 bg-[#333]/50 hover:bg-[#444]/50 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 border border-[#444]/50 hover:border-[#555]"
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Modal de Crear/Configurar Fondo PAMM */}
      <CrearPAMMModal
        isOpen={showCrearFondoModal}
        onClose={() => setShowCrearFondoModal(false)}
        mode="create"
        onFundCreated={handleFundCreated}
        onConfirm={(formData) => {
          console.log('[PammGestorAdmin] Fondo PAMM creado:', formData);
          setShowCrearFondoModal(false);
        }}
      />

      {/* Modal de Aprobación de Retiros */}
      {showWithdrawalModal && selectedWithdrawal && (
        <PAMMWithdrawalApprovalModal
          withdrawal={selectedWithdrawal}
          onClose={() => {
            setShowWithdrawalModal(false);
            setSelectedWithdrawal(null);
          }}
          onApproved={async () => {
            setShowWithdrawalModal(false);
            setSelectedWithdrawal(null);
            
            // Recargar TODOS los datos del gestor (incluyendo AUM actualizado)
            try {
              const { getManagerStats } = await import('../services/pammService');
              const response = await getManagerStats();
              
              if (response && response.overview) {
                const investors = response.investors || [];
                const traders = response.funds || [];
                
                setInvestors(investors);
                setTradersDisponibles(traders);
                
                // Recargar solicitudes de retiro
                if (traders.length > 0) {
                  loadPendingWithdrawals(traders);
                }
              }
            } catch (error) {
              console.error('[PammGestorAdmin] Error reloading data after approval:', error);
            }
          }}
          onRejected={async () => {
            setShowWithdrawalModal(false);
            setSelectedWithdrawal(null);
            
            // Recargar solicitudes de retiro
            if (tradersDisponibles.length > 0) {
              loadPendingWithdrawals(tradersDisponibles);
            }
          }}
        />
      )}

      {/* Modal de Copiar Estrategia */}
      <CopiarEstrategiaModal 
        isOpen={showCopiarEstrategiaModal}
        onClose={() => setShowCopiarEstrategiaModal(false)}
        onConfirm={(formData) => {
          console.log('Estrategia copiada:', formData);
          // Aquí integrarías con tu API para copiar la estrategia
        }}
      />

      {/* Modal de Configuración de Fondo Individual */}
      {showFundConfigModal && (
        <CrearPAMMModal 
          isOpen={showFundConfigModal}
          onClose={() => {
            setShowFundConfigModal(false);
            setSelectedFundForConfig(null);
          }}
          mode="configure"
          fundData={selectedFundForConfig}
          onConfirm={(formData) => {
            console.log('Configuración de fondo actualizada:', formData);
            // Aquí integrarías con tu API para actualizar la configuración del fondo
            setShowFundConfigModal(false);
            setSelectedFundForConfig(null);
          }}
        />
      )}
    </div>
  );
};

export default PammGestorAdminDashboard; 