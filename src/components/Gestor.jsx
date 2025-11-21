import React, { useState, useEffect } from 'react';
import { Star, Users, DollarSign, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Eye, Settings, BarChart3, Activity, Award, Calendar, Copy, MoreHorizontal, Edit, Camera, Save, X, Info, Shield, Target, Briefcase, Search, Filter, SlidersHorizontal, Pause, StopCircle, MessageCircle, UserCheck, Percent, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import { getFollowers, getTraderStats, updateMasterProfile } from '../services/copytradingService';
import ConfigurarGestorModal from './ConfigurarGestorModal';
import { scrollToTopManual } from '../hooks/useScrollToTop';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

// Mini sparkline chart component for performance visualization
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

// Circular progress indicator for percentages
const ReturnCircle = ({ percentage, size = 'normal' }) => {
  const isPositive = percentage >= 0;
  const radius = size === 'large' ? 24 : 18;
  const circumference = 2 * Math.PI * radius;
  const displayPercentage = Math.min(Math.abs(percentage), 100);
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference;
  const dimensions = size === 'large' ? 'w-14 h-14' : 'w-10 h-10';
  const cx = size === 'large' ? 28 : 20;
  const cy = size === 'large' ? 28 : 20;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className={`transform -rotate-90 ${dimensions}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#333"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className={`absolute text-[10px] font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{percentage.toFixed(0)}%
      </span>
    </div>
  );
};

// KPI Badge component with hover effects
const KpiBadge = ({ icon: Icon, label, value, color = 'cyan', trend }) => {
  const colorClasses = {
    cyan: 'text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60',
    blue: 'text-blue-400 border-blue-500/30 hover:border-blue-500/60',
    green: 'text-green-400 border-green-500/30 hover:border-green-500/60',
    red: 'text-red-400 border-red-500/30 hover:border-red-500/60',
    yellow: 'text-yellow-400 border-yellow-500/30 hover:border-yellow-500/60',
    purple: 'text-purple-400 border-purple-500/30 hover:border-purple-500/60'
  };
  const textColor = colorClasses[color] || colorClasses.cyan;

  return (
    <div className={`flex flex-col items-center p-3 bg-[#232323]/50 rounded-xl backdrop-blur-sm border ${textColor} transition-all duration-300 hover:scale-105 hover:bg-[#2a2a2a]/70`}>
      <div className={`flex items-center gap-1 mb-1`}>
        <Icon size={14} className={textColor.split(' ')[0]} />
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
      </div>
      <span className={`text-sm font-bold ${textColor.split(' ')[0]}`}>{value}</span>
      {trend && (
        <span className={`text-[10px] ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  );
};

// Risk indicator component with visual bars
const RiskIndicator = ({ level, showLabel = true }) => {
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
      {showLabel && <span className={`text-xs ${config.textColor}`}>{level}</span>}
    </div>
  );
};

// Enhanced stat card component
const EnhancedStatCard = ({ icon: Icon, iconColor, iconBg, title, value, subtitle, trend, sparklineData, sparklineColor }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-[#1C1C1C] rounded-xl border border-[#333] p-5 transition-all duration-300 ${
        isHovered ? 'transform scale-[1.02] border-cyan-600/50 shadow-lg shadow-cyan-500/10' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center transition-transform duration-300 ${
            isHovered ? 'scale-110' : ''
          }`}>
            <Icon size={24} className={iconColor} />
          </div>
          {trend !== undefined && (
            trend >= 0 ? (
              <TrendingUp size={20} className="text-green-400" />
            ) : (
              <TrendingDown size={20} className="text-red-400" />
            )
          )}
        </div>

        <h3 className={`text-2xl font-bold mb-1 ${
          trend !== undefined ? (trend >= 0 ? 'text-white' : 'text-red-400') : 'text-white'
        }`}>
          {value}
        </h3>
        <p className="text-sm text-gray-400">{title}</p>

        {subtitle && (
          <div className="mt-2 text-xs text-gray-500">
            {subtitle}
          </div>
        )}

        {sparklineData && (
          <div className="mt-3">
            <PerformanceSparkline data={sparklineData} color={sparklineColor || '#22d3ee'} />
          </div>
        )}
      </div>
    </div>
  );
};

// Datos iniciales vacíos - se cargarán dinámicamente desde la API
const initialTraderDashboardData = {
  overview: {
    totalAUM: 0,
    monthlyReturn: 0,
    totalFollowers: 0,
    activeFollowers: 0,
    totalCommissions: 0,
    monthlyCommissions: 0,
    riskScore: 0,
    maxDrawdown: 0
  },
  performanceChart: [],
  topInvestors: [],
  recentTrades: [],
  followerDistribution: []
};

const Gestor = ({ setSelectedOption, navigationParams, setNavigationParams, scrollContainerRef }) => {
  const { t } = useTranslation('copytrading');
  const [view, setView] = useState('dashboard'); // dashboard, myInvestors, profileEdit
  const [investors, setInvestors] = useState([]);
  const [traderStats, setTraderStats] = useState(initialTraderDashboardData);
  const [masterConfig, setMasterConfig] = useState(null); // Configuración de Master Trader
  const [isMasterTrader, setIsMasterTrader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfigurarModal, setShowConfigurarModal] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('1M');
  
  // Profile Edit states
  const [profileData, setProfileData] = useState({
    displayName: 'Maestro FX Pro',
    bio: 'Trader profesional especializado en estrategias de scalping en EUR/USD con más de 5 años de experiencia en mercados forex.',
    strategy: 'Scalping EUR/USD',
    riskLevel: 'Moderado',
    minInvestment: 1000,
    maxInvestment: 50000,
    commissionRate: 20,
    isPublic: true,
    allowCopying: true,
    avatar: '/trader-avatar.png',
    tradingExperience: '5+ años',
    specializations: ['Forex', 'Scalping', 'Technical Analysis'],
    timeZone: 'GMT-3 (Buenos Aires)',
    tradingHours: '09:00 - 17:00'
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Efecto para hacer scroll hacia arriba cuando cambie la vista
  useEffect(() => {
    scrollToTopManual(scrollContainerRef);
  }, [view]);
  
  // My Investors states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, paused, inactive
  const [sortBy, setSortBy] = useState('investment'); // investment, performance, date
  const [showInvestorActions, setShowInvestorActions] = useState({});

  // Función para cargar datos del trader (extraída para poder reutilizarla)
  const fetchTraderData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[Gestor] Fetching trader data...');

      // Cargar estadísticas del trader y seguidores en paralelo
      const [statsData, followersData] = await Promise.all([
        getTraderStats().catch(() => null),
        getFollowers().catch(() => [])
      ]);

      console.log('[Gestor] Stats data received:', statsData);
      console.log('[Gestor] Followers data received:', followersData);

        // Actualizar estadísticas del trader
        if (statsData) {
          console.log('[Gestor] Checking if user is master trader...', {
            hasStatsData: !!statsData,
            hasMasterConfig: !!statsData.master_config,
            hasMasterTrader: !!statsData.master_trader,
            hasOverview: !!statsData.overview,
            isConfigured: statsData.is_configured
          });

          // Verificar si realmente está configurado como master trader
          // Prioridad: 1) is_configured explícito, 2) presencia de master_trader o master_config
          let isMaster = false;

          if (statsData.is_configured !== undefined) {
            // Backend nuevo: usa el campo explícito
            isMaster = statsData.is_configured === true;
          } else {
            // Fallback para backend viejo: verifica presencia de config
            isMaster = !!(statsData.master_trader || statsData.master_config);
          }

          setIsMasterTrader(isMaster);

          console.log('[Gestor] User is master trader:', isMaster);

          setTraderStats({
            overview: {
              totalAUM: statsData.overview?.total_aum || 0,
              monthlyReturn: statsData.overview?.monthly_return || 0,
              totalFollowers: statsData.overview?.total_followers || 0,
              activeFollowers: statsData.overview?.active_followers || 0,
              totalCommissions: statsData.overview?.total_commissions || 0,
              monthlyCommissions: statsData.overview?.monthly_commissions || 0,
              riskScore: statsData.overview?.risk_score || 0,
              maxDrawdown: statsData.overview?.max_drawdown || 0
            },
            performanceChart: statsData.performance_chart || [],
            topInvestors: statsData.followers_list || [],
            recentTrades: statsData.recent_trades || [],
            followerDistribution: statsData.follower_distribution || []
          });

          // Extraer la configuración del Master Trader si está disponible
          if (statsData.master_config) {
            console.log('[Gestor] Master config found:', statsData.master_config);
            setMasterConfig(statsData.master_config);

            // Cargar datos del perfil desde master_config
            console.log('[Gestor] Loading profile data from master_config');
            setProfileData({
              displayName: statsData.master_config.display_name || statsData.master_config.strategy_name || 'Master Trader',
              bio: statsData.master_config.bio || statsData.master_config.description || '',
              strategy: statsData.master_config.strategy || statsData.master_config.strategy_name || '',
              riskLevel: statsData.master_config.risk_level || 'Moderado',
              minInvestment: statsData.master_config.min_investment || statsData.master_config.min_capital || 1000,
              maxInvestment: statsData.master_config.max_investment || 50000,
              commissionRate: statsData.master_config.commission_rate || statsData.master_config.commission_rate || 20,
              isPublic: statsData.master_config.is_public !== undefined ? statsData.master_config.is_public : true,
              allowCopying: statsData.master_config.allow_copying !== undefined ? statsData.master_config.allow_copying : true,
              avatar: '/trader-avatar.png',
              tradingExperience: statsData.master_config.trading_experience || statsData.master_config.experience_level || '5+ años',
              specializations: Array.isArray(statsData.master_config.specializations) ? statsData.master_config.specializations : ['Forex', 'Scalping', 'Technical Analysis'],
              timeZone: statsData.master_config.time_zone || 'GMT-3 (Buenos Aires)',
              tradingHours: statsData.master_config.trading_hours || '09:00 - 17:00'
            });
          } else {
            console.log('[Gestor] No master config in response');
          }

          // Usar la lista de inversores del API si está disponible
          if (statsData.followers_list && Array.isArray(statsData.followers_list)) {
            setInvestors(statsData.followers_list);
          } else if (Array.isArray(followersData)) {
            // Formatear datos de seguidores tradicionales
            const formattedInvestors = followersData.map(follower => ({
              id: follower.id,
              name: follower.follower?.name || follower.follower?.username || 'Inversor sin nombre',
              avatar: follower.follower?.photo_url || '/investor1.png',
              email: follower.follower?.email || '',
              investedAmount: follower.invested_amount || 0,
              monthlyPnL: follower.monthly_pnl || 0,
              monthlyPnLPercentage: follower.monthly_pnl_percentage || 0,
              totalPnL: follower.total_pnl || 0,
              totalPnLPercentage: follower.total_pnl_percentage || 0,
              copyPercentage: (follower.risk_ratio || 1) * 100,
              startDate: follower.created_at || new Date().toISOString(),
              lastActivity: follower.updated_at || follower.created_at || new Date().toISOString(),
              status: follower.status || 'active'
            }));

            setInvestors(formattedInvestors);
          }
      } else {
        console.log('[Gestor] No stats data received, user is not a master trader');
        setIsMasterTrader(false);
      }

    } catch (err) {
      console.error('[Gestor] Error loading trader data:', err);
      setError('No se pudieron cargar los datos.');
      setIsMasterTrader(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchTraderData();
  }, []);

  const handleCreateCopy = () => {
    setShowConfigurarModal(true);
  };

  const handleEditProfile = () => {
    setView('profileEdit');
  };

  const handleViewMyInvestors = () => {
    setView('myInvestors');
  };

  const handleViewAccountInfo = (accountId) => {
    console.log('Viewing account info for:', accountId);
    setView('myInvestors');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
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

  const handleProfileInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setProfileErrors({});

    // Validaciones básicas
    const errors = {};
    if (!profileData.displayName.trim()) {
      errors.displayName = t('copyTrading.errors.nameRequired') || 'El nombre es requerido';
    }
    if (!profileData.bio.trim()) {
      errors.bio = t('copyTrading.errors.bioRequired') || 'La biografía es requerida';
    }
    if (profileData.bio.length < 30) {
      errors.bio = t('copyTrading.errors.bioMinLength') || 'La biografía debe tener al menos 30 caracteres';
    }
    if (profileData.minInvestment >= profileData.maxInvestment) {
      errors.minInvestment = t('copyTrading.errors.minInvestmentLessThanMax') || 'La inversión mínima debe ser menor que la máxima';
    }
    if (profileData.commissionRate < 0 || profileData.commissionRate > 50) {
      errors.commissionRate = t('copyTrading.errors.commissionRange') || 'La comisión debe estar entre 0% y 50%';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      setIsSaving(false);
      toast.error(t('copyTrading.errors.fixValidationErrors') || 'Por favor corrige los errores');
      return;
    }

    try {
      console.log('[Gestor] Saving profile data...');
      const response = await updateMasterProfile(profileData);
      console.log('[Gestor] Profile saved successfully:', response);

      toast.success(t('copyTrading.manager.profileUpdatedSuccessfully') || 'Perfil actualizado exitosamente');

      // Refrescar datos del trader
      await fetchTraderData();

      // Volver al dashboard
      setView('dashboard');
    } catch (error) {
      console.error('[Gestor] Error guardando perfil:', error);
      toast.error(error.error || t('copyTrading.errors.saveError') || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSpecialization = (spec) => {
    if (!profileData.specializations.includes(spec)) {
      setProfileData(prev => ({
        ...prev,
        specializations: [...prev.specializations, spec]
      }));
    }
  };

  const handleRemoveSpecialization = (spec) => {
    setProfileData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== spec)
    }));
  };

  // Get all investors data dynamically
  const allInvestors = traderStats.topInvestors || [];

  const toggleInvestorActions = (investorId) => {
    setShowInvestorActions(prev => ({
      ...prev,
      [investorId]: !prev[investorId]
    }));
  };

  const handleInvestorAction = (action, investor) => {
    console.log(`Acción ${action} para inversor:`, investor.name);
    setShowInvestorActions({});
    // Aquí iría la lógica real para cada acción
  };

  const getFilteredInvestors = () => {
    let filtered = allInvestors;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(investor => 
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(investor => investor.status === statusFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'investment':
          return b.investedAmount - a.investedAmount;
        case 'performance':
          return b.totalPnLPercentage - a.totalPnLPercentage;
        case 'date':
          return new Date(b.startDate) - new Date(a.startDate);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400';
      case 'inactive': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return t('copyTrading.status.active');
      case 'paused': return t('copyTrading.status.paused');
      case 'inactive': return t('copyTrading.status.inactive');
      default: return status;
    }
  };

  // Dashboard View
  if (view === 'dashboard') {
    // Skeleton Loading State
    if (isLoading) {
      return (
        <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="h-8 bg-[#333] rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-[#333] rounded w-96 animate-pulse"></div>
              </div>
              <div className="h-12 bg-[#333] rounded-xl w-48 animate-pulse"></div>
            </div>
          </div>

          {/* Portfolio Skeleton */}
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-8 animate-pulse">
            <div className="h-6 bg-[#333] rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-[#333] rounded-xl"></div>
                    <div className="w-5 h-5 bg-[#333] rounded"></div>
                  </div>
                  <div className="h-8 bg-[#333] rounded w-32 mb-1"></div>
                  <div className="h-4 bg-[#333] rounded w-24 mb-2"></div>
                  <div className="h-3 bg-[#333] rounded w-28"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Accounts Skeleton */}
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-8 animate-pulse">
            <div className="h-6 bg-[#333] rounded w-48 mb-6"></div>
            <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#333] rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 bg-[#333] rounded w-48 mb-2"></div>
                  <div className="h-4 bg-[#333] rounded w-32"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="h-3 bg-[#333] rounded w-20 mb-2"></div>
                    <div className="h-6 bg-[#333] rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">{t('copyTrading.manager.dashboard')}</h1>
              <p className="text-gray-400">{t('copyTrading.manager.manageAccountsAndPerformance')}</p>
            </div>
            <button
              onClick={handleCreateCopy}
              className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-6 rounded-xl hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
            >
              <Settings size={20} />
              {t('copyTrading.manager.createCopyTrading')}
            </button>
          </div>
        </div>

        {/* Portafolio Section - DATOS DINÁMICOS con mejoras visuales */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-cyan-400">{t('copyTrading.manager.portfolio')}</h2>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-gray-500" />
              <span className="text-xs text-gray-500">Live</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Capital de Terceros (AUM) - Enhanced */}
            <EnhancedStatCard
              icon={Users}
              iconColor="text-cyan-400"
              iconBg="bg-cyan-500/20"
              title={t('copyTrading.manager.thirdPartyCapital')}
              value={formatAUM(traderStats.overview.totalAUM)}
              subtitle={<><span className="text-cyan-400">{traderStats.overview.activeFollowers} {t('copyTrading.manager.investors')}</span> {t('copyTrading.status.active')}</>}
              trend={traderStats.overview.monthlyReturn}
              sparklineData={traderStats.performanceChart?.slice(-30)}
              sparklineColor="#22d3ee"
            />

            {/* Retorno Mensual - Enhanced con círculo de progreso */}
            <div className="relative overflow-hidden bg-[#1C1C1C] rounded-xl border border-[#333] p-5 transition-all duration-300 hover:scale-[1.02] hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-500/10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <TrendingUp size={24} className="text-blue-400" />
                  </div>
                  <ReturnCircle percentage={traderStats.overview.monthlyReturn} size="large" />
                </div>
                <h3 className={`text-2xl font-bold mb-1 ${traderStats.overview.monthlyReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(traderStats.overview.monthlyReturn)}
                </h3>
                <p className="text-sm text-gray-400">{t('copyTrading.manager.monthlyReturn')}</p>
                <div className="mt-3">
                  <PerformanceSparkline
                    data={traderStats.performanceChart?.slice(-30)}
                    color={traderStats.overview.monthlyReturn >= 0 ? '#22c55e' : '#ef4444'}
                  />
                </div>
              </div>
            </div>

            {/* Comisiones Totales - Enhanced */}
            <EnhancedStatCard
              icon={DollarSign}
              iconColor="text-green-400"
              iconBg="bg-green-500/20"
              title={t('copyTrading.manager.totalCommissions')}
              value={formatCurrency(traderStats.overview.totalCommissions)}
              subtitle={<><span className="text-green-400">{formatCurrency(traderStats.overview.monthlyCommissions)}</span> {t('copyTrading.time.thisMonth')}</>}
              trend={1}
            />
          </div>

          {/* KPI Badges adicionales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <KpiBadge
              icon={Percent}
              label="Win Rate"
              value={`${(traderStats.overview.riskScore * 10 || 75).toFixed(0)}%`}
              color="green"
            />
            <KpiBadge
              icon={TrendingDown}
              label="Max DD"
              value={`${traderStats.overview.maxDrawdown || 0}%`}
              color="red"
            />
            <KpiBadge
              icon={Users}
              label="Seguidores"
              value={traderStats.overview.totalFollowers || 0}
              color="cyan"
            />
            <KpiBadge
              icon={Zap}
              label="Riesgo"
              value={traderStats.overview.riskScore || 'N/A'}
              color="yellow"
            />
          </div>
        </div>

        {/* Mis Cuentas Copy Trading - DATOS DINÁMICOS */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-cyan-400">{t('copyTrading.manager.myCopyTradingAccounts')}</h2>

          {isMasterTrader && masterConfig ? (
            <div className="space-y-4">
              {/* Cuenta Master Configurada - Enhanced con glassmorphism y hover effects */}
              <div className="relative overflow-hidden bg-[#1C1C1C] rounded-xl border border-[#333] p-6 transition-all duration-500 hover:border-cyan-600/50 hover:shadow-lg hover:shadow-cyan-500/10 group">
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Animated border gradient */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10" />
                </div>

                <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar mejorado con glow effect */}
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-transform duration-300 group-hover:scale-110">
                        <Award size={28} className="text-white" />
                      </div>
                      {traderStats.overview.activeFollowers > 0 && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1C1C1C] animate-pulse" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white text-xl">{masterConfig.strategy_name || 'Estrategia de Trading'}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                          traderStats.overview.activeFollowers > 0
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm shadow-green-500/20'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {traderStats.overview.activeFollowers > 0 ? t('copyTrading.status.active') : t('copyTrading.status.inactive')}
                        </span>
                      </div>

                      <p className="text-sm text-gray-400 mb-3">
                        {t('copyTrading.manager.created')}: {new Date(masterConfig.created_at).toLocaleDateString()}
                        <span className="mx-2">|</span>
                        MT5: <span className="text-cyan-400 font-medium">#{masterConfig.master_mt5_account}</span>
                      </p>

                      {/* KPI Grid mejorado */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-[#232323]/80 backdrop-blur-sm p-3 rounded-lg border border-[#333]/50 hover:border-cyan-500/30 transition-all duration-300">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">AUM</p>
                          <p className="text-cyan-400 font-bold">{formatAUM(traderStats.overview.totalAUM)}</p>
                        </div>
                        <div className="bg-[#232323]/80 backdrop-blur-sm p-3 rounded-lg border border-[#333]/50 hover:border-purple-500/30 transition-all duration-300">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('copyTrading.manager.investors')}</p>
                          <p className="text-purple-400 font-bold">{traderStats.overview.activeFollowers}</p>
                        </div>
                        <div className="bg-[#232323]/80 backdrop-blur-sm p-3 rounded-lg border border-[#333]/50 hover:border-green-500/30 transition-all duration-300">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Comisión</p>
                          <p className="text-green-400 font-bold">{masterConfig.commission_rate}%</p>
                        </div>
                        <div className="bg-[#232323]/80 backdrop-blur-sm p-3 rounded-lg border border-[#333]/50 hover:border-yellow-500/30 transition-all duration-300">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Max DD</p>
                          <p className="text-yellow-400 font-bold">{masterConfig.max_drawdown}%</p>
                        </div>
                      </div>

                      {/* Markets con badges mejorados */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {masterConfig.markets && masterConfig.markets.map((market, idx) => (
                          <span key={idx} className="text-xs px-3 py-1.5 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-400 rounded-lg border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 hover:scale-105">
                            {market}
                          </span>
                        ))}
                      </div>

                      {/* Risk Indicator visual */}
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">Nivel de Riesgo:</span>
                        <RiskIndicator level={masterConfig.risk_level || 'Moderado'} />
                      </div>
                    </div>
                  </div>

                  {/* Action buttons mejorados */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleViewMyInvestors()}
                      className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 justify-center shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105"
                    >
                      <Users size={16} />
                      Ver Seguidores
                    </button>
                    <button
                      onClick={handleEditProfile}
                      className="border border-[#444] hover:border-cyan-500/50 bg-[#232323]/50 hover:bg-[#2a2a2a] text-gray-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 justify-center hover:scale-105"
                    >
                      <Edit size={16} />
                      Editar Perfil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty state - Usuario aún no es Master Trader */
            <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-8 text-center">
              <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={32} className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('copyTrading.manager.noMasterAccountYet')}
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {t('copyTrading.manager.configureMasterDescription')}
              </p>
              <button
                onClick={handleCreateCopy}
                className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-6 rounded-xl hover:opacity-90 transition-opacity font-medium inline-flex items-center gap-2"
              >
                <Settings size={20} />
                {t('copyTrading.manager.becomeMasterTrader')}
              </button>
            </div>
          )}
        </div>





        {/* Modal de Configurar Gestor */}
        <ConfigurarGestorModal
          isOpen={showConfigurarModal}
          onClose={() => setShowConfigurarModal(false)}
          onConfirm={async (formData) => {
            console.log('[Gestor] Perfil de gestor configurado:', formData);
            setShowConfigurarModal(false);

            // Esperar un momento para que el backend procese la configuración
            console.log('[Gestor] Waiting 2 seconds before refreshing data...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Recargar los datos del trader para mostrar la cuenta master configurada
            console.log('[Gestor] Refreshing trader data after configuration...');
            await fetchTraderData();

            toast.success('Cuenta master configurada exitosamente');
          }}
        />
      </div>
    );
  }

  // My Investors View
  if (view === 'myInvestors') {
    const filteredInvestors = getFilteredInvestors();
    
    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
          >
            ← {t('copyTrading.navigation.backToDashboard')}
          </button>
          <h1 className="text-3xl font-semibold mb-2">{t('copyTrading.manager.myInvestors')}</h1>
          <p className="text-gray-400">{t('copyTrading.manager.manageAndMonitorInvestors')}</p>
        </div>

        {/* Stats Cards - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 hover:scale-[1.02] group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-cyan-400" />
                </div>
                <span className="text-cyan-400 font-medium text-sm">{t('copyTrading.stats.total')}</span>
              </div>
              <p className="text-3xl font-bold text-white">{allInvestors.length}</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 transition-all duration-300 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 hover:scale-[1.02] group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <UserCheck size={20} className="text-green-400" />
                </div>
                <span className="text-green-400 font-medium text-sm">{t('copyTrading.status.active')}</span>
              </div>
              <p className="text-3xl font-bold text-white">{allInvestors.filter(i => i.status === 'active').length}</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02] group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-purple-400" />
                </div>
                <span className="text-purple-400 font-medium text-sm">{t('copyTrading.stats.aum')}</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatAUM(allInvestors.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0))}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 transition-all duration-300 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 hover:scale-[1.02] group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-400" />
                </div>
                <span className="text-green-400 font-medium text-sm">{t('copyTrading.stats.avgPnL')}</span>
              </div>
              <p className="text-3xl font-bold text-green-400">
                {formatPercentage(
                  allInvestors.length > 0
                    ? allInvestors.reduce((sum, inv) => sum + (inv.totalPnLPercentage || 0), 0) / allInvestors.length
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t('copyTrading.search.searchInvestor')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-3 bg-[#191919] border border-[#333] rounded-lg text-white"
            >
              <option value="all">{t('copyTrading.filters.allStatuses')}</option>
              <option value="active">{t('copyTrading.status.active')}</option>
              <option value="paused">{t('copyTrading.status.paused')}</option>
              <option value="inactive">{t('copyTrading.status.inactive')}</option>
            </select>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-3 bg-[#191919] border border-[#333] rounded-lg text-white"
            >
              <option value="investment">{t('copyTrading.filters.byInvestment')}</option>
              <option value="performance">{t('copyTrading.filters.byPerformance')}</option>
              <option value="date">{t('copyTrading.filters.byDate')}</option>
            </select>
          </div>
        </div>

        {/* Investors Table */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1C1C1C] border-b border-[#333]">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">{t('copyTrading.manager.investor')}</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">{t('copyTrading.manager.investment')}</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">{t('copyTrading.stats.totalPnL')}</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">{t('copyTrading.stats.monthlyPnL')}</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">{t('copyTrading.manager.status')}</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">{t('copyTrading.manager.copy')}</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">{t('copyTrading.manager.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestors.map((investor) => (
                  <tr key={investor.id} className="border-b border-[#333]/50 hover:bg-[#1C1C1C]/70 transition-all duration-300 group">
                    {/* Investor Info - Enhanced */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-md shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-110">
                            <span className="text-white font-semibold text-sm">{(investor.name || 'I').charAt(0)}</span>
                          </div>
                          {investor.status === 'active' && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1C1C1C]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-cyan-400 transition-colors duration-300">{investor.name}</p>
                          <p className="text-sm text-gray-400">{investor.email}</p>
                          <p className="text-xs text-gray-500">{t('copyTrading.manager.since')} {investor.startDate}</p>
                        </div>
                      </div>
                    </td>

                    {/* Investment Amount - Enhanced */}
                    <td className="py-4 px-6">
                      <p className="font-semibold text-white">{formatCurrency(investor.investedAmount)}</p>
                    </td>

                    {/* Total P&L - Enhanced con ReturnCircle */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <ReturnCircle percentage={investor.totalPnLPercentage || 0} />
                        <div>
                          <p className={`font-semibold ${investor.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(investor.totalPnL)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Monthly P&L - Enhanced */}
                    <td className="py-4 px-6">
                      <div>
                        <p className={`font-semibold ${investor.monthlyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(investor.monthlyPnL)}
                        </p>
                        <p className={`text-xs ${investor.monthlyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ({formatPercentage(investor.monthlyPnLPercentage)})
                        </p>
                      </div>
                    </td>

                    {/* Status - Enhanced con badge mejorado */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                        investor.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm shadow-green-500/10'
                          : investor.status === 'paused'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-sm shadow-yellow-500/10'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          investor.status === 'active' ? 'bg-green-400 animate-pulse' :
                          investor.status === 'paused' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`} />
                        {getStatusLabel(investor.status)}
                      </span>
                    </td>

                    {/* Copy Percentage - Enhanced con gradiente */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-[#333] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 ease-out"
                            style={{ width: `${investor.copyPercentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-white font-medium">{investor.copyPercentage || 0}%</span>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="relative">
                        <button
                          onClick={() => toggleInvestorActions(investor.id)}
                          className="p-2 hover:bg-[#333] rounded-lg transition-colors"
                        >
                          <MoreHorizontal size={16} className="text-gray-400" />
                        </button>
                        
                        {showInvestorActions[investor.id] && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-[#2a2a2a] border border-[#333] rounded-lg shadow-lg z-10">
                            <button 
                              onClick={() => handleInvestorAction('view', investor)}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333] flex items-center gap-2"
                            >
                              <Eye size={14} />
                              {t('copyTrading.actions.viewDetails')}
                            </button>
                            <button 
                              onClick={() => handleInvestorAction('message', investor)}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333] flex items-center gap-2"
                            >
                              <MessageCircle size={14} />
                              {t('copyTrading.actions.sendMessage')}
                            </button>
                            {investor.status === 'active' ? (
                              <button 
                                onClick={() => handleInvestorAction('pause', investor)}
                                className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-[#333] flex items-center gap-2"
                              >
                                <Pause size={14} />
                                {t('copyTrading.actions.pauseCopy')}
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleInvestorAction('activate', investor)}
                                className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-[#333] flex items-center gap-2"
                              >
                                <UserCheck size={14} />
                                {t('copyTrading.actions.activateCopy')}
                              </button>
                            )}
                            <button 
                              onClick={() => handleInvestorAction('stop', investor)}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#333] flex items-center gap-2 border-t border-[#333]"
                            >
                              <StopCircle size={14} />
                              {t('copyTrading.actions.stopCopy')}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredInvestors.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-medium mb-2">{t('copyTrading.manager.noInvestorsFound')}</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? t('copyTrading.manager.tryAdjustingFilters') 
                  : t('copyTrading.manager.noInvestorsYet')
                }
              </p>
            </div>
          )}
        </div>
        
        {/* Results Summary */}
        {filteredInvestors.length > 0 && (
          <div className="mt-6 text-center text-gray-400">
            {t('copyTrading.manager.showingInvestors', { filtered: filteredInvestors.length, total: allInvestors.length })}
          </div>
        )}
      </div>
    );
  }

  // Profile Edit View
  if (view === 'profileEdit') {
    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
          >
            ← {t('copyTrading.navigation.backToDashboard')}
          </button>
          <h1 className="text-3xl font-semibold mb-2">{t('copyTrading.manager.editTraderProfile')}</h1>
          <p className="text-gray-400">{t('copyTrading.manager.configureHowInvestorsSeeYou')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information - Enhanced */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 transition-all duration-300 hover:border-[#444]">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-full blur-2xl" />

              <h2 className="relative text-xl font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Info size={18} className="text-cyan-400" />
                </div>
                {t('copyTrading.manager.information')}
              </h2>
              
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{(profileData.displayName || 'M').charAt(0)}</span>
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center hover:bg-cyan-700 transition-colors">
                      <Camera size={16} className="text-white" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">{t('copyTrading.manager.profilePhoto')}</h3>
                    <p className="text-sm text-gray-400 mb-2">{t('copyTrading.manager.professionalImage400x400')}</p>
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm">{t('copyTrading.manager.changeImage')}</button>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t('copyTrading.manager.name')} *</label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => handleProfileInputChange('displayName', e.target.value)}
                    className={`w-full bg-[#1C1C1C] border ${profileErrors.displayName ? 'border-red-500' : 'border-[#333]'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500`}
                    placeholder={t('copyTrading.manager.namePlaceholder')}
                  />
                  {profileErrors.displayName && <p className="text-red-500 text-xs mt-1">{profileErrors.displayName}</p>}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t('copyTrading.manager.bio')} *</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleProfileInputChange('bio', e.target.value)}
                    className={`w-full bg-[#1C1C1C] border ${profileErrors.bio ? 'border-red-500' : 'border-[#333]'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 h-24 resize-none`}
                    placeholder={t('copyTrading.manager.bioPlaceholder')}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {profileErrors.bio && <p className="text-red-500 text-xs">{profileErrors.bio}</p>}
                    <p className="text-gray-400 text-xs ml-auto">{profileData.bio.length}/500</p>
                  </div>
                </div>

                {/* Strategy & Risk Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">{t('copyTrading.manager.strategy')}</label>
                    <input
                      type="text"
                      value={profileData.strategy}
                      onChange={(e) => handleProfileInputChange('strategy', e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      placeholder={t('copyTrading.manager.strategyPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">{t('copyTrading.manager.risk')}</label>
                    <select
                      value={profileData.riskLevel}
                      onChange={(e) => handleProfileInputChange('riskLevel', e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Bajo">{t('copyTrading.risk.low')}</option>
                      <option value="Moderado">{t('copyTrading.risk.moderate')}</option>
                      <option value="Alto">{t('copyTrading.risk.high')}</option>
                    </select>
                  </div>
                </div>

                {/* Experience & Time Zone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">{t('copyTrading.manager.experience')}</label>
                    <select
                      value={profileData.tradingExperience}
                      onChange={(e) => handleProfileInputChange('tradingExperience', e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="1-2 años">{t('copyTrading.experience.oneToTwo')}</option>
                      <option value="3-5 años">{t('copyTrading.experience.threeToFive')}</option>
                      <option value="5+ años">{t('copyTrading.experience.fivePlus')}</option>
                      <option value="10+ años">{t('copyTrading.experience.tenPlus')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">{t('copyTrading.manager.timeZone')}</label>
                    <input
                      type="text"
                      value={profileData.timeZone}
                      onChange={(e) => handleProfileInputChange('timeZone', e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      placeholder={t('copyTrading.manager.timeZonePlaceholder')}
                    />
                  </div>
                </div>

                {/* Trading Hours */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t('copyTrading.manager.tradingHours')}</label>
                  <input
                    type="text"
                    value={profileData.tradingHours}
                    onChange={(e) => handleProfileInputChange('tradingHours', e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                    placeholder={t('copyTrading.manager.tradingHoursPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Investment Settings - Enhanced */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 transition-all duration-300 hover:border-[#444]">
              {/* Background decoration */}
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 rounded-full blur-2xl" />

              <h2 className="relative text-xl font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Target size={18} className="text-purple-400" />
                </div>
                {t('copyTrading.manager.configuration')}
              </h2>
              
              <div className="space-y-6">
                {/* Investment Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">{t('copyTrading.manager.minInvestment')} (USD)</label>
                    <input
                      type="number"
                      value={profileData.minInvestment}
                      onChange={(e) => handleProfileInputChange('minInvestment', Number(e.target.value))}
                      className={`w-full bg-[#1C1C1C] border ${profileErrors.minInvestment ? 'border-red-500' : 'border-[#333]'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500`}
                      min="100"
                    />
                    {profileErrors.minInvestment && <p className="text-red-500 text-xs mt-1">{profileErrors.minInvestment}</p>}
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">{t('copyTrading.manager.maxInvestment')} (USD)</label>
                    <input
                      type="number"
                      value={profileData.maxInvestment}
                      onChange={(e) => handleProfileInputChange('maxInvestment', Number(e.target.value))}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      min="1000"
                    />
                  </div>
                </div>

                {/* Commission Rate */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t('copyTrading.manager.commission')} (%)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={profileData.commissionRate}
                      onChange={(e) => handleProfileInputChange('commissionRate', Number(e.target.value))}
                      className={`flex-1 bg-[#1C1C1C] border ${profileErrors.commissionRate ? 'border-red-500' : 'border-[#333]'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500`}
                      min="0"
                      max="50"
                      step="0.1"
                    />
                    <span className="text-gray-400 text-sm">{t('copyTrading.manager.profitPercentage')}</span>
                  </div>
                  {profileErrors.commissionRate && <p className="text-red-500 text-xs mt-1">{profileErrors.commissionRate}</p>}
                  <p className="text-gray-400 text-xs mt-1">{t('copyTrading.manager.onlyChargeCommissionOnProfits')}</p>
                </div>
              </div>
            </div>

            {/* Specializations - Enhanced */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 transition-all duration-300 hover:border-[#444]">
              {/* Background decoration */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-500/5 to-cyan-500/5 rounded-full blur-2xl" />

              <h2 className="relative text-xl font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Briefcase size={18} className="text-green-400" />
                </div>
                {t('copyTrading.manager.specializations')}
              </h2>

              <div className="relative space-y-4">
                {/* Selected specializations */}
                <div className="flex flex-wrap gap-2">
                  {profileData.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-400 px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 transition-all duration-300 hover:scale-105"
                    >
                      {spec}
                      <button
                        onClick={() => handleRemoveSpecialization(spec)}
                        className="hover:text-red-400 transition-colors duration-200"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Available specializations */}
                <div className="flex flex-wrap gap-2">
                  {['Forex', 'Crypto', 'Stocks', 'Commodities', 'Scalping', 'Swing Trading', 'Day Trading', 'Technical Analysis', 'Fundamental Analysis'].filter(spec =>
                    !profileData.specializations.includes(spec)
                  ).map((spec) => (
                    <button
                      key={spec}
                      onClick={() => handleAddSpecialization(spec)}
                      className="bg-[#1C1C1C] border border-[#333] text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5 px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:scale-105"
                    >
                      + {spec}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Privacy Settings - Enhanced */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 transition-all duration-300 hover:border-[#444]">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-full blur-2xl" />

              <h3 className="relative text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                <div className="w-7 h-7 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Shield size={14} className="text-yellow-400" />
                </div>
                {t('copyTrading.manager.privacySettings')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{t('copyTrading.manager.publicProfile')}</p>
                    <p className="text-sm text-gray-400">{t('copyTrading.manager.othersCanSeeProfile')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.isPublic}
                      onChange={(e) => handleProfileInputChange('isPublic', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{t('copyTrading.manager.allowCopyTrading')}</p>
                    <p className="text-sm text-gray-400">{t('copyTrading.manager.investorsCanCopyTrades')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.allowCopying}
                      onChange={(e) => handleProfileInputChange('allowCopying', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Preview Card - Enhanced */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 transition-all duration-300 hover:border-[#444]">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">{t('copyTrading.manager.preview')}</h3>

              <div className="relative overflow-hidden bg-[#1C1C1C] rounded-xl border border-[#333] p-4 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <span className="text-white font-semibold">{(profileData.displayName || 'M').charAt(0)}</span>
                      </div>
                      {profileData.isPublic && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1C1C1C]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{profileData.displayName}</h3>
                      <p className="text-sm text-gray-400">{profileData.strategy}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{profileData.bio}</p>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('copyTrading.stats.riskLevel')}</span>
                      <RiskIndicator level={profileData.riskLevel} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('copyTrading.manager.minInvestmentShort')}</span>
                      <span className="text-cyan-400 font-medium">{formatCurrency(profileData.minInvestment)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('copyTrading.manager.commission')}</span>
                      <span className="text-green-400 font-medium">{profileData.commissionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Enhanced */}
            <div className="space-y-3">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white py-3 px-6 rounded-xl transition-all duration-300 font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02]"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('copyTrading.actions.saving')}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {t('copyTrading.actions.saveChanges')}
                  </>
                )}
              </button>

              <button
                onClick={handleBackToDashboard}
                className="w-full border border-[#444] bg-[#232323]/50 hover:bg-[#2a2a2a] text-gray-400 py-3 px-6 rounded-xl hover:text-white hover:border-gray-500 transition-all duration-300 font-medium hover:scale-[1.02]"
              >
                {t('copyTrading.actions.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
      <p className="text-gray-400">{t('copyTrading.errors.viewNotFound')}</p>
    </div>
  );
};

export default Gestor; 