import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend, CartesianGrid, LabelList, Tooltip } from 'recharts';
import { useAccounts, ACCOUNT_CATEGORIES } from '../contexts/AccountsContext';
import { Copy, Eye, EyeOff, Check, X, Settings, Menu, Filter, ArrowUpRight, Star, Search as SearchIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { updateInvestorPassword } from '../services/tradingAccounts';
import { scrollToTopManual } from '../hooks/useScrollToTop';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import CustomDropdown from './utils/CustomDropdown';
import CustomTooltip from './utils/CustomTooltip';
import useTranslation from '../hooks/useTranslation';

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

// Options for custom dropdowns
const typeOptions = [
  { value: 'Todos', label: 'Todos' },
  { value: 'Compra', label: 'Compra' },
  { value: 'Venta', label: 'Venta' },
];

const profitLossOptions = [
  { value: 'Todos', label: 'Todos' },
  { value: 'Ganancia', label: 'Ganancia' },
  { value: 'Pérdida', label: 'Pérdida' },
];

const benefitChartFilterOptions = [
  { value: 'Último mes', label: 'Último mes' },
  { value: 'Últimos 3 meses', label: 'Últimos 3 meses' },
  { value: 'Último año', label: 'Último año' },
];

const rendimientoPeriodOptions = [
  { value: 'Mensual', label: 'Mensual' },
  { value: 'Trimestral', label: 'Trimestral' },
];

const TradingAccounts = ({ setSelectedOption, navigationParams, scrollContainerRef }) => {
  const { t } = useTranslation();
  const {
    accounts,
    isLoading,
    error,
    getAllAccounts,
    getAccountsByCategory,
    ACCOUNT_CATEGORIES: ACC_CAT,
    refreshAccounts
  } = useAccounts();

  const { currentUser } = useAuth();

  // Determinar el estado inicial basado en los parámetros de navegación
  // para evitar el parpadeo de la doble navegación.
  const getInitialViewMode = () => {
    return navigationParams?.viewMode === 'details' && navigationParams?.accountId ? 'details' : 'overview';
  };

  const getInitialSelectedAccountId = () => {
    return navigationParams?.viewMode === 'details' ? navigationParams.accountId : null;
  };
  
  const [activeTab, setActiveTab] = useState(t('trading.all'));
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
    instrument: 'Todos',
    type: 'Todos',
    dateFrom: '',
    dateTo: '',
    profitLoss: 'Todos'
  });

  // State for new instrument filter
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);
  const [instrumentSearchTerm, setInstrumentSearchTerm] = useState('');
  const [favoriteInstruments, setFavoriteInstruments] = useState([]);
  const [instrumentFilterType, setInstrumentFilterType] = useState('forex');
  const instrumentDropdownRef = useRef(null);

  // Estados para el gráfico de beneficio total
  const [benefitChartFilter, setBenefitChartFilter] = useState('Último mes');
  const [benefitChartTab, setBenefitChartTab] = useState(t('trading.benefitTotal'));
  
  // Estados para filtros del gráfico de rendimiento
  const [rendimientoFilters, setRendimientoFilters] = useState({
    year: '2024',
    period: 'Mensual'
  });
  const [barChartTooltip, setBarChartTooltip] = useState(null);

  // Detectar dispositivo móvil
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

  // --- Favorite Instruments Logic (from PipCalculator) ---
  useEffect(() => {
    if (currentUser) {
      const userPrefsRef = doc(db, 'userPreferences', currentUser.uid);
      getDoc(userPrefsRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().favoritePipInstruments) {
          setFavoriteInstruments(docSnap.data().favoritePipInstruments);
        }
      }).catch(error => {
        console.error("Error fetching favorite instruments from Firestore:", error);
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
    if (!currentUser) return; // Or handle local favorites for non-logged-in users

    const userPrefsRef = doc(db, 'userPreferences', currentUser.uid);
    const isCurrentlyFavorite = favoriteInstruments.includes(instrumentValue);

    setFavoriteInstruments(prev =>
      isCurrentlyFavorite
        ? prev.filter(fav => fav !== instrumentValue)
        : [...prev, instrumentValue]
    );

    try {
      if (isCurrentlyFavorite) {
        await updateDoc(userPrefsRef, { favoritePipInstruments: arrayRemove(instrumentValue) });
      } else {
        await setDoc(userPrefsRef, { favoritePipInstruments: arrayUnion(instrumentValue) }, { merge: true });
      }
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
  const selectedInstrumentLabel = allInstruments.find(item => item.value === historyFilters.instrument)?.label || 'Todos';
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
      toast.error('Error al copiar al portapapeles');
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
      toast.error('Error: Usuario o cuenta no válidos');
      return;
    }

    // Verificar que la cuenta seleccionada existe
    const selectedAccount = getAllAccounts().find(acc => acc.id === selectedAccountId);
    if (!selectedAccount) {
      toast.error('Error: Cuenta no encontrada');
      return;
    }

    if (!investorPassword.trim()) {
      toast.error('Por favor, ingresa una contraseña');
      return;
    }

    if (investorPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (investorPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsUpdatingPassword(true);
    const toastId = toast.loading('Configurando contraseña investor...');

    try {
      // Usar el servicio para actualizar la contraseña investor
      const result = await updateInvestorPassword(selectedAccountId, investorPassword);
      
      if (result.success) {
        toast.success('Contraseña investor configurada exitosamente', { id: toastId });
        closeInvestorModal();
        
        // Refrescar las cuentas para mostrar los cambios
        if (refreshAccounts) {
          await refreshAccounts();
        }
      } else {
        toast.error(result.error || 'Error al guardar la contraseña investor', { id: toastId });
      }
      
    } catch (error) {
      console.error('Error al configurar contraseña investor:', error);
      toast.error('Error al guardar la contraseña investor', { id: toastId });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Obtener cuentas dinámicamente del contexto
  const getAllAccountsFromContext = () => {
    const allAccountsList = getAllAccounts();
    return {
      [t('trading.all')]: allAccountsList,
      [t('accounts.live')]: getAccountsByCategory(ACC_CAT.REAL),
      [t('accounts.demo')]: getAccountsByCategory(ACC_CAT.DEMO),
      [t('copytrading.title')]: getAccountsByCategory(ACC_CAT.COPYTRADING),
      [t('pamm.title')]: getAccountsByCategory(ACC_CAT.PAMM)
    };
  };

  const allAccounts = getAllAccountsFromContext();
  const accountsForCurrentTab = allAccounts[activeTab] || [];

  // Manejar navegación desde Home.jsx y actualizar la pestaña activa
  useEffect(() => {
    if (navigationParams && navigationParams.viewMode === 'details' && navigationParams.accountId) {
      console.log("[TradingAccounts] Processing navigation params:", navigationParams);
      
      const targetAccount = getAllAccounts().find(acc => acc.id === navigationParams.accountId);
      if (targetAccount) {
        // Determinar en qué categoría está la cuenta
        for (const [category, accountsList] of Object.entries(allAccounts)) {
          if (accountsList.some(acc => acc.id === navigationParams.accountId)) {
            setActiveTab(category);
            break;
          }
        }
      }
      
      // Asegurarse de que la vista se actualice si los parámetros cambian después del montaje.
      setViewMode('details');
      setSelectedAccountId(navigationParams.accountId);
      scrollToTopManual(scrollContainerRef);
    } else {
        // Si no hay parámetros de navegación, volver a la vista general.
        setViewMode('overview');
        setSelectedAccountId(null);
    }
  }, [navigationParams, getAllAccounts]);
  
  const handleCreateAccount = () => {
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

  // Función helper para obtener el estado de la cuenta
  const getAccountStatus = (account) => {
    if (!account) return { status: 'Inactiva', statusColor: 'bg-gray-800 bg-opacity-30 text-gray-400' };
    
    // Usar el status si existe, sino determinar basado en balance
    if (account.status) {
      return {
        status: account.status,
        statusColor: account.status === 'Activo' ? 'bg-green-800 bg-opacity-30 text-green-400' : 'bg-red-800 bg-opacity-30 text-red-400'
      };
    }
    
    // Fallback basado en balance
    const balance = account.balance || 0;
    if (balance > 0) {
      return { status: 'Activa', statusColor: 'bg-green-800 bg-opacity-30 text-green-400' };
    } else {
      return { status: 'Inactiva', statusColor: 'bg-gray-800 bg-opacity-30 text-gray-400' };
    }
  };
  
  // Función para color dinámico de barras
  const getBarColor = (value) => {
    const maxValue = 20; // El valor máximo en los datos es ~20%
    const minLightness = 25; // Lightness para el valor más bajo
    const maxLightness = 50; // Lightness para el valor más alto
    const lightness = minLightness + (value / maxValue) * (maxLightness - minLightness);
    return `hsl(191, 95%, ${lightness}%)`;
  };
  
  // Función para calcular escala del gráfico Y
  const calculateYAxisScale = (dataPoints, initialBalance) => {
    if (!dataPoints || dataPoints.length === 0) return { min: 0, max: 100000, step: 10000 };
    
    const values = dataPoints.map(point => point.value);
    const minValue = Math.min(initialBalance, ...values);
    const maxValue = Math.max(initialBalance, ...values);
    
    // Calcular incrementos basados en el balance inicial
    let increment;
    if (initialBalance >= 10000) {
      increment = 1000;
    } else if (initialBalance >= 5000) {
      increment = 500;
    } else {
      increment = 250;
    }
    
    // Ajustar min y max para que coincidan con los incrementos
    const adjustedMin = Math.floor(minValue / increment) * increment;
    const adjustedMax = Math.ceil(maxValue / increment) * increment;
    
    return {
      min: adjustedMin,
      max: adjustedMax,
      step: increment
    };
  };

  // Datos para el gráfico de balance (simulando balance inicial de 5000)
  const initialBalance = 5000;
  const balanceData = [
    { name: 'Ene', value: 5000 },
    { name: 'Feb', value: 5250 },
    { name: 'Mar', value: 5500 },
    { name: 'Abr', value: 5750 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 5800 },
    { name: 'Jul', value: 6200 },
    { name: 'Ago', value: 6100 },
    { name: 'Sep', value: 6500 },
  ];
  
  // Calcular escala para el eje Y
  const yAxisConfig = calculateYAxisScale(balanceData, initialBalance);

  // NUEVOS DATOS para secciones faltantes
  const beneficioData = [
    { name: 'Ene', value: 1000 },
    { name: 'Feb', value: 1500 },
    { name: 'Mar', value: 1200 },
    { name: 'Abr', value: 1800 },
    { name: 'May', value: 2000 },
    { name: 'Jun', value: 1700 },
  ];

  const instrumentosData = [
    { name: 'NQM25', value: 71.43, color: '#06b6d4' },
    { name: 'EURUSD', value: 28.57, color: '#2563eb' },
  ];

  const rendimientoData = [
    { name: 'Ene', value: 3.2 },
    { name: 'Feb', value: 5.0 },
    { name: 'Mar', value: 4.5 },
    { name: 'Abr', value: 7.9 },
    { name: 'May', value: 10.0 },
    { name: 'Jun', value: 8.5 },
    { name: 'Jul', value: 13.2 },
    { name: 'Ago', value: 15.0 },
    { name: 'Sep', value: 14.4 },
    { name: 'Oct', value: 18.0 },
    { name: 'Nov', value: 15.2 },
    { name: 'Dic', value: 19.8 },
  ];

  const historialData = [
    // Febrero 2025
    { 
      fechaApertura: '12:00 20 Feb',
      fechaCierre: '12:00 20 Feb',
      fechaISO: '2025-02-20',
      tiempoApertura: '00:30:23',
      tiempoCierre: '00:30:23',
      instrumento: 'EURUSD',
      bandera: '/EU.svg',
      tipo: 'Compra',
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
      tipo: 'Venta',
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
      tipo: 'Compra',
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
      tipo: 'Venta',
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
      tipo: 'Venta',
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
      tipo: 'Compra',
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
      tipo: 'Venta',
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
      tipo: 'Compra',
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
      tipo: 'Compra',
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
      tipo: 'Venta',
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
    return historialData.filter(item => {
      // Filtro por instrumento
      if (historyFilters.instrument !== 'Todos' && item.instrumento !== historyFilters.instrument) {
        return false;
      }
      
      // Filtro por tipo
      if (historyFilters.type !== 'Todos' && item.tipo !== historyFilters.type) {
        return false;
      }
      
      // Filtro por ganancia/pérdida
      if (historyFilters.profitLoss === 'Ganancia' && item.ganancia <= 0) {
        return false;
      }
      if (historyFilters.profitLoss === 'Pérdida' && item.ganancia >= 0) {
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
    // Aplicar filtros del historial al gráfico
    let dataToProcess = historialData;
    
    // Aplicar filtros del historial si están activos
    if (historyFilters.instrument !== 'Todos') {
      dataToProcess = dataToProcess.filter(item => item.instrumento === historyFilters.instrument);
    }
    
    if (historyFilters.type !== 'Todos') {
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
    
    if (benefitChartFilter === 'Último año') {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      endDate = new Date(now);
      dateFormat = isMobile ? 'quarter' : 'month'; // Trimestres en móvil, meses en desktop
    } else if (benefitChartFilter === 'Últimos 3 meses') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      endDate = new Date(now);
      dateFormat = isMobile ? 'month' : 'week'; // Meses en móvil, semanas en desktop
    } else if (benefitChartFilter === 'Último mes') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      endDate = new Date(now);
      dateFormat = isMobile ? 'week' : 'day'; // Semanas en móvil, días en desktop
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
    const chartData = dateArray.map(({ dateKey, formattedDate }) => {
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
    
    return chartData;
  };

  // Optimizar datos del gráfico para móvil
  const optimizeChartDataForMobile = (data) => {
    if (!isMobile || data.length <= 6) return data;
    
    const step = Math.ceil(data.length / 6);
    return data.filter((_, index) => index % step === 0 || index === data.length - 1);
  };

  const benefitChartData = optimizeChartDataForMobile(generateBenefitChartData());

  // Función para generar datos de Balance
  const generateBalanceChartData = () => {
    let dataToProcess = historialData;
    
    // Aplicar mismos filtros que el gráfico de beneficio
    if (historyFilters.instrument !== 'Todos') {
      dataToProcess = dataToProcess.filter(item => item.instrumento === historyFilters.instrument);
    }
    
    if (historyFilters.type !== 'Todos') {
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
    
    if (benefitChartFilter === 'Último año') {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      endDate = new Date(now);
      dateFormat = 'month';
    } else if (benefitChartFilter === 'Últimos 3 meses') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      endDate = new Date(now);
      dateFormat = 'week';
    } else if (benefitChartFilter === 'Último mes') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      endDate = new Date(now);
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

  // Función para generar datos de Retracción
  const generateDrawdownChartData = () => {
    let dataToProcess = historialData;
    
    // Aplicar mismos filtros
    if (historyFilters.instrument !== 'Todos') {
      dataToProcess = dataToProcess.filter(item => item.instrumento === historyFilters.instrument);
    }
    
    if (historyFilters.type !== 'Todos') {
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
    
    if (benefitChartFilter === 'Último año') {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      endDate = new Date(now);
      dateFormat = 'month';
    } else if (benefitChartFilter === 'Últimos 3 meses') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      endDate = new Date(now);
      dateFormat = 'week';
    } else if (benefitChartFilter === 'Último mes') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      endDate = new Date(now);
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
        value: Math.round(drawdown * 100) / 100,
        dateISO: dateKey
      };
    });
    
    return chartData;
  };

  // Obtener datos según el tab seleccionado
  const getChartDataByTab = () => {
    switch (benefitChartTab) {
      case 'Balance':
        return generateBalanceChartData();
      case 'Retracción':
        return generateDrawdownChartData();
      default:
        return benefitChartData;
    }
  };

  const currentChartData = getChartDataByTab();

  // Función para generar datos de instrumentos basado en filtros
  const generateInstrumentsData = () => {
    let dataToProcess = historialData;
    
    // Agrupar por instrumento y calcular totales
    const instrumentTotals = {
      'EURUSD': { ganancia: 0, operaciones: 0 },
      'XAUUSD': { ganancia: 0, operaciones: 0 }
    };
    
    dataToProcess.forEach(item => {
      if (instrumentTotals[item.instrumento]) {
        instrumentTotals[item.instrumento].ganancia += item.ganancia;
        instrumentTotals[item.instrumento].operaciones += 1;
      }
    });
    
    // Calcular total para porcentajes
    const totalGanancia = Math.abs(instrumentTotals.EURUSD.ganancia) + Math.abs(instrumentTotals.XAUUSD.ganancia);
    
    // Datos fijos para EURUSD y XAUUSD
    const instrumentsData = [
      {
        name: 'EURUSD',
        value: totalGanancia > 0 ? (Math.abs(instrumentTotals.EURUSD.ganancia) / totalGanancia) * 100 : 50,
        color: '#2563eb',
        ganancia: instrumentTotals.EURUSD.ganancia,
        operaciones: instrumentTotals.EURUSD.operaciones
      },
      {
        name: 'XAUUSD',
        value: totalGanancia > 0 ? (Math.abs(instrumentTotals.XAUUSD.ganancia) / totalGanancia) * 100 : 50,
        color: '#06b6d4',
        ganancia: instrumentTotals.XAUUSD.ganancia,
        operaciones: instrumentTotals.XAUUSD.operaciones
      }
    ];
    
    // Si no hay datos, mostrar distribución 50/50
    if (totalGanancia === 0) {
      instrumentsData[0].value = 50;
      instrumentsData[1].value = 50;
    }
    
    return instrumentsData;
  };

  const dynamicInstrumentsData = generateInstrumentsData();

  // Función para actualizar filtros del rendimiento
  const updateRendimientoFilter = (filterType, value) => {
    setRendimientoFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Función para generar datos de rendimiento dinámicos
  const generateRendimientoData = () => {
    // Filtrar por año seleccionado
    const selectedYear = parseInt(rendimientoFilters.year);
    
    // Generar datos según el período seleccionado
    if (rendimientoFilters.period === 'Mensual') {
      // Datos de muestra variados según año
      if (selectedYear === 2024) {
        // Datos para 2024 - Año completo con buen rendimiento
        return [
          { name: 'Ene', value: 8.5 },
          { name: 'Feb', value: 12.3 },
          { name: 'Mar', value: 15.7 },
          { name: 'Abr', value: 22.1 },
          { name: 'May', value: 28.9 },
          { name: 'Jun', value: 25.4 },
          { name: 'Jul', value: 31.2 },
          { name: 'Ago', value: 35.8 },
          { name: 'Sep', value: 42.3 },
          { name: 'Oct', value: 38.7 },
          { name: 'Nov', value: 45.2 },
          { name: 'Dic', value: 52.8 },
        ];
      } else {
        // Datos para 2025 - Año en curso con crecimiento proyectado
        return [
          { name: 'Ene', value: 14.2 },
          { name: 'Feb', value: 18.7 },
          { name: 'Mar', value: 23.1 },
          { name: 'Abr', value: 27.8 },
          { name: 'May', value: 32.4 },
          { name: 'Jun', value: 29.6 },
          { name: 'Jul', value: 36.9 },
          { name: 'Ago', value: 41.3 },
          { name: 'Sep', value: 46.7 },
          { name: 'Oct', value: 43.2 },
          { name: 'Nov', value: 49.8 },
          { name: 'Dic', value: 55.4 },
        ];
      }
      
    } else if (rendimientoFilters.period === 'Trimestral') {
      // Datos de muestra variados para trimestres
      if (selectedYear === 2024) {
        return [
          { name: '1er Trimestre', value: 36.5 },
          { name: '2do Trimestre', value: 76.4 },
          { name: '3er Trimestre', value: 109.3 },
          { name: '4to Trimestre', value: 136.7 },
        ];
      } else {
        return [
          { name: '1er Trimestre', value: 56.0 },
          { name: '2do Trimestre', value: 89.8 },
          { name: '3er Trimestre', value: 124.9 },
          { name: '4to Trimestre', value: 158.6 },
        ];
      }
    }
    
    // Fallback a datos estáticos mensuales por defecto
    return [
      { name: 'Ene', value: 12.5 },
      { name: 'Feb', value: 16.3 },
      { name: 'Mar', value: 19.8 },
      { name: 'Abr', value: 23.4 },
      { name: 'May', value: 28.7 },
      { name: 'Jun', value: 25.1 },
      { name: 'Jul', value: 31.9 },
      { name: 'Ago', value: 36.2 },
      { name: 'Sep', value: 41.5 },
      { name: 'Oct', value: 38.9 },
      { name: 'Nov', value: 44.7 },
      { name: 'Dic', value: 49.3 },
    ];
  };

  // Función simplificada para generar datos de rendimiento dinámicos
  const generateSimpleRendimientoData = () => {
    const selectedYear = parseInt(rendimientoFilters.year);
    
    if (rendimientoFilters.period === 'Mensual') {
      if (selectedYear === 2024) {
        return [
          { name: 'Ene', value: 8.5 },
          { name: 'Feb', value: 12.3 },
          { name: 'Mar', value: 15.7 },
          { name: 'Abr', value: 22.1 },
          { name: 'May', value: 28.9 },
          { name: 'Jun', value: 25.4 },
          { name: 'Jul', value: 31.2 },
          { name: 'Ago', value: 35.8 },
          { name: 'Sep', value: 42.3 },
          { name: 'Oct', value: 38.7 },
          { name: 'Nov', value: 45.2 },
          { name: 'Dic', value: 52.8 },
        ];
      } else {
        return [
          { name: 'Ene', value: 14.2 },
          { name: 'Feb', value: 18.7 },
          { name: 'Mar', value: 23.1 },
          { name: 'Abr', value: 27.8 },
          { name: 'May', value: 32.4 },
          { name: 'Jun', value: 29.6 },
          { name: 'Jul', value: 36.9 },
          { name: 'Ago', value: 41.3 },
          { name: 'Sep', value: 46.7 },
          { name: 'Oct', value: 43.2 },
          { name: 'Nov', value: 49.8 },
          { name: 'Dic', value: 55.4 },
        ];
      }
    } else if (rendimientoFilters.period === 'Trimestral') {
      if (selectedYear === 2024) {
        return [
          { name: '1er Trimestre', value: 36.5 },
          { name: '2do Trimestre', value: 76.4 },
          { name: '3er Trimestre', value: 109.3 },
          { name: '4to Trimestre', value: 136.7 },
        ];
      } else {
        return [
          { name: '1er Trimestre', value: 56.0 },
          { name: '2do Trimestre', value: 89.8 },
          { name: '3er Trimestre', value: 124.9 },
          { name: '4to Trimestre', value: 158.6 },
        ];
      }
    }
    
    return [
      { name: 'Ene', value: 12.5 },
      { name: 'Feb', value: 16.3 },
      { name: 'Mar', value: 19.8 },
      { name: 'Abr', value: 23.4 },
      { name: 'May', value: 28.7 },
      { name: 'Jun', value: 25.1 },
      { name: 'Jul', value: 31.9 },
      { name: 'Ago', value: 36.2 },
      { name: 'Sep', value: 41.5 },
      { name: 'Oct', value: 38.9 },
      { name: 'Nov', value: 44.7 },
      { name: 'Dic', value: 49.3 },
    ];
  };

  const dynamicRendimientoData = generateSimpleRendimientoData();

  // Función para renderizar las credenciales MT5 en móvil como tarjetas
  const renderMobileCredentials = (selectedAccount) => {
    const credentials = [
      { label: 'Servidor MT5', value: selectedAccount.server || 'AGM-Server', field: 'Servidor' },
      { label: 'Contraseña Master', value: selectedAccount.masterPassword || 'MT5Pass123', field: 'Contraseña Master', isPassword: true, showKey: 'master' },
      { label: 'Número de Cuenta', value: selectedAccount.accountNumber, field: 'Número de Cuenta' },
      { label: 'Contraseña Investor', value: selectedAccount.investorPassword, field: 'Contraseña Investor', isPassword: true, showKey: 'investor', canConfigure: true }
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
            <div className="text-white font-medium text-sm flex items-center">
              <span className="mr-2">
                {cred.isPassword && showPasswords[cred.showKey] === false ? '••••••••' : cred.value}
              </span>
              {cred.isPassword && (
                <button
                  onClick={() => togglePasswordVisibility(cred.showKey)}
                  className="p-1 hover:bg-[#2a2a2a] rounded"
                  title={showPasswords[cred.showKey] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPasswords[cred.showKey] ? (
                    <EyeOff size={12} className="text-gray-400 hover:text-white" />
                  ) : (
                    <Eye size={12} className="text-gray-400 hover:text-white" />
                  )}
                </button>
              )}
            </div>
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
    ));
  };

  // VISTA GENERAL DE CUENTAS
  if (viewMode === 'overview') {
  return (
      <div className="flex flex-col p-3 sm:p-4 text-white">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Tus Cuentas</h1>
          
          {/* Create Account Button */}
          <button 
            onClick={handleCreateAccount}
            className="w-full py-3 px-4 bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center mb-4 sm:mb-6 text-sm sm:text-base"
          >
            + Crear Cuenta
          </button>
          
          {/* Tab Navigation */}
          <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'} mb-4 sm:mb-6`}>
            {[t('trading.all'), t('accounts.live'), t('accounts.demo'), t('copytrading.title'), t('pamm.title')].map((tab) => (
              <button
                key={tab}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm focus:outline-none transition-all text-center ${
                  activeTab === tab
                    ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                    : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {isMobile && tab === 'Cuentas Reales' ? 'Reales' : 
                 isMobile && tab === 'Cuentas Demo' ? 'Demo' :
                 isMobile && tab === 'Copy Trading' ? 'Copy' :
                 tab}
              </button>
            ))}
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Tus Cuentas</h2>
          
          {isLoading ? (
            <div className="text-center text-gray-400 py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
              <p className="text-sm sm:text-base">Cargando cuentas...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-6 sm:py-8">
              <p className="text-sm sm:text-base">Error: {error}</p>
            </div>
          ) : accountsForCurrentTab.length === 0 ? (
            <div className="text-center text-gray-400 py-6 sm:py-8">
              <p className="text-sm sm:text-base">No tienes cuentas en esta categoría</p>
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
                  <div className={isMobile ? 'text-center' : ''}>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                        {account.accountName || 'Cuenta sin nombre'} 
                        {isMobile && <br />}
                        <span className="text-sm sm:text-base">(ID: {account.accountNumber || 'N/A'})</span>
                      </h3>
                    <div className={`${isMobile ? 'space-y-1' : 'flex items-center space-x-4'} text-xs sm:text-sm text-gray-400`}>
                        <span>Tipo: {account.accountType || 'N/A'}</span>
                        <span>Balance: ${(account.balance || 0).toFixed(2)}</span>
                        <span>Plataforma: {account.platform || 'MT5'}</span>
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
                    Ver Detalles
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
  return (
    <div className="flex flex-col p-3 sm:p-4 text-white">
      {/* Back Button */}
      <div className="mb-3 sm:mb-4">
        <img 
          src="/Back.svg" 
          alt="Back" 
          onClick={handleBackToOverview}
          className="w-8 h-8 sm:w-10 sm:h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
        />
      </div>

      {/* Layout responsivo - móvil: stack vertical, desktop: grid */}
      <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-12 gap-6'} mb-4 sm:mb-6`}>
        
        {/* COLUMNA CENTRAL - Tus Cuentas */}
        <div className={`${isMobile ? 'w-full' : 'lg:col-span-5'} bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-t border-l border-r border-cyan-500`}>
          <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Tus Cuentas</h1>
          
          {/* Create Account Button */}
          <button 
            onClick={handleCreateAccount}
            className="w-full py-3 px-4 bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center mb-4 sm:mb-6 text-sm sm:text-base"
          >
            + Crear Cuenta
          </button>
          
          {/* Tab Navigation */}
          <div className={`${isMobile ? 'grid grid-cols-3 gap-2' : 'flex flex-wrap gap-2'} mb-4 sm:mb-6`}>
            {[t('trading.all'), t('accounts.live'), t('accounts.demo')].map((tab) => (
              <button
                key={tab}
                className={`px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm focus:outline-none transition-all text-center ${
                  activeTab === tab
                    ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                    : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {isMobile && tab === 'Cuentas Reales' ? 'Reales' : 
                 isMobile && tab === 'Cuentas Demo' ? 'Demo' :
                 tab}
              </button>
            ))}
          </div>
          
          {/* Account List */}
          <div className="space-y-2 sm:space-y-3">
            {isLoading ? (
              <div className="text-center text-gray-400 py-3 sm:py-4">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm">Cargando cuentas...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400 py-3 sm:py-4">
                <p className="text-xs sm:text-sm">Error: {error}</p>
              </div>
            ) : accountsForCurrentTab.length === 0 ? (
              <div className="text-center text-gray-400 py-3 sm:py-4">
                <p className="text-xs sm:text-sm">No hay cuentas en esta categoría</p>
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
                    {account.accountName || 'Cuenta sin nombre'} 
                    {isMobile && <br />}
                    <span className="text-xs sm:text-sm">(ID: {account.accountNumber || 'N/A'})</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {account.accountType || 'N/A'} • ${(account.balance || 0).toFixed(2)}
                  </div>
              </button>
              ))
            )}
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
                        <p>Cuenta no encontrada</p>
                      </div>
                    );
                  }

                  return (
                    <>
                <div className="mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold mb-2">Detalles de la Cuenta</h2>
                  <p className="text-gray-400 text-xs sm:text-sm">Información completa de la cuenta seleccionada</p>
                </div>
                
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm mb-4 sm:mb-6">
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">{selectedAccount.accountName} (ID: {selectedAccount.accountNumber})</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">Balance actual: ${(selectedAccount.balance || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">Cuenta Activa: 30 días</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">Tipo de cuenta: {selectedAccount.accountType || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">Apalancamiento: 1:{selectedAccount.leverage || '500'}</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">Plataforma: {selectedAccount.platform || 'MetaTrader 5'}</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">Estado: {getAccountStatus(selectedAccount).status}</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          <span className="text-gray-400">Creada: {selectedAccount.createdAt ? new Date(selectedAccount.createdAt?.toDate?.() || selectedAccount.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-[#1a1a1a] rounded-lg sm:rounded-xl">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="font-medium text-white text-sm sm:text-base">Credenciales MT5</h3>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getAccountStatus(selectedAccount).statusColor}`}>
                            {getAccountStatus(selectedAccount).status}
                          </span>
                  </div>
                  <div className={`${isMobile ? 'space-y-3' : 'grid grid-cols-2 gap-4'} text-xs sm:text-sm`}>
                    {/* Servidor MT5 */}
                    <div className="p-2 sm:p-3 bg-[#0f0f0f] rounded-lg relative group">
                      <span className="text-gray-400 text-xs block mb-1">Servidor MT5</span>
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium text-sm">{selectedAccount.server || 'AGM-Server'}</div>
                        <button
                          onClick={() => copyToClipboard(selectedAccount.server || 'AGM-Server', 'Servidor')}
                          className={`${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity p-1 hover:bg-[#2a2a2a] rounded`}
                          title="Copiar servidor"
                        >
                          {copiedField === 'Servidor' ? (
                            <Check size={12} className="text-green-400" />
                          ) : (
                            <Copy size={12} className="text-gray-400 hover:text-white" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Contraseña Master */}
                    <div className="p-3 bg-[#0f0f0f] rounded-lg relative group">
                      <span className="text-gray-400 text-xs block mb-1">Contraseña Master</span>
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium flex items-center">
                          <span className="mr-2">
                            {showPasswords.master ? (selectedAccount.masterPassword || 'MT5Pass123') : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility('master')}
                            className="p-1 hover:bg-[#2a2a2a] rounded"
                            title={showPasswords.master ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showPasswords.master ? (
                              <EyeOff size={14} className="text-gray-400 hover:text-white" />
                            ) : (
                              <Eye size={14} className="text-gray-400 hover:text-white" />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => copyToClipboard(selectedAccount.masterPassword || 'MT5Pass123', 'Contraseña Master')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded"
                          title="Copiar contraseña master"
                        >
                          {copiedField === 'Contraseña Master' ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} className="text-gray-400 hover:text-white" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Número de Cuenta */}
                    <div className="p-3 bg-[#0f0f0f] rounded-lg relative group">
                      <span className="text-gray-400 text-xs block mb-1">Número de Cuenta</span>
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">{selectedAccount.accountNumber}</div>
                        <button
                          onClick={() => copyToClipboard(selectedAccount.accountNumber, 'Número de Cuenta')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded"
                          title="Copiar número de cuenta"
                        >
                          {copiedField === 'Número de Cuenta' ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} className="text-gray-400 hover:text-white" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Contraseña Investor */}
                    <div className="p-3 bg-[#0f0f0f] rounded-lg relative group">
                      <span className="text-gray-400 text-xs block mb-1">Contraseña Investor</span>
                      <div className="flex items-center justify-between">
                        {selectedAccount.investorPassword ? (
                          <div className="text-white font-medium flex items-center">
                            <span className="mr-2">
                              {showPasswords.investor ? selectedAccount.investorPassword : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility('investor')}
                              className="p-1 hover:bg-[#2a2a2a] rounded"
                              title={showPasswords.investor ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                              {showPasswords.investor ? (
                                <EyeOff size={14} className="text-gray-400 hover:text-white" />
                              ) : (
                                <Eye size={14} className="text-gray-400 hover:text-white" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={openInvestorModal}
                            className="text-cyan-400 font-medium cursor-pointer hover:text-cyan-300 flex items-center gap-1"
                          >
                            <Settings size={14} />
                            {t('common.configure')}
                          </div>
                        )}
                        {selectedAccount.investorPassword && (
                          <button
                            onClick={() => copyToClipboard(selectedAccount.investorPassword, 'Contraseña Investor')}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded"
                            title="Copiar contraseña investor"
                          >
                            {copiedField === 'Contraseña Investor' ? (
                              <Check size={14} className="text-green-400" />
                            ) : (
                              <Copy size={14} className="text-gray-400 hover:text-white" />
                            )}
                          </button>
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
                <h3 className="text-base sm:text-lg mb-2">Selecciona una cuenta</h3>
                <p className="text-sm">Elige una cuenta de la lista para ver sus detalles</p>
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
            <div className={`${isMobile ? 'w-full' : 'lg:col-span-2'} p-4 sm:p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl`}>
              <CustomTooltip content="El capital total de tu cuenta, incluyendo ganancias y pérdidas no realizadas.">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 cursor-help">Balance</h2>
              </CustomTooltip>
              <div className="flex items-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold mr-2 sm:mr-3 text-white">
                  ${balanceData[balanceData.length - 1]?.value.toLocaleString() || '0.00'}
                </span>
                <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-xs sm:text-sm">
                  +{(((balanceData[balanceData.length - 1]?.value || 0) - initialBalance) / initialBalance * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className={`w-full ${isMobile ? 'h-48' : 'h-64'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <YAxis 
                        domain={[yAxisConfig.min, yAxisConfig.max]}
                        ticks={Array.from(
                          {length: Math.floor((yAxisConfig.max - yAxisConfig.min) / yAxisConfig.step) + 1}, 
                          (_, i) => yAxisConfig.min + (i * yAxisConfig.step)
                        )}
                        tickFormatter={(value) => {
                          if (value >= 1000) {
                            return `${(value/1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
                          }
                          return value.toString();
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
                          color: '#ffffff'
                        }}
                        labelStyle={{ color: '#ffffff' }}
                        itemStyle={{ color: '#ffffff' }}
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']}
                        labelFormatter={(label) => `Mes: ${label}`}
                      />
                      <Area
                      type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2}
                      fillOpacity={1} fill="url(#colorBalance)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
            {/* Métricas lado derecho - 2 columnas con altura completa */}
            <div className={`${isMobile ? 'w-full grid grid-cols-1 gap-3' : 'lg:col-span-2 flex flex-col justify-between'} space-y-3 sm:space-y-4`}>
              {/* Profit/Loss */}
              <div className={`${isMobile ? '' : 'flex-1'} p-4 sm:p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center`}>
                <CustomTooltip content="La ganancia o pérdida neta de tus operaciones cerradas en el período seleccionado.">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 cursor-help">Profit/Loss</h3>
                </CustomTooltip>
                  <div className="flex items-center mb-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-2">$1,000.00</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-xs">+25.0%</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400">Lun, 13 Enero</p>
                </div>

              {/* Drawdown */}
              <div className={`${isMobile ? '' : 'flex-1'} p-4 sm:p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center`}>
                <CustomTooltip content="La mayor caída desde un pico hasta un valle en el capital de tu cuenta. Mide el riesgo.">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 cursor-help">Drawdown</h3>
                </CustomTooltip>
                <div className="flex items-center mb-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-2">$200.00</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-xs">+25.0%</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400">Total • Diario</p>
                </div>

              {/* Días de Trading */}
              <div className={`${isMobile ? '' : 'flex-1'} p-4 sm:p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center`}>
                <CustomTooltip content="El número total de días en los que se ha realizado al menos una operación.">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 cursor-help">Días de Trading</h3>
                </CustomTooltip>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold">5 Días</div>
              </div>
                </div>
              </div>
              
          {/* ===== CAPTURA 3: GRID MÉTRICAS 3x3 ===== */}
          
          {/* Grid de métricas KPIs con iconos del public */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
            {/* 1. Pérdida Promedio Por Operación */}
            <div className={`p-3 sm:p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl ${isMobile ? 'flex items-center justify-between' : 'flex justify-between items-center'}`}>
              <CustomTooltip content="El monto promedio que pierdes en cada operación perdedora.">
                <div className="cursor-help">
                <h3 className="text-gray-400 text-xs sm:text-sm mb-1">Pérdida Promedio Por Operación</h3>
                <div className="flex items-center">
                  <span className="text-lg sm:text-xl font-bold text-red-400">$77.61</span>
                  <span className="bg-red-800 bg-opacity-30 text-red-400 px-1 py-0.5 rounded text-xs ml-2">-25.0%</span>
                </div>
              </div>
              </CustomTooltip>
              <div className={`bg-[#2d2d2d] ${isMobile ? 'p-2' : 'p-4'} rounded-full`}>
                <img src="/PerdidaIcono.svg" alt="" className={isMobile ? 'w-8 h-8' : ''} />
                  </div>
                  </div>

            {/* 2. Ganancia Promedio Por Operación */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content="El monto promedio que ganas en cada operación ganadora.">
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">Ganancia Promedio Por Operación</h3>
                <div className="flex items-center">
                  <span className="text-xl font-bold">$20.61</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-1 py-0.5 rounded text-xs ml-2">+25.0%</span>
                </div>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/GananciaIcono.svg" alt="" className="" />
                </div>
              </div>
              
            {/* 3. Lotaje Promedio Por Operación */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content="El tamaño de posición promedio que utilizas en tus operaciones.">
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">Lotaje Promedio Por Operación</h3>
                <span className="text-xl font-bold">3.26</span>
                  </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/Group.svg" alt="" className="" />
                  </div>
                </div>

            {/* 4. Duración Promedio Por Operación */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content="El tiempo promedio que mantienes abiertas tus posiciones.">
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">Duración Promedio Por Operación</h3>
                <span className="text-xl font-bold">02:25:36</span>
                  </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/RelojIcono.svg" alt="" className="" />
                  </div>
            </div>

            {/* 5. Relación Riesgo Beneficio */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content="Compara la ganancia potencial con la pérdida potencial. Un ratio de 1:3 significa que arriesgas 1 para ganar 3.">
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">Relación Riesgo Beneficio</h3>
                <span className="text-xl font-bold">1:3</span>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/RatioVictoria.svg" alt="" className="w-12 h-12" />
                </div>
              </div>
              
            {/* 6. Ratio De Ganancia */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content="El porcentaje de operaciones ganadoras sobre el total de operaciones realizadas.">
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">Ratio De Ganancia</h3>
                <span className="text-xl font-bold">20%</span>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/MonedaIcono.svg" alt="" className="w-12 h-12" />
              </div>
            </div>

            {/* 7. Depósitos Totales */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content="La suma total de todos los fondos que has depositado en esta cuenta.">
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">Depósitos Totales</h3>
                <span className="text-xl font-bold">$10,000.00</span>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/hugeicons.svg" alt="" className="w-12 h-12" />
              </div>
            </div>

            {/* 8. Retiros Totales */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content="La suma total de todos los fondos que has retirado de esta cuenta.">
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">Retiros Totales</h3>
                <span className="text-xl font-bold">$12,000.00</span>
              </div>
              </CustomTooltip>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/ph.svg" alt="" className="w-12 h-12" />
        </div>
      </div>
      
            {/* 9. PNL */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <CustomTooltip content="La ganancia o pérdida neta total de la cuenta desde su creación.">
                <div className="cursor-help">
                <h3 className="text-gray-400 text-sm mb-1">PNL</h3>
                <span className="text-xl font-bold">$5,000.00 = 5%</span>
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
            {/* Header con Tabs y Filtro - RESPONSIVE */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              {/* Tabs */}
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
                <button 
                  onClick={() => setBenefitChartTab(t('trading.benefitTotal'))}
                  className={`px-3 py-2 bg-transparent rounded-full text-xs sm:text-sm font-medium transition ${
                    benefitChartTab === t('trading.benefitTotal') 
                      ? 'border border-cyan-400 text-cyan-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isMobile ? t('trading.profit') : t('trading.benefitTotal')}
                </button>
                <button 
                  onClick={() => setBenefitChartTab(t('trading.balance'))}
                  className={`px-3 py-2 bg-transparent rounded-full text-xs sm:text-sm font-medium transition ${
                    benefitChartTab === t('trading.balance') 
                      ? 'border border-cyan-400 text-cyan-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('trading.balance')}
                </button>
                <button 
                  onClick={() => setBenefitChartTab(t('trading.drawdown'))}
                  className={`px-3 py-2 bg-transparent rounded-full text-xs sm:text-sm font-medium transition ${
                    benefitChartTab === t('trading.drawdown') 
                      ? 'border border-cyan-400 text-cyan-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('trading.drawdown')}
                </button>
              </div>
              
              {/* Filtro Dropdown */}
              <div className="relative w-full sm:w-auto">
                <CustomDropdown
                  options={benefitChartFilterOptions}
                  selectedValue={benefitChartFilter}
                  onSelect={setBenefitChartFilter}
                  dropdownClass="w-full sm:w-48"
                />
              </div>
            </div>

            {/* Título */}
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">
              {isMobile ? benefitChartTab.split(' ')[0] : benefitChartTab}
              {(historyFilters.instrument !== 'Todos' || 
                historyFilters.type !== 'Todos' || 
                historyFilters.profitLoss !== 'Todos' || 
                historyFilters.dateFrom || 
                historyFilters.dateTo) && (
                <span className="ml-2 px-2 py-1 bg-cyan-600 text-white text-xs rounded-full">
                  Filtrado
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
                    domain={['dataMin - 100', 'dataMax + 100']}
                    width={isMobile ? 50 : 60}
                    tickFormatter={(value) => {
                      if (benefitChartTab === 'Retracción') {
                        return `${value.toFixed(1)}%`;
                      }
                      if (Math.abs(value) >= 1000) {
                        return `${(value/1000).toFixed(1)}K`;
                      }
                      return value.toFixed(0);
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
                    formatter={(value) => {
                      const unit = benefitChartTab === 'Retracción' ? '%' : '$';
                      const formattedValue = benefitChartTab === 'Retracción' 
                        ? value.toFixed(2) 
                        : value.toLocaleString();
                      return [`${unit}${formattedValue}`, benefitChartTab];
                    }}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#06b6d4" 
                    strokeWidth={isMobile ? 2 : 3}
                    dot={isMobile ? false : { fill: '#06b6d4', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: isMobile ? 4 : 6, fill: '#06b6d4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ===== CAPTURA 6: INSTRUMENTOS ===== */}
          
          <div className="space-y-6">
            {/* Instrumentos de Trading */}
            <div className="p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Instrumentos de Trading</h2>
              </div>

              {/* Body con Leyenda y Gráfico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Leyenda */}
                <div className="space-y-4">
                  {dynamicInstrumentsData.map((entry, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-4 h-4 rounded-sm mr-3" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-gray-300">{entry.name}</span>
                      <span className="ml-auto font-semibold text-white">{entry.value.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>

                {/* Gráfico */}
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dynamicInstrumentsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(2)}%`}
                        outerRadius={100}
                        dataKey="value"
                        stroke="#2a2a2a"
                        strokeWidth={4}
                      >
                        {dynamicInstrumentsData.map((entry, index) => (
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
                        formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ===== CAPTURA 7: RENDIMIENTO ===== */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
              {/* Header - RESPONSIVE */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Rendimiento</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateRendimientoFilter('year', '2024')}
                      className={`px-3 py-1 bg-transparent border rounded-full text-xs sm:text-sm font-medium transition ${
                        rendimientoFilters.year === '2024' 
                          ? 'border-cyan-400 text-cyan-400' 
                          : 'border-gray-600 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      2024
                    </button>
                    <button 
                      onClick={() => updateRendimientoFilter('year', '2025')}
                      className={`px-3 py-1 bg-transparent border rounded-full text-xs sm:text-sm font-medium transition ${
                        rendimientoFilters.year === '2025' 
                          ? 'border-cyan-400 text-cyan-400' 
                          : 'border-gray-600 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      2025
                    </button>
                  </div>
                </div>
                <div className="relative w-full sm:w-auto">
                  <CustomDropdown
                    options={rendimientoPeriodOptions}
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
                    data={optimizeChartDataForMobile(dynamicRendimientoData)} 
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
                                {rendimientoFilters.period === 'Mensual' ? 'Mes' : 'Trimestre'}: {label}, {value.toFixed(1)}%
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
                      {(optimizeChartDataForMobile(dynamicRendimientoData)).map((entry, index) => (
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
                <h2 className="text-2xl font-bold text-white">{t('trading.operationsHistory')}</h2>
              </div>

              {/* Botón toggle filtros móvil */}
              {isMobile && (
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="w-full mb-4 py-2 px-4 bg-[#2a2a2a] border border-[#444] rounded-lg text-white flex items-center justify-center gap-2"
                >
                  <Filter size={16} />
                  {showMobileFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </button>
              )}

              {/* Filtros superiores */}
              <div className={`${isMobile && !showMobileFilters ? 'hidden' : isMobile ? 'grid grid-cols-1 gap-3 mb-4' : 'grid grid-cols-1 md:grid-cols-5 gap-4'} mb-4 sm:mb-6`}>
                {/* Instrumento */}
                <div ref={instrumentDropdownRef}>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-2">Instrumento</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowInstrumentDropdown(!showInstrumentDropdown)}
                      className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 sm:px-4 py-2 text-white text-left flex justify-between items-center"
                    >
                      <span className="truncate">{selectedInstrumentLabel}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showInstrumentDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-[#2d2d2d] border border-[#444] rounded-lg shadow-lg max-h-72 overflow-y-auto">
                        <div className="p-2 sticky top-0 bg-[#2d2d2d] z-20 border-b border-[#444]">
                          <div className="flex justify-between space-x-2 mb-2">
                            <button onClick={() => setInstrumentFilterType('forex')} className={`flex-1 px-3 py-1.5 rounded-full text-xs sm:text-sm border ${instrumentFilterType === 'forex' ? 'border-cyan-500' : 'border-gray-700'}`}>Forex</button>
                            <button onClick={() => setInstrumentFilterType('stocks')} className={`flex-1 px-3 py-1.5 rounded-full text-xs sm:text-sm border ${instrumentFilterType === 'stocks' ? 'border-cyan-500' : 'border-gray-700'}`}>Acciones</button>
                            <button onClick={() => setInstrumentFilterType('crypto')} className={`flex-1 px-3 py-1.5 rounded-full text-xs sm:text-sm border ${instrumentFilterType === 'crypto' ? 'border-cyan-500' : 'border-gray-700'}`}>Cripto</button>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Buscar instrumento"
                              value={instrumentSearchTerm}
                              onChange={(e) => setInstrumentSearchTerm(e.target.value)}
                              className="w-full bg-[#232323] border border-[#444] rounded-md px-3 py-2 pl-10 focus:outline-none focus:border-cyan-500"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          </div>
                        </div>
                        
                        <div key="todos-filter" onClick={() => { updateHistoryFilter('instrument', 'Todos'); setShowInstrumentDropdown(false); }} className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer">Todos</div>

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
                    label="Tipo"
                    options={typeOptions}
                    selectedValue={historyFilters.type}
                    onSelect={(value) => updateHistoryFilter('type', value)}
                  />
                </div>
                
                {/* Desde */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Desde</label>
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
                  <label className="block text-gray-400 text-sm mb-2">Hasta</label>
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
                    label="Ganancia/Pérdida"
                    options={profitLossOptions}
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
                            src={transaction.bandera} 
                            alt={transaction.instrumento}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="font-medium text-white">{transaction.instrumento}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            transaction.tipo === 'Compra' ? 'bg-green-800/30 text-green-400' : 'bg-red-800/30 text-red-400'
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
                          <div className="mb-1"><span className="text-white">Lotaje:</span> {transaction.lotaje}</div>
                        </div>
                        <div>
                          <div className="mb-1"><span className="text-white">Entrada:</span> {transaction.precioApertura}</div>
                          <div className="mb-1"><span className="text-white">Salida:</span> {transaction.precioCierre}</div>
                          <div className="mb-1"><span className="text-white">Pips:</span> {transaction.pips}</div>
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Fecha De Apertura
                        </div>
                      </th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Fecha De Cierre
                        </div>
                      </th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">Instrumento</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">Tipo</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">Lotaje</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">Stop Loss</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">Take Profit</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">Precio De Apertura</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">Precio De Cierre</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">Pips</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">ID De Posición</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium whitespace-nowrap">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistorialData.map((transaction, index) => (
                      <tr key={index} className="border-b border-[#333] hover:bg-[#2a2a2a] transition-colors">
                        {/* Fecha De Apertura */}
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

                        {/* Fecha De Cierre */}
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

                        {/* Instrumento */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <img 
                              src={transaction.bandera} 
                              alt={transaction.instrumento}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-white font-medium">{transaction.instrumento}</span>
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="py-3 px-2 text-white">{transaction.tipo}</td>

                        {/* Lotaje */}
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
                <span className="text-lg sm:text-xl font-bold text-white">Total</span>
                <div className="text-lg sm:text-xl font-bold text-green-400">
                    ${filteredHistorialData.reduce((sum, item) => sum + item.ganancia, 0).toFixed(2)}
                  <span className="text-xs sm:text-sm bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded ml-2">
                      +8.0% ↗
                    </span>
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
                  placeholder="Ingresa la contraseña investor"
                  disabled={isUpdatingPassword}
                />
              </div>

              {/* Campo Confirmar Contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Confirma la contraseña"
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