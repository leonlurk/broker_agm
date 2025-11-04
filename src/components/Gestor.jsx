import React, { useState, useEffect } from 'react';
import { Star, Users, DollarSign, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Eye, Settings, BarChart3, Activity, Award, Calendar, Copy, MoreHorizontal, Edit, Camera, Save, X, Info, Shield, Target, Briefcase, Search, Filter, SlidersHorizontal, Pause, StopCircle, MessageCircle, UserCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import { getFollowers, getTraderStats, updateMasterProfile } from '../services/copytradingService';
import ConfigurarGestorModal from './ConfigurarGestorModal';
import { scrollToTopManual } from '../hooks/useScrollToTop';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

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

        {/* Portafolio Section - DATOS DINÁMICOS */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-cyan-400">{t('copyTrading.manager.portfolio')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Capital de Terceros (AUM) */}
            <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Users size={24} className="text-cyan-400" />
                </div>
                {traderStats.overview.monthlyReturn >= 0 ? (
                  <TrendingUp size={20} className="text-green-400" />
                ) : (
                  <TrendingDown size={20} className="text-red-400" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{formatAUM(traderStats.overview.totalAUM)}</h3>
              <p className="text-sm text-gray-400">{t('copyTrading.manager.thirdPartyCapital')}</p>
              <div className="mt-2 text-xs text-gray-500">
                <span className="text-cyan-400">{traderStats.overview.activeFollowers} {t('copyTrading.manager.investors')}</span> {t('copyTrading.status.active')}
              </div>
            </div>

            {/* Retorno Mensual */}
            <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp size={24} className="text-blue-400" />
                </div>
                {traderStats.overview.monthlyReturn >= 0 ? (
                  <ArrowUp size={20} className="text-green-400" />
                ) : (
                  <ArrowDown size={20} className="text-red-400" />
                )}
              </div>
              <h3 className={`text-2xl font-bold mb-1 ${traderStats.overview.monthlyReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(traderStats.overview.monthlyReturn)}
              </h3>
              <p className="text-sm text-gray-400">{t('copyTrading.manager.monthlyReturn')}</p>
              <div className="mt-2 text-xs text-gray-500">
                <span className="text-gray-400">{t('copyTrading.time.thisMonth')}</span>
              </div>
            </div>

            {/* Comisiones Totales */}
            <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign size={24} className="text-green-400" />
                </div>
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(traderStats.overview.totalCommissions)}</h3>
              <p className="text-sm text-gray-400">{t('copyTrading.manager.totalCommissions')}</p>
              <div className="mt-2 text-xs text-gray-500">
                <span className="text-green-400">{formatCurrency(traderStats.overview.monthlyCommissions)}</span> {t('copyTrading.time.thisMonth')}
              </div>
            </div>
          </div>
        </div>

        {/* Mis Cuentas Copy Trading - DATOS DINÁMICOS */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-cyan-400">{t('copyTrading.manager.myCopyTradingAccounts')}</h2>

          {isMasterTrader && masterConfig ? (
            <div className="space-y-4">
              {/* Cuenta Master Configurada */}
              <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6 hover:border-cyan-600/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-full flex items-center justify-center">
                      <Award size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{masterConfig.strategy_name || 'Estrategia de Trading'}</h3>
                      <p className="text-sm text-gray-400 mb-1">{t('copyTrading.manager.created')}: {new Date(masterConfig.created_at).toLocaleDateString()}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <span className="text-sm text-gray-400">
                          {t('copyTrading.stats.aum')}: <span className="text-white font-medium">{formatAUM(traderStats.overview.totalAUM)}</span>
                        </span>
                        <span className="text-sm text-gray-400">
                          {t('copyTrading.manager.investors')}: <span className="text-white font-medium">{traderStats.overview.activeFollowers}</span>
                        </span>
                        <span className="text-sm text-gray-400">
                          Cuenta MT5: <span className="text-cyan-400 font-medium">#{masterConfig.master_mt5_account}</span>
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          traderStats.overview.activeFollowers > 0
                            ? 'bg-green-500/20 text-green-400 border border-green-600/50'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-600/50'
                        }`}>
                          {traderStats.overview.activeFollowers > 0 ? t('copyTrading.status.active') : t('copyTrading.status.inactive')}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {masterConfig.markets && masterConfig.markets.map((market, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded">
                            {market}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="bg-[#232323] p-2 rounded">
                          <p className="text-gray-400">Comisión</p>
                          <p className="text-white font-medium">{masterConfig.commission_rate}%</p>
                        </div>
                        <div className="bg-[#232323] p-2 rounded">
                          <p className="text-gray-400">Riesgo Máx.</p>
                          <p className="text-white font-medium">{masterConfig.max_risk}%</p>
                        </div>
                        <div className="bg-[#232323] p-2 rounded">
                          <p className="text-gray-400">Drawdown Máx.</p>
                          <p className="text-white font-medium">{masterConfig.max_drawdown}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewMyInvestors()}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 justify-center"
                    >
                      <Users size={16} />
                      Ver Seguidores
                    </button>
                    <button
                      onClick={handleEditProfile}
                      className="border border-[#333] hover:border-cyan-600 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 justify-center"
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-cyan-400" />
              <span className="text-cyan-400 font-medium">{t('copyTrading.stats.total')}</span>
            </div>
            <p className="text-2xl font-bold text-white">{allInvestors.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck size={20} className="text-green-400" />
              <span className="text-green-400 font-medium">{t('copyTrading.status.active')}</span>
            </div>
            <p className="text-2xl font-bold text-white">{allInvestors.filter(i => i.status === 'active').length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={20} className="text-cyan-400" />
              <span className="text-cyan-400 font-medium">{t('copyTrading.stats.aum')}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatAUM(allInvestors.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0))}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} className="text-green-400" />
              <span className="text-green-400 font-medium">{t('copyTrading.stats.avgPnL')}</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {formatPercentage(
                allInvestors.length > 0 
                  ? allInvestors.reduce((sum, inv) => sum + (inv.totalPnLPercentage || 0), 0) / allInvestors.length
                  : 0
              )}
            </p>
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
                  <tr key={investor.id} className="border-b border-[#333]/50 hover:bg-[#1C1C1C]/50 transition-colors">
                    {/* Investor Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{investor.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{investor.name}</p>
                          <p className="text-sm text-gray-400">{investor.email}</p>
                          <p className="text-xs text-gray-500">{t('copyTrading.manager.since')} {investor.startDate}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Investment Amount */}
                    <td className="py-4 px-6">
                      <p className="font-semibold text-white">{formatCurrency(investor.investedAmount)}</p>
                    </td>
                    
                    {/* Total P&L */}
                    <td className="py-4 px-6">
                      <div>
                        <p className={`font-semibold ${investor.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(investor.totalPnL)}
                        </p>
                        <p className={`text-sm ${investor.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ({formatPercentage(investor.totalPnLPercentage)})
                        </p>
                      </div>
                    </td>
                    
                    {/* Monthly P&L */}
                    <td className="py-4 px-6">
                      <div>
                        <p className={`font-semibold ${investor.monthlyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(investor.monthlyPnL)}
                        </p>
                        <p className={`text-sm ${investor.monthlyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ({formatPercentage(investor.monthlyPnLPercentage)})
                        </p>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(investor.status)}`}>
                        {getStatusLabel(investor.status)}
                      </span>
                    </td>
                    
                    {/* Copy Percentage */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-[#333] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 transition-all duration-300"
                            style={{ width: `${investor.copyPercentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-white">{investor.copyPercentage || 0}%</span>
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
            {/* Basic Information */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
              <h2 className="text-xl font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                <Info size={20} />
                {t('copyTrading.manager.information')}
              </h2>
              
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{profileData.displayName.charAt(0)}</span>
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

            {/* Investment Settings */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
              <h2 className="text-xl font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                <Target size={20} />
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

            {/* Specializations */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
              <h2 className="text-xl font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                <Briefcase size={20} />
                {t('copyTrading.manager.specializations')}
              </h2>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {profileData.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="bg-cyan-600/20 text-cyan-400 px-3 py-1 rounded-lg text-sm flex items-center gap-2"
                    >
                      {spec}
                      <button
                        onClick={() => handleRemoveSpecialization(spec)}
                        className="hover:text-cyan-300"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['Forex', 'Crypto', 'Stocks', 'Commodities', 'Scalping', 'Swing Trading', 'Day Trading', 'Technical Analysis', 'Fundamental Analysis'].filter(spec => 
                    !profileData.specializations.includes(spec)
                  ).map((spec) => (
                    <button
                      key={spec}
                      onClick={() => handleAddSpecialization(spec)}
                      className="bg-[#1C1C1C] border border-[#333] text-gray-400 hover:text-white hover:border-cyan-500 px-3 py-1 rounded-lg text-sm transition-colors"
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
            {/* Privacy Settings */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                <Shield size={18} />
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

            {/* Preview Card */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">{t('copyTrading.manager.preview')}</h3>
              
              <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{profileData.displayName.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{profileData.displayName}</h3>
                    <p className="text-sm text-gray-400">{profileData.strategy}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">{profileData.bio}</p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('copyTrading.stats.riskLevel')}</span>
                    <span className={`font-medium ${
                      profileData.riskLevel === 'Bajo' ? 'text-green-400' : 
                      profileData.riskLevel === 'Moderado' ? 'text-yellow-400' : 'text-red-400'
                    }`}>{profileData.riskLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('copyTrading.manager.minInvestmentShort')}</span>
                    <span className="text-white">{formatCurrency(profileData.minInvestment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('copyTrading.manager.commission')}</span>
                    <span className="text-white">{profileData.commissionRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-6 rounded-xl hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2 disabled:opacity-50"
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
                className="w-full border border-[#333] text-gray-400 py-3 px-6 rounded-xl hover:text-white hover:border-gray-300 transition-colors font-medium"
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