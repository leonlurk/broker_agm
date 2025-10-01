import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend, CartesianGrid, LabelList, Tooltip } from 'recharts';
import { useAccounts, ACCOUNT_CATEGORIES } from '../contexts/AccountsContext';
import { Copy, Eye, EyeOff, Check, X, Settings, Menu, Filter, ArrowUpRight, Star, Search as SearchIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
// import { updateInvestorPassword } from '../services/tradingAccounts'; // Ya no necesario, investor password es solo lectura
import { scrollToTopManual } from '../hooks/useScrollToTop';
import { DatabaseAdapter } from '../services/database.adapter';
import CustomDropdown from './utils/CustomDropdown';
import CustomTooltip from './utils/CustomTooltip';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
// Importar servicio optimizado
import accountMetricsOptimized from '../services/accountMetricsOptimized';
// Importar servicio estandarizado para datos de equity
import equityDataService from '../services/equityDataService';
import { 
  getBalanceChartData, 
  recordBalanceSnapshot,
  getTradingOperations,
  getPerformanceChartData 
} from '../services/accountHistory';
import equityDirect from '../services/equityDirect';
// Auto-sync ya manejado por el backend scheduler
import { ListLoader, ChartLoader, useMinLoadingTime } from './WaveLoader';
import { TradingAccountsLayoutLoader } from './ExactLayoutLoaders';

// --- Instrument Lists (from PipCalculator) ---
const forexInstruments = [
  // Major Pairs
  { value: 'EUR/USD', label: 'EUR/USD', type: 'forex' },
  { value: 'GBP/USD', label: 'GBP/USD', type: 'forex' },
  { value: 'USD/JPY', label: 'USD/JPY', type: 'forex' },
  { value: 'USD/CHF', label: 'USD/CHF', type: 'forex' },
  { value: 'USD/CAD', label: 'USD/CAD', type: 'forex' },
  { value: 'AUD/USD', label: 'AUD/USD', type: 'forex' },
  { value: 'NZD/USD', label: 'NZD/USD', type: 'forex' },

  // Minor Pairs (Crosses) - EUR
  { value: 'EUR/GBP', label: 'EUR/GBP', type: 'forex' }, { value: 'EUR/JPY', label: 'EUR/JPY', type: 'forex' },
  { value: 'EUR/CHF', label: 'EUR/CHF', type: 'forex' }, { value: 'EUR/AUD', label: 'EUR/AUD', type: 'forex' },
  { value: 'EUR/CAD', label: 'EUR/CAD', type: 'forex' }, { value: 'EUR/NZD', label: 'EUR/NZD', type: 'forex' },
  { value: 'EUR/NOK', label: 'EUR/NOK', type: 'forex' }, { value: 'EUR/SEK', label: 'EUR/SEK', type: 'forex' },
  { value: 'EUR/PLN', label: 'EUR/PLN', type: 'forex' }, { value: 'EUR/HUF', label: 'EUR/HUF', type: 'forex' },
  { value: 'EUR/CZK', label: 'EUR/CZK', type: 'forex' }, { value: 'EUR/TRY', label: 'EUR/TRY', type: 'forex' },
  { value: 'EUR/ZAR', label: 'EUR/ZAR', type: 'forex' }, { value: 'EUR/SGD', label: 'EUR/SGD', type: 'forex' },
  { value: 'EUR/HKD', label: 'EUR/HKD', type: 'forex' }, { value: 'EUR/MXN', label: 'EUR/MXN', type: 'forex' },

  // Minor Pairs (Crosses) - GBP
  { value: 'GBP/JPY', label: 'GBP/JPY', type: 'forex' }, { value: 'GBP/CHF', label: 'GBP/CHF', type: 'forex' },
  { value: 'GBP/AUD', label: 'GBP/AUD', type: 'forex' }, { value: 'GBP/CAD', label: 'GBP/CAD', type: 'forex' },
  { value: 'GBP/NZD', label: 'GBP/NZD', type: 'forex' }, { value: 'GBP/NOK', label: 'GBP/NOK', type: 'forex' },
  { value: 'GBP/SEK', label: 'GBP/SEK', type: 'forex' }, { value: 'GBP/PLN', label: 'GBP/PLN', type: 'forex' },
  { value: 'GBP/ZAR', label: 'GBP/ZAR', type: 'forex' }, { value: 'GBP/SGD', label: 'GBP/SGD', type: 'forex' },

  // Minor Pairs (Crosses) - AUD
  { value: 'AUD/JPY', label: 'AUD/JPY', type: 'forex' }, { value: 'AUD/CHF', label: 'AUD/CHF', type: 'forex' },
  { value: 'AUD/CAD', label: 'AUD/CAD', type: 'forex' }, { value: 'AUD/NZD', label: 'AUD/NZD', type: 'forex' },
  { value: 'AUD/SGD', label: 'AUD/SGD', type: 'forex' }, { value: 'AUD/HKD', label: 'AUD/HKD', type: 'forex' },

  // Minor Pairs (Crosses) - NZD
  { value: 'NZD/JPY', label: 'NZD/JPY', type: 'forex' }, { value: 'NZD/CHF', label: 'NZD/CHF', type: 'forex' },
  { value: 'NZD/CAD', label: 'NZD/CAD', type: 'forex' }, { value: 'NZD/SGD', label: 'NZD/SGD', type: 'forex' },

  // Minor Pairs (Crosses) - CAD
  { value: 'CAD/JPY', label: 'CAD/JPY', type: 'forex' }, { value: 'CAD/CHF', label: 'CAD/CHF', type: 'forex' },
  { value: 'CAD/SGD', label: 'CAD/SGD', type: 'forex' },

  // Minor Pairs (Crosses) - CHF
  { value: 'CHF/JPY', label: 'CHF/JPY', type: 'forex' }, { value: 'CHF/NOK', label: 'CHF/NOK', type: 'forex' },
  { value: 'CHF/SEK', label: 'CHF/SEK', type: 'forex' },

  // Exotic Pairs
  { value: 'USD/NOK', label: 'USD/NOK', type: 'forex' }, { value: 'USD/SEK', label: 'USD/SEK', type: 'forex' },
  { value: 'USD/DKK', label: 'USD/DKK', type: 'forex' }, { value: 'USD/PLN', label: 'USD/PLN', type: 'forex' },
  { value: 'USD/HUF', label: 'USD/HUF', type: 'forex' }, { value: 'USD/CZK', label: 'USD/CZK', type: 'forex' },
  { value: 'USD/TRY', label: 'USD/TRY', type: 'forex' }, { value: 'USD/ZAR', label: 'USD/ZAR', type: 'forex' },
  { value: 'USD/MXN', label: 'USD/MXN', type: 'forex' }, { value: 'USD/SGD', label: 'USD/SGD', type: 'forex' },
  { value: 'USD/HKD', label: 'USD/HKD', type: 'forex' }, { value: 'USD/THB', label: 'USD/THB', type: 'forex' },
  { value: 'USD/CNH', label: 'USD/CNH', type: 'forex' }, { value: 'USD/ILS', label: 'USD/ILS', type: 'forex' },
  { value: 'USD/RUB', label: 'USD/RUB', type: 'forex' },

  // Other common exotic crosses
  { value: 'NOK/SEK', label: 'NOK/SEK', type: 'forex' },
  { value: 'SEK/NOK', label: 'SEK/NOK', type: 'forex' },
  { value: 'TRY/JPY', label: 'TRY/JPY', type: 'forex' },
  { value: 'ZAR/JPY', label: 'ZAR/JPY', type: 'forex' },
];

const stockInstruments = [
  { value: 'AAPL', label: 'Apple Inc. (AAPL)', type: 'stocks' },
  { value: 'MSFT', label: 'Microsoft Corp. (MSFT)', type: 'stocks' },
  { value: 'GOOGL', label: 'Alphabet Inc. (GOOGL)', type: 'stocks' },
  { value: 'AMZN', label: 'Amazon.com Inc. (AMZN)', type: 'stocks' },
  { value: 'TSLA', label: 'Tesla Inc. (TSLA)', type: 'stocks' },
  { value: 'NVDA', label: 'NVIDIA Corp. (NVDA)', type: 'stocks' },
  { value: 'JPM', label: 'JPMorgan Chase & Co. (JPM)', type: 'stocks' },
  { value: 'V', label: 'Visa Inc. (V)', type: 'stocks' },
  { value: 'XOM', label: 'Exxon Mobil Corp. (XOM)', type: 'stocks' },
  { value: 'GS', label: 'Goldman Sachs Group Inc. (GS)', type: 'stocks' },
];

const cryptoInstruments = [
  { value: 'BTC/USD', label: 'Bitcoin / USD (BTC/USD)', type: 'crypto' },
  { value: 'ETH/USD', label: 'Ethereum / USD (ETH/USD)', type: 'crypto' },
  { value: 'XRP/USD', label: 'Ripple / USD (XRP/USD)', type: 'crypto' },
  { value: 'LTC/USD', label: 'Litecoin / USD (LTC/USD)', type: 'crypto' },
  { value: 'ADA/USD', label: 'Cardano / USD (ADA/USD)', type: 'crypto' },
  { value: 'SOL/USD', label: 'Solana / USD (SOL/USD)', type: 'crypto' },
  { value: 'DOGE/USD', label: 'Dogecoin / USD (DOGE/USD)', type: 'crypto' },
  { value: 'DOT/USD', label: 'Polkadot / USD (DOT/USD)', type: 'crypto' },
];

const metalInstruments = [
  { value: 'XAU/USD', label: 'Gold / USD (XAU/USD)', type: 'metal' },
  { value: 'XAG/USD', label: 'Silver / USD (XAG/USD)', type: 'metal' },
  { value: 'XPT/USD', label: 'Platinum / USD (XPT/USD)', type: 'metal' },
  { value: 'XPD/USD', label: 'Palladium / USD (XPD/USD)', type: 'metal' },
  { value: 'XCU/USD', label: 'Copper / USD (XCU/USD)', type: 'metal' },
];

const indicesInstruments = [
  { value: 'SPX500', label: 'S&P 500 (SPX500)', type: 'index' },
  { value: 'US30', label: 'Dow Jones (US30)', type: 'index' },
  { value: 'NAS100', label: 'NASDAQ 100 (NAS100)', type: 'index' },
  { value: 'GER30', label: 'DAX 30 (GER30)', type: 'index' },
  { value: 'UK100', label: 'FTSE 100 (UK100)', type: 'index' },
  { value: 'JPN225', label: 'Nikkei 225 (JPN225)', type: 'index' },
  { value: 'FRA40', label: 'CAC 40 (FRA40)', type: 'index' },
  { value: 'AUS200', label: 'ASX 200 (AUS200)', type: 'index' },
];

const allInstruments = [...forexInstruments, ...stockInstruments, ...cryptoInstruments, ...metalInstruments, ...indicesInstruments];
// --- End Instrument Lists ---

// Options for custom dropdowns - will be translated inside component
const typeOptions = [
  { value: 'all', label: 'filters.all' },
  { value: 'buy', label: 'positions.types.buy' },
  { value: 'sell', label: 'positions.types.sell' },
];

const profitLossOptions = [
  { value: 'all', label: 'filters.all' },
  { value: 'profit', label: 'filters.profit' },
  { value: 'loss', label: 'filters.loss' },
];

const benefitChartFilterOptions = [
  { value: 'last7Days', label: 'filters.last7Days' },
  { value: 'last30Days', label: 'filters.last30Days' },
  { value: 'last90Days', label: 'filters.last90Days' },
  { value: 'custom', label: 'filters.custom' },
];

const rendimientoPeriodOptions = [
  { value: 'monthly', label: 'filters.monthly' },
  { value: 'quarterly', label: 'filters.quarterly' },
];

const TradingAccounts = ({ setSelectedOption, navigationParams, scrollContainerRef }) => {
  const { t } = useTranslation(['trading', 'common']);
  
  // Helper function to translate options for dropdowns
  const translateOptions = (options) => options.map(option => ({
    ...option,
    label: option.label.includes('.') ? t(option.label) : option.label
  }));
  const {
    accounts,
    isLoading,
    error,
    getAllAccounts,
    getAccountsByCategory,
    ACCOUNT_CATEGORIES: ACC_CAT,
    refreshAccounts
  } = useAccounts();

  const { currentUser, userData } = useAuth();

  // Determinar el estado inicial basado en los parámetros de navegación
  // para evitar el parpadeo de la doble navegación.
  const getInitialViewMode = () => {
    return navigationParams?.viewMode === 'details' && navigationParams?.accountId ? 'details' : 'overview';
  };

  const getInitialSelectedAccountId = () => {
    return navigationParams?.viewMode === 'details' ? navigationParams.accountId : null;
  };
  
  // Loading state
  const [initialLoading, setInitialLoading] = useState(false);
  const showLoader = false; // Disabled to prevent stuck loading on refresh
  
  // Usar la misma lógica que Home - estado simple para filtro
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAccountId, setSelectedAccountId] = useState(getInitialSelectedAccountId());
  const [viewMode, setViewMode] = useState(getInitialViewMode()); 
  
  // Estados para responsividad móvil
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false); 
  
  // Estados para la funcionalidad de copia y mostrar contraseñas
  const [showPasswords, setShowPasswords] = useState({
    master: false,
    investor: false
  });
  const [copiedField, setCopiedField] = useState(null);
  
  // Estados para el modal de configuración de contraseña investor
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const [investorPassword, setInvestorPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Estados para filtros del historial de operaciones
  const [historyFilters, setHistoryFilters] = useState({
    instrument: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    profitLoss: 'all'
  });
  
  // Estados para datos reales de MT5
  const [realMetrics, setRealMetrics] = useState(null);
  // Equity directo desde API sin Supabase
  const [directEquity, setDirectEquity] = useState(null);
  const [realStatistics, setRealStatistics] = useState(null);
  const [realInstruments, setRealInstruments] = useState(null);
  const [realPerformance, setRealPerformance] = useState(null);
  const [realHistory, setRealHistory] = useState(null);
  const [realBalanceChart, setRealBalanceChart] = useState(null);
  const [realBalanceHistory, setRealBalanceHistory] = useState(null);
  const [realPerformanceChart, setRealPerformanceChart] = useState(null);
  const [realTradingOperations, setRealTradingOperations] = useState(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [canRefresh, setCanRefresh] = useState(true);

  // State for new instrument filter
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);

  // Función para obtener tiempo transcurrido en minutos
  const getTimeAgoInMinutes = (timestamp) => {
    if (!timestamp) return null;
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    return diffInMinutes;
  };

  // Función para obtener días desde la creación
  const getDaysFromCreation = (createdDate) => {
    if (!createdDate) return null;
    const now = new Date();
    const created = createdDate?.toDate ? createdDate.toDate() : new Date(createdDate);
    const diffInTime = now - created;
    const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));
    return diffInDays;
  };
  const [instrumentSearchTerm, setInstrumentSearchTerm] = useState('');
  const [favoriteInstruments, setFavoriteInstruments] = useState([]);
  const [instrumentFilterType, setInstrumentFilterType] = useState('forex');
  const instrumentDropdownRef = useRef(null);

  // Estados para el gráfico de beneficio total
  const [benefitChartFilter, setBenefitChartFilter] = useState('last30Days');
  const [benefitChartTab, setBenefitChartTab] = useState('benefitTotal');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Estados para filtros del gráfico de rendimiento
  const [rendimientoFilters, setRendimientoFilters] = useState({
    year: '2025',
    period: 'monthly'
  });
  const [barChartTooltip, setBarChartTooltip] = useState(null);

  // Detectar dispositivo móvil
  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      // setInitialLoading(true); // Disabled to prevent stuck loading
      try {
        await getAllAccounts();
      } finally {
        // setInitialLoading(false); // Disabled to prevent stuck loading
      }
    };
    
    // Solo cargar si currentUser está disponible y tiene ID
    if (currentUser && currentUser.id) {
      loadInitialData();
    }
  }, [currentUser?.id]); // Remover getAllAccounts de dependencias

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Auto-sync COMPLETAMENTE DESHABILITADO - Ahora manejado por el backend scheduler
  useEffect(() => {
    // NO HACER NADA - Auto-sync deshabilitado y manejado por backend
    return () => {
      // Cleanup vacío - sync ahora es automático en el backend
    };
  }, [currentUser]);

  // --- Favorite Instruments Logic (from PipCalculator) ---
  useEffect(() => {
    if (currentUser) {
      const userId = currentUser.id;
      DatabaseAdapter.users.getById(userId).then(({ data, error }) => {
        if (data && data.favoriteHistoryInstruments) {
          setFavoriteInstruments(data.favoriteHistoryInstruments);
        }
      }).catch(error => {
        console.error("Error fetching favorite instruments:", error);
      });
    }
    return () => {
      if (!currentUser) setFavoriteInstruments([]);
    };
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (instrumentDropdownRef.current && !instrumentDropdownRef.current.contains(event.target)) {
        setShowInstrumentDropdown(false);
      }
    };
    if (showInstrumentDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInstrumentDropdown]);

  const toggleFavorite = async (instrumentValue) => {
    if (!currentUser) {
      setFavoriteInstruments(prev =>
        prev.includes(instrumentValue)
          ? prev.filter(fav => fav !== instrumentValue)
          : [...prev, instrumentValue]
      );
      return;
    }

    const isCurrentlyFavorite = favoriteInstruments.includes(instrumentValue);

    setFavoriteInstruments(prev =>
      isCurrentlyFavorite
        ? prev.filter(fav => fav !== instrumentValue)
        : [...prev, instrumentValue]
    );

    try {
      // Get current user data first
      const { data: currentUserData } = await DatabaseAdapter.users.getById(currentUser.id);
      const currentFavorites = currentUserData?.favoriteHistoryInstruments || [];
      
      let newFavorites;
      if (isCurrentlyFavorite) {
        newFavorites = currentFavorites.filter(fav => fav !== instrumentValue);
      } else {
        newFavorites = [...currentFavorites, instrumentValue];
      }

      // Update user data
      const { error } = await DatabaseAdapter.users.update(currentUser.id, {
        favoriteHistoryInstruments: newFavorites
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error updating favorite instruments in database:", error);
      // Revert if error occurs
      setFavoriteInstruments(prev =>
        isCurrentlyFavorite
          ? [...prev, instrumentValue]
          : prev.filter(fav => fav !== instrumentValue)
      );
    }

    try {
      const newFavorites = isCurrentlyFavorite 
        ? favoriteInstruments.filter(i => i !== instrumentValue)
        : [...favoriteInstruments, instrumentValue];
      
      await DatabaseAdapter.users.update(userId, { 
        favorite_pip_instruments: newFavorites 
      });
    } catch (error) {
      console.error("Error updating favorites in Firestore:", error);
      // Revert UI on error
      setFavoriteInstruments(prev => isCurrentlyFavorite ? [...prev, instrumentValue] : prev.filter(fav => fav !== instrumentValue));
    }
  };

  const getFilteredInstrumentsForDropdown = () => {
    let instrumentsToFilter = [];
    if (instrumentFilterType === 'forex') instrumentsToFilter = forexInstruments;
    else if (instrumentFilterType === 'stocks') instrumentsToFilter = stockInstruments;
    else if (instrumentFilterType === 'crypto') instrumentsToFilter = cryptoInstruments;
    else if (instrumentFilterType === 'metal') instrumentsToFilter = metalInstruments;
    else if (instrumentFilterType === 'index') instrumentsToFilter = indicesInstruments;

    const searched = instrumentsToFilter.filter(item =>
      item.label.toLowerCase().includes(instrumentSearchTerm.toLowerCase())
    );

    const favorites = searched.filter(item => favoriteInstruments.includes(item.value));
    const nonFavorites = searched.filter(item => !favoriteInstruments.includes(item.value));
    
    favorites.sort((a, b) => a.label.localeCompare(b.label));
    nonFavorites.sort((a, b) => a.label.localeCompare(b.label));

    return { favorites, nonFavorites };
  };

  const { favorites: favoriteFilteredInstruments, nonFavorites: nonFavoriteFilteredInstruments } = getFilteredInstrumentsForDropdown();
  const selectedInstrumentLabel = historyFilters.instrument === 'all' ? t('filters.all') : allInstruments.find(item => item.value === historyFilters.instrument)?.label || t('filters.all');
  // --- End Favorite Instruments Logic ---

  // Función para copiar al portapapeles
  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copiado al portapapeles`);
      
      // Resetear el estado de copiado después de 2 segundos
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      toast.error(t('trading.messages.copyError'));
    }
  };

  // Función para alternar visibilidad de contraseñas
  const togglePasswordVisibility = (type) => {
    setShowPasswords(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Función para abrir el modal de configuración de contraseña investor
  const openInvestorModal = () => {
    setShowInvestorModal(true);
    setInvestorPassword('');
    setConfirmPassword('');
  };

  // Función para cerrar el modal
  const closeInvestorModal = () => {
    setShowInvestorModal(false);
    setInvestorPassword('');
    setConfirmPassword('');
  };

  // Función para guardar la contraseña investor en Firebase
  const saveInvestorPassword = async () => {
    if (!currentUser || !selectedAccountId) {
      toast.error(t('trading.messages.invalidUserAccount'));
      return;
    }

    // Verificar que la cuenta seleccionada existe
    const selectedAccount = getAllAccounts().find(acc => acc.id === selectedAccountId);
    if (!selectedAccount) {
      toast.error(t('trading.messages.accountNotFound'));
      return;
    }

    if (!investorPassword.trim()) {
      toast.error(t('trading.messages.enterPassword'));
      return;
    }

    if (investorPassword !== confirmPassword) {
      toast.error(t('trading.messages.passwordMismatch'));
      return;
    }

    if (investorPassword.length < 6) {
      toast.error(t('trading.messages.passwordTooShort'));
      return;
    }

    setIsUpdatingPassword(true);
    const toastId = toast.loading('Configurando contraseña investor...');

    try {
      // Usar el servicio para actualizar la contraseña investor
      const result = await updateInvestorPassword(selectedAccountId, investorPassword);
      
      if (result.success) {
        toast.success(t('trading.messages.passwordUpdated'), { id: toastId });
        closeInvestorModal();
        
        // Refrescar las cuentas para mostrar los cambios
        if (refreshAccounts) {
          await refreshAccounts();
        }
      } else {
        toast.error(result.error || t('trading.messages.passwordSaveError'), { id: toastId });
      }
      
    } catch (error) {
      console.error('Error al configurar contraseña investor:', error);
      toast.error(t('trading.messages.passwordSaveError'), { id: toastId });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Replicar la lógica exacta de Home para filtros
  const realAccountsOnly = getAccountsByCategory(t('dashboard:accountSummary.realAccounts'));
  const demoAccountsOnly = getAccountsByCategory('Cuentas Demo');
  
  const getFilteredAccounts = () => {
    let filteredAccounts = [];
    
    if (activeTab === 'real') {
      filteredAccounts = realAccountsOnly;
    } else if (activeTab === 'demo') {
      filteredAccounts = demoAccountsOnly;
    // } else if (activeTab === 'copytrading') {
    //   filteredAccounts = getAccountsByCategory(ACC_CAT.COPYTRADING);
    // } else if (activeTab === 'pamm') {
    //   filteredAccounts = getAccountsByCategory(ACC_CAT.PAMM);
    } else {
      // 'all' - obtener todas las cuentas
      filteredAccounts = getAllAccounts();
    }
    
    // Debug logs
    console.log('[TradingAccounts] activeTab:', activeTab);
    console.log('[TradingAccounts] filteredAccounts:', filteredAccounts.length);
    console.log('[TradingAccounts] realAccountsOnly:', realAccountsOnly.length);
    console.log('[TradingAccounts] demoAccountsOnly:', demoAccountsOnly.length);
    
    return filteredAccounts;
  };

  const accountsForCurrentTab = getFilteredAccounts();
  
  // Debug logging
  console.log('[TradingAccounts] Current state:', {
    activeTab,
    accountsForCurrentTab: accountsForCurrentTab.length,
    isLoading,
    error
  });

  // Manejar navegación desde Home.jsx y actualizar la pestaña activa
  useEffect(() => {
    if (navigationParams && navigationParams.viewMode === 'details' && navigationParams.accountId) {
      console.log("[TradingAccounts] Processing navigation params:", navigationParams);
      
      const targetAccount = getAllAccounts().find(acc => acc.id === navigationParams.accountId);
      if (targetAccount) {
        // Determinar en qué categoría está la cuenta basándose en account_type
        if (realAccountsOnly.some(acc => acc.id === navigationParams.accountId)) {
          setActiveTab('real');
        } else if (demoAccountsOnly.some(acc => acc.id === navigationParams.accountId)) {
          setActiveTab('demo');
        } else {
          setActiveTab('all');
        }
      }
      
      // Asegurarse de que la vista se actualice si los parámetros cambian después del montaje.
      setViewMode('details');
      setSelectedAccountId(navigationParams.accountId);
      scrollToTopManual(scrollContainerRef);
    }
    // IMPORTANTE: NO resetear a overview si no hay navigationParams
    // Esto mantiene el estado actual cuando el componente se re-renderiza
    // Solo resetear si explícitamente se navega a otra sección
  }, [navigationParams?.accountId]); // Solo re-ejecutar si el accountId cambia específicamente
  
  const handleCreateAccount = () => {
    if (userData?.kyc_status !== 'approved') {
      toast.error(t('common:kyc.verificationRequired'), {
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
    setSelectedOption && setSelectedOption("Nueva Cuenta");
  };

  const handleViewDetails = (accountId) => {
    setSelectedAccountId(accountId);
    setViewMode('details');
    scrollToTopManual(scrollContainerRef); // Scroll al cambiar a vista de detalles
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedAccountId(null);
    scrollToTopManual(scrollContainerRef); // Scroll al volver a vista general
  };

  // Ref para prevenir llamadas duplicadas
  const loadingRef = useRef(false);
  const lastLoadedAccountRef = useRef(null);

  // Cargar equity directo sin Supabase cuando cambia la cuenta seleccionada
  useEffect(() => {
    const account = getAllAccounts().find(acc => acc.id === selectedAccountId);
    if (!account?.account_number) {
      setDirectEquity(null);
      return;
    }
    // Evitar llamada si ya tenemos equity desde dashboard
    if (realMetrics?.equity != null && !Number.isNaN(realMetrics.equity)) {
      setDirectEquity(null); // usar el de dashboard
      return;
    }
    let cancelled = false;
    (async () => {
      const { equity } = await equityDirect.getEquityDirect(account.account_number);
      if (!cancelled && equity !== null && !Number.isNaN(equity)) {
        setDirectEquity(equity);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedAccountId]); // Remover realMetrics de dependencias para evitar loops
  
  // Función para cargar métricas de una cuenta
  const loadAccountMetrics = useCallback(async (account) => {
    if (!account || !account.account_number) return;
    
    // Prevenir llamadas duplicadas para la misma cuenta
    if (loadingRef.current || lastLoadedAccountRef.current === account.account_number) {
      return;
    }
    
    loadingRef.current = true;
    
    // No mostrar loading en auto-refresh, solo en carga inicial
    if (!realMetrics && !realStatistics) {
      setIsLoadingMetrics(true);
    } else {
      // Si ya hay datos, mostrar indicador de refresh
      setIsRefreshing(true);
    }
    
    try {
      // Obtener todos los datos del dashboard desde el endpoint optimizado
      const dashboardData = await accountMetricsOptimized.getDashboardData(
        account.account_number,
        'month'
      );
      
      // Historial de balance: preferir el que ya viene en el dashboard para evitar 429
      const balanceHistory = Array.isArray(dashboardData?.balance_history) && dashboardData.balance_history.length > 0
        ? dashboardData.balance_history
        : await accountMetricsOptimized.getBalanceHistory(account.account_number, 'month');
      
      // Procesar datos del dashboard
        if (dashboardData) {
          // Actualizar métricas
          if (dashboardData.kpis) {
            console.log('[TradingAccounts] Usando métricas optimizadas:', dashboardData.kpis);
            // Hotfix: recalcular KPIs clave en frontend para asegurar consistencia
            try {
              const k = dashboardData.kpis;
              const initial = parseFloat(k.initial_balance ?? 0) || 0;
              
              // IMPORTANTE: Usar profit_loss del backend (desde operaciones cerradas)
              // NO recalcular desde equity - initial porque incluye depósitos
              const backendProfitLoss = parseFloat(k.profit_loss ?? 0);
              const backendProfitPct = parseFloat(k.profit_loss_percentage ?? 0);
              
              const fixedKpis = {
                ...k,
                initial_balance: initial,
                // Usar servicio estandarizado para datos consistentes
                balance: equityDataService.getAccountBalance(k),
                equity: equityDataService.getAccountEquity(k),
                // CRÍTICO: Usar valores del backend, no recalcular
                profit_loss: backendProfitLoss,
                profit_loss_percentage: backendProfitPct,
                total_deposits: initial,
                total_withdrawals: k.total_withdrawals ?? 0
              };
              setRealMetrics(fixedKpis);
            } catch(e) {
              setRealMetrics(dashboardData.kpis);
            }
          }
          
          // Actualizar estadísticas
          if (dashboardData.statistics) {
            console.log('[TradingAccounts] Usando estadísticas optimizadas:', dashboardData.statistics);
            setRealStatistics(dashboardData.statistics);
          }
          
          // Actualizar instrumentos
          if (dashboardData.instruments && dashboardData.instruments.length > 0) {
            console.log('[TradingAccounts] Usando instrumentos optimizados:', dashboardData.instruments);
            setRealInstruments({
              distribution: dashboardData.instruments,
              total_instruments: dashboardData.instruments.length,
              total_trades: dashboardData.statistics?.total_trades || 0
            });
          }
          
          // Actualizar historial de balance
          if (balanceHistory && balanceHistory.length > 0) {
            console.log('[TradingAccounts] Balance history recibido:', balanceHistory.length, 'puntos');
            console.log('[TradingAccounts] Balance history muestra:', balanceHistory.slice(0, 2));
            // Formatear para el gráfico
            let formattedBalance = balanceHistory.map(item => ({
              date: item.timestamp || item.date,
              timestamp: item.timestamp || item.date,
              // Usar servicio estandarizado para datos de gráfico
              value: equityDataService.getChartValue(item),
              balance: equityDataService.getAccountBalance(item),
              equity: equityDataService.getAccountEquity(item)
            }));
            try {
              if (dashboardData.kpis && formattedBalance.length > 0) {
                const currentVal = parseFloat(dashboardData.kpis.balance ?? 0) || 0;
                const li = formattedBalance.length - 1;
                const lastVal = equityDataService.getChartValue(formattedBalance[li]);
                if (currentVal > 0 && Math.abs(currentVal - lastVal) > 0.01) {
                  formattedBalance[li] = { ...formattedBalance[li], value: currentVal, balance: currentVal, equity: currentVal };
                }
              }
            } catch (e) {}
            console.log('[TradingAccounts] Balance formateado:', formattedBalance.slice(0, 2));
            setRealBalanceHistory(formattedBalance);
          } else {
            console.log('[TradingAccounts] NO hay balance history!');
          }
        }
        
        // Usar operaciones del dashboard si están disponibles
        if (dashboardData.recent_operations && dashboardData.recent_operations.length > 0) {
          // Transformar las operaciones al formato esperado por la tabla
          const transformedOps = {
            operations: dashboardData.recent_operations.map(op => {
              const openTime = op.open_time ? new Date(op.open_time) : null;
              const closeTime = op.close_time ? new Date(op.close_time) : null;
              
              return {
                // Formato para la tabla de historial
                fechaApertura: openTime ? openTime.toLocaleDateString() : '-',
                tiempoApertura: openTime ? openTime.toLocaleTimeString() : '-',
                fechaCierre: closeTime ? closeTime.toLocaleDateString() : '-',
                tiempoCierre: closeTime ? closeTime.toLocaleTimeString() : '-',
                fechaISO: op.close_time || op.open_time,
                instrumento: op.symbol || 'N/A',
                bandera: getInstrumentIcon(op.symbol || 'N/A'),
                tipo: op.type === 'BUY' ? t('positions.types.buy') : op.type === 'SELL' ? t('positions.types.sell') : op.type,
                lotaje: (op.volume || 0).toFixed(2),
                stopLossFormatted: op.stop_loss ? parseFloat(op.stop_loss).toFixed(5) : '0.0',
                takeProfitFormatted: op.take_profit ? parseFloat(op.take_profit).toFixed(5) : '0.0',
                precioApertura: (op.open_price || 0).toFixed(5),
                precioCierre: (op.close_price || 0).toFixed(5),
                pips: op.pips || 0,
                idPosicion: op.ticket || '-',
                resultado: `$${(op.profit || 0).toFixed(2)}`,
                resultadoPct: `${((op.profit || 0) / 10000 * 100).toFixed(1)}%`,
                resultadoColor: (op.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400',
                ganancia: op.profit || 0,
                stopLossPct: op.stop_loss ? 
                  Math.abs((op.stop_loss - op.open_price) / op.open_price * 100).toFixed(1) + '%' : '-',
                takeProfitPct: op.take_profit ? 
                  Math.abs((op.take_profit - op.open_price) / op.open_price * 100).toFixed(1) + '%' : '-',
                // También mantener los campos originales para compatibilidad
                id: op.ticket,
                ticket: op.ticket,
                symbol: op.symbol,
                type: op.operation_type || op.type,
                volume: op.volume,
                openPrice: op.open_price,
                closePrice: op.close_price,
                openTime: op.open_time,
                closeTime: op.close_time,
                stopLoss: op.stop_loss,
                takeProfit: op.take_profit,
                profit: op.profit,
                swap: op.swap || 0,
                commission: op.commission || 0,
                status: op.status || 'CLOSED'
              };
            }),
            total_operations: dashboardData.recent_operations.length
          };
          setRealHistory(transformedOps);
        } else {
          // Si no hay operaciones, establecer array vacío
          setRealHistory({ operations: [], total_operations: 0 });
        }
        
        // Actualizar tiempo de última actualización
        setLastUpdated(new Date());
        
      } catch (error) {
        console.error('[TradingAccounts] Error cargando métricas:', error);
      } finally {
        setIsLoadingMetrics(false);
        setIsRefreshing(false);
        loadingRef.current = false;
        // Actualizar timestamp de última actualización
        setLastUpdated(Date.now());
        // Guardar la cuenta cargada exitosamente
        if (account) {
          lastLoadedAccountRef.current = account.account_number;
        }
      }
  }, []);

  // Función para refresh manual de datos con rate limiting inteligente
  const handleRefreshData = useCallback(async () => {
      if (!canRefresh || isRefreshing) {
        return;
      }

      const currentTime = Date.now();
      const timeSinceLastRefresh = lastRefreshTime ? currentTime - lastRefreshTime : Infinity;
      const RATE_LIMIT_MS = 15000; // Reducido a 15 segundos

      // Rate limiting inteligente
      if (timeSinceLastRefresh < RATE_LIMIT_MS) {
        const remainingTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastRefresh) / 1000);
        toast.error(`Espere ${remainingTime}s antes de actualizar`, {
          duration: 2000,
          icon: '⏱️'
        });
        return;
      }

      const selectedAccount = getAllAccounts().find(acc => acc.id === selectedAccountId);
      if (!selectedAccount) {
        toast.error('No hay cuenta seleccionada');
        return;
      }

      try {
        setCanRefresh(false);
        setLastRefreshTime(currentTime);
        
        // Limpiar datos existentes para mostrar loading
        setRealMetrics(null);
        setRealStatistics(null);
        setRealBalanceHistory([]);
        
        // Obtener timestamp antes del fetch
        const beforeFetch = Date.now();
        
        // Cargar métricas de la cuenta seleccionada
        await loadAccountMetrics(selectedAccount);
        
        // Calcular tiempo de respuesta
        const responseTime = Date.now() - beforeFetch;
        
        // Mostrar toast de éxito con tiempo de respuesta
        toast.success(`✅ Datos actualizados (${(responseTime/1000).toFixed(1)}s)`, {
          duration: 3000
        });
        
      } catch (error) {
        console.error('[TradingAccounts] Error en refresh:', error);
        toast.error('Error al actualizar datos');
      } finally {
        // Reactivar refresh después del rate limit
        setTimeout(() => {
          setCanRefresh(true);
        }, RATE_LIMIT_MS);
      }
  }, [selectedAccountId, lastUpdated]); // Remover funciones de dependencias
    
  // useEffect para cargar datos reales de MT5 cuando se selecciona una cuenta con auto-refresh
  useEffect(() => {
    if (!selectedAccountId) return;
    
    const selectedAccount = getAllAccounts().find(acc => acc.id === selectedAccountId);
    if (!selectedAccount || !selectedAccount.account_number) return;
    
    // Cargar datos inmediatamente
    loadAccountMetrics(selectedAccount);
    
    // Auto-refresh desactivado por ahora - los datos se actualizan solo con refresh manual
    // Para reactivar, descomentar las siguientes líneas:
    /*
    let refreshInterval;
    if (selectedAccountId) {
      console.log('[TradingAccounts] Configurando auto-refresh cada 60 segundos');
      refreshInterval = setInterval(() => {
        console.log('[TradingAccounts] Auto-refresh de métricas...', new Date().toISOString());
        loadAccountMetrics(selectedAccount);
      }, 60000); // 60 segundos
    }
    */
    let refreshInterval = null;
    
    // Limpiar intervalo al desmontar o cambiar dependencias
    return () => {
      if (refreshInterval) {
        console.log('[TradingAccounts] Limpiando intervalo de auto-refresh');
        clearInterval(refreshInterval);
      }
      // Resetear el ref cuando cambia la cuenta
      loadingRef.current = false;
      if (selectedAccountId !== lastLoadedAccountRef.current) {
        lastLoadedAccountRef.current = null;
      }
    };
  }, [selectedAccountId]); // Solo recargar cuando cambia la cuenta seleccionada

  // Función helper para obtener el estado de la cuenta
  const getAccountStatus = (account) => {
    if (!account) return { status: t('accounts.status.inactive'), statusColor: 'bg-gray-800 bg-opacity-30 text-gray-400' };
    
    // Usar el status si existe, sino determinar basado en balance
    if (account.status) {
      // Convertir el status a lowercase para comparación
      const statusLower = account.status.toLowerCase();
      
      // Determinar si está activo o inactivo
      const isActive = statusLower.includes('activ') && !statusLower.includes('inactiv');
      const isInactive = statusLower.includes('inactiv');
      
      // Normalizar el texto mostrado
      let displayStatus = account.status;
      if (isActive) {
        displayStatus = t('accounts.status.active');
      } else if (isInactive) {
        displayStatus = t('accounts.status.inactive');
      }
      
      return {
        status: displayStatus,
        statusColor: isActive ? 'bg-green-800 bg-opacity-30 text-green-400' : 
                    isInactive ? 'bg-gray-800 bg-opacity-30 text-gray-400' :
                    'bg-red-800 bg-opacity-30 text-red-400'
      };
    }
    
    // Fallback basado en balance
    const balance = account.balance || 0;
    if (balance > 0) {
      return { status: t('accounts.status.active'), statusColor: 'bg-green-800 bg-opacity-30 text-green-400' };
    } else {
      return { status: t('accounts.status.inactive'), statusColor: 'bg-gray-800 bg-opacity-30 text-gray-400' };
    }
  };
  
  // Color fijo turquesa para barras de Rendimiento
  const getBarColor = () => '#06b6d4';
  
  // Función para calcular escala del gráfico Y
  const calculateYAxisScale = (dataPoints) => {
    if (!dataPoints || dataPoints.length === 0) return { min: 0, max: 1000, step: 100 };
    const values = dataPoints.map(p => parseFloat(p.value) || 0);
    let minValue = Math.min(...values);
    let maxValue = Math.max(...values);
    if (!isFinite(minValue) || !isFinite(maxValue)) return { min: 0, max: 1000, step: 100 };
    // Añadir padding relativo para que pequeñas variaciones se vean
    const rangeRaw = maxValue - minValue;
    const pad = Math.max(1, Math.abs((minValue + maxValue) / 2) * 0.01, rangeRaw * 0.1);
    if (rangeRaw === 0) {
      minValue -= pad;
      maxValue += pad;
    } else {
      minValue = minValue - pad;
      maxValue = maxValue + pad;
    }
    const range = maxValue - minValue;
    const roughStep = range / 4;
    // redondear step a 1/2/5*10^n
    const pow10 = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
    const candidates = [1, 2, 5].map(m => m * pow10);
    const step = candidates.reduce((prev, curr) => Math.abs(curr - roughStep) < Math.abs(prev - roughStep) ? curr : prev, candidates[0]);
    const adjustedMin = Math.floor(minValue / step) * step;
    const adjustedMax = Math.ceil(maxValue / step) * step;
    return { min: adjustedMin, max: adjustedMax, step };
  };

  // Obtener la cuenta seleccionada de forma segura
  const currentSelectedAccount = selectedAccountId ? 
    getAllAccounts().find(acc => acc.id === selectedAccountId) : null;
  
  // Datos para el gráfico de balance (superior) usando la misma lógica del tab de Balance
  const initialBalance = realMetrics?.initial_balance || 0;
  const balanceData = useMemo(() => {
    const series = generateBalanceChartData();
    if (series && series.length > 0) {
      return series.map(item => ({ name: item.date, value: item.value, isGain: item.isGain }));
    }
    if (currentSelectedAccount && currentSelectedAccount.balance > 0) {
      const now = new Date();
      return [
        { name: t('trading:charts.start'), value: currentSelectedAccount.initialBalance || 0 },
        { name: now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), value: currentSelectedAccount.balance }
      ];
    }
    return [];
  }, [realBalanceHistory, currentSelectedAccount]);

  // Calcular escala para el eje Y
  const yAxisConfig = calculateYAxisScale(balanceData);

  // Generar datos de beneficio basados en el historial de balance real
  const generateBeneficioData = () => {
    // Usar datos reales del balance history si están disponibles
    if (realBalanceHistory && realBalanceHistory.length > 0) {
      // Tomar los últimos 6 puntos para el gráfico
      const recentData = realBalanceHistory.slice(-6);
      return recentData.map(item => ({
        name: new Date(item.date || item.timestamp).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short' 
        }),
        value: equityDataService.getChartValue(item)
      }));
    }
    
    // Fallback si hay balanceData
    if (balanceData && balanceData.length > 0) {
      // Usar los datos reales del balance
      return balanceData.slice(-6).map(item => ({
        name: item.date,
        value: item.value || 0
      }));
    }
    // Fallback si no hay datos
    return [
      { name: t('months.jan'), value: 0 },
      { name: t('months.feb'), value: 0 },
      { name: t('months.mar'), value: 0 },
      { name: t('months.apr'), value: 0 },
      { name: t('months.may'), value: 0 },
      { name: t('months.jun'), value: 0 },
    ];
  };
  
  const beneficioData = generateBeneficioData();

  // Variables temporales para evitar error de referencia
  // Se actualizarán con los valores reales más adelante cuando se definan las funciones
  let instrumentosData = [];
  let rendimientoData = [];

  // Función para obtener el icono del instrumento con fallback
  const getInstrumentIcon = (symbol) => {
    // Icono por defecto (moneda genérica)
    const defaultIcon = 'https://cdn-icons-png.flaticon.com/512/2150/2150150.png';
    
    if (!symbol) return defaultIcon;
    
    // Mapeo de símbolos a iconos/banderas
    const iconMap = {
      'EURUSD': 'https://flagcdn.com/w40/eu.png',
      'GBPUSD': 'https://flagcdn.com/w40/gb.png',
      'USDJPY': 'https://flagcdn.com/w40/us.png',
      'AUDUSD': 'https://flagcdn.com/w40/au.png',
      'USDCAD': 'https://flagcdn.com/w40/us.png',  // US flag for USD pairs
      'NZDUSD': 'https://flagcdn.com/w40/nz.png',
      'EURJPY': 'https://flagcdn.com/w40/eu.png',
      'GBPJPY': 'https://flagcdn.com/w40/gb.png',
      'AUDJPY': 'https://flagcdn.com/w40/au.png',  // AU flag for AUD pairs
      'EURGBP': 'https://flagcdn.com/w40/eu.png',
      'XAUUSD': 'https://cdn-icons-png.flaticon.com/512/2318/2318032.png', // Gold icon
      'GOLD': 'https://cdn-icons-png.flaticon.com/512/2318/2318032.png',
      'XAGUSD': 'https://cdn-icons-png.flaticon.com/512/861/861184.png', // Silver icon
      'BTCUSD': 'https://cdn-icons-png.flaticon.com/512/1490/1490849.png', // Bitcoin icon
      'ETHUSD': 'https://cdn-icons-png.flaticon.com/512/7016/7016537.png', // Ethereum icon
    };
    
    // Si existe un mapeo específico, usarlo
    if (iconMap[symbol]) {
      return iconMap[symbol];
    }
    
    // Para otros pares, intentar obtener la bandera del primer país
    if (symbol && symbol.length >= 6) {
      const currency = symbol.substring(0, 3);
      const currencyToCountry = {
        'EUR': 'eu',
        'USD': 'us',
        'GBP': 'gb',
        'JPY': 'jp',
        'AUD': 'au',
        'CAD': 'ca',
        'NZD': 'nz',
        'CHF': 'ch',
        'SEK': 'se',
        'NOK': 'no'
      };
      
      if (currencyToCountry[currency]) {
        return `https://flagcdn.com/w40/${currencyToCountry[currency]}.png`;
      }
    }
    
    // Icono por defecto para instrumentos desconocidos
    return 'https://cdn-icons-png.flaticon.com/512/2150/2150150.png';
  };

  // Transformar operaciones de Supabase al formato de la tabla
  const transformTradingOperations = (operations) => {
    if (!operations || operations.length === 0) return [];
    
    return operations.map(op => {
      const openTime = new Date(op.open_time);
      const closeTime = new Date(op.close_time);
      const duration = closeTime - openTime;
      
      // Calcular pips según el instrumento
      let pips = 0;
      const openPrice = parseFloat(op.open_price);
      const closePrice = parseFloat(op.close_price);
      
      if (op.symbol && op.symbol.includes('JPY')) {
        pips = Math.round((closePrice - openPrice) * 100);
      } else if (op.symbol === 'XAUUSD' || op.symbol === 'GOLD') {
        pips = Math.round((closePrice - openPrice) * 10);
      } else {
        pips = Math.round((closePrice - openPrice) * 10000);
      }
      
      // Si es venta, invertir el signo de los pips
      if (op.operation_type === 'SELL' || op.type === 'SELL') {
        pips = -pips;
      }
      
      // Formatear duración
      const hours = Math.floor(duration / 3600000);
      const minutes = Math.floor((duration % 3600000) / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      
      return {
        fechaApertura: openTime.toLocaleString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit', 
          day: '2-digit', 
          month: 'short' 
        }),
        fechaCierre: closeTime.toLocaleString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit', 
          day: '2-digit', 
          month: 'short' 
        }),
        fechaISO: openTime.toISOString().split('T')[0],
        tiempoApertura: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        tiempoCierre: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        instrumento: op.symbol,
        bandera: getInstrumentIcon(op.symbol),
        tipo: op.operation_type === 'BUY' ? t('positions.types.buy') : op.type === 'SELL' ? t('positions.types.sell') : op.type,
        lotaje: parseFloat(op.volume).toFixed(2),
        stopLoss: op.stop_loss ? parseFloat(op.stop_loss).toFixed(5) : 'N/A',
        stopLossPct: op.stop_loss ? 
          `-${Math.abs((parseFloat(op.open_price) - parseFloat(op.stop_loss)) / parseFloat(op.open_price) * 100).toFixed(1)}%` : '-',
        takeProfit: op.take_profit ? parseFloat(op.take_profit).toFixed(5) : 'N/A',
        takeProfitPct: op.take_profit ? 
          `+${Math.abs((parseFloat(op.take_profit) - parseFloat(op.open_price)) / parseFloat(op.open_price) * 100).toFixed(1)}%` : '-',
        precioApertura: parseFloat(op.open_price).toFixed(5),
        precioCierre: parseFloat(op.close_price).toFixed(5),
        pips: pips,
        idPosicion: op.ticket || '-',
        resultado: parseFloat(op.profit) >= 0 ? `+$${parseFloat(op.profit).toFixed(2)}` : `-$${Math.abs(parseFloat(op.profit)).toFixed(2)}`,
        resultadoColor: parseFloat(op.profit) >= 0 ? 'text-green-400' : 'text-red-400',
        resultadoPct: `${((parseFloat(op.profit) / (parseFloat(op.volume) * 1000)) * 100).toFixed(1)}%`,
        ganancia: parseFloat(op.profit)
      };
    });
  };
  
  // Usar operaciones reales si están disponibles, si no usar datos hardcodeados
  const historialData = realTradingOperations ? 
    transformTradingOperations(realTradingOperations) : 
    [
    // Febrero 2025
    { 
      fechaApertura: '12:00 20 Feb',
      fechaCierre: '12:00 20 Feb',
      fechaISO: '2025-02-20',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'EURUSD',
      bandera: '/EU.svg',
      tipo: t('positions.types.buy'),
      lotaje: '1',
      stopLoss: '$95,00',
      stopLossPct: '5.0%',
      takeProfit: '$110,00',
      takeProfitPct: '9.0%',
      precioApertura: '$290,32',
      precioCierre: '$285,58',
      pips: '263.5',
      idPosicion: '41528296',
      resultado: '+$195,58',
      resultadoPct: '+19.5%',
      resultadoColor: 'text-green-400',
      ganancia: 195.58,
      posicion: 'EURUSD',
      entrada: '2.670,89',
      entradaFecha: '10/01/2025 20:20:00',
      salida: '2.670,89',
      salidaFecha: '10/01/2025 01:26:07',
      orden: '484247'
    },
    { 
      fechaApertura: '12:00 21 Feb',
      fechaCierre: '12:00 21 Feb',
      fechaISO: '2025-02-21',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'XAUUSD',
      bandera: '/US.svg',
      tipo: t('positions.types.sell'),
      lotaje: '1',
      stopLoss: '$95,00',
      stopLossPct: '5.0%',
      takeProfit: '$110,00',
      takeProfitPct: '9.0%',
      precioApertura: '$2670,89',
      precioCierre: '$2670,69',
      pips: '20.0',
      idPosicion: '41528297',
      resultado: '-$40,00',
      resultadoPct: '-1.5%',
      resultadoColor: 'text-red-400',
      ganancia: -40.00,
      posicion: 'XAUUSD',
      entrada: '2.670,89',
      entradaFecha: '10/01/2025 20:20:00',
      salida: '2.670,69',
      salidaFecha: '10/01/2025 01:26:07',
      orden: '484247'
    },
    // Enero 2025
    { 
      fechaApertura: '12:00 15 Ene',
      fechaCierre: '12:00 15 Ene',
      fechaISO: '2025-01-15',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'GBPUSD',
      bandera: '/US.svg',
      tipo: t('positions.types.buy'),
      lotaje: '2',
      stopLoss: '$120,00',
      stopLossPct: '4.0%',
      takeProfit: '$180,00',
      takeProfitPct: '12.0%',
      precioApertura: '$1.2450',
      precioCierre: '$1.2580',
      pips: '130.0',
      idPosicion: '41528298',
      resultado: '+$260,00',
      resultadoPct: '+10.4%',
      resultadoColor: 'text-green-400',
      ganancia: 260.00,
      posicion: 'GBPUSD',
      entrada: '1.2450',
      entradaFecha: '10/01/2025 21:00:00',
      salida: '1.2580',
      salidaFecha: '10/01/2025 02:00:45',
      orden: '484271'
    },
    { 
      fechaApertura: '12:00 28 Ene',
      fechaCierre: '12:00 28 Ene',
      fechaISO: '2025-01-28',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'USDJPY',
      bandera: '/US.svg',
      tipo: t('positions.types.sell'),
      lotaje: '1.5',
      stopLoss: '$140,00',
      stopLossPct: '6.0%',
      takeProfit: '$90,00',
      takeProfitPct: '8.0%',
      precioApertura: '¥150.25',
      precioCierre: '¥149.80',
      pips: '45.0',
      idPosicion: '41528299',
      resultado: '-$67,50',
      resultadoPct: '-2.7%',
      resultadoColor: 'text-red-400',
      ganancia: -67.50,
      posicion: 'USDJPY',
      entrada: '150.25',
      entradaFecha: '10/01/2025 21:00:00',
      salida: '149.80',
      salidaFecha: '10/01/2025 02:00:48',
      orden: '499421'
    },
    // Diciembre 2024
    { 
      fechaApertura: '12:00 10 Dic',
      fechaCierre: '12:00 10 Dic',
      fechaISO: '2024-12-10',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'EURUSD',
      bandera: '/EU.svg',
      tipo: t('positions.types.sell'),
      lotaje: '1.2',
      stopLoss: '$85,00',
      stopLossPct: '4.5%',
      takeProfit: '$125,00',
      takeProfitPct: '8.5%',
      precioApertura: '$1.0520',
      precioCierre: '$1.0485',
      pips: '35.0',
      idPosicion: '41528300',
      resultado: '+$42,00',
      resultadoPct: '+3.5%',
      resultadoColor: 'text-green-400',
      ganancia: 42.00,
      posicion: 'EURUSD',
      entrada: '1.0520',
      entradaFecha: '10/12/2024 14:20:00',
      salida: '1.0485',
      salidaFecha: '10/12/2024 17:45:00',
      orden: '484301'
    },
    { 
      fechaApertura: '12:00 22 Dic',
      fechaCierre: '12:00 22 Dic',
      fechaISO: '2024-12-22',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'XAUUSD',
      bandera: '/US.svg',
      tipo: t('positions.types.buy'),
      lotaje: '0.8',
      stopLoss: '$180,00',
      stopLossPct: '7.0%',
      takeProfit: '$320,00',
      takeProfitPct: '15.0%',
      precioApertura: '$2660,00',
      precioCierre: '$2695,00',
      pips: '350.0',
      idPosicion: '41528301',
      resultado: '+$280,00',
      resultadoPct: '+14.0%',
      resultadoColor: 'text-green-400',
      ganancia: 280.00,
      posicion: 'XAUUSD',
      entrada: '2660.00',
      entradaFecha: '22/12/2024 10:15:00',
      salida: '2695.00',
      salidaFecha: '22/12/2024 16:30:00',
      orden: '484302'
    },
    // Noviembre 2024
    { 
      fechaApertura: '12:00 05 Nov',
      fechaCierre: '12:00 05 Nov',
      fechaISO: '2024-11-05',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'GBPUSD',
      bandera: '/US.svg',
      tipo: t('positions.types.sell'),
      lotaje: '1.8',
      stopLoss: '$160,00',
      stopLossPct: '6.5%',
      takeProfit: '$90,00',
      takeProfitPct: '4.5%',
      precioApertura: '$1.2790',
      precioCierre: '$1.2825',
      pips: '-35.0',
      idPosicion: '41528302',
      resultado: '-$63,00',
      resultadoPct: '-3.5%',
      resultadoColor: 'text-red-400',
      ganancia: -63.00,
      posicion: 'GBPUSD',
      entrada: '1.2790',
      entradaFecha: '05/11/2024 09:30:00',
      salida: '1.2825',
      salidaFecha: '05/11/2024 14:15:00',
      orden: '484303'
    },
    { 
      fechaApertura: '12:00 18 Nov',
      fechaCierre: '12:00 18 Nov',
      fechaISO: '2024-11-18',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'USDJPY',
      bandera: '/US.svg',
      tipo: t('positions.types.buy'),
      lotaje: '1.1',
      stopLoss: '$110,00',
      stopLossPct: '5.5%',
      takeProfit: '$140,00',
      takeProfitPct: '7.5%',
      precioApertura: '¥149.20',
      precioCierre: '¥149.85',
      pips: '65.0',
      idPosicion: '41528303',
      resultado: '+$71,50',
      resultadoPct: '+3.6%',
      resultadoColor: 'text-green-400',
      ganancia: 71.50,
      posicion: 'USDJPY',
      entrada: '149.20',
      entradaFecha: '18/11/2024 13:00:00',
      salida: '149.85',
      salidaFecha: '18/11/2024 18:45:00',
      orden: '484304'
    },
    // Octubre 2024
    { 
      fechaApertura: '12:00 12 Oct',
      fechaCierre: '12:00 12 Oct',
      fechaISO: '2024-10-12',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'EURUSD',
      bandera: '/EU.svg',
      tipo: t('positions.types.buy'),
      lotaje: '1.3',
      stopLoss: '$100,00',
      stopLossPct: '5.0%',
      takeProfit: '$150,00',
      takeProfitPct: '7.5%',
      precioApertura: '$1.0865',
      precioCierre: '$1.0840',
      pips: '-25.0',
      idPosicion: '41528304',
      resultado: '-$32,50',
      resultadoPct: '-1.6%',
      resultadoColor: 'text-red-400',
      ganancia: -32.50,
      posicion: 'EURUSD',
      entrada: '1.0865',
      entradaFecha: '12/10/2024 11:45:00',
      salida: '1.0840',
      salidaFecha: '12/10/2024 16:20:00',
      orden: '484305'
    },
    { 
      fechaApertura: '12:00 25 Oct',
      fechaCierre: '12:00 25 Oct',
      fechaISO: '2024-10-25',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'XAUUSD',
      bandera: '/US.svg',
      tipo: t('positions.types.sell'),
      lotaje: '0.6',
      stopLoss: '$200,00',
      stopLossPct: '8.0%',
      takeProfit: '$250,00',
      takeProfitPct: '12.0%',
      precioApertura: '$2630,00',
      precioCierre: '$2595,00',
      pips: '350.0',
      idPosicion: '41528305',
      resultado: '+$210,00',
      resultadoPct: '+10.5%',
      resultadoColor: 'text-green-400',
      ganancia: 210.00,
      posicion: 'XAUUSD',
      entrada: '2630.00',
      entradaFecha: '25/10/2024 08:30:00',
      salida: '2595.00',
      salidaFecha: '25/10/2024 15:10:00',
      orden: '484306'
    }
  ];

  // Funciones de filtrado del historial
  const updateHistoryFilter = (filterType, value) => {
    setHistoryFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Función para filtrar los datos del historial
  const getFilteredHistorialData = () => {
    // Usar datos reales si están disponibles, sino usar datos de ejemplo
    const dataSource = realHistory?.operations || historialData;
    return dataSource.filter(item => {
      // Filtro por instrumento
      if (historyFilters.instrument !== 'all') {
        // Normalizar ambos formatos (EUR/USD -> EURUSD)
        const normalizedFilter = historyFilters.instrument.replace('/', '');
        const normalizedInstrument = item.instrumento?.replace('/', '') || '';
        if (normalizedInstrument !== normalizedFilter) {
          return false;
        }
      }
      
      // Filtro por tipo
      if (historyFilters.type !== 'all') {
        const translatedType = historyFilters.type === 'buy' ? t('positions.types.buy') : 
                               historyFilters.type === 'sell' ? t('positions.types.sell') : 
                               historyFilters.type;
        if (item.tipo !== translatedType) {
          return false;
        }
      }
      
      // Filtro por ganancia/pérdida
      if (historyFilters.profitLoss === 'profit' && item.ganancia <= 0) {
        return false;
      }
      if (historyFilters.profitLoss === 'loss' && item.ganancia >= 0) {
        return false;
      }
      
      // Filtros de fecha
      if (historyFilters.dateFrom && item.fechaISO) {
        if (item.fechaISO < historyFilters.dateFrom) {
          return false;
        }
      }
      
      if (historyFilters.dateTo && item.fechaISO) {
        if (item.fechaISO > historyFilters.dateTo) {
          return false;
        }
      }
      
      return true;
    });
  };

  const filteredHistorialData = getFilteredHistorialData();

  // Función para generar datos del gráfico de beneficio total con optimización móvil
  const generateBenefitChartData = () => {
    // Usar datos del balance history si están disponibles para el gráfico de beneficio
    if (realBalanceHistory && realBalanceHistory.length > 0) {
      // Calcular beneficio relativo tomando como base el PRIMER punto del periodo filtrado
      // Así el trazo no depende del inicio absoluto de la serie completa
      let dataPoints = realBalanceHistory;
      
      if (benefitChartFilter === 'last7Days') {
        dataPoints = realBalanceHistory.slice(-7);
      } else if (benefitChartFilter === 'last30Days') {
        dataPoints = realBalanceHistory.slice(-30);
      } else if (benefitChartFilter === 'last90Days') {
        dataPoints = realBalanceHistory.slice(-90);
      } else if (benefitChartFilter === 'custom' && customDateFrom && customDateTo) {
        const fromDate = new Date(customDateFrom).getTime();
        const toDate = new Date(customDateTo).getTime();
        dataPoints = realBalanceHistory.filter(point => {
          const pointDate = new Date(point.date || point.timestamp).getTime();
          return pointDate >= fromDate && pointDate <= toDate;
        });
      }

      // Ordenar por fecha ascendente para trazo correcto
      const sorted = [...dataPoints].sort((a, b) => {
        const da = new Date(a.date || a.timestamp).getTime();
        const db = new Date(b.date || b.timestamp).getTime();
        return da - db;
      });
      const initialBalance = equityDataService.getChartValue(sorted[0]) || 0;

      // Reducir puntos para evitar aglomeración
      const step = Math.ceil(sorted.length / (isMobile ? 6 : 12));
      let reducedData = sorted.filter((_, index) => index % step === 0 || index === sorted.length - 1);
      // Garantizar al menos primer y último punto
      if (reducedData.length < 2 && sorted.length >= 2) {
        reducedData = [sorted[0], sorted[sorted.length - 1]];
      }

      return reducedData.map(point => ({
        date: new Date(point.date || point.timestamp).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short' 
        }),
        value: equityDataService.getChartValue(point) - initialBalance,
        dateISO: point.date || point.timestamp
      }));
    }
    
    // Fallback al código anterior si no hay datos de balance
    let dataToProcess = realHistory?.operations || historialData;
    
    // Aplicar filtros del historial si están activos
    if (historyFilters.instrument !== 'all') {
      dataToProcess = dataToProcess.filter(item => item.instrumento === historyFilters.instrument);
    }
    
    if (historyFilters.type !== 'all') {
      dataToProcess = dataToProcess.filter(item => item.tipo === historyFilters.type);
    }
    
    if (historyFilters.profitLoss === 'Ganancia') {
      dataToProcess = dataToProcess.filter(item => item.ganancia > 0);
    } else if (historyFilters.profitLoss === 'Pérdida') {
      dataToProcess = dataToProcess.filter(item => item.ganancia < 0);
    }
    
    if (historyFilters.dateFrom) {
      dataToProcess = dataToProcess.filter(item => item.fechaISO >= historyFilters.dateFrom);
    }
    
    if (historyFilters.dateTo) {
      dataToProcess = dataToProcess.filter(item => item.fechaISO <= historyFilters.dateTo);
    }
    
    // Generar rango de fechas según el filtro del gráfico - OPTIMIZADO PARA MÓVIL
    const now = new Date();
    let startDate, endDate, dateFormat, maxPoints;
    
    // Determinar máximo de puntos según dispositivo
    maxPoints = isMobile ? 6 : 12;
    
    if (benefitChartFilter === 'last7Days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      dateFormat = 'day';
    } else if (benefitChartFilter === 'last30Days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      // For drawdown, always use daily granularity
      dateFormat = 'day';
    } else if (benefitChartFilter === 'last90Days') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      dateFormat = 'day';
    } else if (benefitChartFilter === 'custom' && customDateFrom && customDateTo) {
      startDate = new Date(customDateFrom);
      endDate = new Date(customDateTo);
      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
      // For drawdown, force daily always
      dateFormat = 'day';
    } else {
      // Para "Último mes" por defecto, usar el rango de datos disponibles
      const dates = dataToProcess.map(item => new Date(item.fechaISO));
      if (dates.length > 0) {
        startDate = new Date(Math.min(...dates));
        endDate = new Date(Math.max(...dates));
      } else {
        startDate = new Date(2025, 1, 20);
        endDate = new Date(2025, 1, 22);
      }
      dateFormat = isMobile ? 'week' : 'day';
    }
    
    // Agrupar datos existentes por fecha
    const groupedByDate = {};
    dataToProcess.forEach(item => {
      const date = item.fechaISO;
      if (!groupedByDate[date]) {
        groupedByDate[date] = 0;
      }
      groupedByDate[date] += item.ganancia;
    });
    
    // Generar array de fechas para el período
    const dateArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      let dateKey, formattedDate;
      
      if (dateFormat === 'month') {
        dateKey = currentDate.toISOString().substring(0, 7) + '-01';
        formattedDate = currentDate.toLocaleDateString('es-ES', { 
          month: 'short', 
          year: '2-digit' 
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (dateFormat === 'week') {
        dateKey = currentDate.toISOString().substring(0, 10);
        formattedDate = currentDate.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short' 
        });
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        dateKey = currentDate.toISOString().substring(0, 10);
        formattedDate = currentDate.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit' 
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      dateArray.push({ dateKey, formattedDate });
    }
    
    // Calcular beneficio acumulado para cada fecha
    let cumulativeProfit = 0;
    let chartData = dateArray.map(({ dateKey, formattedDate }) => {
      // Para formato mensual y trimestral, sumar todas las ganancias del período
      if (dateFormat === 'month' || dateFormat === 'quarter') {
        const monthPrefix = dateKey.substring(0, 7); // YYYY-MM
        const monthlyGains = Object.keys(groupedByDate)
          .filter(date => date.startsWith(monthPrefix))
          .reduce((sum, date) => sum + groupedByDate[date], 0);
        cumulativeProfit += monthlyGains;
      } else {
        // Para días y semanas, usar la ganancia específica de esa fecha
        cumulativeProfit += groupedByDate[dateKey] || 0;
      }
      
      return {
        date: formattedDate,
        value: Math.round(cumulativeProfit * 100) / 100,
        dateISO: dateKey
      };
    });
    
    // Limit maximum points to 10 (downsample evenly), keeping first and last
    const MAX_POINTS = 10;
    if (chartData.length > MAX_POINTS) {
      const step = Math.ceil(chartData.length / MAX_POINTS);
      const reduced = chartData.filter((_, idx) => idx === 0 || idx === chartData.length - 1 || idx % step === 0);
      // Ensure no more than MAX_POINTS by slicing if filter kept more
      chartData = reduced.slice(0, MAX_POINTS - 1).concat([chartData[chartData.length - 1]]);
    }
    return chartData;
  };

  // Optimizar datos del gráfico para móvil
  const optimizeChartDataForMobile = (data) => {
    if (!isMobile || data.length <= 6) return data;
    
    const step = Math.ceil(data.length / 6);
    return data.filter((_, index) => index % step === 0 || index === data.length - 1);
  };

  const benefitChartData = useMemo(() => 
    optimizeChartDataForMobile(generateBenefitChartData()), 
    [realBalanceHistory, historialData, benefitChartFilter, customDateFrom, customDateTo, isMobile]
  );

  // Función para generar datos de Balance (declaración hoisted para poder usarla antes)
  function generateBalanceChartData() {
    // Usar datos del histórico de balance de Supabase
    if (realBalanceHistory && realBalanceHistory.length > 0) {
      // Ordenar por fecha ascendente para trazo consistente
      let filteredData = [...realBalanceHistory].sort((a, b) => {
        const da = new Date(a.date || a.timestamp).getTime();
        const db = new Date(b.date || b.timestamp).getTime();
        return da - db;
      });
      const dataPoints = filteredData.length;
      // Calcular rango real para decidir si reducimos puntos
      const vals = filteredData.map(p => equityDataService.getChartValue(p));
      const vMin = Math.min(...vals);
      const vMax = Math.max(...vals);
      const vRange = vMax - vMin;

      // Si hay más de 10 puntos, tomar solo algunos representativos
      if (dataPoints > 12 && vRange > Math.max(5, Math.abs(vals[0]) * 0.001)) {
        const step = Math.max(1, Math.floor(dataPoints / (isMobile ? 10 : 16))); // más puntos visibles
        filteredData = filteredData.filter((_, index) => 
          index === 0 || // Primer punto
          index === dataPoints - 1 || // Último punto
          index % step === 0 // Puntos intermedios
        );
        if (filteredData.length < 2) {
          filteredData = [filteredData[0] ?? realBalanceHistory[0], filteredData[filteredData.length - 1] ?? realBalanceHistory[realBalanceHistory.length - 1]].filter(Boolean);
        }
      }

      return filteredData.map((point, index) => {
        const currentValue = equityDataService.getChartValue(point);
        const previousValue = index > 0 ? equityDataService.getChartValue(filteredData[index - 1]) : currentValue;
        const isGain = currentValue >= previousValue;

        return {
          date: new Date(point.date || point.timestamp).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short' 
          }),
          value: currentValue,
          isGain: isGain
        };
      });
    }
    
    // Si no hay histórico pero hay balance actual, mostrar línea simple
    if (currentSelectedAccount && currentSelectedAccount.balance > 0) {
      const now = new Date();
      const initialBalance = currentSelectedAccount.initialBalance || 0;
      const isGain = currentSelectedAccount.balance >= initialBalance;
      return [
        { date: t('trading:charts.start'), value: initialBalance, isGain: true },
        { date: now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), value: currentSelectedAccount.balance, isGain: isGain }
      ];
    }
    
    // Sin datos
    return [{ date: t('trading:charts.noData'), value: 0, isGain: true }];
  }
  
  // Función anterior renombrada para no perder funcionalidad
  const generateBalanceChartDataOld = () => {
    let dataToProcess = historialData;
    
    // Aplicar mismos filtros que el gráfico de beneficio
    if (historyFilters.instrument !== 'all') {
      dataToProcess = dataToProcess.filter(item => item.instrumento === historyFilters.instrument);
    }
    
    if (historyFilters.type !== 'all') {
      dataToProcess = dataToProcess.filter(item => item.tipo === historyFilters.type);
    }
    
    if (historyFilters.profitLoss === 'Ganancia') {
      dataToProcess = dataToProcess.filter(item => item.ganancia > 0);
    } else if (historyFilters.profitLoss === 'Pérdida') {
      dataToProcess = dataToProcess.filter(item => item.ganancia < 0);
    }
    
    if (historyFilters.dateFrom) {
      dataToProcess = dataToProcess.filter(item => item.fechaISO >= historyFilters.dateFrom);
    }
    
    if (historyFilters.dateTo) {
      dataToProcess = dataToProcess.filter(item => item.fechaISO <= historyFilters.dateTo);
    }
    
    // Generar rango de fechas según el filtro del gráfico
    const now = new Date();
    let startDate, endDate, dateFormat;
    
    if (benefitChartFilter === 'last7Days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      dateFormat = 'day';
    } else if (benefitChartFilter === 'last30Days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      dateFormat = 'day';
    } else if (benefitChartFilter === 'last90Days') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      dateFormat = 'week';
    } else if (benefitChartFilter === 'custom' && customDateFrom && customDateTo) {
      startDate = new Date(customDateFrom);
      endDate = new Date(customDateTo);
      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
      dateFormat = daysDiff <= 30 ? 'day' : 'week';
    } else {
      // Para "Último mes" por defecto, usar el rango de datos disponibles
      const dates = dataToProcess.map(item => new Date(item.fechaISO));
      if (dates.length > 0) {
        startDate = new Date(Math.min(...dates));
        endDate = new Date(Math.max(...dates));
      } else {
        startDate = new Date(2025, 1, 20);
        endDate = new Date(2025, 1, 22);
      }
      dateFormat = 'day';
    }
    
    // Agrupar datos existentes por fecha
    const groupedByDate = {};
    dataToProcess.forEach(item => {
      const date = item.fechaISO;
      if (!groupedByDate[date]) {
        groupedByDate[date] = 0;
      }
      groupedByDate[date] += item.ganancia;
    });
    
    // Generar array de fechas para el período
    const dateArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      let dateKey, formattedDate;
      
      if (dateFormat === 'month') {
        dateKey = currentDate.toISOString().substring(0, 7) + '-01';
        formattedDate = currentDate.toLocaleDateString('es-ES', { 
          month: 'short', 
          year: '2-digit' 
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (dateFormat === 'week') {
        dateKey = currentDate.toISOString().substring(0, 10);
        formattedDate = currentDate.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short' 
        });
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        dateKey = currentDate.toISOString().substring(0, 10);
        formattedDate = currentDate.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit' 
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      dateArray.push({ dateKey, formattedDate });
    }
    
    // Simular balance inicial y calcular balance acumulado
    const initialBalance = 10000;
    let currentBalance = initialBalance;
    
    const chartData = dateArray.map(({ dateKey, formattedDate }) => {
      // Para formato mensual, sumar todas las ganancias del mes
      if (dateFormat === 'month') {
        const monthPrefix = dateKey.substring(0, 7);
        const monthlyGains = Object.keys(groupedByDate)
          .filter(date => date.startsWith(monthPrefix))
          .reduce((sum, date) => sum + groupedByDate[date], 0);
        currentBalance += monthlyGains;
      } else {
        // Para días y semanas, usar la ganancia específica de esa fecha
        currentBalance += groupedByDate[dateKey] || 0;
      }
      
      return {
        date: formattedDate,
        value: Math.round(currentBalance * 100) / 100,
        dateISO: dateKey
      };
    });
    
    return chartData;
  };

  // Función para generar datos de Retracción (Drawdown)
  const generateDrawdownChartData = () => {
    // Usar datos reales si están disponibles
    if (realBalanceHistory && realBalanceHistory.length > 0) {
      // Aplicar filtros de fecha
      const now = new Date();
      let filteredData = [...realBalanceHistory];
      
      if (benefitChartFilter === 'last7Days') {
        const cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(point => new Date(point.date || point.timestamp) >= cutoffDate);
      } else if (benefitChartFilter === 'last30Days') {
        const cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(point => new Date(point.date || point.timestamp) >= cutoffDate);
      } else if (benefitChartFilter === 'last90Days') {
        const cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(point => new Date(point.date || point.timestamp) >= cutoffDate);
      } else if (benefitChartFilter === 'custom' && customDateFrom && customDateTo) {
        const fromDate = new Date(customDateFrom);
        const toDate = new Date(customDateTo);
        filteredData = filteredData.filter(point => {
          const pointDate = new Date(point.date || point.timestamp);
          return pointDate >= fromDate && pointDate <= toDate;
        });
      }
      
      // Si no hay datos después del filtro, retornar array vacío
      if (filteredData.length === 0) {
        return [];
      }
      
      // Calcular drawdown desde el máximo histórico
      let peakBalance = 0;
      
      let result = filteredData.map((point, index) => {
        const currentBalance = equityDataService.getChartValue(point);
        
        // En el primer punto, establecer el pico y drawdown en 0
        if (index === 0) {
          peakBalance = currentBalance;
          return {
            date: new Date(point.date || point.timestamp).toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: 'short' 
            }),
            value: 0 // Comenzar desde 0% de drawdown
          };
        }
        
        // Actualizar el pico si el balance actual es mayor
        if (currentBalance > peakBalance) {
          peakBalance = currentBalance;
        }
        
        // Calcular drawdown como porcentaje desde el pico (negativo para representar pérdida)
        const drawdown = peakBalance > 0 ? -((peakBalance - currentBalance) / peakBalance) * 100 : 0;
        
        return {
          date: new Date(point.date || point.timestamp).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short' 
          }),
          value: parseFloat(drawdown.toFixed(2))
        };
      });

      // Limitar a 10 puntos en total (downsample uniforme, mantener primero y último)
      const MAX_POINTS = 10;
      if (result.length > MAX_POINTS) {
        const step = Math.ceil(result.length / MAX_POINTS);
        const reduced = result.filter((_, idx) => idx === 0 || idx === result.length - 1 || idx % step === 0);
        result = reduced.slice(0, MAX_POINTS - 1).concat([result[result.length - 1]]);
      }
      return result;
    }
    
    // Fallback al código anterior si no hay datos reales
    let dataToProcess = historialData;
    
    // Aplicar mismos filtros
    if (historyFilters.instrument !== 'all') {
      dataToProcess = dataToProcess.filter(item => item.instrumento === historyFilters.instrument);
    }
    
    if (historyFilters.type !== 'all') {
      dataToProcess = dataToProcess.filter(item => item.tipo === historyFilters.type);
    }
    
    if (historyFilters.profitLoss === 'Ganancia') {
      dataToProcess = dataToProcess.filter(item => item.ganancia > 0);
    } else if (historyFilters.profitLoss === 'Pérdida') {
      dataToProcess = dataToProcess.filter(item => item.ganancia < 0);
    }
    
    if (historyFilters.dateFrom) {
      dataToProcess = dataToProcess.filter(item => item.fechaISO >= historyFilters.dateFrom);
    }
    
    if (historyFilters.dateTo) {
      dataToProcess = dataToProcess.filter(item => item.fechaISO <= historyFilters.dateTo);
    }
    
    // Generar rango de fechas según el filtro del gráfico
    const now = new Date();
    let startDate, endDate, dateFormat;
    
    if (benefitChartFilter === 'last7Days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      dateFormat = 'day';
    } else if (benefitChartFilter === 'last30Days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      dateFormat = 'day';
    } else if (benefitChartFilter === 'last90Days') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
      dateFormat = 'week';
    } else if (benefitChartFilter === 'custom' && customDateFrom && customDateTo) {
      startDate = new Date(customDateFrom);
      endDate = new Date(customDateTo);
      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
      dateFormat = daysDiff <= 30 ? 'day' : 'week';
    } else {
      // Para "Último mes" por defecto, usar el rango de datos disponibles
      const dates = dataToProcess.map(item => new Date(item.fechaISO));
      if (dates.length > 0) {
        startDate = new Date(Math.min(...dates));
        endDate = new Date(Math.max(...dates));
      } else {
        startDate = new Date(2025, 1, 20);
        endDate = new Date(2025, 1, 22);
      }
      dateFormat = 'day';
    }
    
    // Agrupar datos existentes por fecha
    const groupedByDate = {};
    dataToProcess.forEach(item => {
      const date = item.fechaISO;
      if (!groupedByDate[date]) {
        groupedByDate[date] = 0;
      }
      groupedByDate[date] += item.ganancia;
    });
    
    // Generar array de fechas para el período
    const dateArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      let dateKey, formattedDate;
      
      if (dateFormat === 'month') {
        dateKey = currentDate.toISOString().substring(0, 7) + '-01';
        formattedDate = currentDate.toLocaleDateString('es-ES', { 
          month: 'short', 
          year: '2-digit' 
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (dateFormat === 'week') {
        dateKey = currentDate.toISOString().substring(0, 10);
        formattedDate = currentDate.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short' 
        });
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        dateKey = currentDate.toISOString().substring(0, 10);
        formattedDate = currentDate.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit' 
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      dateArray.push({ dateKey, formattedDate });
    }
    
    // Calcular retracción (drawdown) para cada fecha
    let cumulativeProfit = 0;
    let maxProfit = 0;
    
    const chartData = dateArray.map(({ dateKey, formattedDate }) => {
      // Para formato mensual, sumar todas las ganancias del mes
      if (dateFormat === 'month') {
        const monthPrefix = dateKey.substring(0, 7);
        const monthlyGains = Object.keys(groupedByDate)
          .filter(date => date.startsWith(monthPrefix))
          .reduce((sum, date) => sum + groupedByDate[date], 0);
        cumulativeProfit += monthlyGains;
      } else {
        // Para días y semanas, usar la ganancia específica de esa fecha
        cumulativeProfit += groupedByDate[dateKey] || 0;
      }
      
      maxProfit = Math.max(maxProfit, cumulativeProfit);
      const drawdown = ((cumulativeProfit - maxProfit) / Math.max(maxProfit, 1)) * 100;
      
      return {
        date: formattedDate,
        value: Math.round(drawdown * 100) / 100, // Ya es negativo por la fórmula
        dateISO: dateKey
      };
    });
    
    return chartData;
  };

  // Obtener datos según el tab seleccionado
  const getChartDataByTab = () => {
    switch (benefitChartTab) {
      case 'balance':
        return generateBalanceChartData();
      case 'drawdown':
        return generateDrawdownChartData();
      default:
        return benefitChartData;
    }
  };

  const currentChartData = useMemo(() => getChartDataByTab(), [benefitChartTab, benefitChartData]);

  // Función para generar datos de instrumentos basado en filtros - COMPLETAMENTE DINÁMICO
  const generateInstrumentsData = () => {
    // Primero verificar si hay datos reales de la API
    if (realInstruments?.distribution && realInstruments.distribution.length > 0) {
      // Usar datos reales de la API con colores dinámicos
      const colors = ['#06b6d4', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
      
      return realInstruments.distribution.map((item, index) => ({
        name: item.symbol || item.name || t('trading:charts.unknown'),
        value: item.percentage || 0,
        color: colors[index % colors.length],
        ganancia: item.profit || 0,
        operaciones: item.count || 0
      }));
    }
    
    // Si no hay datos de la API, usar operaciones reales de Supabase
    let dataToProcess = realTradingOperations ? 
      transformTradingOperations(realTradingOperations) : 
      [];
    
    // Si tampoco hay operaciones, mostrar "Sin datos"
    if (dataToProcess.length === 0) {
      return [
        {
          name: t('trading:charts.noOperations'),
          value: 100,
          color: '#4a5568',
          ganancia: 0,
          operaciones: 0
        }
      ];
    }
    
    // Agrupar por instrumento dinámicamente (cualquier instrumento)
    const instrumentTotals = {};
    
    dataToProcess.forEach(item => {
      const symbol = item.instrumento || item.symbol || 'Unknown';
      if (!instrumentTotals[symbol]) {
        instrumentTotals[symbol] = { ganancia: 0, operaciones: 0 };
      }
      instrumentTotals[symbol].ganancia += item.ganancia || item.profit || 0;
      instrumentTotals[symbol].operaciones += 1;
    });
    
    // Calcular total de operaciones
    const totalOperaciones = Object.values(instrumentTotals).reduce(
      (sum, item) => sum + item.operaciones, 0
    );
    
    // Si no hay operaciones, retornar datos vacíos
    if (totalOperaciones === 0) {
      return [
        {
          name: t('trading:charts.noOperations'),
          value: 100,
          color: '#4a5568',
          ganancia: 0,
          operaciones: 0
        }
      ];
    }
    
    // Convertir a array y calcular porcentajes
    const colors = ['#06b6d4', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
    const instrumentsData = Object.entries(instrumentTotals)
      .map(([symbol, data], index) => ({
        name: symbol,
        value: (data.operaciones / totalOperaciones) * 100,
        color: colors[index % colors.length],
        ganancia: data.ganancia,
        operaciones: data.operaciones
      }))
      .filter(item => item.operaciones > 0) // Solo incluir instrumentos con operaciones
      .sort((a, b) => b.value - a.value) // Ordenar por porcentaje descendente
      .slice(0, 8); // Limitar a 8 instrumentos principales
    
    return instrumentsData;
  };


  // Función para actualizar filtros del rendimiento
  const updateRendimientoFilter = (filterType, value) => {
    setRendimientoFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Función para generar datos de rendimiento dinámicos basados en datos reales
  const generateRendimientoData = () => {
    // Si no hay historial de balance, retornar array vacío con estructura
    if (!realBalanceHistory || realBalanceHistory.length === 0) {
      // Retornar estructura vacía para evitar errores en el gráfico
      if (rendimientoFilters.period === 'monthly') {
        const months = [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'), t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')];
        return months.map(month => ({ name: month, value: 0 }));
      } else if (rendimientoFilters.period === 'quarterly') {
        return [
          { name: t('filters.quarter1'), value: 0 },
          { name: t('filters.quarter2'), value: 0 },
          { name: t('filters.quarter3'), value: 0 },
          { name: t('filters.quarter4'), value: 0 }
        ];
      } else {
        return [{ name: '2025', value: 0 }];
      }
    }
    
    const selectedYear = parseInt(rendimientoFilters.year);
    const balanceInitial = realBalanceHistory[0]?.value || realBalanceHistory[0]?.balance || realMetrics?.initial_balance || 18000;
    
    // Filtrar datos por año seleccionado
    const yearData = realBalanceHistory.filter(item => {
      const dateStr = item.date || item.timestamp;
      if (!dateStr) return false;
      const itemYear = new Date(dateStr).getFullYear();
      return itemYear === selectedYear;
    });
    
    if (rendimientoFilters.period === 'monthly') {
      const months = [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'), t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')];
      
      return months.map((monthName, index) => {
        // Buscar datos del mes
        const monthData = yearData.filter(item => {
          const itemMonth = new Date(item.date || item.timestamp).getMonth();
          return itemMonth === index;
        });
        
        if (monthData.length > 0) {
          // Obtener el primer y último balance del mes
          const firstBalance = monthData[0].value || monthData[0].balance || balanceInitial;
          const lastBalance = monthData[monthData.length - 1].value || monthData[monthData.length - 1].balance;
          
          // Calcular rendimiento del mes (no acumulado desde el inicio)
          const rendimiento = firstBalance > 0 
            ? ((lastBalance - firstBalance) / firstBalance) * 100 
            : 0;
          return { name: monthName, value: parseFloat(rendimiento.toFixed(2)) };
        }
        
        return { name: monthName, value: 0 };
      });
      
    } else if (rendimientoFilters.period === 'quarterly') {
      const quarters = [
        { name: t('filters.quarter1'), months: [0, 1, 2] },
        { name: t('filters.quarter2'), months: [3, 4, 5] },
        { name: t('filters.quarter3'), months: [6, 7, 8] },
        { name: t('filters.quarter4'), months: [9, 10, 11] }
      ];
      
      return quarters.map(quarter => {
        const quarterData = yearData.filter(item => {
          const itemMonth = new Date(item.date || item.timestamp).getMonth();
          return quarter.months.includes(itemMonth);
        });
        
        if (quarterData.length > 0) {
          // Obtener el primer y último balance del trimestre
          const firstBalance = quarterData[0].value || quarterData[0].balance || balanceInitial;
          const lastBalance = quarterData[quarterData.length - 1].value || quarterData[quarterData.length - 1].balance;
          
          // Calcular rendimiento del trimestre
          const rendimiento = firstBalance > 0 
            ? ((lastBalance - firstBalance) / firstBalance) * 100 
            : 0;
          return { name: quarter.name, value: parseFloat(rendimiento.toFixed(2)) };
        }
        
        return { name: quarter.name, value: 0 };
      });
    }
    
    // Fallback mensual con datos reales
    const months = [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'), t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')];
    return months.map(month => ({ name: month, value: 0 }));
  };

  // Memoizar datos dinámicos para evitar recálculos innecesarios
  const dynamicInstrumentsData = useMemo(() => generateInstrumentsData(), [realInstruments, historialData]);
  const dynamicRendimientoData = useMemo(() => generateRendimientoData(), [realPerformance, rendimientoFilters]);
  
  // Actualizar las variables con los datos dinámicos generados
  instrumentosData = dynamicInstrumentsData;
  rendimientoData = dynamicRendimientoData;
  
  // Debug para ver qué datos se están usando
  console.log('[Debug Instruments]', {
    realInstruments,
    dynamicInstrumentsData,
    hasRealData: realInstruments?.distribution?.length > 0
  });
  
  console.log('[Debug Rendimiento]', {
    beneficioData: generateBeneficioData(),
    dynamicRendimientoData,
    hasRealData: balanceData?.length > 0
  });

  // Función para renderizar las credenciales MT5 en móvil como tarjetas
  const renderMobileCredentials = (selectedAccount) => {
    const credentials = [
      { label: t('trading:accounts.fields.server'), value: selectedAccount.server || 'AlphaGlobalMarket-Live', field: 'Server' },
      { label: t('accounts.fields.masterPassword'), value: selectedAccount.master_password || selectedAccount.mt5_password || '••••••••', field: 'Contraseña Master', isPassword: true, showKey: 'master' },
      { label: t('accounts.fields.accountNumber'), value: selectedAccount.account_number, field: 'Número de Cuenta' },
      { label: t('accounts.fields.investorPasswordReadOnly'), value: selectedAccount.investor_password || selectedAccount.investorPassword, field: 'Contraseña Investor', isPassword: true, showKey: 'investor', canConfigure: true }
    ];

    return credentials.map((cred, index) => (
      <div key={index} className="p-3 bg-[#0f0f0f] rounded-lg">
        <span className="text-gray-400 text-xs block mb-2">{cred.label}</span>
        <div className="flex items-center justify-between">
          {cred.canConfigure && !cred.value ? (
            <div 
              onClick={openInvestorModal}
              className="text-cyan-400 font-medium cursor-pointer hover:text-cyan-300 flex items-center gap-1 text-sm"
            >
              <Settings size={12} />
              {t('common.configure')}
            </div>
          ) : (
            <div className="text-white font-medium text-sm">
              {cred.isPassword && showPasswords[cred.showKey] === false ? '••••••••' : cred.value}
            </div>
          )}
          <div className="flex items-center gap-1">
            {cred.isPassword && (
              <button
                onClick={() => togglePasswordVisibility(cred.showKey)}
                className="p-1 hover:bg-[#2a2a2a] rounded"
                title={showPasswords[cred.showKey] ? t('trading:accounts.actions.hidePassword') : t('trading:accounts.actions.showPassword')}
              >
                {showPasswords[cred.showKey] ? (
                  <EyeOff size={12} className="text-gray-400 hover:text-white" />
                ) : (
                  <Eye size={12} className="text-gray-400 hover:text-white" />
                )}
              </button>
            )}
            {cred.value && (
              <button
                onClick={() => copyToClipboard(cred.value, cred.field)}
                className="opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded"
                title={`Copiar ${cred.label.toLowerCase()}`}
              >
                {copiedField === cred.field ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <Copy size={12} className="text-gray-400 hover:text-white" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    ));
  };

  // VISTA GENERAL DE CUENTAS
  if (viewMode === 'overview') {
  // Show loader during initial loading - DISABLED to prevent stuck loading
  // if (showLoader) {
  //   return <TradingAccountsLayoutLoader />;
  // }

  return (
      <div className="flex flex-col p-3 sm:p-4 text-white">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">{t('accounts.title')}</h1>
          
          {/* Create Account Button */}
          <button 
            onClick={handleCreateAccount}
            className={`relative w-full py-3 px-4 bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white rounded-lg transition flex items-center justify-center mb-4 sm:mb-6 text-sm sm:text-base ${
              userData?.kyc_status !== 'approved' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
          >
            {userData?.kyc_status !== 'approved' && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">!</span>
              </span>
            )}
            + {t('accounts.create')}
          </button>
          
          {/* Tab Navigation - Replicando lógica de Home */}
          <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'} mb-4 sm:mb-6`}>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm focus:outline-none transition-all text-center ${
                activeTab === 'all'
                  ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                  : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
              }`}
            >
              {t('accounts.types.all')} ({getAllAccounts().length})
            </button>
            <button
              onClick={() => setActiveTab('real')}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm focus:outline-none transition-all text-center ${
                activeTab === 'real'
                  ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                  : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
              }`}
            >
              {isMobile ? t('accounts.types.realShort') : t('accounts.types.real')} ({realAccountsOnly.length})
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm focus:outline-none transition-all text-center ${
                activeTab === 'demo'
                  ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                  : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
              }`}
            >
              {isMobile ? t('accounts.types.demoShort') : t('accounts.types.demo')} ({demoAccountsOnly.length})
            </button>
            {/* 
            <button
              onClick={() => setActiveTab('copytrading')}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm focus:outline-none transition-all text-center ${
                activeTab === 'copytrading'
                  ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                  : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
              }`}
            >
              {isMobile ? t('copyTrading.titleShort') : 'Copytrading'} ({getAccountsByCategory(ACC_CAT.COPYTRADING).length})
            </button>
            <button
              onClick={() => setActiveTab('pamm')}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm focus:outline-none transition-all text-center ${
                activeTab === 'pamm'
                  ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                  : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
              }`}
            >
              PAMM ({getAccountsByCategory(ACC_CAT.PAMM).length})
            </button>
            */}
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">{t('accounts.messages.yourAccounts')}</h2>
          
          {isLoading ? (
            <div className="text-center text-gray-400 py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
              <p className="text-sm sm:text-base">{t('accounts.messages.loadingAccounts')}</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-6 sm:py-8">
              <p className="text-sm sm:text-base">Error: {error}</p>
            </div>
          ) : accountsForCurrentTab.length === 0 ? (
            <div className="text-center text-gray-400 py-6 sm:py-8">
              <p className="text-sm sm:text-base">{t('accounts.messages.noAccountsInCategory')}</p>
            </div>
          ) : (
            accountsForCurrentTab.map((account) => {
              const accountStatus = getAccountStatus(account);
              return (
              <div 
                key={account.id} 
                className={`p-4 sm:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl ${
                  isMobile ? 'space-y-3' : 'flex items-center justify-between'
                }`}
              >
                <div className={`${isMobile ? 'space-y-3' : 'flex items-center'}`}>
                  {/* Chart Icon */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-[#2d2d2d] rounded-lg flex items-center justify-center ${isMobile ? 'mx-auto' : 'mr-4'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  
                  {/* Account Info */}
                  <div className={isMobile ? "text-center" : ""}>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                        {account.account_name || t('trading:accounts.noName')} 
                        {isMobile && <br />}
                        <span className="text-sm sm:text-base">(ID: {account.account_number || 'N/A'})</span>
                      </h3>
                    <div className={`${isMobile ? 'space-y-1' : 'flex items-center space-x-4'} text-xs sm:text-sm text-gray-400`}>
                        <span>{t('accounts.fields.accountType')}: {account.account_type || 'N/A'}</span>
                        <span>{t('accounts.fields.balance')}: ${(account.balance || 0).toFixed(2)}</span>
                        <span>{t('accounts.fields.platform')}: {account.platform || 'MetaTrader 5'}</span>
                    </div>
                  </div>
                </div>

                <div className={`${isMobile ? 'flex flex-col items-center space-y-2' : 'flex items-center space-x-4'}`}>
                  {/* Status */}
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${accountStatus.statusColor}`}>
                      {accountStatus.status}
                  </span>
                  
                  {/* Ver Detalles Button */}
                  <button 
                    onClick={() => handleViewDetails(account.id)}
                    className="px-3 sm:px-4 py-2 bg-[#2d2d2d] text-white rounded-lg hover:bg-[#3d3d3d] transition border border-[#444] text-xs sm:text-sm w-full sm:w-auto"
                  >
                    {t('accounts.actions.viewDetails')}
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // VISTA DETALLADA DE CUENTA
  // Obtener la cuenta seleccionada para mostrar sus detalles
  const selectedAccount = currentSelectedAccount;
  
  if (!selectedAccount) {
    return (
      <div className="flex flex-col p-3 sm:p-4 text-white">
        <div className="text-center text-gray-400 py-8">
          <p>{t('tradingAccountsUI.general.accountNotFoundSelected')}</p>
          <button 
            onClick={handleBackToOverview}
            className="mt-4 px-4 py-2 bg-[#2d2d2d] text-white rounded-lg hover:bg-[#3d3d3d] transition"
          >
            {t('accounts.actions.backToAccounts')}
          </button>
        </div>
      </div>
    );
  }
  
  // Función para sincronizar manualmente
  const handleManualSync = async () => {
    try {
      // Usar account_number en lugar de accountNumber
      const accountNumber = selectedAccount?.account_number || selectedAccount?.accountNumber;
      
      if (!selectedAccount || !accountNumber) {
        toast.error(t('trading.messages.accountNotFound'));
        console.error('Selected account:', selectedAccount);
        return;
      }
      
      // Obtener el token de Supabase como lo hacen los otros servicios
      const { supabase } = await import('../supabase/config');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error(t('trading.messages.noActiveSession'));
        return;
      }
      
      // Usar la URL correcta de apekapital
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://apekapital.com:444';
      
      console.log('Syncing account:', accountNumber);
      console.log('API URL:', apiUrl);
      
      // Usar el endpoint manual sync con el worker
      const response = await fetch(`${apiUrl}/api/v1/sync/account/${accountNumber}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`Sincronización completada: ${result.deals_synced} operaciones actualizadas`);
        
        // Esperar un momento para que los datos se propaguen en la base de datos
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refrescar los datos
        await refreshAccounts();
        
        // Esperar un poco más y forzar recarga de métricas
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Forzar recarga de métricas después de sync
        const currentSelectedAccount = getAllAccounts().find(acc => acc.id === selectedAccountId);
        if (currentSelectedAccount) {
          // Limpiar el cache de la última cuenta cargada para forzar recarga
          lastLoadedAccountRef.current = null;
          loadingRef.current = false;
          
          await loadAccountMetrics(currentSelectedAccount);
        }
      } else {
        toast.error(t('trading.messages.syncError'));
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error(t('trading.messages.accountSyncError'));
    }
  };

  // Loader for details view to avoid flicker while fetching metrics - DISABLED
  // const detailsLoading = viewMode !== 'overview' && (
  //   initialLoading || isLoading || isLoadingMetrics || !realMetrics || !realStatistics || !realBalanceHistory
  // );

  // if (detailsLoading) {
  //   return <TradingAccountsLayoutLoader />;
  // }

  return (
    <div className="flex flex-col p-3 sm:p-4 text-white overflow-x-hidden">
      {/* Back Button */}
      <div className="mb-3 sm:mb-4 flex items-center">
        <img 
          src="/Back.svg" 
          alt={t('trading.navigation.back')} 
          onClick={handleBackToOverview}
          className="w-8 h-8 sm:w-10 sm:h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
        />
      </div>

      {/* Layout responsivo - móvil: stack vertical, desktop: grid */}
      <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-12 gap-6'} mb-4 sm:mb-6`}>
        
        {/* COLUMNA CENTRAL - Tus Cuentas */}
        <div className={`${isMobile ? 'w-full max-h-[400px]' : 'lg:col-span-5 max-h-[600px]'} bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-t border-l border-r border-cyan-500 flex flex-col overflow-hidden`}>
          <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">{t('accounts.title')}</h1>
          
          {/* Create Account Button */}
          <button 
            onClick={handleCreateAccount}
            className={`relative w-full py-3 px-4 bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white rounded-lg transition flex items-center justify-center mb-4 sm:mb-6 text-sm sm:text-base ${
              userData?.kyc_status !== 'approved' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
          >
            {userData?.kyc_status !== 'approved' && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">!</span>
              </span>
            )}
            + {t('accounts.create')}
          </button>
          
          {/* Tab Navigation - Solo All, Real, Demo en móvil */}
          <div className={`${isMobile ? 'grid grid-cols-3 gap-2' : 'flex flex-wrap gap-2'} mb-4 sm:mb-6`}>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm focus:outline-none transition-all text-center ${
                activeTab === 'all'
                  ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                  : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
              }`}
            >
              {t('accounts.types.all')} ({getAllAccounts().length})
            </button>
            <button
              onClick={() => setActiveTab('real')}
              className={`px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm focus:outline-none transition-all text-center ${
                activeTab === 'real'
                  ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                  : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
              }`}
            >
              {isMobile ? t('accounts.types.realShort') : t('accounts.types.real')} ({realAccountsOnly.length})
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm focus:outline-none transition-all text-center ${
                activeTab === 'demo'
                  ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                  : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
              }`}
            >
              {isMobile ? t('accounts.types.demoShort') : t('accounts.types.demo')} ({demoAccountsOnly.length})
            </button>
          </div>
          
          {/* Account List - ocupa el espacio restante con scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-2 sm:space-y-3">
              {isLoading ? (
                <div className="text-center text-gray-400 py-3 sm:py-4">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                  <p className="text-xs sm:text-sm">{t('accounts.messages.loadingAccounts')}</p>
                </div>
              ) : error ? (
                <div className="text-center text-red-400 py-3 sm:py-4">
                  <p className="text-xs sm:text-sm">Error: {error}</p>
                </div>
              ) : accountsForCurrentTab.length === 0 ? (
                <div className="text-center text-gray-400 py-3 sm:py-4">
                  <p className="text-xs sm:text-sm">{t('tradingAccountsUI.general.noAccountsInThisCategory')}</p>
                </div>
              ) : (
                accountsForCurrentTab.map((account) => (
              <button 
                key={account.id} 
                className={`p-3 sm:p-4 w-full rounded-lg sm:rounded-xl border transition-all text-left ${
                  selectedAccountId === account.id 
                    ? 'bg-[#2a2a2a] border-cyan-500' 
                    : 'bg-[#1a1a1a] border-[#333] hover:border-gray-500'
                }`}
                onClick={() => setSelectedAccountId(account.id)}
              >
                  <div className="font-medium text-white text-sm sm:text-base">
                    {account.account_name || t('trading:accounts.noName')} 
                    {isMobile && <br />}
                    <span className="text-xs sm:text-sm">(ID: {account.account_number || 'N/A'})</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {account.account_type || 'N/A'} • ${(account.balance || 0).toFixed(2)}
                  </div>
              </button>
              ))
            )}
            </div>
          </div>
        </div>
        
        {/* COLUMNA DERECHA - Detalles de Cuenta */}
        <div className={`${isMobile ? 'w-full' : 'lg:col-span-7'} space-y-4 sm:space-y-6`}>
          {selectedAccountId ? (
            <>
              {/* Detalles de la Cuenta Seleccionada */}
              <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#333]">
                {(() => {
                  const selectedAccount = getAllAccounts().find(acc => acc.id === selectedAccountId);
                  if (!selectedAccount) {
                    return (
                      <div className="text-center text-gray-400 py-8">
                        <p>{t('trading:accounts.messages.accountNotFound')}</p>
                      </div>
                    );
                  }

                  return (
                    <>
                <div className="mb-3 sm:mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg sm:text-xl font-semibold">{t('accounts.details.title')}</h2>
                    <div className="flex items-center gap-2">
                      <CustomTooltip content={t('accounts.fields.updateFrequencyTooltip')}>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded-md border border-gray-700/50 cursor-help">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-gray-300 text-xs font-medium">
                            {t('accounts.fields.updateFrequency')}
                          </p>
                        </div>
                      </CustomTooltip>
                      <button
                        onClick={handleRefreshData}
                        disabled={!canRefresh || isRefreshing}
                        className={`p-1.5 rounded-md text-xs transition-colors ${
                          canRefresh && !isRefreshing
                            ? 'text-gray-400 hover:text-cyan-400 hover:bg-[#3a3a3a]'
                            : 'text-gray-600 cursor-not-allowed'
                        }`}
                        title={t('accounts.fields.refresh')}
                      >
                        <svg
                          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs sm:text-sm">{t('accounts.details.subtitle')}</p>
                </div>
                
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm mb-4 sm:mb-6">
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">{selectedAccount.account_name} (ID: {selectedAccount.account_number})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                      <span className="text-gray-400">{t('accounts.fields.currentBalance')}: ${(selectedAccount.balance || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">{t('accounts.fields.accountType')}: {selectedAccount.account_type || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">{t('accounts.fields.leverage')}: {selectedAccount.leverage?.includes(':') ? selectedAccount.leverage : `1:${selectedAccount.leverage || '500'}`}</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">{t('accounts.fields.platform')}: {selectedAccount.platform || 'MetaTrader 5'}</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">{t('accounts.fields.status')}: {getAccountStatus(selectedAccount).status}</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">{t('accounts.fields.createdAt')}: {(() => {
                            const daysFromCreation = getDaysFromCreation(selectedAccount.created_at || selectedAccount.createdAt);
                            if (daysFromCreation === null) {
                              return 'N/A';
                            } else if (daysFromCreation === 0) {
                              return t('common:time.today');
                            } else if (daysFromCreation === 1) {
                              return t('common:time.oneDayAgo');
                            } else {
                              return t('common:time.daysAgo', { count: daysFromCreation });
                            }
                          })()}</span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-[#1a1a1a] rounded-lg sm:rounded-xl">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="font-medium text-white text-sm sm:text-base">{t('accounts.details.credentials')}</h3>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getAccountStatus(selectedAccount).statusColor}`}>
                            {getAccountStatus(selectedAccount).status}
                          </span>
                  </div>
                  <div className={`${isMobile ? 'space-y-3' : 'grid grid-cols-2 gap-4'} text-xs sm:text-sm`}>
                    {/* Servidor MT5 */}
                    <div className="p-2 sm:p-3 bg-[#0f0f0f] rounded-lg relative group">
                      <span className="text-gray-400 text-xs block mb-1">{t('accounts.fields.serverMT5')}</span>
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium text-sm">{selectedAccount.server || 'AlphaGlobalMarket-Live'}</div>
                        <button
                          onClick={() => copyToClipboard(selectedAccount.server || 'AlphaGlobalMarket-Live', 'Server')}
                          className={`${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity p-1 hover:bg-[#2a2a2a] rounded`}
                          title={t('trading:accounts.actions.copyServer')}
                        >
                          {copiedField === 'Server' ? (
                            <Check size={12} className="text-green-400" />
                          ) : (
                            <Copy size={12} className="text-gray-400 hover:text-white" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Contraseña Master */}
                    <div className="p-3 bg-[#0f0f0f] rounded-lg relative group">
                      <span className="text-gray-400 text-xs block mb-1">{t('accounts.fields.masterPassword')}</span>
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">
                          {showPasswords.master ? (selectedAccount.mt5_password || selectedAccount.master_password || '••••••••') : '••••••••'}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => togglePasswordVisibility('master')}
                            className="p-1 hover:bg-[#2a2a2a] rounded"
                            title={showPasswords.master ? t('trading:accounts.actions.hidePassword') : t('trading:accounts.actions.showPassword')}
                          >
                            {showPasswords.master ? (
                              <EyeOff size={14} className="text-gray-400 hover:text-white" />
                            ) : (
                              <Eye size={14} className="text-gray-400 hover:text-white" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(selectedAccount.mt5_password || selectedAccount.master_password || '', 'Contraseña Master')}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded"
                            title={t('trading:accounts.actions.copyMasterPassword')}
                          >
                            {copiedField === 'Contraseña Master' ? (
                              <Check size={14} className="text-green-400" />
                            ) : (
                              <Copy size={14} className="text-gray-400 hover:text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Número de Cuenta */}
                    <div className="p-3 bg-[#0f0f0f] rounded-lg relative group">
                      <span className="text-gray-400 text-xs block mb-1">{t('accounts.fields.accountNumber')}</span>
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">{selectedAccount.account_number}</div>
                        <button
                          onClick={() => copyToClipboard(selectedAccount.account_number, 'Número de Cuenta')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded"
                          title={t('trading:accounts.actions.copyAccountNumber')}
                        >
                          {copiedField === 'Número de Cuenta' ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} className="text-gray-400 hover:text-white" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Contraseña Investor - Solo lectura */}
                    <div className="p-3 bg-[#0f0f0f] rounded-lg relative group">
                      <span className="text-gray-400 text-xs block mb-1">{t('accounts.fields.investorPasswordReadOnly')}</span>
                      <div className="flex items-center justify-between">
                        {(selectedAccount.mt5_investor_password || selectedAccount.investorPassword) ? (
                          <>
                            <div className="text-white font-medium">
                              {showPasswords.investor ? (selectedAccount.mt5_investor_password || selectedAccount.investorPassword || '••••••••') : '••••••••'}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => togglePasswordVisibility('investor')}
                                className="p-1 hover:bg-[#2a2a2a] rounded"
                                title={showPasswords.investor ? t('trading:accounts.actions.hidePassword') : t('trading:accounts.actions.showPassword')}
                              >
                                {showPasswords.investor ? (
                                  <EyeOff size={14} className="text-gray-400 hover:text-white" />
                                ) : (
                                  <Eye size={14} className="text-gray-400 hover:text-white" />
                                )}
                              </button>
                              <button
                                onClick={() => copyToClipboard(selectedAccount.mt5_investor_password || selectedAccount.investorPassword || '', 'Contraseña Investor')}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded"
                                title={t('trading:accounts.actions.copyInvestorPassword')}
                              >
                                {copiedField === 'Contraseña Investor' ? (
                                  <Check size={14} className="text-green-400" />
                                ) : (
                                  <Copy size={14} className="text-gray-400 hover:text-white" />
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500 font-medium">
                            {t('trading:accounts.messages.notConfigured')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#333] flex items-center justify-center h-48 sm:h-64">
              <div className="text-center text-gray-400">
                <h3 className="text-base sm:text-lg mb-2">{t('trading:accounts.messages.selectAccount')}</h3>
                <p className="text-sm">{t('trading:accounts.messages.chooseAccount')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* SECCIÓN PRINCIPAL - Balance y Métricas */}
      {selectedAccountId && (
        <div className="space-y-4 sm:space-y-6">
          {/* Sección Balance + Métricas lado a lado */}
          <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-4 gap-6'} mb-4 sm:mb-6`}>
            
            {/* Balance Card - Lado izquierdo (2 columnas - menos ancho) */}
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-2'} p-4 sm:p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl relative`}>
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <CustomTooltip content={t('tooltips.balance')}>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold cursor-help">{t('balance')}</h2>
                </CustomTooltip>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefreshData}
                    disabled={!canRefresh || isRefreshing}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      canRefresh && !isRefreshing
                        ? 'text-gray-400 hover:text-cyan-400 hover:bg-[#3a3a3a]'
                        : 'text-gray-600 cursor-not-allowed'
                    }`}
                    title={t('accounts.fields.refresh')}
                  >
                    <svg
                      className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center mb-2 sm:mb-3">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold mr-2 sm:mr-3 text-white">
                  ${(
                    // Mostrar equity usando servicio estandarizado
                    directEquity ?? equityDataService.getAccountEquity(realMetrics) ?? equityDataService.getChartValue(balanceData[balanceData.length - 1]) ?? 0
                  ).toLocaleString()}
                </span>
                <span className={`px-2 py-1 rounded text-xs sm:text-sm ${
                  (realMetrics?.profit_loss_percentage || 0) >= 0 
                    ? 'bg-green-800 bg-opacity-30 text-green-400' 
                    : 'bg-red-800 bg-opacity-30 text-red-400'
                }`}>
                  {(realMetrics?.profit_loss_percentage || 0) >= 0 ? '+' : ''}{(realMetrics?.profit_loss_percentage || 0).toFixed(1)}%
                </span>
              </div>
              {/* Chips con Balance y Equity actuales */}
              <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                <div className="px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded-md text-xs text-gray-300">
                  {t('trading:balance')}: <span className="text-white font-semibold">${equityDataService.getAccountBalance(realMetrics ?? balanceData[balanceData.length - 1]).toLocaleString()}</span>
                </div>
                <div className="px-2 py-1 bg-cyan-900/30 border border-cyan-700/40 rounded-md text-xs text-cyan-300">
                  {t('trading:equity')}: <span className="text-white font-semibold">${(directEquity ?? equityDataService.getAccountEquity(realMetrics) ?? equityDataService.getChartValue(balanceData[balanceData.length - 1]) ?? 0).toLocaleString()}</span>
                </div>
              </div>
              
              <div className={`w-full ${isMobile ? 'h-48' : 'h-64'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorBalanceGain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorBalanceLoss" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <YAxis 
                        domain={[ 'dataMin', 'dataMax' ]}
                        tickFormatter={(value) => {
                          if (typeof value === 'number' && Math.abs(value) >= 1000) {
                            return `${(value/1000).toFixed(1)}k`;
                          }
                          return typeof value === 'number' ? value.toFixed(0) : '0';
                        }}
                        axisLine={false} tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        width={40} 
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#232323',
                          border: '1px solid #333',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#ffffff',
                          padding: '12px'
                        }}
                        labelStyle={{ color: '#9CA3AF', marginBottom: '8px' }}
                        itemStyle={{ color: '#ffffff' }}
                        formatter={(value) => [`$${value.toLocaleString()}`, t('trading:accounts.fields.balance')]}
                        content={(props) => {
                          const { active, payload, label } = props;
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const dateStr = data.fullDate || data.timestamp || label;
                            
                            let formattedDate = '';
                            let formattedTime = '';
                            
                            if (dateStr && typeof dateStr === 'string' && dateStr.includes('-')) {
                              const date = new Date(dateStr);
                              if (!isNaN(date.getTime())) {
                                // Format date according to locale
                                formattedDate = date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                });
                                
                                // Format time
                                formattedTime = date.toLocaleTimeString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              }
                            }
                            
                            return (
                              <div style={{ backgroundColor: '#232323', border: '1px solid #333', borderRadius: '8px', padding: '12px' }}>
                                {formattedDate && (
                                  <div style={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '12px' }}>
                                    {formattedDate} {formattedTime && `• ${formattedTime}`}
                                  </div>
                                )}
                                <div style={{ fontSize: '14px' }}>
                                  <span style={{ color: '#9CA3AF' }}>{t('trading:accounts.fields.balance')}: </span>
                                  <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                                    ${payload[0].value.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone" 
                        dataKey="value" 
                        stroke={(() => {
                          if (!balanceData || balanceData.length < 2) return "#06b6d4";
                          const first = parseFloat(balanceData[0].value) || 0;
                          const last = parseFloat(balanceData[balanceData.length - 1].value) || 0;
                          return last < first ? "#ef4444" : "#06b6d4";
                        })()}
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill={(() => {
                          if (!balanceData || balanceData.length < 2) return "url(#colorBalanceGain)";
                          const first = parseFloat(balanceData[0].value) || 0;
                          const last = parseFloat(balanceData[balanceData.length - 1].value) || 0;
                          return last < first ? "url(#colorBalanceLoss)" : "url(#colorBalanceGain)";
                        })()}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
            {/* Métricas lado derecho - 2 columnas con altura completa */}
            <div className={`${isMobile ? 'w-full grid grid-cols-1 gap-3' : 'lg:col-span-2 flex flex-col justify-between'} space-y-3 sm:space-y-4`}>
              {/* Profit/Loss */}
              <div className={`${isMobile ? '' : 'flex-1'} p-4 sm:p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center`}>
                <CustomTooltip content={t('tooltips.profitLoss')}>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 cursor-help">{t('metrics.profitLoss')}</h3>
                </CustomTooltip>
                  <div className="flex items-center mb-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-2">
                    ${Math.abs(realMetrics?.profit_loss || 0).toFixed(2)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    (realMetrics?.profit_loss || 0) >= 0
                      ? 'bg-green-800 bg-opacity-30 text-green-400'
                      : 'bg-red-800 bg-opacity-30 text-red-400'
                  }`}>
                    {(realMetrics?.profit_loss || 0) >= 0 ? '+' : ''}{(realMetrics?.profit_loss_percentage || 0).toFixed(1)}%
                  </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400">{t('metrics.historicalTotal')}</p>
                </div>

              {/* Drawdown */}
              <div className={`${isMobile ? '' : 'flex-1'} p-4 sm:p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center`}>
                <CustomTooltip content={t('tooltips.drawdown')}>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 cursor-help">{t('drawdown')}</h3>
                </CustomTooltip>
                <div className="flex items-center mb-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-2">
                    ${(() => {
                      // Calcular drawdown sobre equity usando servicio estandarizado
                      const basis = equityDataService.getAccountEquity(realMetrics);
                      const maxDrawdownPercent = realMetrics?.max_drawdown || 0;
                      const drawdownAmount = (basis * maxDrawdownPercent) / 100;
                      return drawdownAmount.toFixed(2);
                    })()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    (realMetrics?.current_drawdown || 0) <= 5
                      ? 'bg-red-800 bg-opacity-30 text-red-400'
                      : (realMetrics?.current_drawdown || 0) <= 10
                      ? 'bg-red-900 bg-opacity-40 text-red-300'
                      : 'bg-red-900 bg-opacity-50 text-red-200'
                  }`}>
                    {t('metrics.current')}: ${(() => {
                      const basis = equityDataService.getAccountEquity(realMetrics);
                      const currentDrawdownPercent = realMetrics?.current_drawdown || 0;
                      const currentDrawdownAmount = (basis * currentDrawdownPercent) / 100;
                      return currentDrawdownAmount.toFixed(2);
                    })()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400">{t('metrics.maxCurrent')}</p>
                </div>
                </div>
              </div>
              
          {/* ===== CAPTURA 3: GRID MÉTRICAS 3x3 ===== */}
          
          {/* Grid de métricas KPIs con iconos del public */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
            {/* 1. {t('tradingAccountsUI.metrics.averageLossPerTrade')} */}
            <div className={`p-3 sm:p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl ${isMobile ? 'flex items-center justify-between' : 'flex justify-between items-center'}`}>
              <CustomTooltip content={t('tooltips.averageLoss')}>
                <div className="cursor-help">
                <h3 className="text-gray-400 text-xs sm:text-sm mb-1">{t('metrics.averageLoss')}</h3>
                <div className="flex items-center">
                  <span className="text-lg sm:text-xl font-bold text-red-400">${(realStatistics?.average_loss || 0).toFixed(2)}</span>
                  <span className="bg-red-800 bg-opacity-30 text-red-400 px-1 py-0.5 rounded text-xs ml-2">{t('metrics.average')}</span>
                </div>
              </div>
              </CustomTooltip>
              <div className={`bg-[#2d2d2d] ${isMobile ? 'p-2' : 'p-4'} rounded-full`}>
                <img src="/PerdidaIcono.svg" alt="" className={isMobile ? 'w-8 h-8' : ''} />
                  </div>
                  </div>

            {/* 2. {t('tradingAccountsUI.metrics.averageWinPerTrade')} */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content={t('tooltips.averageWin')}>
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">{t('metrics.averageWin')}</h3>
                <div className="flex items-center">
                  <span className="text-xl font-bold">${(realStatistics?.average_win || 0).toFixed(2)}</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-1 py-0.5 rounded text-xs ml-2">{t('metrics.average')}</span>
                </div>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/GananciaIcono.svg" alt="" className="" />
                </div>
              </div>
              
            {/* 3. {t('tradingAccountsUI.metrics.averageLotSizePerTrade')} */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content={t('tooltips.averageLotSize')}>
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">{t('metrics.averageLotSize')}</h3>
                <span className="text-xl font-bold">{(realStatistics?.average_lot_size || 0).toFixed(2)}</span>
                  </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/Group.svg" alt="" className="" />
                  </div>
                </div>

            {/* 4. {t('tradingAccountsUI.metrics.averageDurationPerTrade')} */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content={t('tooltips.averageDuration')}>
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">{t('metrics.averageDuration')}</h3>
                <span className="text-xl font-bold">{realStatistics?.average_trade_duration || '00:00:00'}</span>
                  </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/RelojIcono.svg" alt="" className="" />
                  </div>
            </div>

            {/* 5. {t('tradingAccountsUI.metrics.riskRewardRatio')} */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content={t('tooltips.riskReward')}>
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">{t('metrics.riskReward')}</h3>
                <span className="text-xl font-bold">
                  {realStatistics?.risk_reward_ratio 
                    ? `1:${parseFloat(realStatistics.risk_reward_ratio).toFixed(2)}` 
                    : '1:0'}
                </span>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/RatioVictoria.svg" alt="" className="w-12 h-12" />
                </div>
              </div>
              
            {/* 6. {t('tradingAccountsUI.metrics.winRatio')} */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content={t('tooltips.winRate')}>
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">{t('metrics.winRate')}</h3>
                <span className="text-xl font-bold">{(realStatistics?.win_rate || 0).toFixed(1)}%</span>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/MonedaIcono.svg" alt="" className="w-12 h-12" />
              </div>
            </div>

            {/* 7. {t('tradingAccountsUI.metrics.totalDeposits')} */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content={t('tooltips.totalDeposits')}>
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">{t('metrics.totalDeposits')}</h3>
                <span className="text-xl font-bold">${(realStatistics?.total_deposits || 0).toFixed(2)}</span>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/hugeicons.svg" alt="" className="w-12 h-12" />
              </div>
            </div>

            {/* 8. {t('tradingAccountsUI.metrics.totalWithdrawals')} */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content={t('tooltips.totalWithdrawals')}>
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">{t('metrics.totalWithdrawals')}</h3>
                <span className="text-xl font-bold">${(realStatistics?.total_withdrawals || 0).toFixed(2)}</span>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/ph.svg" alt="" className="w-12 h-12" />
        </div>
      </div>
      
            {/* 9. {t('tradingAccountsUI.metrics.pnl')} */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content={t('tooltips.pnl')}>
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">{t('metrics.pnl')}</h3>
                <span className="text-xl font-bold">${(realStatistics?.net_pnl || 0).toFixed(2)} = {(realStatistics?.net_pnl_percentage || 0).toFixed(1)}%</span>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/streamline.svg" alt="" className="w-12 h-12" />
              </div>
            </div>
          </div>



          {/* ===== CAPTURA 5: BENEFICIO TOTAL ===== */}
          
          {/* Sección Beneficio Total con Tabs */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
            {/* Remover botón refresh duplicado del beneficio total */}
            {/* Header con Tabs y Filtro - RESPONSIVE */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              {/* Tabs */}
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
                <button 
                  onClick={() => setBenefitChartTab('benefitTotal')}
                  className={`px-3 py-2 bg-transparent rounded-full text-xs sm:text-sm font-medium transition ${
                    benefitChartTab === 'benefitTotal' 
                      ? 'border border-cyan-400 text-cyan-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isMobile ? t('accounts.fields.profit') : t('tradingAccountsUI.charts.benefitTotal')}
                </button>
                <button 
                  onClick={() => setBenefitChartTab('balance')}
                  className={`px-3 py-2 bg-transparent rounded-full text-xs sm:text-sm font-medium transition ${
                    benefitChartTab === 'balance' 
                      ? 'border border-cyan-400 text-cyan-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('tradingAccountsUI.charts.balance')}
                </button>
                <button 
                  onClick={() => setBenefitChartTab('drawdown')}
                  className={`px-3 py-2 bg-transparent rounded-full text-xs sm:text-sm font-medium transition ${
                    benefitChartTab === 'drawdown' 
                      ? 'border border-cyan-400 text-cyan-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('tradingAccountsUI.charts.drawdown')}
                </button>
              </div>
              
              {/* Filtro Dropdown */}
              <div className="relative w-full sm:w-auto">
                <CustomDropdown
                  options={translateOptions(benefitChartFilterOptions)}
                  selectedValue={benefitChartFilter}
                  onSelect={setBenefitChartFilter}
                  dropdownClass="w-full sm:w-48"
                />
              </div>
            </div>

            {/* Filtros de fecha personalizada */}
            {benefitChartFilter === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('filters.dateFrom')}
                  </label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('filters.dateTo')}
                  </label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Título */}
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">
              {isMobile ? t(benefitChartTab).split(' ')[0] : t(benefitChartTab)}
              {(historyFilters.instrument !== 'all' || 
                historyFilters.type !== 'all' || 
                historyFilters.profitLoss !== 'all' || 
                historyFilters.dateFrom || 
                historyFilters.dateTo) && (
                <span className="ml-2 px-2 py-1 bg-cyan-600 text-white text-xs rounded-full">
                  {t('filters.filtered')}
                </span>
              )}
            </h2>
            
            {/* Gráfico - OPTIMIZADO PARA MÓVIL */}
            <div className={`w-full ${isMobile ? 'h-64' : 'h-80'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="color
                    " x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: isMobile ? 9 : 11 }}
                    interval={isMobile ? 'preserveStartEnd' : 0}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: isMobile ? 9 : 11 }}
                    domain={benefitChartTab === 'drawdown' ? ['dataMin', 0] : ['dataMin - 100', 'dataMax + 100']}
                    width={isMobile ? 50 : 60}
                    tickFormatter={(value) => {
                      if (benefitChartTab === 'drawdown') {
                        return `${typeof value === 'number' ? Math.abs(value).toFixed(1) : 0}%`;
                      }
                      if (typeof value === 'number' && Math.abs(value) >= 1000) {
                        return `${(value/1000).toFixed(1)}K`;
                      }
                      return typeof value === 'number' ? value.toFixed(0) : '0';
                    }}
                  />
                  <CartesianGrid 
                    strokeDasharray="none" 
                    stroke="#333" 
                    horizontal={true} 
                    vertical={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#232323',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      fontSize: isMobile ? '12px' : '14px',
                      color: '#ffffff'
                    }}
                    labelStyle={{ color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                    formatter={(value, name) => {
                      const unit = benefitChartTab === 'drawdown' ? '%' : '$';
                      const numValue = typeof value === 'number' ? value : 0;
                      const formattedValue = benefitChartTab === 'drawdown' 
                        ? (typeof numValue === 'number' ? numValue.toFixed(2) : '0') 
                        : (typeof numValue === 'number' ? numValue.toLocaleString() : '0');
                      
                      // Use the name from the Line component
                      return [`${unit}${formattedValue}`, name];
                    }}
                    labelFormatter={(label) => {
                      // Formatear la fecha de manera más legible
                      if (typeof label === 'string' && label.includes('-')) {
                        const date = new Date(label);
                        return `${t('trading:charts.date')}: ${date.toLocaleDateString()}`;
                      }
                      return `${t('trading:charts.date')}: ${label}`;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value"
                    name={
                      benefitChartTab === 'benefitTotal' 
                        ? t('trading:charts.totalProfit')
                        : benefitChartTab === 'balance'
                        ? t('trading:accounts.fields.balance')
                        : t('trading:charts.drawdown')
                    }
                    stroke={
                      benefitChartTab === 'drawdown'
                        ? '#ef4444'
                        : (currentChartData && currentChartData.length > 1 && (currentChartData[currentChartData.length - 1].value < currentChartData[0].value)
                            ? '#ef4444'
                            : '#06b6d4')
                    } 
                    strokeWidth={isMobile ? 2 : 3}
                    dot={isMobile ? false : { fill: (benefitChartTab === 'drawdown' || (currentChartData && currentChartData.length > 1 && currentChartData[currentChartData.length - 1].value < currentChartData[0].value)) ? '#ef4444' : '#06b6d4', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: isMobile ? 4 : 6, fill: (benefitChartTab === 'drawdown' || (currentChartData && currentChartData.length > 1 && currentChartData[currentChartData.length - 1].value < currentChartData[0].value)) ? '#ef4444' : '#06b6d4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ===== CAPTURA 6: INSTRUMENTOS ===== */}
          
          <div className="space-y-6">
            {/* {t('tradingAccountsUI.instruments.tradingInstruments')} */}
            <div className="p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{t('copyTrading.tabs.instruments')}</h2>
              </div>

              {/* Body con Leyenda y Gráfico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Leyenda */}
                <div className="space-y-4">
                  {(() => {
                    // Determinar qué datos usar
                    const dataToUse = realInstruments?.distribution?.length > 0 
                      ? realInstruments.distribution 
                      : (realInstruments === null ? dynamicInstrumentsData : []);
                    
                    // Si no hay datos, mostrar mensaje profesional
                    if (dataToUse.length === 0 || (dataToUse.length === 1 && dataToUse[0].name === t('trading:charts.noOperations'))) {
                      return (
                        <div className="flex flex-col justify-center h-full">
                          <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#333]">
                            <div className="text-gray-500 text-sm mb-2">{t('tradingAccountsUI.instruments.status')}</div>
                            <div className="text-gray-400 font-medium">{t('tradingAccountsUI.instruments.noTradingActivity')}</div>
                            <div className="text-gray-600 text-xs mt-2">{t('tradingAccountsUI.instruments.willAppearWhenTrading')}</div>
                          </div>
                        </div>
                      );
                    }
                    
                    return dataToUse.map((entry, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-4 h-4 rounded-sm mr-3" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-gray-300">{entry.name}</span>
                        <span className="ml-auto font-semibold text-white">{(entry.value || 0).toFixed(2)}%</span>
                      </div>
                    ));
                  })()}
                </div>

                {/* Gráfico */}
                <div className="w-full h-64 pb-2">
                  {(() => {
                    const dataToUse = realInstruments?.distribution?.length > 0 
                      ? realInstruments.distribution 
                      : (realInstruments === null ? dynamicInstrumentsData : []);
                    
                    // Si no hay datos o es "Sin operaciones", mostrar mensaje profesional
                    if (dataToUse.length === 0 || (dataToUse.length === 1 && dataToUse[0].name === t('trading:charts.noOperations'))) {
                      return (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#333] flex items-center justify-center">
                              <div className="text-gray-600 text-3xl font-light">—</div>
                            </div>
                            <div className="text-gray-400 text-sm uppercase tracking-wider">{t('charts.noOperations')}</div>
                            <div className="text-gray-600 text-xs mt-1">{t('charts.noData')}</div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dataToUse}
                            cx="50%"
                            cy="45%"
                            labelLine={false}
                            label={({ percent }) => `${typeof percent === 'number' ? (percent * 100).toFixed(2) : 0}%`}
                            outerRadius={85}
                            dataKey="value"
                            stroke="#2a2a2a"
                            strokeWidth={4}
                          >
                            {dataToUse.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color}/>
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#232323',
                              border: '1px solid #333',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#ffffff'
                        }}
                        labelStyle={{ color: '#ffffff' }}
                        itemStyle={{ color: '#ffffff' }}
                        formatter={(value, name) => {
                          const numValue = typeof value === 'number' ? value : 0;
                          return [`${typeof numValue === 'number' ? numValue.toFixed(2) : '0'}%`, name];
                        }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* ===== CAPTURA 7: RENDIMIENTO ===== */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
              {/* Header - RESPONSIVE */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{t('tradingAccountsUI.general.performance')}</h2>
                  <div className="flex gap-2">
                    <button 
                      className="px-3 py-1 bg-transparent border rounded-full text-xs sm:text-sm font-medium border-cyan-400 text-cyan-400"
                    >
                      2025
                    </button>
                  </div>
                </div>
                <div className="relative w-full sm:w-auto">
                  <CustomDropdown
                    options={translateOptions(rendimientoPeriodOptions)}
                    selectedValue={rendimientoFilters.period}
                    onSelect={(value) => updateRendimientoFilter('period', value)}
                    dropdownClass="w-full sm:w-36"
                  />
          </div>
          </div>
          
              {/* Gráfico - OPTIMIZADO PARA MÓVIL */}
              <div className={`w-full ${isMobile ? 'h-64' : 'h-80'}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={optimizeChartDataForMobile(realPerformanceChart || realPerformance?.data || dynamicRendimientoData)} 
                    margin={{ 
                      top: isMobile ? 10 : 20, 
                      right: isMobile ? 10 : 0, 
                      left: isMobile ? 10 : 0, 
                      bottom: isMobile ? 20 : 5 
                    }}
                    onMouseLeave={() => setBarChartTooltip(null)}
                  >
                    <CartesianGrid 
                      strokeDasharray="none" 
                      stroke="#333" 
                      horizontal={true} 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9CA3AF', fontSize: isMobile ? 10 : 12 }}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? 'end' : 'middle'}
                      height={isMobile ? 50 : 30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9CA3AF', fontSize: isMobile ? 10 : 12 }}
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 30]}
                      width={isMobile ? 40 : 50}
                    />
                    <Tooltip
                      active={!!barChartTooltip}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      content={() => {
                        if (barChartTooltip) {
                          const { bar, label } = barChartTooltip;
                          const value = bar.value;
                          const tooltipStyle = {
                            position: 'absolute',
                            left: `${bar.x + bar.width / 2}px`,
                            top: `${bar.y}px`,
                            transform: 'translate(-50%, -100%) translateY(-8px)',
                            pointerEvents: 'none',
                            zIndex: 100,
                          };
                          return (
                            <div style={tooltipStyle}>
                              <div className={`bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white shadow-lg whitespace-nowrap ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                {rendimientoFilters.period === 'monthly' ? t('filters.month') : t('filters.quarter')}: {label}, {typeof value === 'number' ? value.toFixed(1) : value}%
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                        dataKey="value" 
                      barSize={isMobile ? 25 : 35} 
                      radius={[4, 4, 0, 0]}
                      onMouseOver={(data) => setBarChartTooltip({ bar: data, label: data.name })}
                    >
                      {(optimizeChartDataForMobile(realPerformanceChart || realPerformance?.data || dynamicRendimientoData)).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </div>

            {/* ===== Historial de Operaciones ===== */}
            <div className="p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
              {/* Header con título */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">{t('operationsHistory')}</h2>
              </div>

              {/* Botón toggle filtros móvil */}
              {isMobile && (
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="w-full mb-4 py-2 px-4 bg-[#2a2a2a] border border-[#444] rounded-lg text-white flex items-center justify-center gap-2"
                >
                  <Filter size={16} />
                  {showMobileFilters ? t('hideFilters') : t('showFilters')}
                </button>
              )}

              {/* Filtros superiores */}
              <div className={`${isMobile && !showMobileFilters ? 'hidden' : isMobile ? 'grid grid-cols-1 gap-3 mb-4' : 'grid grid-cols-1 md:grid-cols-5 gap-4'} mb-4 sm:mb-6`}>
                {/* Instrumento */}
                <div ref={instrumentDropdownRef}>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-2">{t('instrument')}</label>
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowInstrumentDropdown(!showInstrumentDropdown);
                        // Auto scroll when opening dropdown
                        if (!showInstrumentDropdown) {
                          setTimeout(() => {
                            const dropdownElement = instrumentDropdownRef.current?.querySelector('.absolute');
                            if (dropdownElement) {
                              const rect = dropdownElement.getBoundingClientRect();
                              const isOutOfView = rect.bottom > window.innerHeight || rect.top < 0;
                              if (isOutOfView) {
                                dropdownElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }
                            }
                          }, 50);
                        }
                      }}
                      className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 sm:px-4 py-2 text-white text-left flex justify-between items-center"
                    >
                      <span className="truncate">{selectedInstrumentLabel}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showInstrumentDropdown && (
                      <div className="absolute z-20 mt-1 w-full min-w-[320px] md:min-w-[420px] bg-[#2d2d2d] border border-[#444] rounded-lg shadow-lg max-h-72 overflow-y-auto">
                        <div className="p-2 sticky top-0 bg-[#2d2d2d] z-20 border-b border-[#444]">
                          <div className="flex gap-1 mb-2 overflow-x-auto">
                            <button onClick={() => setInstrumentFilterType('forex')} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border whitespace-nowrap flex-shrink-0 ${instrumentFilterType === 'forex' ? 'border-cyan-500 bg-transparent' : 'border-gray-700 bg-transparent'}`} style={{ outline: 'none' }}>Forex</button>
                            <button onClick={() => setInstrumentFilterType('stocks')} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border whitespace-nowrap flex-shrink-0 ${instrumentFilterType === 'stocks' ? 'border-cyan-500 bg-transparent' : 'border-gray-700 bg-transparent'}`} style={{ outline: 'none' }}>{i18n.language === 'es' ? 'Acciones' : 'Stocks'}</button>
                            <button onClick={() => setInstrumentFilterType('crypto')} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border whitespace-nowrap flex-shrink-0 ${instrumentFilterType === 'crypto' ? 'border-cyan-500 bg-transparent' : 'border-gray-700 bg-transparent'}`} style={{ outline: 'none' }}>{i18n.language === 'es' ? 'Cripto' : 'Crypto'}</button>
                            <button onClick={() => setInstrumentFilterType('metal')} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border whitespace-nowrap flex-shrink-0 ${instrumentFilterType === 'metal' ? 'border-cyan-500 bg-transparent' : 'border-gray-700 bg-transparent'}`} style={{ outline: 'none' }}>{i18n.language === 'es' ? 'Metales' : 'Metals'}</button>
                            <button onClick={() => setInstrumentFilterType('index')} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border whitespace-nowrap flex-shrink-0 ${instrumentFilterType === 'index' ? 'border-cyan-500 bg-transparent' : 'border-gray-700 bg-transparent'}`} style={{ outline: 'none' }}>{i18n.language === 'es' ? 'Índices' : 'Indices'}</button>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder={t('filters.searchInstrument')}
                              value={instrumentSearchTerm}
                              onChange={(e) => setInstrumentSearchTerm(e.target.value)}
                              className="w-full bg-[#232323] border border-[#444] rounded-md px-3 py-2 pl-10 focus:outline-none focus:border-cyan-500"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        
                        <div key="todos-filter" onClick={() => { updateHistoryFilter('instrument', 'all'); setShowInstrumentDropdown(false); }} className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer">{t('filters.all')}</div>

                        {favoriteFilteredInstruments.map(item => (
                          <div key={item.value + '-fav'} onClick={() => { updateHistoryFilter('instrument', item.value); setShowInstrumentDropdown(false); }} className={`px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer flex justify-between items-center ${historyFilters.instrument === item.value ? 'bg-[#3f3f3f]' : ''}`}>
                            <span>{item.label}</span>
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.value); }} className="p-1"><Star className={`w-4 h-4 ${favoriteInstruments.includes(item.value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} /></button>
                          </div>
                        ))}

                        {nonFavoriteFilteredInstruments.map(item => (
                          <div key={item.value} onClick={() => { updateHistoryFilter('instrument', item.value); setShowInstrumentDropdown(false); }} className={`px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer flex justify-between items-center ${historyFilters.instrument === item.value ? 'bg-[#3f3f3f]' : ''}`}>
                            <span>{item.label}</span>
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.value); }} className="p-1"><Star className={`w-4 h-4 ${favoriteInstruments.includes(item.value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} /></button>
                    </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <CustomDropdown
                    label={t('positions.fields.type')}
                    options={translateOptions(typeOptions)}
                    selectedValue={historyFilters.type}
                    onSelect={(value) => updateHistoryFilter('type', value)}
                  />
                </div>
                
                {/* Desde */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">{t('filters.from')}</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={historyFilters.dateFrom}
                      onChange={(e) => updateHistoryFilter('dateFrom', e.target.value)}
                      className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-2 text-white [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Hasta */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">{t('filters.to')}</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={historyFilters.dateTo}
                      onChange={(e) => updateHistoryFilter('dateTo', e.target.value)}
                      className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-2 text-white [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Ganancia/Pérdida */}
                <div>
                  <CustomDropdown
                    label={t('filters.profitLoss')}
                    options={translateOptions(profitLossOptions)}
                    selectedValue={historyFilters.profitLoss}
                    onSelect={(value) => updateHistoryFilter('profitLoss', value)}
                  />
                </div>
              </div>

              {/* Tabla completa de transacciones */}
              {isMobile ? (
                /* Vista de tarjetas para móvil */
                <div className="space-y-3">
                  {filteredHistorialData.map((transaction, index) => (
                    <div key={index} className="p-4 bg-[#1a1a1a] rounded-lg border border-[#333]">
                      {/* Header de la tarjeta */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <img 
                            src={transaction.bandera || 'https://cdn-icons-png.flaticon.com/512/2150/2150150.png'} 
                            alt={transaction.instrumento}
                            className="w-5 h-5 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://cdn-icons-png.flaticon.com/512/2150/2150150.png';
                            }}
                          />
                          <span className="font-medium text-white">{transaction.instrumento}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            transaction.tipo === t('positions.types.buy') ? 'bg-green-800/30 text-green-400' : 'bg-red-800/30 text-red-400'
                          }`}>
                            {transaction.tipo}
                          </span>
                        </div>
                        <div className={`font-medium ${transaction.resultadoColor} text-right`}>
                          <div>{transaction.resultado}</div>
                          <div className="text-xs">{transaction.resultadoPct}</div>
                        </div>
                      </div>

                      {/* Información principal */}
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                        <div>
                          <div className="mb-1"><span className="text-white">Apertura:</span> {transaction.fechaApertura}</div>
                          <div className="mb-1"><span className="text-white">Cierre:</span> {transaction.fechaCierre}</div>
                          <div className="mb-1"><span className="text-white">{t('lotSize')}:</span> {transaction.lotaje}</div>
                        </div>
                        <div>
                          <div className="mb-1"><span className="text-white">{t('entry')}:</span> {transaction.precioApertura}</div>
                          <div className="mb-1"><span className="text-white">{t('exit')}:</span> {transaction.precioCierre}</div>
                          <div className="mb-1"><span className="text-white">{t('pips')}:</span> {transaction.pips}</div>
                        </div>
                      </div>

                      {/* Información secundaria */}
                      <div className="mt-3 pt-3 border-t border-[#333] text-xs text-gray-400">
                        <div className="flex justify-between">
                          <span>ID: {transaction.idPosicion}</span>
                          <span>SL: {transaction.stopLoss} | TP: {transaction.takeProfit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {t('dateOpen')}
                        </div>
                      </th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {t('dateClose')}
                        </div>
                      </th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">{t('instrument')}</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">{t('type')}</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">{t('lotSize')}</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">{t('stopLoss')}</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">{t('takeProfit')}</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">{t('openPrice')}</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">{t('closePrice')}</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">{t('pips')}</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">{t('positionId')}</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">{t('result')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistorialData.map((transaction, index) => (
                      <tr key={index} className="border-b border-[#333] hover:bg-[#2a2a2a] transition-colors">
                        {/* {t('dateOpen')} */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 text-white text-xs">
                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <div>{transaction.fechaApertura}</div>
                              <div className="text-gray-500">{transaction.tiempoApertura}</div>
                            </div>
                          </div>
                        </td>

                        {/* {t('dateClose')} */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 text-white text-xs">
                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <div>{transaction.fechaCierre}</div>
                              <div className="text-gray-500">{transaction.tiempoCierre}</div>
                            </div>
                          </div>
                        </td>

                        {/* {t('instrument')} */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <img 
                              src={transaction.bandera || 'https://cdn-icons-png.flaticon.com/512/2150/2150150.png'} 
                              alt={transaction.instrumento}
                              className="w-5 h-5 rounded-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://cdn-icons-png.flaticon.com/512/2150/2150150.png';
                              }}
                            />
                            <span className="text-white font-medium">{transaction.instrumento}</span>
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="py-3 px-2 text-white">{transaction.tipo}</td>

                        {/* {t('lotSize')} */}
                        <td className="py-3 px-2 text-white">{transaction.lotaje}</td>

                        {/* Stop Loss */}
                        <td className="py-3 px-2">
                          <div className="text-white">
                            {transaction.stopLoss}
                            <span className="text-xs text-gray-400 bg-gray-700 px-1 rounded ml-1">
                              {transaction.stopLossPct}
                            </span>
                          </div>
                        </td>

                        {/* Take Profit */}
                        <td className="py-3 px-2">
                          <div className="text-white">
                            {transaction.takeProfit}
                            <span className="text-xs text-gray-400 bg-gray-700 px-1 rounded ml-1">
                              {transaction.takeProfitPct}
                            </span>
                          </div>
                        </td>

                        {/* Precio De Apertura */}
                        <td className="py-3 px-2 text-white">{transaction.precioApertura}</td>

                        {/* Precio De Cierre */}
                        <td className="py-3 px-2 text-white">{transaction.precioCierre}</td>

                        {/* Pips */}
                        <td className="py-3 px-2 text-white">{transaction.pips}</td>

                        {/* ID De Posición */}
                        <td className="py-3 px-2 text-white">{transaction.idPosicion}</td>

                        {/* Resultado */}
                        <td className="py-3 px-2">
                          <div className={`font-medium ${transaction.resultadoColor} flex items-center gap-2 whitespace-nowrap`}>
                            <span>{transaction.resultado}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              transaction.resultadoColor === 'text-green-400' 
                                ? 'bg-green-800 bg-opacity-30' 
                                : 'bg-red-800 bg-opacity-30'
                            }`}>
                              {transaction.resultadoPct}
                            </span>
                            <ArrowUpRight size={14} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
                
              {/* Total para ambas vistas */}
              <div className="mt-4 sm:mt-6 pt-4 border-t border-[#333] flex justify-between items-center">
                <span className="text-lg sm:text-xl font-bold text-white">{t('tradingAccountsUI.filters.total')}</span>
                <div className="text-lg sm:text-xl font-bold" style={{ color: 'white' }}>
                    ${filteredHistorialData.reduce((sum, item) => {
                      const value = typeof item.ganancia === 'number' ? item.ganancia : parseFloat(item.ganancia) || 0;
                      return sum + value;
                    }, 0).toFixed(2)}
                  {filteredHistorialData.length > 0 && (
                    <span className={`text-xs sm:text-sm px-2 py-1 rounded ml-2 ${
                      filteredHistorialData.reduce((sum, item) => {
                        const value = typeof item.ganancia === 'number' ? item.ganancia : parseFloat(item.ganancia) || 0;
                        return sum + value;
                      }, 0) >= 0
                        ? 'bg-green-800 bg-opacity-30 text-green-400'
                        : 'bg-red-800 bg-opacity-30 text-red-400'
                    }`}>
                      {filteredHistorialData.reduce((sum, item) => {
                        const value = typeof item.ganancia === 'number' ? item.ganancia : parseFloat(item.ganancia) || 0;
                        return sum + value;
                      }, 0) >= 0 ? '+' : ''}
                      {((filteredHistorialData.reduce((sum, item) => {
                        const value = typeof item.ganancia === 'number' ? item.ganancia : parseFloat(item.ganancia) || 0;
                        return sum + value;
                      }, 0) / 15000) * 100).toFixed(1)}% 
                      {filteredHistorialData.reduce((sum, item) => {
                        const value = typeof item.ganancia === 'number' ? item.ganancia : parseFloat(item.ganancia) || 0;
                        return sum + value;
                      }, 0) >= 0 ? '↗' : '↘'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración de Contraseña Investor */}
      {showInvestorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] w-full max-w-md">
            {/* Header del Modal */}
            <div className="flex justify-between items-center p-6 border-b border-[#333]">
              <h3 className="text-xl font-semibold text-white">{t('trading.configurePassword')} {t('trading.investorPassword')}</h3>
              <button
                onClick={closeInvestorModal}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-400 mb-4">
                La contraseña investor permite acceso de solo lectura a la cuenta MT5. 
                Ideal para compartir con inversores o sistemas de análisis.
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="investorPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Nueva Contraseña Investor
                </label>
                <input
                  type="password"
                  id="investorPassword"
                  value={investorPassword}
                  onChange={(e) => setInvestorPassword(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder={t('trading:accounts.passwordPlaceholder')}
                  disabled={isUpdatingPassword}
                />
              </div>

              {/* Campo Confirmar Contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('accounts.confirmPasswordPlaceholder')}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder={t('trading:accounts.confirmPasswordPlaceholder')}
                  disabled={isUpdatingPassword}
                />
              </div>

              {/* Requisitos de Contraseña */}
              <div className="text-xs text-gray-500">
                • Mínimo 6 caracteres
                • Se recomienda usar una combinación de letras y números
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex justify-end gap-3 p-6 border-t border-[#333]">
              <button
                onClick={closeInvestorModal}
                disabled={isUpdatingPassword}
                className="px-4 py-2 bg-transparent border border-[#333] text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={saveInvestorPassword}
                disabled={isUpdatingPassword || !investorPassword || !confirmPassword}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdatingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Configurando...
                  </>
                ) : (
                  <>
                    <Settings size={16} />
                    {t('common.configure')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingAccounts;
