import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Crown, CheckCircle, Search, Filter, Star, TrendingUp, Users, Target, Copy, BarChart3, PieChart, Calendar, Clock, AlertTriangle, DollarSign, Settings, Plus } from 'lucide-react';
import TraderProfileDetail from './TraderProfileDetail';
import SeguirTraderModal from './SeguirTraderModal';
import AccountSelectionModal from './AccountSelectionModal';
import EnhancedTraderCard from './EnhancedTraderCard';
import { getMasterTraders, getMySubscriptions, followMaster, unfollowMaster, getFollowers, getCopyStats, getTraderStats } from '../services/copytradingService';
import { useAccounts } from '../contexts/AccountsContext';
import useTranslation from '../hooks/useTranslation';
import { MasterAccountBadge, FollowStatusIndicator, SubscriptionStatusCard, MasterAccountSummaryCard } from './StatusIndicators';

const CopytradingDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('traders');
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [expandedTrader, setExpandedTrader] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  
  // Version: 2025-10-04 - UX improvements applied (deploy trigger)
  
  // Estados para datos de la API
  const [availableTraders, setAvailableTraders] = useState([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [myFollowers, setMyFollowers] = useState([]); // Seguidores si soy Master
  const [copyStats, setCopyStats] = useState(null); // Estadísticas generales
  const [traderStats, setTraderStats] = useState(null); // Stats como Master
  const [isMasterTrader, setIsMasterTrader] = useState(false); // Si soy Master
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedTraders, setCopiedTraders] = useState(new Set());
  const [userMasterAccounts, setUserMasterAccounts] = useState([]);
  const [followedTraders, setFollowedTraders] = useState(new Set());
  const [subscriptionStatuses, setSubscriptionStatuses] = useState(new Map());
  const [currentUserId, setCurrentUserId] = useState(null);
  const [followFilter, setFollowFilter] = useState('all'); // 'all', 'following', 'not-following'
  
  // Estados para el modal de seguir trader
  const [showSeguirModal, setShowSeguirModal] = useState(false);
  const [selectedTraderForCopy, setSelectedTraderForCopy] = useState(null);
  
  // Estados para el modal de selección de cuenta
  const [showAccountSelectionModal, setShowAccountSelectionModal] = useState(false);
  const [selectedAccountForCopy, setSelectedAccountForCopy] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Obtener el usuario actual
        const { supabase } = await import('../supabase/config');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        // Cargar estadísticas primero para determinar si soy Master
        const [traders, subscriptions, stats] = await Promise.all([
          getMasterTraders(),
          getMySubscriptions(),
          getCopyStats().catch(() => ({ as_master: { active: 0 }, as_follower: { active: 0 } }))
        ]);

        console.log('🔍 RAW TRADERS FROM API:', traders);
        console.log('🔍 COPY STATS:', stats);

        setCopyStats(stats);

        // Determinar si soy Master Trader
        const isIMaster = stats?.as_master?.active > 0 || stats?.as_master?.total > 0;
        setIsMasterTrader(isIMaster);

        // Si soy Master, cargar mis seguidores y stats
        if (isIMaster) {
          try {
            const [followers, masterStats] = await Promise.all([
              getFollowers(),
              getTraderStats().catch(() => null)
            ]);

            console.log('👥 MY FOLLOWERS:', followers);
            console.log('📊 TRADER STATS:', masterStats);

            setMyFollowers(followers || []);
            setTraderStats(masterStats);
          } catch (err) {
            console.warn('Error cargando datos de Master:', err);
          }
        }

        // Filtrar traders: excluir las propias cuentas master del usuario
        const filteredTraders = traders.filter(trader => trader.id !== user?.id);

        // Mapear traders con follower_count del backend
        const formattedTraders = filteredTraders.map(trader => ({
          id: trader.id,
          user_id: trader.id,
          name: trader.username || trader.name || 'N/A',
          followerCount: trader.follower_count || 0, // Usar el contador del backend
          profit: `+${trader.performance?.monthly_pnl_percentage?.toFixed(1) || 0}%`,
          since: new Date(trader.created_at || Date.now()).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          type: trader.type || 'Verificado',
          typeColor: 'bg-blue-600',
          rentabilidad: `+${trader.performance?.total_pnl_percentage?.toFixed(1) || 0}%`,
          rentabilidadPercentage: `${Math.min(100, Math.abs(trader.performance?.total_pnl_percentage || 0))}%`,
          riesgo: trader.riskLevel || 'Medio',
          riesgoColor: 'text-yellow-400',
          riesgoPercentage: `${trader.riskScore || 50}%`,
          riesgoBarColor: 'bg-yellow-500',
          master_config: trader.master_config,
          // Agregar datos reales de performance
          totalTrades: trader.performance?.total_trades || 0,
          winRate: trader.performance?.win_rate || 0,
          avgProfit: trader.performance?.avg_profit || 0,
          maxDrawdown: trader.performance?.max_drawdown || 0,
          sharpeRatio: trader.performance?.sharpe_ratio || 0
        }));

        // Mapear suscripciones con más detalle
        const formattedSubscriptions = subscriptions.map(sub => ({
          id: sub.id,
          traderId: sub.master_user_id,
          name: sub.master?.username || sub.master?.name || 'Trader Desconocido',
          invested: `$${sub.investmentAmount?.toFixed(2) || 0}`,
          profit: `+$${sub.currentProfit?.toFixed(2) || 0}`,
          profitPercentage: `+${sub.currentProfitPercentage?.toFixed(1) || 0}%`,
          status: sub.status === 'active' ? 'Activo' : 'Pausado',
          startedDate: new Date(sub.created_at).toLocaleDateString(),
          riskRatio: sub.risk_ratio || 1.0,
          masterPerformance: sub.master?.performance || {}
        }));

        setAvailableTraders(formattedTraders);
        setActiveSubscriptions(formattedSubscriptions);

        // Sincronizar copiedTraders con subscriptions activas
        const followedIds = new Set(subscriptions
          .filter(sub => sub.status === 'active')
          .map(sub => sub.master_user_id)
        );
        setCopiedTraders(followedIds);

      } catch (err) {
        setError('No se pudieron cargar los datos de Copytrading.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  console.log("Current state:", { activeTab, selectedTrader, expandedTrader, searchTerm, typeFilter, riskFilter });
  
  const handleViewTraderDetails = (trader) => {
    console.log("Viewing trader details for:", trader);
    setSelectedTrader(trader);
  };
  
  const handleBackToTraders = () => {
    console.log("Going back to traders list");
    setSelectedTrader(null);
  };
  
  const handleFollowTrader = async (formData, traderData, accountData) => {
    try {
      setIsLoading(true);

      // Use passed data or fallback to component state
      const finalTrader = traderData || selectedTraderForCopy;
      const finalAccount = accountData || selectedAccountForCopy;

      // Validar dependencias
      if (!finalTrader) throw new Error('No hay trader seleccionado');
      if (!finalAccount?.accountNumber) throw new Error('No hay cuenta seleccionada');

      // Mapear porcentaje de riesgo (1-50%) a risk_ratio (0.01 - 1.0)
      const pct = Number(formData?.porcentajeRiesgo) || 5; // default 5%
      const computedRisk = Math.max(0.01, Math.min(1.0, pct / 100));

      // Extract master MT5 account from trader's master_config
      const masterMt5Account = finalTrader.master_config?.cuentaMT5Seleccionada || 
                              finalTrader.master_config?.master_mt5_account ||
                              finalTrader.masterAccount ||
                              finalTrader.mt5Account;
      
      if (!masterMt5Account) {
        alert('Error: No se encontró la cuenta MT5 del master trader');
        return;
      }

      // Llamar al endpoint followMaster del backend
      const response = await followMaster({
        master_user_id: finalTrader.user_id || finalTrader.id,
        master_mt5_account_id: masterMt5Account,
        follower_mt5_account_id: parseInt(finalAccount.accountNumber, 10),
        risk_ratio: computedRisk
      });

      if (response.success || response.message) {
        alert(t('copyTrading.messages.followSuccess') || 'Successfully following trader');

        // Marcar en UI como copiado usando el user_id correcto
        const traderId = finalTrader.user_id || finalTrader.id;
        setCopiedTraders(prev => new Set([...prev, traderId]));

        // Cerrar modal y limpiar selección
        setShowSeguirModal(false);
        setSelectedTraderForCopy(null);
        setSelectedAccountForCopy(null);

        // Refrescar datos desde el servidor para obtener actualización completa
        const [traders, subscriptions] = await Promise.all([
          getMasterTraders(),
          getMySubscriptions()
        ]);
        
        // Re-mapear traders
        const formattedTraders = traders.map(trader => ({
          id: trader.id,
          user_id: trader.id,
          name: trader.username || trader.name || 'N/A',
          followerCount: trader.follower_count || 0,
          profit: `+${trader.performance?.monthly_pnl_percentage?.toFixed(1) || 0}%`,
          since: new Date(trader.created_at || Date.now()).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          type: trader.type || 'Verificado',
          typeColor: 'bg-blue-600',
          rentabilidad: `+${trader.performance?.total_pnl_percentage?.toFixed(1) || 0}%`,
          rentabilidadPercentage: `${Math.min(100, Math.abs(trader.performance?.total_pnl_percentage || 0))}%`,
          riesgo: trader.riskLevel || 'Medio',
          riesgoColor: 'text-yellow-400',
          riesgoPercentage: `${trader.riskScore || 50}%`,
          riesgoBarColor: 'bg-yellow-500',
          master_config: trader.master_config
        }));
        
        setAvailableTraders(formattedTraders);
        
        // Sincronizar estado de copiados
        const followedIds = new Set(subscriptions
          .filter(sub => sub.status === 'active')
          .map(sub => sub.master_user_id)
        );
        setCopiedTraders(followedIds);
      } else {
        throw new Error(response.error || 'Error following trader');
      }
    } catch (error) {
      console.error('Error siguiendo trader:', error);
      alert((t('copyTrading.messages.followError') || 'Error al seguir al trader') + ': ' + (error.message || 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyTrader = (trader) => {
    if (copiedTraders.has(trader.id)) {
      return; // Ya está siendo copiado
    }
    console.log("Copying trader:", trader);
    setSelectedTraderForCopy(trader);
    setShowAccountSelectionModal(true);
  };

  const handleUnfollowTrader = async (traderId) => {
    if (!confirm('¿Estás seguro de que deseas dejar de copiar a este trader?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await unfollowMaster(traderId);
      
      // Actualizar estado local
      setCopiedTraders(prev => {
        const newSet = new Set(prev);
        newSet.delete(traderId);
        return newSet;
      });
      
      // Refrescar datos
      const [traders, subscriptions] = await Promise.all([
        getMasterTraders(),
        getMySubscriptions()
      ]);
      
      const { supabase } = await import('../supabase/config');
      const { data: { user } } = await supabase.auth.getUser();
      const filteredTraders = traders.filter(trader => trader.id !== user?.id);
      
      const formattedTraders = filteredTraders.map(trader => ({
        id: trader.id,
        user_id: trader.id,
        name: trader.username || trader.name || 'N/A',
        followerCount: trader.follower_count || 0,
        profit: `+${trader.performance?.monthly_pnl_percentage?.toFixed(1) || 0}%`,
        since: new Date(trader.created_at || Date.now()).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        type: trader.type || 'Verificado',
        typeColor: 'bg-blue-600',
        rentabilidad: `+${trader.performance?.total_pnl_percentage?.toFixed(1) || 0}%`,
        rentabilidadPercentage: `${Math.min(100, Math.abs(trader.performance?.total_pnl_percentage || 0))}%`,
        riesgo: trader.riskLevel || 'Medio',
        riesgoColor: 'text-yellow-400',
        riesgoPercentage: `${trader.riskScore || 50}%`,
        riesgoBarColor: 'bg-yellow-500',
        master_config: trader.master_config,
        totalTrades: trader.performance?.total_trades || 0,
        winRate: trader.performance?.win_rate || 0,
        avgProfit: trader.performance?.avg_profit || 0,
        maxDrawdown: trader.performance?.max_drawdown || 0,
        sharpeRatio: trader.performance?.sharpe_ratio || 0
      }));
      
      setAvailableTraders(formattedTraders);
      setActiveSubscriptions(subscriptions.map(sub => ({
        id: sub.id,
        traderId: sub.master_user_id,
        name: sub.master?.username || sub.master?.name || 'Trader Desconocido',
        invested: `$${sub.investmentAmount?.toFixed(2) || 0}`,
        profit: `+$${sub.currentProfit?.toFixed(2) || 0}`,
        profitPercentage: `+${sub.currentProfitPercentage?.toFixed(1) || 0}%`,
        status: sub.status === 'active' ? 'Activo' : 'Pausado',
        startedDate: new Date(sub.created_at).toLocaleDateString(),
        riskRatio: sub.risk_ratio || 1.0,
        masterPerformance: sub.master?.performance || {}
      })));
      
      const followedIds = new Set(subscriptions
        .filter(sub => sub.status === 'active')
        .map(sub => sub.master_user_id)
      );
      setCopiedTraders(followedIds);
      
      alert('Has dejado de copiar al trader exitosamente');
    } catch (error) {
      console.error('Error al dejar de seguir:', error);
      alert('Error al dejar de copiar al trader: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelected = (account) => {
    console.log("Account selected for copying:", account);
    setSelectedAccountForCopy(account);
    setShowAccountSelectionModal(false);
    setShowSeguirModal(true);
  };
  
  // Si hay un trader seleccionado, mostrar sus detalles
  if (selectedTrader) {
    console.log("Rendering TraderProfileDetail for:", selectedTrader);
    return <TraderProfileDetail 
             trader={selectedTrader} 
             onBack={handleBackToTraders} 
           />;
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-[#232323] text-white">
        <h1 className="text-2xl font-bold mb-6">Traders Disponibles</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#191919] p-6 rounded-xl border border-[#333] animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="h-5 bg-[#333] rounded w-32 mb-2"></div>
                  <div className="h-4 bg-[#333] rounded w-24 mb-1"></div>
                  <div className="h-3 bg-[#333] rounded w-40"></div>
                </div>
                <div className="h-6 bg-[#333] rounded w-20"></div>
              </div>
              <div className="space-y-3">
                <div className="h-2 bg-[#333] rounded w-full"></div>
                <div className="h-2 bg-[#333] rounded w-full"></div>
              </div>
              <div className="flex space-x-2 mt-4">
                <div className="h-10 bg-[#333] rounded flex-1"></div>
                <div className="h-10 bg-[#333] rounded w-16"></div>
                <div className="h-10 bg-[#333] rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#232323] text-white text-center">
        <h1 className="text-xl font-semibold text-red-500">Error al Cargar</h1>
        <p className="text-gray-400 mt-2">{error}</p>
      </div>
    );
  }

  // Renderizar tarjeta de trader
  const renderTraderCard = (trader) => {
    const isExpanded = expandedTrader === trader.id;
    const isCopying = copiedTraders.has(trader.user_id || trader.id);
    
    return (
      <div key={trader.id} className="bg-[#191919] p-6 rounded-xl border border-[#333] mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">{trader.name}</h3>
            <p className="text-green-500 text-sm">{trader.profit} último mes</p>
            <p className="text-gray-400 text-sm mt-1">Operando desde: {trader.since}</p>
            <p className="text-cyan-400 text-xs mt-1">
              <Users size={12} className="inline mr-1" />
              {trader.followerCount || 0} {trader.followerCount === 1 ? 'seguidor' : 'seguidores'}
            </p>
          </div>
          <div className={`${trader.typeColor} text-xs px-2 py-1 rounded text-white`}>
            {trader.type}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Rentabilidad</span>
            <span className="text-xs text-green-400">{trader.rentabilidad}</span>
          </div>
          <div className="w-full bg-[#333] h-2 rounded-full">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: trader.rentabilidadPercentage }}></div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Riesgo</span>
            <span className={`text-xs ${trader.riesgoColor}`}>{trader.riesgo}</span>
          </div>
          <div className="w-full bg-[#333] h-2 rounded-full">
            <div className={`${trader.riesgoBarColor} h-2 rounded-full`} style={{ width: trader.riesgoPercentage }}></div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            className={`flex-1 px-4 py-2 rounded-md text-sm transition-colors flex items-center justify-center ${
              isCopying
                ? 'bg-green-600 hover:bg-green-700 cursor-not-allowed' 
                : 'bg-cyan-700 hover:bg-cyan-600'
            }`}
            onClick={() => handleCopyTrader(trader)}
            disabled={isCopying}
          >
            {isCopying ? (
              <>
                <CheckCircle size={16} className="mr-2" />
                {t('copytrading.copying') || 'Copiando'}
              </>
            ) : (
              <>
                <Copy size={16} className="mr-2" />
                {t('copytrading.copy') || 'Copiar ahora'}
              </>
            )}
          </button>
          <button 
            className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded-md text-sm"
            onClick={() => handleViewTraderDetails(trader)}
          >
            Ver
          </button>
          <button 
            className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded-md text-sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              console.log("Toggle expand button clicked for trader:", trader.id);
              toggleExpandTrader(trader.id);
            }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        
        {/* Panel expandible con vista previa de trader profile - DATOS DINÁMICOS */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#333]">
            <div className="bg-[#232323] p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Rentabilidad total</p>
                  <p className="text-xl font-medium text-green-500">{trader.rentabilidad}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Operaciones totales</p>
                  <p className="text-xl font-medium">{trader.totalTrades || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Tasa de éxito</p>
                  <p className="text-xl font-medium text-cyan-400">{trader.winRate ? `${trader.winRate.toFixed(1)}%` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Max Drawdown</p>
                  <p className="text-xl font-medium text-red-400">{trader.maxDrawdown ? `${trader.maxDrawdown.toFixed(1)}%` : 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-[#191919] p-3 rounded">
                  <p className="text-xs text-gray-400 mb-1">Beneficio Promedio</p>
                  <p className="text-lg font-medium text-green-400">{trader.avgProfit ? `$${trader.avgProfit.toFixed(2)}` : 'N/A'}</p>
                </div>
                <div className="bg-[#191919] p-3 rounded">
                  <p className="text-xs text-gray-400 mb-1">Sharpe Ratio</p>
                  <p className="text-lg font-medium">{trader.sharpeRatio ? trader.sharpeRatio.toFixed(2) : 'N/A'}</p>
                </div>
              </div>

              <button
                className="w-full px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md text-sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  console.log("Ver perfil completo clicked for trader:", trader);
                  handleViewTraderDetails(trader);
                }}
              >
                Ver perfil completo →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar tarjeta de suscripción
  const renderSubscriptionCard = (subscription) => {
    return (
      <div key={subscription.id} className="bg-[#191919] p-6 rounded-xl border border-[#333] mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">{subscription.name}</h3>
            <p className="text-green-500 text-sm">{subscription.profitPercentage}</p>
            <p className="text-gray-400 text-sm mt-1">Activo desde: {subscription.startedDate}</p>
          </div>
          <div className="bg-green-600 text-xs px-2 py-1 rounded text-white">
            {subscription.status}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-400">Invertido</p>
            <p className="text-lg font-medium">{subscription.invested}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Beneficio</p>
            <p className="text-lg font-medium text-green-500">{subscription.profit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Rentabilidad</p>
            <p className="text-lg font-medium text-green-500">{subscription.profitPercentage}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="flex-1 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md text-sm transition-colors"
            onClick={() => handleViewTraderDetails(
              availableTraders.find(trader => trader.id === subscription.traderId)
            )}
          >
            Ver trader
          </button>
          <button 
            className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md text-sm transition-colors"
            onClick={() => handleUnfollowTrader(subscription.traderId)}
          >
            Dejar de Copiar
          </button>
        </div>
      </div>
    );
  };
  
  // Renderizar contenido del rendimiento
  const renderPerformanceContent = () => {
    return (
      <div className="bg-[#191919] p-6 rounded-xl border border-[#333]">
        <h3 className="text-lg font-medium mb-4">Resumen de rendimiento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#232323] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Inversión total</p>
            <p className="text-2xl font-medium">$7,500</p>
          </div>
          <div className="bg-[#232323] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Beneficio total</p>
            <p className="text-2xl font-medium text-green-500">+$1,273.25</p>
          </div>
          <div className="bg-[#232323] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Rentabilidad</p>
            <p className="text-2xl font-medium text-green-500">+17.0%</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mb-2">Distribución por trader:</p>
        <div className="space-y-4">
          {activeSubscriptions.map(sub => (
            <div key={sub.id} className="flex justify-between items-center bg-[#232323] p-3 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{sub.name}</p>
                <p className="text-xs text-gray-400">Inversión: {sub.invested}</p>
              </div>
              <div className="text-right">
                <p className="text-green-500">{sub.profit}</p>
                <p className="text-xs text-green-400">{sub.profitPercentage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-[#232323] text-white">
      <h1 className="text-2xl font-semibold mb-4">Copy Trading</h1>
      <p className="text-gray-400 mb-6">Gestiona tus operaciones copy trading.</p>
      
      {/* Tabs - Dinámicos según rol del usuario */}
      <div className="flex mb-6 border-b border-[#333] overflow-x-auto">
        <button
          onClick={() => setActiveTab('traders')}
          className={`py-3 px-6 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'traders'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp size={18} />
          {t('copytrading.exploreTraders') || 'Explorar Traders'}
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`py-3 px-6 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'subscriptions'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Copy size={18} />
          {t('copytrading.myCopies') || 'Mis Copias'}
          {activeSubscriptions.length > 0 && (
            <span className="bg-cyan-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeSubscriptions.length}
            </span>
          )}
        </button>
        {/* Tab de "Mis Seguidores" - Solo si soy Master Trader */}
        {isMasterTrader && (
          <button
            onClick={() => setActiveTab('followers')}
            className={`py-3 px-6 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'followers'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={18} />
            {t('copytrading.myFollowers') || 'Mis Seguidores'}
            {myFollowers.length > 0 && (
              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                {myFollowers.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('performance')}
          className={`py-3 px-6 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'performance'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 size={18} />
          {t('copytrading.performance') || 'Rendimiento'}
        </button>
      </div>
      
      {/* Contenido según tab seleccionado */}
      {activeTab === 'traders' && (
        <div className="space-y-4">
          {/* Dashboard de Traders Seguidos */}
          {activeSubscriptions.length > 0 && (
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" size={24} />
                  <h3 className="text-xl font-semibold text-white">Traders que Sigues</h3>
                </div>
                <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm font-medium">
                  {activeSubscriptions.length} {activeSubscriptions.length === 1 ? 'Trader' : 'Traders'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeSubscriptions.slice(0, 3).map(sub => (
                  <div key={sub.id} className="bg-[#191919]/50 rounded-lg p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white truncate">{sub.name}</h4>
                      <CheckCircle size={16} className="text-green-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Invertido:</span>
                        <span className="text-white font-medium">{sub.invested}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Beneficio:</span>
                        <span className="text-green-400 font-bold">{sub.profit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Rentabilidad:</span>
                        <span className="text-cyan-400 font-bold">{sub.profitPercentage}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnfollowTrader(sub.traderId)}
                      className="w-full mt-3 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors border border-red-600/30"
                    >
                      Dejar de Copiar
                    </button>
                  </div>
                ))}
              </div>
              {activeSubscriptions.length > 3 && (
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className="w-full mt-4 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg text-sm transition-colors border border-cyan-600/30"
                >
                  Ver todos los traders que sigues →
                </button>
              )}
            </div>
          )}

          {/* Filtros y búsqueda */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('copytrading.searchTrader')}
                className="w-full p-3 bg-[#191919] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors"
                value={searchTerm}
                onChange={(e) => {
                  console.log("Search term changed:", e.target.value);
                  setSearchTerm(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <select 
                className="p-3 bg-[#191919] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors"
                value={followFilter}
                onChange={(e) => {
                  console.log("Follow filter changed:", e.target.value);
                  setFollowFilter(e.target.value);
                }}
              >
                <option value="all">Todos los traders</option>
                <option value="following">Siguiendo</option>
                <option value="not-following">No siguiendo</option>
              </select>
              <select 
                className="p-3 bg-[#191919] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors"
                value={typeFilter}
                onChange={(e) => {
                  console.log("Type filter changed:", e.target.value);
                  setTypeFilter(e.target.value);
                }}
              >
                <option value="">Todos los tipos</option>
                <option value="Premium">Premium</option>
                <option value="Verificado">Verificado</option>
                <option value="Nuevo">Nuevo</option>
              </select>
              <select 
                className="p-3 bg-[#191919] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors"
                value={riskFilter}
                onChange={(e) => {
                  console.log("Risk filter changed:", e.target.value);
                  setRiskFilter(e.target.value);
                }}
              >
                <option value="">Todos los riesgos</option>
                <option value="Bajo">Riesgo bajo</option>
                <option value="Medio">Riesgo medio</option>
                <option value="Alto">Riesgo alto</option>
                <option value="Medio-Alto">Riesgo medio-alto</option>
              </select>
            </div>
          </div>
          
          {/* Lista de traders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableTraders
              .filter(trader => {
                // Filter by search term
                const matchesSearch = searchTerm === '' || 
                  trader.name.toLowerCase().includes(searchTerm.toLowerCase());
                
                // Filter by type
                const matchesType = typeFilter === '' || 
                  trader.type === typeFilter;
                
                // Filter by risk
                const matchesRisk = riskFilter === '' || 
                  trader.riesgo === riskFilter;
                
                // Filter by follow status
                const isFollowing = copiedTraders.has(trader.user_id || trader.id);
                const matchesFollowFilter = 
                  followFilter === 'all' ||
                  (followFilter === 'following' && isFollowing) ||
                  (followFilter === 'not-following' && !isFollowing);
                
                console.log(`Filtering trader ${trader.name}:`, { 
                  matchesSearch, 
                  matchesType, 
                  matchesRisk,
                  matchesFollowFilter,
                  isFollowing
                });
                
                return matchesSearch && matchesType && matchesRisk && matchesFollowFilter;
              })
              .map(trader => (
                <EnhancedTraderCard
                  key={trader.id}
                  trader={trader}
                  onCopy={handleCopyTrader}
                  onView={handleViewTraderDetails}
                  onExpand={toggleExpandTrader}
                  isExpanded={expandedTrader === trader.id}
                  isCopying={copiedTraders.has(trader.user_id || trader.id)}
                  t={t}
                />
              ))}
          </div>
        </div>
      )}
      
      {/* Mis suscripciones */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {activeSubscriptions.length > 0 ? (
            activeSubscriptions.map(subscription => renderSubscriptionCard(subscription))
          ) : (
            <div className="bg-[#191919] p-8 rounded-xl border border-[#333] text-center">
              <p className="text-lg mb-2">No tienes copias activas</p>
              <p className="text-gray-400 mb-4">Comienza a copiar traders para verlas aquí</p>
              <button
                onClick={() => setActiveTab('traders')}
                className="px-6 py-3 bg-cyan-700 hover:bg-cyan-600 rounded-md"
              >
                Explorar traders
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Rendimiento */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {activeSubscriptions.length > 0 ? (
            renderPerformanceContent()
          ) : (
            <div className="bg-[#191919] p-8 rounded-xl border border-[#333] text-center">
              <p className="text-lg mb-2">No hay datos de rendimiento</p>
              <p className="text-gray-400 mb-4">Necesitas al menos una copia activa</p>
              <button
                onClick={() => setActiveTab('traders')}
                className="px-6 py-3 bg-cyan-700 hover:bg-cyan-600 rounded-md"
              >
                Explorar traders
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mis Seguidores - Vista para Master Traders */}
      {activeTab === 'followers' && isMasterTrader && (
        <div className="space-y-6">
          {/* Panel de estadísticas como Master */}
          {traderStats && (
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-700/30 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="text-yellow-400" size={24} />
                <h3 className="text-xl font-semibold">Estadísticas como Master Trader</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#191919]/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Total Seguidores</p>
                  <p className="text-2xl font-bold text-purple-400">{myFollowers.length}</p>
                </div>
                <div className="bg-[#191919]/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Capital Gestionado</p>
                  <p className="text-2xl font-bold text-green-400">${traderStats.total_capital_managed?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-[#191919]/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Performance Total</p>
                  <p className="text-2xl font-bold text-cyan-400">{traderStats.total_performance_pct?.toFixed(1) || '0.0'}%</p>
                </div>
                <div className="bg-[#191919]/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Comisiones Ganadas</p>
                  <p className="text-2xl font-bold text-yellow-400">${traderStats.total_commissions?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Lista de seguidores */}
          {myFollowers.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users size={20} className="text-purple-400" />
                Personas que te están copiando ({myFollowers.length})
              </h3>
              {myFollowers.map(follower => (
                <div key={follower.id} className="bg-[#191919] p-6 rounded-xl border border-[#333] hover:border-purple-600/50 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center text-white font-bold">
                          {follower.follower?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium">{follower.follower?.name || 'Usuario Anónimo'}</h4>
                          <p className="text-sm text-gray-400">{follower.follower?.email || 'Sin email'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-400">Cuenta MT5</p>
                          <p className="text-sm font-medium text-cyan-400">#{follower.follower_mt5_account_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Risk Ratio</p>
                          <p className="text-sm font-medium">{(follower.risk_ratio * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Desde</p>
                          <p className="text-sm font-medium">{new Date(follower.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Estado</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            follower.status === 'active'
                              ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                              : 'bg-gray-600/20 text-gray-400 border border-gray-600/50'
                          }`}>
                            {follower.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#191919] p-8 rounded-xl border border-[#333] text-center">
              <Users size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-lg mb-2">Aún no tienes seguidores</p>
              <p className="text-gray-400 mb-4">Cuando alguien comience a copiar tus operaciones, aparecerá aquí</p>
              <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4 mt-4 max-w-md mx-auto">
                <p className="text-sm text-gray-300">
                  💡 <strong>Consejo:</strong> Mejora tu rendimiento y visibilidad para atraer más seguidores
                </p>
              </div>
            </div>
          )}
        </div>
      )}

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
        onConfirm={async (formData, traderData, accountData) => {
          console.log('Copiar trader confirmado desde dashboard:', formData);
          console.log('Trader recibido:', traderData);
          console.log('Cuenta recibida:', accountData);
          console.log('Debug - account:', accountData);
          console.log('Debug - trader:', traderData);
          
          // Use the passed data or fallback to component state
          const finalTrader = traderData || selectedTraderForCopy;
          const finalAccount = accountData || selectedAccountForCopy;
          
          await handleFollowTrader(formData, finalTrader, finalAccount);
        }}
      />
    </div>
  );
};

// For debugging purposes
window.handleViewTraderDetails = (trader) => {
  console.log("Global handleViewTraderDetails called with:", trader);
};

export default CopytradingDashboard;