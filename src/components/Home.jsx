import React, { useState, useRef, useEffect } from 'react';
import Settings from './Settings';
import UserInformationContent from './UserInformationContent';
import NotificationsModal from './NotificationsModal';
import { ChevronDown, ArrowDown, ArrowUp, SlidersHorizontal, Settings as SettingsIcon, Bell, AlertCircle, CheckCircle, X, TrendingUp, TrendingDown, Target, Activity, BarChart2, Zap } from 'lucide-react';
import { useAccounts, WALLET_OPERATIONS, ACCOUNT_CATEGORIES } from '../contexts/AccountsContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseAdapter } from '../services/database.adapter';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import LanguageSelector from './LanguageSelector';
import accountMetricsOptimized from '../services/accountMetricsOptimized';
import { DashboardCardLoader, UserInfoLoader, KYCStatusLoader, useMinLoadingTime } from './WaveLoader';
import { HomeDashboardLoader } from './ExactLayoutLoaders';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// Rate limit: 10 minutes between refreshes per account
const METRICS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Mini sparkline chart component for account cards
const AccountSparkline = ({ data, color = '#22d3ee', isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="h-16 w-full flex items-center justify-center">
        <div className="flex gap-1">
          <div className="w-1 h-8 bg-cyan-500/30 rounded animate-pulse" />
          <div className="w-1 h-12 bg-cyan-500/30 rounded animate-pulse" style={{ animationDelay: '100ms' }} />
          <div className="w-1 h-6 bg-cyan-500/30 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="w-1 h-10 bg-cyan-500/30 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="w-1 h-14 bg-cyan-500/30 rounded animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-16 w-full flex items-center justify-center">
        <span className="text-[10px] text-gray-500">Sin historial</span>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((item, index) => ({
    index,
    value: parseFloat(item.equity || item.balance || item.value || 0)
  }));

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sparkGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              backgroundColor: '#191919',
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: '11px',
              padding: '6px 10px'
            }}
            formatter={(value) => [`$${value.toLocaleString()}`, '']}
            labelFormatter={() => ''}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#sparkGradient-${color.replace('#', '')})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Win rate circular indicator
const WinRateCircle = ({ percentage, size = 40 }) => {
  const radius = (size / 2) - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className={`transform -rotate-90`} style={{ width: size, height: size }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#333"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={percentage >= 50 ? '#22c55e' : '#ef4444'}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className={`absolute text-[10px] font-bold ${percentage >= 50 ? 'text-green-400' : 'text-red-400'}`}>
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
};

// Timestamp component for last update
const LastUpdatedBadge = ({ timestamp }) => {
  if (!timestamp) return null;

  const getTimeAgo = () => {
    const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60));
  const color = minutes < 5 ? 'text-green-400' : minutes < 30 ? 'text-yellow-400' : 'text-gray-400';

  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${minutes < 5 ? 'bg-green-400' : minutes < 30 ? 'bg-yellow-400' : 'bg-gray-400'}`} />
      <span className="text-[9px]">{getTimeAgo()}</span>
    </div>
  );
};

const fondoTarjetaUrl = "/fondoTarjeta.png";

const Home = ({ onSettingsClick, setSelectedOption, user }) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation(['dashboard', 'common', 'wallet']);
  const { 
    accounts, 
    selectedAccount, 
    activeCategory, 
    isLoading,
    error,
    selectAccount, 
    setActiveCategory,
    startWalletOperation,
    getAllAccounts,
    getAccountsByCategory,
    WALLET_OPERATIONS: WOP,
    ACCOUNT_CATEGORIES: ACC_CAT
  } = useAccounts();
  
  const { 
    unreadCount, 
    markAllAsRead 
  } = useNotifications();
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [userProfileData, setUserProfileData] = useState({
    photoURL: '/Perfil.png',
    nombre: '',
    apellido: ''
  });
  const [accountFilter, setAccountFilter] = useState('all'); // 'all', 'real', 'demo'
  const [kycCardDismissed, setKycCardDismissed] = useState(() => {
    if (!user?.id) return false;
    const key = `kycApprovedDismissed_${user.id}`;
    return localStorage.getItem(key) === 'true';
  });
  const [accountsMetrics, setAccountsMetrics] = useState({});
  const [metricsLoading, setMetricsLoading] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const dropdownRef = useRef(null);
  
  // Use minimum loading time of 2 seconds - DISABLED for refresh issues
  const showLoader = false; // Disabled to prevent stuck loading on refresh

  // Simular carga inicial de datos - DISABLED
  useEffect(() => {
    const loadInitialData = async () => {
      // setInitialLoading(true); // Disabled to prevent stuck loading
      try {
        // Esperar a que los datos estén disponibles
        await new Promise(resolve => {
          const checkData = setInterval(() => {
            if (user && accounts !== undefined) {
              clearInterval(checkData);
              resolve();
            }
          }, 100);
          // Timeout después de 2 segundos (reducido)
          setTimeout(() => {
            clearInterval(checkData);
            resolve();
          }, 2000);
        });
      } finally {
        // setInitialLoading(false); // Disabled to prevent stuck loading
      }
    };
    
    // Solo cargar si user y currentUser están disponibles
    if (user && currentUser) {
      loadInitialData();
    }
  }, [user, currentUser]);

  // Función para cerrar permanentemente el cartel KYC aprobado
  const dismissKycCard = () => {
    if (!user?.id) return;
    const key = `kycApprovedDismissed_${user.id}`;
    setKycCardDismissed(true);
    localStorage.setItem(key, 'true');
  };

  // Función para renderizar el cartel KYC según su estado
  const renderKycCard = () => {
    // No mostrar si ha sido cerrado y está aprobado
    if (kycCardDismissed && user?.kyc_status === 'approved') {
      return null;
    }

    // No mostrar si ya está aprobado y no se ha cerrado aún
    if (user?.kyc_status === 'approved') {
      return (
        <div className="w-[300px] p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/50 flex flex-col justify-center relative">
          <button
            onClick={dismissKycCard}
            className="absolute top-3 right-3 text-green-500 hover:text-green-400 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-500 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">
                {t('dashboard:kycCard.approved.title')}
              </h3>
              <p className="text-gray-300 text-sm">
                {t('dashboard:kycCard.approved.message')}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No mostrar para usuarios sin KYC definido o ya aprobado
    if (!user?.kyc_status || user?.kyc_status === 'approved') {
      return null;
    }

    // Configuración según el estado
    const getKycConfig = () => {
      switch (user?.kyc_status) {
        case 'pending':
          return {
            colors: 'from-blue-500/10 to-cyan-500/10 border-blue-500/50',
            iconColor: 'text-blue-500',
            icon: AlertCircle,
            title: t('dashboard:kycCard.pending.title'),
            message: t('dashboard:kycCard.pending.message'),
            buttonText: t('dashboard:kycCard.pending.button'),
            buttonColors: 'bg-blue-500 hover:bg-blue-600 cursor-not-allowed',
            disabled: true
          };
        case 'rejected':
          return {
            colors: 'from-red-500/10 to-orange-500/10 border-red-500/50',
            iconColor: 'text-red-500',
            icon: AlertCircle,
            title: t('dashboard:kycCard.rejected.title'),
            message: t('dashboard:kycCard.rejected.message'),
            buttonText: t('dashboard:kycCard.rejected.button'),
            buttonColors: 'bg-red-500 hover:bg-red-600',
            disabled: false
          };
        default: // not_submitted or any other status
          return {
            colors: 'from-yellow-500/10 to-orange-500/10 border-yellow-500/50',
            iconColor: 'text-yellow-500',
            icon: AlertCircle,
            title: t('dashboard:kycCard.required.title'),
            message: t('dashboard:kycCard.required.message'),
            buttonText: t('dashboard:kycCard.required.button'),
            buttonColors: 'bg-yellow-500 hover:bg-yellow-600',
            disabled: false
          };
      }
    };

    const config = getKycConfig();
    const Icon = config.icon;

    return (
      <div className={`w-[300px] p-4 rounded-2xl bg-gradient-to-br ${config.colors} flex flex-col justify-center`}>
        <div className="flex items-start gap-3">
          <Icon className={`${config.iconColor} mt-1`} size={24} />
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">
              {config.title}
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              {config.message}
            </p>
            <button
              onClick={() => {
                if (!config.disabled) {
                  onSettingsClick && onSettingsClick(true, true);
                }
              }}
              className={`w-full ${config.buttonColors} text-white font-semibold py-2 px-4 rounded-lg transition-colors ${config.disabled ? 'opacity-75' : ''}`}
              disabled={config.disabled}
            >
              {config.buttonText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Cargar datos del usuario desde la base de datos
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const { data: userData, error } = await DatabaseAdapter.users.getById(currentUser.id);
        
        if (userData) {
          setUserProfileData({
            photoURL: userData.photourl || userData.photoURL || currentUser.photoURL || '/Perfil.png',
            nombre: userData.nombre || '',
            apellido: userData.apellido || ''
          });
        } else if (error) {
          console.error("Error loading user data:", error);
          // Si no hay datos en la base de datos, usar los datos del Auth
          setUserProfileData({
            photoURL: userData?.photourl || currentUser.photoURL || '/Perfil.png',
            nombre: currentUser.displayName?.split(' ')[0] || '',
            apellido: currentUser.displayName?.split(' ')[1] || ''
          });
        } else {
          // Si no hay datos en la base de datos, usar los datos del Auth
          setUserProfileData({
            photoURL: userData?.photourl || currentUser.photoURL || '/Perfil.png',
            nombre: currentUser.displayName?.split(' ')[0] || '',
            apellido: currentUser.displayName?.split(' ')[1] || ''
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback en caso de error
        setUserProfileData({
          photoURL: '/Perfil.png',
          nombre: '',
          apellido: ''
        });
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Refrescar datos cuando se regresa de la configuración de perfil
  useEffect(() => {
    if (!showUserInfo && currentUser) {
      // Recargar datos cuando se cierra el modal de configuración
      const fetchUserData = async () => {
        try {
          const { data: userData, error } = await DatabaseAdapter.users.getById(currentUser.id);
          
          if (userData) {
            setUserProfileData({
              photoURL: userData.photourl || userData.photoURL || currentUser.photoURL || '/Perfil.png',
              nombre: userData.nombre || '',
              apellido: userData.apellido || ''
            });
          } else if (error) {
            console.error("Error refreshing user data:", error);
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      };
      
      fetchUserData();
    }
  }, [showUserInfo, currentUser]);

  const toggleUserInfo = () => {
    setShowUserInfo(!showUserInfo);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      setTimeout(() => {
        markAllAsRead();
      }, 1000);
    }
  };

  const toggleMonthMenu = () => {
    setShowMonthMenu(!showMonthMenu);
  };

  const handleBackFromUserInfo = () => {
    setShowUserInfo(false);
  };

  const handleDeposit = () => {
    // Verificar KYC antes de permitir depositar
    if (user?.kyc_status !== 'approved') {
      toast.error(t('common:kyc.depositWithdrawBlocked'), {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '1px solid #dc2626'
        },
        icon: '⚠️'
      });
      return;
    }
    
    console.log("Deposit button clicked for account:", selectedAccount?.account_name);
    const operationData = startWalletOperation(WOP.DEPOSIT, selectedAccount);
    if (setSelectedOption) {
      setSelectedOption("Wallet", operationData);
    }
  };

  const handleWithdraw = () => {
    // Verificar KYC antes de permitir retirar
    if (user?.kyc_status !== 'approved') {
      toast.error(t('common:kyc.depositWithdrawBlocked'), {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '1px solid #dc2626'
        },
        icon: '⚠️'
      });
      return;
    }
    
    console.log("Withdraw button clicked for account:", selectedAccount?.account_name);
    const operationData = startWalletOperation(WOP.WITHDRAW, selectedAccount);
    if (setSelectedOption) {
      setSelectedOption("Wallet", operationData);
    }
  };

  const handleTransfer = () => {
    // Verificar KYC antes de permitir transferir
    if (user?.kyc_status !== 'approved') {
      toast.error(t('common:kyc.depositWithdrawBlocked'), {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '1px solid #dc2626'
        },
        icon: '⚠️'
      });
      return;
    }
    
    console.log("Transfer button clicked for account:", selectedAccount?.account_name);
    const operationData = startWalletOperation(WOP.TRANSFER, selectedAccount);
    if (setSelectedOption) {
      setSelectedOption("Wallet", operationData);
    }
  };

  const handleWalletAccountSelect = (account) => {
    console.log("Selected wallet account:", account);
    selectAccount(account);
    setShowAccountSelector(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountSelector(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Función para calcular PNL por períodos usando datos del servicio
  const calculatePnlByPeriod = (statistics, period) => {
    if (!statistics) {
      return { percentage: 0, amount: 0 };
    }

    // Los datos ya vienen calculados del backend según el período
    // Usar directamente los valores de statistics
    switch(period) {
      case 'today':
        // Usar net_pnl para el día actual si está disponible
        return {
          percentage: statistics.net_pnl_percentage || 0,
          amount: statistics.net_pnl || 0
        };
      case '7days':
        // Para 7 días, usar profit_loss si está disponible
        return {
          percentage: statistics.profit_loss_percentage || 0,
          amount: statistics.profit_loss || 0
        };
      case '30days':
        // Para 30 días, usar los datos generales del período
        return {
          percentage: statistics.net_pnl_percentage || 0,
          amount: statistics.net_pnl || 0
        };
      default:
        return { percentage: 0, amount: 0 };
    }
  };
  
  // Función mejorada para calcular PNL desde historial de balance
  const calculatePnlFromHistory = (balanceHistory, days, accountKpis = null) => {
    if (!balanceHistory || balanceHistory.length === 0) {
      return { percentage: 0, amount: 0 };
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    // Ordenar por timestamp (más antiguo primero)
    const sortedHistory = [...balanceHistory].sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date);
      const dateB = new Date(b.timestamp || b.date);
      return dateA - dateB;
    });

    // Balance actual (último snapshot)
    let endBalance = sortedHistory[sortedHistory.length - 1];
    const currentValue = parseFloat(endBalance.equity ?? endBalance.balance ?? endBalance.value ?? 0);

    // Encontrar el balance más cercano al inicio del período
    let startBalance = null;

    for (let i = sortedHistory.length - 1; i >= 0; i--) {
      const recordDate = new Date(sortedHistory[i].timestamp || sortedHistory[i].date);
      if (recordDate <= periodStart) {
        startBalance = sortedHistory[i];
        break;
      }
    }

    // Si no hay datos del inicio del período, usar el primer registro disponible
    if (!startBalance && sortedHistory.length > 0) {
      startBalance = sortedHistory[0];
    }

    if (!startBalance || !endBalance) {
      return { percentage: 0, amount: 0 };
    }

    // Obtener valor inicial del período
    let initialValue = parseFloat(startBalance.equity ?? startBalance.balance ?? startBalance.value ?? 0);

    // CORRECCIÓN: Para cuentas nuevas o períodos largos, usar balance inicial de KPIs
    // Solo si el período solicitado cubre toda la vida de la cuenta
    const firstSnapshotDate = new Date(sortedHistory[0].timestamp || sortedHistory[0].date);
    const accountAgeInDays = (now - firstSnapshotDate) / (1000 * 60 * 60 * 24);

    if (accountKpis?.initial_balance && (days >= accountAgeInDays || days >= 30)) {
      // Si el período solicitado es mayor que la edad de la cuenta, usar balance inicial real
      initialValue = parseFloat(accountKpis.initial_balance) || initialValue;
    }

    const profit = currentValue - initialValue;
    const percentage = initialValue > 0 ? (profit / initialValue) * 100 : 0;

    console.log(`[PNL ${days}d] Initial: $${initialValue.toFixed(2)}, Current: $${currentValue.toFixed(2)}, Profit: $${profit.toFixed(2)} (${percentage.toFixed(2)}%)`);

    return {
      percentage: percentage,
      amount: profit
    };
  };

  // Filtrar solo cuentas reales para el tablero principal
  const realAccountsOnly = getAccountsByCategory(ACC_CAT.REAL);
  
  // Obtener todas las cuentas y filtrarlas según el filtro seleccionado
  const getFilteredAccounts = () => {
    let filteredAccounts = [];
    
    if (accountFilter === 'real') {
      filteredAccounts = getAccountsByCategory(ACC_CAT.REAL);
    } else if (accountFilter === 'demo') {
      filteredAccounts = getAccountsByCategory(ACC_CAT.DEMO);
    } else {
      // 'all' - obtener todas las cuentas
      filteredAccounts = getAllAccounts();
    }
    
    // Ordenar por fecha de creación (más reciente primero) y tomar solo las últimas 3
    return filteredAccounts
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      })
      .slice(0, 3);
  };

  // Efecto para cargar métricas de las cuentas cuando cambien
  useEffect(() => {
    const loadAccountMetrics = async () => {
      const accountsToLoad = getFilteredAccounts();
      console.log('[HOME] Accounts to load metrics for:', accountsToLoad.map(a => a.account_number || a.login));

      if (accountsToLoad.length === 0) {
        console.log('[HOME] No accounts found to load metrics for');
        return;
      }

      for (const account of accountsToLoad) {
        // Evitar recargar si ya tenemos datos recientes (cache de 10 minutos)
        const cachedMetrics = accountsMetrics[account.account_number];
        if (cachedMetrics && cachedMetrics.lastUpdated &&
            (Date.now() - cachedMetrics.lastUpdated) < METRICS_CACHE_DURATION) {
          console.log(`[HOME] Using cached metrics for ${account.account_number} (${Math.floor((Date.now() - cachedMetrics.lastUpdated) / 1000)}s old)`);
          continue;
        }
        
        setMetricsLoading(prev => ({ ...prev, [account.account_number]: true }));
        
        try {
          // Obtener todos los datos del dashboard (incluye KPIs, statistics, balance history)
          const dashboardData = await accountMetricsOptimized.getDashboardData(
            account.account_number,
            'month'
          );
          
          // Calcular PNL por períodos
          let pnlToday = { percentage: 0, amount: 0 };
          let pnl7Days = { percentage: 0, amount: 0 };
          let pnl30Days = { percentage: 0, amount: 0 };
          
          // Primero intentar usar los datos de statistics si están disponibles
          if (dashboardData.statistics) {
            // Para el día actual, calcular desde el historial si está disponible
            if (dashboardData.balance_history && dashboardData.balance_history.length > 0) {
              console.log(`[HOME-PNL] Using balance_history (${dashboardData.balance_history.length} points) for account ${account.account_number}`);
              // Pasar los KPIs para cálculos más precisos
              pnlToday = calculatePnlFromHistory(dashboardData.balance_history, 1, dashboardData.kpis);
              pnl7Days = calculatePnlFromHistory(dashboardData.balance_history, 7, dashboardData.kpis);
              pnl30Days = calculatePnlFromHistory(dashboardData.balance_history, 30, dashboardData.kpis);
            } else {
              console.log(`[HOME-PNL] No balance_history available for account ${account.account_number}, using KPIs fallback`);
              // Fallback: calcular PNL usando balance inicial y actual de los KPIs
              if (dashboardData.kpis) {
                const initialBalance = parseFloat(dashboardData.kpis.initial_balance) || 0;
                const currentBalance = parseFloat(dashboardData.kpis.equity || dashboardData.kpis.balance) || 0;
                const profit = currentBalance - initialBalance;
                const percentage = initialBalance > 0 ? (profit / initialBalance) * 100 : 0;

                console.log(`[HOME-PNL-FALLBACK] Account ${account.account_number}: initial=${initialBalance}, current=${currentBalance}, profit=${profit}, percentage=${percentage}%`);

                pnlToday = { percentage, amount: profit };
                pnl7Days = { percentage, amount: profit }; // Sin historial, usar los mismos datos
                pnl30Days = { percentage, amount: profit };
              } else {
                console.log(`[HOME-PNL] No KPIs available for account ${account.account_number}, using statistics fallback`);
                // Último fallback a usar statistics directamente
                pnlToday = {
                  percentage: dashboardData.statistics.net_pnl_percentage || 0,
                  amount: dashboardData.statistics.net_pnl || 0
                };
                pnl7Days = pnlToday;
                pnl30Days = pnlToday;
              }
            }
          }

          // Si tenemos profit_loss en KPIs, usar eso para el total
          const totalPnlPercentage = dashboardData.kpis?.profit_loss_percentage || 0;
          const totalPnlAmount = dashboardData.kpis?.profit_loss || 0;

          console.log(`[HOME-PNL-TOTAL] Account ${account.account_number}: total PNL = ${totalPnlAmount} (${totalPnlPercentage}%)`);
          
          setAccountsMetrics(prev => ({
            ...prev,
            [account.account_number]: {
              ...dashboardData,
              pnlToday,
              pnl7Days,
              pnl30Days,
              totalPnl: {
                percentage: totalPnlPercentage,
                amount: totalPnlAmount
              },
              lastUpdated: Date.now()
            }
          }));
        } catch (error) {
          console.error('Error loading metrics for account:', account.account_number, error);
          
          // En caso de error, intentar calcular PNL básico si tenemos balance inicial
          let basicPnl = { percentage: 0, amount: 0 };
          if (account.initial_balance && account.balance) {
            const initialBalance = parseFloat(account.initial_balance) || 0;
            const currentBalance = parseFloat(account.balance) || 0;
            const profit = currentBalance - initialBalance;
            const percentage = initialBalance > 0 ? (profit / initialBalance) * 100 : 0;
            
            basicPnl = { percentage, amount: profit };
          }
          
          setAccountsMetrics(prev => ({
            ...prev,
            [account.account_number]: {
              kpis: {
                balance: account.balance || 0,
                initial_balance: account.initial_balance || 0,
                profit_loss_percentage: basicPnl.percentage,
                profit_loss: basicPnl.amount
              },
              statistics: {},
              pnlToday: basicPnl,
              pnl7Days: basicPnl,
              pnl30Days: basicPnl,
              totalPnl: basicPnl,
              lastUpdated: Date.now()
            }
          }));
        } finally {
          setMetricsLoading(prev => ({ ...prev, [account.account_number]: false }));
        }
      }
    };
    
    const allAccounts = getAllAccounts();
    console.log('[HOME] useEffect triggered - isLoading:', isLoading, 'allAccounts.length:', allAccounts.length);

    if (!isLoading && allAccounts.length > 0) {
      console.log('[HOME] Calling loadAccountMetrics...');
      loadAccountMetrics();
    } else {
      console.log('[HOME] Skipping metrics load - isLoading:', isLoading, 'accounts:', allAccounts.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountFilter, accounts, isLoading]);

  if (showUserInfo) {
    return (
      <UserInformationContent onBack={handleBackFromUserInfo} />
    );
  }

  // Show loader during initial loading - DISABLED to prevent stuck loading
  // if (showLoader) {
  //   return <HomeDashboardLoader />;
  // }

  return (
    <div className="border border-[#333] rounded-3xl p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white min-h-screen flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl relative">
        <div className="absolute inset-0 border-solid border-t border-l border-r border-cyan-500 rounded-2xl"></div>

        <div className="mb-3 sm:mb-0">
          <h1 className="text-xl md:text-2xl font-semibold">
            {t('dashboard:welcome', { name: userProfileData.nombre || currentUser?.displayName?.split(' ')[0] || user?.username || 'Usuario' })}
          </h1>
          <p className="text-sm md:text-base text-gray-400">{new Date().toLocaleDateString(t('common:time.locale'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}</p>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4 w-full sm:w-auto justify-end">
          <button 
            className="relative rounded-full bg-transparent p-2 hover:ring-1 hover:ring-cyan-400 transition-all duration-200"
            style={{ outline: 'none' }}
            onClick={() => onSettingsClick && onSettingsClick()}
          >
            <SettingsIcon className="h-6 w-6 text-white" />
          </button>
          
          <button 
            className="relative rounded-full bg-transparent p-2 hover:ring-1 hover:ring-cyan-400 transition-all duration-200"
            style={{ outline: 'none' }}
            onClick={toggleNotifications}
          >
            <div className="relative">
              <Bell className="h-6 w-6 text-white" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border border-[#2B2B2B]"></div>
              )}
            </div>
          </button>
          
          <div className="flex items-center space-x-2 relative">
            <button 
              onClick={toggleUserInfo}
              className="focus:outline-none bg-transparent p-1 hover:ring-1 hover:ring-cyan-400 rounded-full transition-all duration-200"
            >
              <img 
                src={userProfileData.photoURL} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover" 
                onError={(e) => {
                  e.target.src = "/Perfil.png"; // Fallback a la imagen por defecto
                }}
              />
            </button>
          </div>
          
          {/* Language Selector - 4ta opción (última) */}
          <LanguageSelector />
        </div>
      </div>

      {/* Main banner with KYC reminder */}
      <div className="mb-6">
        <div className={`flex gap-4`}>
          {/* Main Welcome Banner */}
          <div 
            className={`${renderKycCard() ? 'flex-1' : 'w-full'} p-4 md:p-6 rounded-2xl relative flex flex-col justify-center border-solid border-t border-l border-r border-cyan-500`}
          >
            <div 
              className="absolute inset-0 rounded-md"
              style={{ 
                backgroundImage: `url(${fondoTarjetaUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.2,
                zIndex: 0
              }}
            ></div>
            <div className="relative z-10 py-4">
              <h2 className="text-xl md:text-3xl font-bold mb-3">{t('common:home.welcomeTitle')}</h2>
              <p className="text-base md:text-lg mb-4">{t('common:home.welcomeSubtitle')}</p>
              <button 
                className={`relative bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-4 rounded-md transition ${
                  user?.kyc_status !== 'approved' 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:opacity-90'
                }`}
                style={{ outline: 'none' }}
                onClick={() => {
                  if (user?.kyc_status === 'approved') {
                    setSelectedOption && setSelectedOption(t('common:home.newAccount'));
                  } else {
                    toast.error(t('common:kyc.featureBlocked'), {
                      duration: 4000,
                      position: 'top-right',
                      style: {
                        background: '#1f2937',
                        color: '#fff',
                        border: '1px solid #dc2626'
                      },
                      icon: '⚠️'
                    });
                  }
                }}
              >
                {user?.kyc_status !== 'approved' && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-black text-xs font-bold">!</span>
                  </span>
                )}
                {t('common:home.getStarted')}
              </button>
            </div>
          </div>

          {/* KYC Verification Dynamic Card */}
          {renderKycCard()}
        </div>
      </div>

      <div className="mb-6 p-4 md:p-6 border-solid border-t border-l border-r border-cyan-500 rounded-2xl bg-gradient-to-br from-[#232323] to-[#2b2b2b]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
          <div className="flex-1 space-y-3">
            <div className="relative inline-block w-full max-w-xs" ref={dropdownRef}>
              <button
                onClick={() => setShowAccountSelector(prev => !prev)}
                className="flex items-center w-full px-9 py-3.5 rounded-xl border border-[#333] bg-gradient-to-br from-[#232323] to-[#202020] hover:bg-[#2a2a2a] transition text-sm gap-x-4 md:gap-x-0 md:justify-between"
                style={{ outline: 'none' }}
                disabled={isLoading}
              >
                <span className="truncate">
                  {selectedAccount ? selectedAccount.account_name : t('common:general.selectAccount')}
                </span>
                <img src='/Filter.svg' width={23} />
              </button>
              {showAccountSelector && (
                  <div className="absolute top-full left-0 z-10 mt-1 w-full max-w-xs bg-[#232323] border border-[#444] rounded-md shadow-lg text-sm py-1 overflow-y-auto max-h-60">
                    {isLoading ? (
                      <div className="px-4 py-2 text-gray-500">{t('messages.loading', { ns: 'common' })}</div>
                    ) : error ? (
                      <div className="px-4 py-2 text-red-400">{t('common.error')}: {error}</div>
                    ) : realAccountsOnly.length > 0 ? (
                      <div className="px-2 pt-2">
                        <div className="px-2 pb-1 text-xs text-gray-500 font-semibold uppercase">{t('dashboard:accountSummary.realAccounts')}</div>
                        {realAccountsOnly.map(account => (
                          <button
                            key={account.id}
                            onClick={() => handleWalletAccountSelect(account)}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-[#333] text-gray-300 hover:text-white block truncate"
                          >
                            {account.account_name} - ${(account.balance || 0).toFixed(2)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-2 text-gray-500">{t('common:general.noAccountsAvailable')}</div>
                    )}
                  </div>
              )}
            </div>

            <div className="space-y-1 pt-3">
              <h3 className="text-base text-gray-400">{t('common:general.accountNumber')}:</h3>
              <p className="text-lg font-medium text-white">
                {selectedAccount?.account_number || t('common:general.selectAccount')}
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-base text-gray-400">{t('common:general.balance')} (USD)</h3>
              <p className="text-3xl font-bold text-white">
                ${(selectedAccount?.balance || 0).toFixed(2)}
              </p>
              {selectedAccount && (
                <p className="text-sm text-gray-400">
                  {selectedAccount.account_type} • {selectedAccount.account_type_selection}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
             <button
               onClick={handleDeposit}
               className={`relative bg-[#2a2a2a] border py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base ${
                 selectedAccount && user?.kyc_status === 'approved'
                   ? 'border-cyan-500/50 hover:border-cyan-500/80 text-white hover:bg-[#333] cursor-pointer' 
                   : 'border-gray-600/50 text-gray-500 cursor-not-allowed opacity-50'
               }`}
               style={{ outline: 'none' }}
               disabled={!selectedAccount}
             >
               {user?.kyc_status !== 'approved' && (
                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                   <span className="text-black text-xs font-bold">!</span>
                 </span>
               )}
               {t('wallet:deposit.title')}
               <ArrowDown size={16} className="transform -rotate-90"/>
             </button>
             <button
               onClick={handleWithdraw}
               className={`relative bg-[#2a2a2a] border py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base ${
                 selectedAccount && user?.kyc_status === 'approved'
                   ? 'border-cyan-500/50 hover:border-cyan-500/80 text-gray-300 hover:text-white hover:bg-[#333] cursor-pointer' 
                   : 'border-gray-600/50 text-gray-500 cursor-not-allowed opacity-50'
               }`}
               style={{ outline: 'none' }}
               disabled={!selectedAccount}
             >
               {user?.kyc_status !== 'approved' && (
                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                   <span className="text-black text-xs font-bold">!</span>
                 </span>
               )}
               {t('wallet:withdraw.title')}
                <ArrowUp size={16} className="transform -rotate-90"/>
             </button>
             <button
               onClick={handleTransfer}
               className={`relative bg-[#2a2a2a] border py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base ${
                 selectedAccount && user?.kyc_status === 'approved'
                   ? 'border-cyan-500/50 hover:border-cyan-500/80 text-gray-300 hover:text-white hover:bg-[#333] cursor-pointer' 
                   : 'border-gray-600/50 text-gray-500 cursor-not-allowed opacity-50'
               }`}
               style={{ outline: 'none' }}
               disabled={!selectedAccount}
             >
               {user?.kyc_status !== 'approved' && (
                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                   <span className="text-black text-xs font-bold">!</span>
                 </span>
               )}
               {t('wallet:transfer.title')}
               <SlidersHorizontal size={16} className="transform rotate-90"/>
             </button>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-3xl border border-[#333]"> 
         <h2 className="text-2xl font-semibold text-white mb-4">{t('dashboard:sidebar.items.accounts')}</h2>
         <div className="flex flex-wrap items-center gap-3 mb-5">
             <button
                 onClick={() => setAccountFilter('all')}
                 className={`py-2 px-6 text-sm md:text-base font-medium rounded-full transition-colors focus:outline-none border ${
                   accountFilter === 'all' 
                     ? 'bg-gradient-to-br from-[#232323] to-[#202020] border-cyan-500 text-white' 
                     : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-500'
                 }`}
             >
                 {t('common:buttons.all')} ({getAllAccounts().length})
             </button>
             <button
                 onClick={() => setAccountFilter('real')}
                 className={`py-2 px-6 text-sm md:text-base font-medium rounded-full transition-colors focus:outline-none border ${
                   accountFilter === 'real' 
                     ? 'bg-gradient-to-br from-[#232323] to-[#202020] border-cyan-500 text-white' 
                     : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-500'
                 }`}
             >
                 {t('dashboard:accountSummary.realAccounts')} ({realAccountsOnly.length})
             </button>
             <button
                 onClick={() => setAccountFilter('demo')}
                 className={`py-2 px-6 text-sm md:text-base font-medium rounded-full transition-colors focus:outline-none border ${
                   accountFilter === 'demo' 
                     ? 'bg-gradient-to-br from-[#232323] to-[#202020] border-cyan-500 text-white' 
                     : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-500'
                 }`}
             >
                 {t('dashboard:accountSummary.demoAccounts')} ({getAccountsByCategory(ACC_CAT.DEMO).length})
             </button>
         </div>

         {isLoading ? (
           <div className="text-center py-8">
             <img src="/logo.png" alt="Loading" className="h-10 w-10 mx-auto mb-2 animate-pulse" />
             <p className="text-gray-400">{t('messages.loading', { ns: 'common' })}</p>
           </div>
         ) : error ? (
           <div className="text-center py-8">
             <p className="text-red-400">{t('common.error')}: {error}</p>
           </div>
         ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
             {getFilteredAccounts().length > 0 ? getFilteredAccounts().map((account) => {
               const metrics = accountsMetrics[account.account_number];
               const isLoadingMetrics = metricsLoading[account.account_number];

               // Datos de la cuenta mejorados
               const currentBalance = metrics?.kpis?.equity || metrics?.kpis?.balance || account.balance || 0;
               const totalPnlPercentage = metrics?.totalPnl?.percentage || metrics?.kpis?.profit_loss_percentage || 0;
               const winRate = metrics?.statistics?.win_rate || 0;
               const totalTrades = metrics?.statistics?.total_trades || 0;
               const balanceHistory = metrics?.balance_history || [];
               const chartColor = totalPnlPercentage >= 0 ? '#22c55e' : '#ef4444';
               const accountType = account.account_type?.toUpperCase() || 'DEMO';

               return (
                 <div
                   key={account.id}
                   className="group relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#2a2a2a] rounded-2xl transition-all duration-500 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 hover:scale-[1.02]"
                 >
                   {/* Glow effect */}
                   <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                   {/* Header */}
                   <div className="relative p-4 pb-2">
                     <div className="flex justify-between items-start mb-3">
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                           <h3 className="text-lg font-bold text-white truncate">{account.account_name}</h3>
                           <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${accountType === 'REAL' ? 'bg-green-500/20 text-green-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{accountType}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-2xl font-bold text-white">${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                           {isLoadingMetrics ? (
                             <div className="animate-pulse h-5 w-14 bg-gray-700/50 rounded" />
                           ) : (
                             <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${totalPnlPercentage >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                               {totalPnlPercentage >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                               {totalPnlPercentage >= 0 ? '+' : ''}{totalPnlPercentage.toFixed(1)}%
                             </span>
                           )}
                         </div>
                       </div>
                       <LastUpdatedBadge timestamp={metrics?.lastUpdated} />
                     </div>

                     {/* Sparkline Chart */}
                     <div className="mt-2 -mx-2">
                       <AccountSparkline data={balanceHistory} color={chartColor} isLoading={isLoadingMetrics} />
                     </div>
                   </div>

                   {/* KPIs Grid */}
                   <div className="relative px-4 pb-3">
                     <div className="grid grid-cols-4 gap-2">
                       <div className="flex flex-col items-center p-2 bg-[#1a1a1a]/80 rounded-lg border border-[#2a2a2a]">
                         {isLoadingMetrics ? <div className="animate-pulse h-10 w-10 bg-gray-700/50 rounded-full" /> : <WinRateCircle percentage={winRate} size={36} />}
                         <span className="text-[8px] text-gray-500 mt-1 uppercase">Win</span>
                       </div>
                       <div className="flex flex-col items-center justify-center p-2 bg-[#1a1a1a]/80 rounded-lg border border-[#2a2a2a]">
                         {isLoadingMetrics ? <div className="animate-pulse h-4 w-10 bg-gray-700/50 rounded" /> : (
                           <>
                             <span className={`text-xs font-bold ${(metrics?.pnlToday?.percentage || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{(metrics?.pnlToday?.percentage || 0) >= 0 ? '+' : ''}{(metrics?.pnlToday?.percentage || 0).toFixed(1)}%</span>
                             <span className="text-[8px] text-gray-500 uppercase">Hoy</span>
                           </>
                         )}
                       </div>
                       <div className="flex flex-col items-center justify-center p-2 bg-[#1a1a1a]/80 rounded-lg border border-[#2a2a2a]">
                         {isLoadingMetrics ? <div className="animate-pulse h-4 w-10 bg-gray-700/50 rounded" /> : (
                           <>
                             <span className={`text-xs font-bold ${(metrics?.pnl7Days?.percentage || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{(metrics?.pnl7Days?.percentage || 0) >= 0 ? '+' : ''}{(metrics?.pnl7Days?.percentage || 0).toFixed(1)}%</span>
                             <span className="text-[8px] text-gray-500 uppercase">7D</span>
                           </>
                         )}
                       </div>
                       <div className="flex flex-col items-center justify-center p-2 bg-[#1a1a1a]/80 rounded-lg border border-[#2a2a2a]">
                         {isLoadingMetrics ? <div className="animate-pulse h-4 w-8 bg-gray-700/50 rounded" /> : (
                           <>
                             <span className="text-xs font-bold text-cyan-400">{totalTrades}</span>
                             <span className="text-[8px] text-gray-500 uppercase">Trades</span>
                           </>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Action Button */}
                   <div className="relative px-4 pb-4">
                     <button
                       onClick={() => {
                         if (setSelectedOption) {
                           setSelectedOption("Cuentas", {
                             accountId: account.id,
                             viewMode: 'details',
                             directNavigation: true
                           });
                         }
                       }}
                       className="w-full py-2.5 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 rounded-xl font-medium text-sm transition-all duration-300 hover:from-cyan-600/40 hover:to-blue-600/40 hover:border-cyan-500/60 hover:text-white flex items-center justify-center gap-2"
                       style={{ outline: 'none' }}
                     >
                       <BarChart2 size={14} />
                       {t('common:general.view')} {t('common:general.details')}
                     </button>
                   </div>
                 </div>
               );
             }) : (
                   <p className="text-gray-500 sm:col-span-2 lg:col-span-3 text-center py-4">
                     {t('common:general.noAccountsInCategory')}
                   </p>
              )}
         </div>
         )}
      </div>

      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default Home;
