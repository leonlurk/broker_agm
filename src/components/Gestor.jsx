import React, { useState, useEffect } from 'react';
import { Star, Users, DollarSign, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Eye, Settings, BarChart3, Activity, Award, Calendar, Copy, MoreHorizontal, Edit, Camera, Save, X, Info, Shield, Target, Briefcase, Search, Filter, SlidersHorizontal, Pause, StopCircle, MessageCircle, UserCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import { getFollowers, getTraderStats } from '../services/copytradingService';
import ConfigurarGestorModal from './ConfigurarGestorModal';
import { scrollToTopManual } from '../hooks/useScrollToTop';
import useTranslation from '../hooks/useTranslation';

// Mock data para el dashboard del trader
const mockTraderDashboardData = {
  overview: {
    totalAUM: 245000,
    monthlyReturn: 18.7,
    totalFollowers: 89,
    activeFollowers: 67,
    totalCommissions: 3450.50,
    monthlyCommissions: 890.25,
    riskScore: 6.8,
    maxDrawdown: 12.3
  },
  performanceChart: [
    { date: '01/12', portfolio: 220000, benchmark: 215000 },
    { date: '05/12', portfolio: 225000, benchmark: 218000 },
    { date: '10/12', portfolio: 231000, benchmark: 220000 },
    { date: '15/12', portfolio: 238000, benchmark: 223000 },
    { date: '20/12', portfolio: 242000, benchmark: 225000 },
    { date: '25/12', portfolio: 245000, benchmark: 227000 },
    { date: '30/12', portfolio: 245000, benchmark: 229000 },
  ],
  topInvestors: [
    {
      id: 1,
      name: "Carlos Mendez",
      avatar: "/investor1.png",
      investedAmount: 25000,
      monthlyPnL: 1890.50,
      monthlyPnLPercentage: 7.6,
      startDate: "2024-10-15",
      status: "active",
      totalPnL: 3250.75,
      totalPnLPercentage: 13.0,
      email: "carlos.mendez@email.com",
      copyPercentage: 95,
      lastActivity: "2024-01-15"
    },
    {
      id: 2,
      name: "Ana Rodriguez",
      avatar: "/investor2.png",
      investedAmount: 15000,
      monthlyPnL: 1125.80,
      monthlyPnLPercentage: 7.5,
      startDate: "2024-11-02",
      status: "active",
      totalPnL: 1890.25,
      totalPnLPercentage: 12.6,
      email: "ana.rodriguez@email.com",
      copyPercentage: 80,
      lastActivity: "2024-01-15"
    },
    {
      id: 3,
      name: "Miguel Torres",
      avatar: "/investor3.png",
      investedAmount: 32000,
      monthlyPnL: 2688.00,
      monthlyPnLPercentage: 8.4,
      startDate: "2024-09-20",
      status: "active",
      totalPnL: 4520.80,
      totalPnLPercentage: 14.1,
      email: "miguel.torres@email.com",
      copyPercentage: 90,
      lastActivity: "2024-01-15"
    },
    {
      id: 4,
      name: "Sofia Vega",
      avatar: "/investor4.png",
      investedAmount: 18500,
      monthlyPnL: 1351.50,
      monthlyPnLPercentage: 7.3,
      startDate: "2024-11-10",
      status: "paused",
      totalPnL: 1890.75,
      totalPnLPercentage: 10.2,
      email: "sofia.vega@email.com",
      copyPercentage: 0,
      lastActivity: "2024-01-12"
    }
  ],
  recentTrades: [
    {
      id: 1,
      symbol: "EUR/USD",
      type: "BUY",
      time: "10:30",
      size: 2.5,
      pnl: 125.50,
      followers: 45
    },
    {
      id: 2,
      symbol: "GBP/USD",
      type: "SELL",
      time: "09:15",
      size: 1.8,
      pnl: -89.20,
      followers: 38
    },
    {
      id: 3,
      symbol: "USD/JPY",
      type: "BUY",
      time: "08:45",
      size: 3.2,
      pnl: 245.80,
      followers: 52
    }
  ],
  followerDistribution: [
    { name: "Activos", value: 67, color: "#22d3ee" },
    { name: "Pausados", value: 15, color: "#fbbf24" },
    { name: "Inactivos", value: 7, color: "#ef4444" }
  ]
};

const Gestor = ({ setSelectedOption, navigationParams, setNavigationParams, scrollContainerRef }) => {
  const { t } = useTranslation();
  const [view, setView] = useState('dashboard'); // dashboard, myInvestors, profileEdit
  const [investors, setInvestors] = useState([]);
  const [traderStats, setTraderStats] = useState(mockTraderDashboardData);
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

  useEffect(() => {
    const fetchTraderData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Cargar estadísticas del trader y seguidores en paralelo
        const [statsData, followersData] = await Promise.all([
          getTraderStats().catch(() => mockTraderDashboardData),
          getFollowers().catch(() => [])
        ]);
        
        // Actualizar estadísticas del trader
        if (statsData && statsData !== mockTraderDashboardData) {
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
            performanceChart: statsData.performance_chart || mockTraderDashboardData.performanceChart,
            topInvestors: statsData.followers_list || []
          });
          
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
          // Usar datos mock como fallback
          setInvestors(mockTraderDashboardData.topInvestors);
        }
        
      } catch (err) {
        console.error('Error loading trader data:', err);
        setError('No se pudieron cargar los datos.');
        // Usar datos mock como fallback en caso de error
        setInvestors(mockTraderDashboardData.topInvestors);
      } finally {
        setIsLoading(false);
      }
    };
    
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
      errors.displayName = 'El nombre de display es requerido';
    }
    if (!profileData.bio.trim()) {
      errors.bio = 'La biografía es requerida';
    }
    if (profileData.minInvestment >= profileData.maxInvestment) {
      errors.minInvestment = 'La inversión mínima debe ser menor que la máxima';
    }
    if (profileData.commissionRate < 0 || profileData.commissionRate > 50) {
      errors.commissionRate = 'La comisión debe estar entre 0% y 50%';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      setIsSaving(false);
      return;
    }

    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Perfil guardado:', profileData);
      // Aquí iría la lógica real de guardado
      alert('Perfil actualizado correctamente');
      setView('dashboard');
    } catch (error) {
      console.error('Error guardando perfil:', error);
      alert('Error al guardar el perfil');
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

  const mockAllInvestors = [
    ...mockTraderDashboardData.topInvestors,
    {
      id: 5,
      name: "Roberto Silva",
      avatar: "/investor5.png",
      investedAmount: 8500,
      monthlyPnL: 612.50,
      monthlyPnLPercentage: 7.2,
      startDate: "2024-08-15",
      status: "active",
      totalPnL: 1890.75,
      totalPnLPercentage: 22.2,
      email: "roberto.silva@email.com",
      copyPercentage: 85,
      lastActivity: "2024-01-15"
    },
    {
      id: 6,
      name: "Laura Martinez",
      avatar: "/investor6.png",
      investedAmount: 12000,
      monthlyPnL: -156.80,
      monthlyPnLPercentage: -1.3,
      startDate: "2024-12-01",
      status: "active",
      totalPnL: -156.80,
      totalPnLPercentage: -1.3,
      email: "laura.martinez@email.com",
      copyPercentage: 100,
      lastActivity: "2024-01-15"
    },
    {
      id: 7,
      name: "Diego Fernandez",
      avatar: "/investor7.png",
      investedAmount: 22000,
      monthlyPnL: 0,
      monthlyPnLPercentage: 0,
      startDate: "2024-11-20",
      status: "paused",
      totalPnL: 1540.60,
      totalPnLPercentage: 7.0,
      email: "diego.fernandez@email.com",
      copyPercentage: 0,
      lastActivity: "2024-01-10"
    },
    {
      id: 8,
      name: "Carmen Lopez",
      avatar: "/investor8.png",
      investedAmount: 5500,
      monthlyPnL: 0,
      monthlyPnLPercentage: 0,
      startDate: "2024-09-10",
      status: "inactive",
      totalPnL: 890.30,
      totalPnLPercentage: 16.2,
      email: "carmen.lopez@email.com",
      copyPercentage: 0,
      lastActivity: "2024-01-05"
    }
  ];

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
    let filtered = mockAllInvestors;
    
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
      case 'active': return 'Activo';
      case 'paused': return 'Pausado';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">{t('gestor.traderDashboard')}</h1>
              <p className="text-gray-400">{t('gestor.manageAccountsAndPerformance')}</p>
            </div>
            <button
              onClick={handleCreateCopy}
              className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-6 rounded-xl hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
            >
              <Settings size={20} />
              Crear Copy Trading 
            </button>
          </div>
        </div>

        {/* Portafolio Section */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-cyan-400">Portafolio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Capital Propio */}
            <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign size={24} className="text-blue-400" />
                </div>
                <TrendingUp size={20} className="text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">$25,340.00</h3>
              <p className="text-sm text-gray-400">Capital Propio</p>
              <div className="mt-2 text-xs text-gray-500">
                <span className="text-green-400">+8.5%</span> este mes
              </div>
            </div>

            {/* Capital de Terceros */}
            <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Users size={24} className="text-cyan-400" />
                </div>
                <TrendingUp size={20} className="text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">$89,500.00</h3>
              <p className="text-sm text-gray-400">Capital de Terceros</p>
              <div className="mt-2 text-xs text-gray-500">
                <span className="text-yellow-400">5 inversores</span> activos
              </div>
            </div>

            {/* Capital Total Administrado */}
            <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Briefcase size={24} className="text-green-400" />
                </div>
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">$114,840.00</h3>
              <p className="text-sm text-gray-400">Capital Total Administrado</p>
              <div className="mt-2 text-xs text-gray-500">
                <span className="text-green-400">+12.8%</span> rendimiento total
              </div>
            </div>
          </div>
        </div>

        {/* Mis Cuentas Copy Trading */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-cyan-400">Mis Cuentas Copy Trading</h2>
          <div className="space-y-4">

            {/* Cuenta Copy Trading 2 */}
            <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">CT2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Copy Trading Account #2</h3>
                    <p className="text-sm text-gray-400">Creada: 02/11/2024</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-400">AUM: <span className="text-white font-medium">$89,500</span></span>
                      <span className="text-sm text-gray-400">Inversores: <span className="text-white font-medium">5</span></span>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Pausada</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewAccountInfo('CT1')}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Gestionar
                  </button>
                </div>
              </div>
            </div>

            {/* Cuenta Copy Trading 3 */}
            <div className="bg-[#1C1C1C] rounded-xl border border-[#333] p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">CT3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Copy Trading Account #3</h3>
                    <p className="text-sm text-gray-400">Creada: 20/09/2024</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-400">AUM: <span className="text-white font-medium">$0</span></span>
                      <span className="text-sm text-gray-400">Inversores: <span className="text-white font-medium">0</span></span>
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Inactiva</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewAccountInfo('CT1')}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Gestionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>





        {/* Modal de Configurar Gestor */}
        <ConfigurarGestorModal 
          isOpen={showConfigurarModal}
          onClose={() => setShowConfigurarModal(false)}
          onConfirm={(formData) => {
            console.log('Perfil de gestor configurado:', formData);
            setShowConfigurarModal(false);
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
            ← Volver al Dashboard
          </button>
          <h1 className="text-3xl font-semibold mb-2">{t('gestor.myInvestors')}</h1>
          <p className="text-gray-400">{t('gestor.manageAndMonitorInvestors')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-cyan-400" />
              <span className="text-cyan-400 font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{mockAllInvestors.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck size={20} className="text-green-400" />
              <span className="text-green-400 font-medium">Activos</span>
            </div>
            <p className="text-2xl font-bold text-white">{mockAllInvestors.filter(i => i.status === 'active').length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={20} className="text-cyan-400" />
              <span className="text-cyan-400 font-medium">AUM</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatAUM(mockAllInvestors.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0))}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} className="text-green-400" />
              <span className="text-green-400 font-medium">P&L Avg</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {formatPercentage(
                mockAllInvestors.length > 0 
                  ? mockAllInvestors.reduce((sum, inv) => sum + (inv.totalPnLPercentage || 0), 0) / mockAllInvestors.length
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
                placeholder="Buscar inversor..."
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
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="paused">Pausados</option>
              <option value="inactive">Inactivos</option>
            </select>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-3 bg-[#191919] border border-[#333] rounded-lg text-white"
            >
              <option value="investment">Por inversión</option>
              <option value="performance">Por rendimiento</option>
              <option value="date">Por fecha</option>
            </select>
          </div>
        </div>

        {/* Investors Table */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1C1C1C] border-b border-[#333]">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Inversor</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Inversión</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">P&L Total</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">P&L Mensual</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Estado</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Copia</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Acciones</th>
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
                          <p className="text-xs text-gray-500">Desde {investor.startDate}</p>
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
                              Ver Detalles
                            </button>
                            <button 
                              onClick={() => handleInvestorAction('message', investor)}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333] flex items-center gap-2"
                            >
                              <MessageCircle size={14} />
                              Enviar Mensaje
                            </button>
                            {investor.status === 'active' ? (
                              <button 
                                onClick={() => handleInvestorAction('pause', investor)}
                                className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-[#333] flex items-center gap-2"
                              >
                                <Pause size={14} />
                                Pausar Copia
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleInvestorAction('activate', investor)}
                                className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-[#333] flex items-center gap-2"
                              >
                                <UserCheck size={14} />
                                Activar Copia
                              </button>
                            )}
                            <button 
                              onClick={() => handleInvestorAction('stop', investor)}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#333] flex items-center gap-2 border-t border-[#333]"
                            >
                              <StopCircle size={14} />
                              Detener Copia
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
              <p className="text-lg font-medium mb-2">No se encontraron inversores</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda' 
                  : 'Aún no tienes inversores copiando tus operaciones'
                }
              </p>
            </div>
          )}
        </div>
        
        {/* Results Summary */}
        {filteredInvestors.length > 0 && (
          <div className="mt-6 text-center text-gray-400">
            Mostrando {filteredInvestors.length} de {mockAllInvestors.length} inversores
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
            ← Volver al Dashboard
          </button>
          <h1 className="text-3xl font-semibold mb-2">Editar Perfil Trader</h1>
          <p className="text-gray-400">Configura cómo te ven los inversores</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
              <h2 className="text-xl font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                <Info size={20} />
                Información
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
                    <h3 className="font-medium text-white mb-1">Foto de Perfil</h3>
                    <p className="text-sm text-gray-400 mb-2">Imagen profesional 400x400px</p>
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm">Cambiar imagen</button>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => handleProfileInputChange('displayName', e.target.value)}
                    className={`w-full bg-[#1C1C1C] border ${profileErrors.displayName ? 'border-red-500' : 'border-[#333]'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500`}
                    placeholder="Ej: Maestro FX Pro"
                  />
                  {profileErrors.displayName && <p className="text-red-500 text-xs mt-1">{profileErrors.displayName}</p>}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Bio *</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleProfileInputChange('bio', e.target.value)}
                    className={`w-full bg-[#1C1C1C] border ${profileErrors.bio ? 'border-red-500' : 'border-[#333]'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 h-24 resize-none`}
                    placeholder="Describe tu experiencia y estrategias..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    {profileErrors.bio && <p className="text-red-500 text-xs">{profileErrors.bio}</p>}
                    <p className="text-gray-400 text-xs ml-auto">{profileData.bio.length}/500</p>
                  </div>
                </div>

                {/* Strategy & Risk Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Estrategia</label>
                    <input
                      type="text"
                      value={profileData.strategy}
                      onChange={(e) => handleProfileInputChange('strategy', e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Ej: Scalping EUR/USD"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Riesgo</label>
                    <select
                      value={profileData.riskLevel}
                      onChange={(e) => handleProfileInputChange('riskLevel', e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Bajo">Bajo</option>
                      <option value="Moderado">Moderado</option>
                      <option value="Alto">Alto</option>
                    </select>
                  </div>
                </div>

                {/* Experience & Time Zone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Experiencia</label>
                    <select
                      value={profileData.tradingExperience}
                      onChange={(e) => handleProfileInputChange('tradingExperience', e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="1-2 años">1-2 años</option>
                      <option value="3-5 años">3-5 años</option>
                      <option value="5+ años">5+ años</option>
                      <option value="10+ años">10+ años</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Zona</label>
                    <input
                      type="text"
                      value={profileData.timeZone}
                      onChange={(e) => handleProfileInputChange('timeZone', e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      placeholder="GMT-3 (Buenos Aires)"
                    />
                  </div>
                </div>

                {/* Trading Hours */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Horario</label>
                  <input
                    type="text"
                    value={profileData.tradingHours}
                    onChange={(e) => handleProfileInputChange('tradingHours', e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="09:00 - 17:00"
                  />
                </div>
              </div>
            </div>

            {/* Investment Settings */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
              <h2 className="text-xl font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                <Target size={20} />
                Configuración
              </h2>
              
              <div className="space-y-6">
                {/* Investment Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Mínima (USD)</label>
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
                    <label className="block text-white text-sm font-medium mb-2">Máxima (USD)</label>
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
                  <label className="block text-white text-sm font-medium mb-2">Comisión (%)</label>
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
                    <span className="text-gray-400 text-sm">% de ganancia</span>
                  </div>
                  {profileErrors.commissionRate && <p className="text-red-500 text-xs mt-1">{profileErrors.commissionRate}</p>}
                  <p className="text-gray-400 text-xs mt-1">Solo cobras comisión con ganancias</p>
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6">
              <h2 className="text-xl font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                <Briefcase size={20} />
                Especializaciones
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
                Configuración de Privacidad
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Perfil Público</p>
                    <p className="text-sm text-gray-400">Otros usuarios pueden ver tu perfil</p>
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
                    <p className="text-white font-medium">Permitir Copy Trading</p>
                    <p className="text-sm text-gray-400">Los inversores pueden copiar tus operaciones</p>
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
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Vista Previa</h3>
              
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
                    <span className="text-gray-400">Nivel de Riesgo</span>
                    <span className={`font-medium ${
                      profileData.riskLevel === 'Bajo' ? 'text-green-400' : 
                      profileData.riskLevel === 'Moderado' ? 'text-yellow-400' : 'text-red-400'
                    }`}>{profileData.riskLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Inversión Min</span>
                    <span className="text-white">{formatCurrency(profileData.minInvestment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Comisión</span>
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
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Guardar Cambios
                  </>
                )}
              </button>
              
              <button
                onClick={handleBackToDashboard}
                className="w-full border border-[#333] text-gray-400 py-3 px-6 rounded-xl hover:text-white hover:border-gray-300 transition-colors font-medium"
              >
                Cancelar
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
      <p className="text-gray-400">Vista no encontrada</p>
    </div>
  );
};

export default Gestor; 