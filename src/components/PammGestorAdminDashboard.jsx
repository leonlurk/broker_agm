import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, DollarSign, TrendingUp, Users, Award, Activity, MessageCircle, Eye, Settings, Plus, MoreHorizontal, Loader2, RefreshCw } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import CrearPAMMModal from './CrearPAMMModal';
import CopiarEstrategiaModal from './CopiarEstrategiaModal';
import PammMessagingPanel from './PammMessagingPanel';
import { getManagerStats, getFundActivities } from '../services/pammService';
import { scrollToTopManual } from '../hooks/useScrollToTop';

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

// Componente para una tarjeta de estadística individual
const StatCard = ({ icon, title, value, detail }) => {
  const Icon = icon;
  return (
    <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-[#333] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-gray-400">{title}</h3>
        <Icon className="text-cyan-500" size={24} />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {detail && <p className="text-sm text-gray-500 mt-1">{detail}</p>}
      </div>
    </div>
  );
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

          // Actualizar estado con datos reales (se usarán en dashboardData más abajo)
          setInvestors(investors);
          setTradersDisponibles(traders);
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

        {/* Investors List */}
        <div className="bg-[#2a2a2a] p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">{t('pamm.manager.fundDetail.fundInvestors')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#333]">
                <tr className="text-left text-gray-400 text-sm">
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
                    <tr key={investor.id} className="hover:bg-[#333] transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {investor.avatar ? (
                            <img 
                              src={investor.avatar} 
                              alt={investor.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                              {investor.name?.charAt(0)?.toUpperCase() || 'I'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{investor.name}</p>
                            {investor.email && <p className="text-xs text-gray-400">{investor.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">{formatCurrency(investor.invested_amount)}</td>
                      <td className={`py-3 ${investor.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(investor.profit_loss)}
                      </td>
                      <td className={`py-3 ${investor.profit_loss_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercentage(investor.profit_loss_percentage)}
                      </td>
                      <td className="py-3 text-gray-400">{new Date(investor.joined_date).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          investor.status === 'active' 
                            ? 'bg-green-500 bg-opacity-20 text-green-400' 
                            : 'bg-gray-500 bg-opacity-20 text-gray-400'
                        }`}>
                          {investor.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="p-1 hover:bg-[#444] rounded transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Messaging Panel */}
          <PammMessagingPanel fundId={fund.id} userType="manager" />
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

        {/* All Investors Table */}
        <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] overflow-hidden">
          <div className="p-4 border-b border-[#333]">
            <h3 className="text-lg font-semibold">Todos los Inversores</h3>
            <p className="text-sm text-gray-400">Gestiona todos los inversores de tus fondos PAMM</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-[#333]">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="p-4">Inversor</th>
                  <th className="p-4">Fondo</th>
                  <th className="p-4">Inversión</th>
                  <th className="p-4">Ganancia</th>
                  <th className="p-4">Rendimiento</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {filteredInvestors.map((investor, index) => {
                  // Assign fund based on investor ID for demonstration
                  const assignedFund = accountsData[index % accountsData.length];
                  return (
                    <tr key={investor.id} className="hover:bg-[#333] transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{investor.nombre}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-400">{assignedFund.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{formatCurrency(investor.montoInvertido)}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-green-500">{formatCurrency(investor.gananciaActual)}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-green-500">{formatPercentage(investor.rendimientoPersonal)}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          investor.estado === 'Activo' 
                            ? 'bg-green-500 bg-opacity-20 text-green-400' 
                            : 'bg-gray-500 bg-opacity-20 text-gray-400'
                        }`}>
                          {investor.estado}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">
                        {new Date(investor.fechaEntrada).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      {/* Portfolio Section */}
      <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-[#333]">
        <h2 className="text-xl font-semibold mb-6">{t('pamm.manager.portfolio')}</h2>
        
        {/* Basic KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#333] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t('pamm.manager.totalAUM')}</span>
              <DollarSign className="text-cyan-500" size={20} />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.totalCapital)}</div>
          </div>
          
          <div className="bg-[#333] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t('pamm.manager.performance')}</span>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-green-500">{formatPercentage(data.rendimiento)}</div>
          </div>
          
          <div className="bg-[#333] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t('pamm.manager.fundDetail.investors')}</span>
              <Users className="text-blue-500" size={20} />
            </div>
            <div className="text-2xl font-bold">{data.numeroInversores}</div>
          </div>
          
          <div className="bg-[#333] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t('pamm.manager.commissions')}</span>
              <Award className="text-yellow-500" size={20} />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.comisionesGeneradas)}</div>
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

        {/* Funds Grid */}
        {!isLoading && !error && accountsData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {accountsData.map((account) => (
            <div key={account.id} className="bg-[#333] p-6 rounded-xl border border-[#444]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{account.name}</h3>
                  <span className="text-sm text-gray-400">
                    {account.description ? account.description.substring(0, 50) + '...' : 'Fondo PAMM'}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  account.status === 'active' 
                    ? 'bg-green-500 bg-opacity-20 text-green-400' 
                    : 'bg-gray-500 bg-opacity-20 text-gray-400'
                }`}>
                  {account.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">AUM:</span>
                  <span className="font-medium">{formatCurrency(account.aum || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('pamm.manager.investorsCount')}</span>
                  <span className="font-medium">{account.investors_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('pamm.manager.commission')}</span>
                  <span className="font-medium">
                    {(parseFloat(account.management_fee) || 0).toFixed(1)}% + {(parseFloat(account.performance_fee) || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Comisiones Mensuales:</span>
                  <span className="font-medium text-cyan-500">{formatCurrency(account.monthly_commissions || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Inversión Mínima:</span>
                  <span className="font-medium">{formatCurrency(account.min_investment || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Creado:</span>
                  <span className="font-medium text-gray-400">
                    {account.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleManageFund(account)}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  {t('pamm.manager.manageFund')}
                </button>
              </div>
            </div>
          ))}
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