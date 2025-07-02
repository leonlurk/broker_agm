import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Star, Copy, Search, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid, LineChart, Line } from 'recharts';
import TraderProfileDetail from './TraderProfileDetail';

// Colores para el PieChart (ajustar si es necesario)
const PIE_COLORS = ['#3b82f6', '#22d3ee']; // Azul, Cyan

// Datos de ejemplo para Instrumentos (para la vista de detalle)
const instrumentData = [
  { name: 'NQM25', value: 71.43 },
  { name: 'EURUSD', value: 28.57 },
];

// Datos de ejemplo para Rentabilidad (para la vista de detalle)
const rentabilidadData = [
    { date: '01/04', value: 0 },
    { date: '03/04', value: 10 },
    { date: '05/04', value: 5 },
    { date: '07/04', value: -5 },
    { date: '09/04', value: 15 },
    { date: '11/04', value: 12 },
    { date: '13/04', value: -10 },
    { date: '15/04', value: -15 },
    { date: '18/04', value: 20 },
    { date: '20/04', value: 25 },
    { date: '22/04', value: 18 },
    { date: '24/04', value: 22 },
    { date: '26/04', value: 30 },
];

// Datos de ejemplo para Historial (para la vista de detalle)
const tradeHistoryData = [
    { id: '484247', position: 'XAUUSD', entryValue: 2670.89, entryTime: '10/01/2025 20:20:00', exitValue: 2670.69, exitTime: '10/01/2025 01:26:07', profit: -0.40 },
    { id: '484253', position: 'Índice Alemán', entryValue: 5895.53, entryTime: '10/01/2025 20:20:00', exitValue: 5894.88, exitTime: '10/01/2025 01:26:26', profit: -0.65 },
    { id: '484271', position: 'XAUUSD', entryValue: 2669.51, entryTime: '10/01/2025 21:00:00', exitValue: 2670.73, exitTime: '10/01/2025 02:00:45', profit: 1.22 },
    { id: '499421', position: 'XAUUSD', entryValue: 2898.70, entryTime: '10/01/2025 21:00:00', exitValue: 2870.53, exitTime: '10/01/2025 02:00:48', profit: -4.65 },
    // Añadir más operaciones si es necesario
];

const beneficioTotalData = [
    { date: '01/04', value: 0 }, { date: '03/04', value: 5000 }, { date: '05/04', value: 8000 }, { date: '07/04', value: 2000 }, { date: '09/04', value: 12000 }, { date: '11/04', value: -10000 }, { date: '13/04', value: 15000 }, { date: '15/04', value: 18000 }, { date: '18/04', value: 20000 }, { date: '20/04', value: 19000 }, { date: '22/04', value: 0 }, { date: '24/04', value: 3000 }, { date: '26/04', value: 6000 },
];

const balanceEquityData = [
    { date: '01/04', balance: -10000, equity: 20000 }, { date: '03/04', balance: 15000, equity: 35000 }, { date: '05/04', balance: 30000, equity: 30000 }, { date: '07/04', balance: 40000, equity: 25000 }, { date: '09/04', balance: 60000, equity: 15000 }, { date: '11/04', balance: 45000, equity: 50000 }, { date: '13/04', balance: 55000, equity: 60000 }, { date: '15/04', balance: 5000, equity: 20000 }, { date: '18/04', balance: 25000, equity: 40000 }, { date: '20/04', balance: 40000, equity: 60000 }, { date: '22/04', balance: 55000, equity: 50000 }, { date: '24/04', balance: 70000, equity: 65000 }, { date: '26/04', balance: 50000, equity: 75000 },
];

const maxDrawdownData = [
    { date: '01/04', value: 0 }, { date: '03/04', value: 0 }, { date: '05/04', value: 0 }, { date: '07/04', value: 0 }, { date: '09/04', value: -5 }, { date: '11/04', value: -22 }, { date: '13/04', value: -10 }, { date: '15/04', value: -10 }, { date: '18/04', value: -10 }, { date: '20/04', value: -15 }, { date: '22/04', value: -21 }, { date: '24/04', value: -8 }, { date: '26/04', value: -10 },
];

// --- DATOS DE EJEMPLO (Simulados como si vinieran de API) --- 
const ALL_ACCOUNTS_DATA = [
    { 
      id: 1, 
      nombre: 'Fxzio test', 
      serverType: 'MT5',
      accountNumber: '657237', 
      imagen: './Icono.svg',
      pnlUSD: 22621.00,
      rendimientoPercent: 42.13,
      retraccionMaxPercent: -42.4,
      cuentaAbiertaDias: 43,
      balancePropio: 5000.23,
      capitalAdministrado: 75009.73,
      operacionesCount: 7,
      inversoresCount: 1,
      // Campos para filtros
      isFavorite: false,
      tasaVolumen: 0.8,
      tasaRendimiento: 42.13,
      commissionRange: '0',
      porcentaje: '-29.88%', 
      type: 'Premium',
      since: 'Enero 2023',
      profit: '+12.4%',
      riesgo: 'Alto',
    },
    { 
      id: 2, 
      nombre: 'Trading Master', 
      serverType: 'MT4',
      accountNumber: '123456',
      imagen: './Icono.svg',
      pnlUSD: 15800.50,
      rendimientoPercent: 32.7,
      retraccionMaxPercent: -15.5,
      cuentaAbiertaDias: 250,
      balancePropio: 10000.00,
      capitalAdministrado: 120500.10,
      operacionesCount: 150,
      inversoresCount: 25,
      isFavorite: true,
      tasaVolumen: 1.2, 
      tasaRendimiento: 32.7,
      commissionRange: '5-10',
      porcentaje: '+32.7%', 
      type: 'Verificado',
      since: 'Marzo 2023',
    },
    { 
      id: 3, 
      nombre: 'ForexPro', 
      serverType: 'MT5',
      accountNumber: '987654',
      imagen: './Icono.svg',
      pnlUSD: 8300.00,
      rendimientoPercent: 18.5,
      retraccionMaxPercent: -22.0,
      cuentaAbiertaDias: 180,
      balancePropio: 2500.00,
      capitalAdministrado: 55000.00,
      operacionesCount: 85,
      inversoresCount: 10,
      isFavorite: false,
      tasaVolumen: 0.9,
      tasaRendimiento: 18.5,
      commissionRange: '1-5',
      porcentaje: '+18.5%', 
      type: 'Premium',
      since: 'Junio 2023',
    },
    { 
      id: 4, 
      nombre: 'CryptoKing', 
      serverType: 'MT5',
      accountNumber: '345678',
      imagen: './Icono.svg',
      pnlUSD: 35200.00,
      rendimientoPercent: 65.30,
      retraccionMaxPercent: -35.1,
      cuentaAbiertaDias: 25,
      balancePropio: 3200.50,
      capitalAdministrado: 25800.90,
      operacionesCount: 45,
      inversoresCount: 2,
      isFavorite: false,
      tasaVolumen: 1.5,
      tasaRendimiento: 65.30,
      commissionRange: '20-30',
      porcentaje: '+65.3%', 
      type: 'Premium',
      since: 'Diciembre 2024',
    },
    { 
      id: 5, 
      nombre: 'SafeTrader', 
      serverType: 'MT4',
      accountNumber: '567890',
      imagen: './Icono.svg',
      pnlUSD: 12850.00,
      rendimientoPercent: 22.90,
      retraccionMaxPercent: -8.5,
      cuentaAbiertaDias: 95,
      balancePropio: 6750.25,
      capitalAdministrado: 38920.45,
      operacionesCount: 120,
      inversoresCount: 15,
      isFavorite: true,
      tasaVolumen: 0.7,
      tasaRendimiento: 22.90,
      commissionRange: '0',
      porcentaje: '+22.9%', 
      type: 'Verificado',
      since: 'Octubre 2024',
    },
    { 
      id: 6, 
      nombre: 'RiskTaker', 
      serverType: 'MT5',
      accountNumber: '789012',
      imagen: './Icono.svg',
      pnlUSD: 8500.00,
      rendimientoPercent: 28.40,
      retraccionMaxPercent: -45.2,
      cuentaAbiertaDias: 400,
      balancePropio: 15000.00,
      capitalAdministrado: 65000.00,
      operacionesCount: 200,
      inversoresCount: 8,
      isFavorite: false,
      tasaVolumen: 1.8,
      tasaRendimiento: 28.40,
      commissionRange: '10-20',
      porcentaje: '+28.4%', 
      type: 'Premium',
      since: 'Enero 2024',
    }
];

const ALL_TRADE_HISTORY_DATA = [
    { id: '484247', position: 'XAUUSD', entryValue: 2670.89, entryTime: '10/01/2025 20:20:00', exitValue: 2670.69, exitTime: '10/01/2025 01:26:07', profit: -0.40, date: new Date(2025, 0, 10) }, // Mes 0 = Enero
    { id: '484253', position: 'Índice Alemán', entryValue: 5895.53, entryTime: '10/01/2025 20:20:00', exitValue: 5894.88, exitTime: '10/01/2025 01:26:26', profit: -0.65, date: new Date(2025, 0, 10) },
    { id: '484271', position: 'XAUUSD', entryValue: 2669.51, entryTime: '10/01/2025 21:00:00', exitValue: 2670.73, exitTime: '10/01/2025 02:00:45', profit: 1.22, date: new Date(2025, 0, 10) },
    { id: '499421', position: 'XAUUSD', entryValue: 2898.70, entryTime: '05/12/2024 21:00:00', exitValue: 2870.53, exitTime: '05/12/2024 02:00:48', profit: -4.65, date: new Date(2024, 11, 5) }, // Mes 11 = Diciembre
    { id: '501234', position: 'EURUSD', entryValue: 1.0850, entryTime: '01/12/2024 10:00:00', exitValue: 1.0900, exitTime: '01/12/2024 15:30:00', profit: 50.00, date: new Date(2024, 11, 1) },
    { id: '505678', position: 'NQM25', entryValue: 18000, entryTime: '28/11/2024 09:00:00', exitValue: 18050, exitTime: '28/11/2024 11:00:00', profit: 100.00, date: new Date(2024, 10, 28) }, // Mes 10 = Noviembre
];

// Datos de ejemplo para gráficos (modificado para manejar meses en 'Año')
const generateChartData = (period = 'Mes', type = 'rentabilidad') => {
  const data = [];
  let value = 0;
  let balance = 50000;
  let equity = 50000;
  
  let numPoints = 30;
  let labels = Array.from({ length: numPoints }, (_, i) => `Día ${i + 1}`);
  
  if (period === 'Año') {
    numPoints = 12;
    labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  } else if (period === 'Semana') {
    numPoints = 7;
    labels = Array.from({ length: numPoints }, (_, i) => `Día ${i + 1}`); // O podrían ser nombres de días
  } else if (period === 'Día') {
    numPoints = 24; // Podrían ser horas del día
    labels = Array.from({ length: numPoints }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  } // 'Mes' usa el default de 30 días

  for (let i = 0; i < numPoints; i++) {
    const date = labels[i]; // Usar las etiquetas correctas
    if (type === 'rentabilidad') {
      value += (Math.random() - 0.4) * 10;
      data.push({ date, value: parseFloat(value.toFixed(2)) });
    } else if (type === 'beneficio') {
      value += (Math.random() - 0.45) * 5000;
      data.push({ date, value: parseFloat(value.toFixed(2)) });
    } else if (type === 'drawdown') {
      value += (Math.random() - 0.6) * 5;
      if (value > 0) value = 0;
      data.push({ date, value: parseFloat(value.toFixed(2)) });
    } else if (type === 'balance') {
      balance += (Math.random() - 0.45) * 10000;
      equity += (Math.random() - 0.45) * 10000 + (balance - equity) * 0.1;
      data.push({ date, balance: parseFloat(balance.toFixed(2)), equity: parseFloat(equity.toFixed(2)) });
    }
  }
  return data;
};

const Inversor = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    misFavoritos: false,
    tasaVolumen: false,
    tasaRendimiento: false,
  });
  const [antiguedadFilter, setAntiguedadFilter] = useState(null);
  const [comisionFilter, setComisionFilter] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [selectedTraderDetails, setSelectedTraderDetails] = useState({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Estados de la vista de detalle
  const [rentabilidadTab, setRentabilidadTab] = useState('Rentabilidad');
  const [rentabilidadRange, setRentabilidadRange] = useState('Mes');
  const [historialFilter, setHistorialFilter] = useState('Último Mes');
  
  // Estados para datos filtrados
  const [filteredChartData, setFilteredChartData] = useState([]);
  const [filteredHistoryData, setFilteredHistoryData] = useState([]);
  const [filteredInstrumentData, setFilteredInstrumentData] = useState([]);

  // Simulación de carga inicial de cuentas
  useEffect(() => {
    setIsLoading(true);
    // Simular llamada a API
    setTimeout(() => {
      setCuentas(ALL_ACCOUNTS_DATA);
      setIsLoading(false);
    }, 500);
  }, []);

  // Simulación de carga de detalles del trader seleccionado y sus datos
  useEffect(() => {
    if (selectedTrader) {
      setIsLoadingDetails(true);
      // Simular llamada a API para detalles y datos asociados
      setTimeout(() => {
        // En una app real, aquí harías fetch con selectedTrader.id
        const details = ALL_ACCOUNTS_DATA.find(c => c.id === selectedTrader.id) || {};
        setSelectedTraderDetails(details);
        
        // Simular datos asociados (gráficos, historial, instrumentos)
        // Estos también vendrían de la API, filtrados por trader ID
        // Por ahora, generamos datos aleatorios o usamos datos fijos simulados
        setFilteredChartData(generateChartData(30, 'rentabilidad')); // Datos iniciales para 'Mes'
        setFilteredHistoryData(filterHistoryData(ALL_TRADE_HISTORY_DATA, 'Último Mes'));
        setFilteredInstrumentData([ // Ejemplo fijo por ahora
            { name: 'NQM25', value: Math.random() * 100 },
            { name: 'EURUSD', value: Math.random() * 100 },
            { name: 'XAUUSD', value: Math.random() * 100 },
        ].sort((a, b) => b.value - a.value).slice(0, 4)); // Mostrar top 4

        setIsLoadingDetails(false);
      }, 300);
    }
  }, [selectedTrader]);

  // Filtrar datos de gráficos cuando cambia el rango o el tab
  useEffect(() => {
    if (!selectedTrader) return;
    
    let dataType = 'rentabilidad';
    if (rentabilidadTab === 'Beneficio Total') dataType = 'beneficio';
    else if (rentabilidadTab === 'Retracción Máxima') dataType = 'drawdown';
    else if (rentabilidadTab === 'Balance y Equidad') dataType = 'balance';

    // Llamar a generateChartData pasando el período seleccionado
    setFilteredChartData(generateChartData(rentabilidadRange, dataType));

  }, [rentabilidadRange, rentabilidadTab, selectedTrader]);

  // Filtrar historial cuando cambia el filtro
  useEffect(() => {
      if (!selectedTrader) return;
      setFilteredHistoryData(filterHistoryData(ALL_TRADE_HISTORY_DATA, historialFilter));
  }, [historialFilter, selectedTrader]);

  // --- Lógica de Filtros --- 
  const toggleFilter = (filter) => {
    setFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };
  
  // Handlers para filtros de Antigüedad y Comisión (tipo radio)
  const handleAntiguedadSelect = (value) => {
      setAntiguedadFilter(prev => prev === value ? null : value); // Toggle si se hace clic de nuevo
  }
  const handleComisionSelect = (value) => {
      setComisionFilter(prev => prev === value ? null : value); // Toggle
  }

  // Convertir antigüedad seleccionada a días (más preciso)
  const getDaysFromAntiguedad = (filterValue) => {
      if (!filterValue) return null;
      switch (filterValue) {
          case '1m': return 30;
          case '2m': return 60;
          case '3m': return 90;
          case '6m': return 180;
          case '1a': return 365;
          default: return null;
      }
  };
  
  const filteredCuentas = cuentas.filter(cuenta => {
    // 1. Filtro de búsqueda (Nombre o Número de cuenta)
    const searchTerm = searchQuery.toLowerCase();
    const matchesSearch = cuenta.nombre.toLowerCase().includes(searchTerm) || 
                          cuenta.accountNumber?.toLowerCase().includes(searchTerm);
    if (!matchesSearch) return false;

    // 2. Filtros Checkbox ('Filtrar por')
    if (filters.misFavoritos && !cuenta.isFavorite) return false;
    
    // Filtro por tasa de rendimiento - ordenar por rendimiento descendente
    if (filters.tasaRendimiento) {
      // Este filtro se aplicará como ordenamiento después del filtrado
    }
    
    // Filtro por tasa de volumen - filtrar cuentas con volumen alto
    if (filters.tasaVolumen && cuenta.tasaVolumen < 1.0) return false;
    
    // 3. Filtro Antigüedad
    const minDays = getDaysFromAntiguedad(antiguedadFilter);
    if (minDays !== null && cuenta.cuentaAbiertaDias < minDays) return false;
    
    // 4. Filtro Comisión
    if (comisionFilter !== null && cuenta.commissionRange !== comisionFilter) return false;
    
    // Si pasa todos los filtros, incluir la cuenta
    return true;
  });

  // Aplicar ordenamiento si el filtro de tasa de rendimiento está activo
  if (filters.tasaRendimiento) {
    filteredCuentas.sort((a, b) => b.rendimientoPercent - a.rendimientoPercent);
  }

  // Función para filtrar historial (SIMULACIÓN)
  const filterHistoryData = (data, filter) => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay; // Aproximado

    switch(filter) {
      case 'Hoy':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return data.filter(trade => trade.date >= todayStart);
      case 'Última Semana':
        const lastWeekStart = new Date(now.getTime() - oneWeek);
        return data.filter(trade => trade.date >= lastWeekStart);
      case 'Último Mes':
        const lastMonthStart = new Date(now.getTime() - oneMonth);
        return data.filter(trade => trade.date >= lastMonthStart);
      case 'Todo':
      default:
        return data;
    }
  };

  // --- Funciones auxiliares para la vista de detalle ---
  const copyTraderInfo = () => { alert('Información copiada (Implementación pendiente)'); };
  const formatCurrency = (value) => {
    // Manejar null o undefined
    if (value == null) return '$0.00'; 
    const numValue = Number(value);
    if (isNaN(numValue)) return '$0.00'; // Devolver un valor por defecto si no es número
    return `$${numValue.toFixed(2)}`;
  }
  
  const formatPercentage = (value) => {
    // Manejar null o undefined
    if (value == null) return '0.0%';
    const numValue = Number(value);
    if (isNaN(numValue)) return '0.0%';
    // Añadir signo + si es positivo
    const sign = numValue > 0 ? '+' : ''; 
    return `${sign}${numValue.toFixed(1)}%`;
  }

  const formatCurrencyK = (value) => {
      if (value == null || isNaN(Number(value))) return '0K';
      return `${Math.round(Number(value) / 1000)}K`;
  }

  const handleTraderSelect = (trader) => {
    setSelectedTrader(trader);
    setRentabilidadTab('Rentabilidad');
    setRentabilidadRange('Mes');
    setHistorialFilter('Último Mes');
  };

  const handleBackToList = () => {
    setSelectedTrader(null);
  };

  // Vista de Carga Principal
  if (isLoading) {
    return <div className="p-6 text-center text-gray-400">Cargando cuentas...</div>;
  }

  // Vista de Detalle del Trader
  if (selectedTrader) {
    if (isLoadingDetails) {
      return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white flex flex-col">
          <div className="mb-4">
            <img 
              src="/Back.svg" 
              alt="Back" 
              onClick={handleBackToList}
              className="w-10 h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
            />
          </div>
          <div className="text-center py-10 text-gray-400">Cargando detalles del trader...</div>
        </div>
      );
    }

    // Usar selectedTraderDetails para la información estática
    const trader = selectedTraderDetails;

    // Determinar formateadores y tipo de gráfico
    let yAxisFormatter = (value) => `${value}%`;
    let tooltipFormatter = (value, name, props) => [`${value}%`, rentabilidadTab];
    let chartType = 'area';
    let yDomain = ['auto', 'auto'];
    switch (rentabilidadTab) {
        case 'Beneficio Total':
            yAxisFormatter = formatCurrencyK;
            tooltipFormatter = (value) => [formatCurrency(value), rentabilidadTab];
            yDomain=['auto', 'auto'];
            break;
        case 'Balance y Equidad':
            yAxisFormatter = formatCurrencyK;
            tooltipFormatter = (value, name) => [formatCurrency(value), name === 'balance' ? 'Balance Máximo' : 'Equidad Mínima'];
            chartType = 'balance';
            yDomain=['auto', 'auto'];
            break;
        case 'Retracción Máxima':
            yAxisFormatter = (value) => `${value}%`;
            tooltipFormatter = (value) => [`${value}%`, rentabilidadTab];
            yDomain=['auto', 0]; 
            break;
        default: break;
    }
      
    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white flex flex-col border border-[#333] rounded-3xl">
        {/* Botón Volver */} 
        <div className="mb-4">
          <img 
            src="/Back.svg" 
            alt="Back" 
            onClick={handleBackToList}
            className="w-10 h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
          />
          </div>

        {/* Perfil del Trader (solo la información básica, sin duplicar botón volver) */}
        <div className="bg-[#191919] p-6 rounded-xl border border-[#333] mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Info del Trader */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {selectedTrader.nombre?.charAt(0) || 'T'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{selectedTrader.nombre}</h1>
                <p className="text-gray-400">Activo hace {selectedTrader.cuentaAbiertaDias} días</p>
              </div>
            </div>
            
            {/* Stats básicos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-gray-400 text-sm">Número de cuenta</p>
                <p className="text-white font-medium">{selectedTrader.accountNumber}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Rendimiento</p>
                <p className={`font-medium ${selectedTrader.rendimientoPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercentage(selectedTrader.rendimientoPercent)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Balance</p>
                <p className="text-white font-medium">{formatCurrency(selectedTrader.balancePropio)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Inversores</p>
                <p className="text-white font-medium">{selectedTrader.inversoresCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Tabs Rentabilidad y Gráfico (Usa filteredChartData) */} 
        <div className="bg-[#232323] p-5 md:p-6 rounded-xl border border-[#333] mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
             {/* Tabs */}
             <div className="flex w-full border-b border-[#333] overflow-x-auto md:overflow-visible md:border-none md:w-auto focus:outline-none">
                {['Rentabilidad', 'Beneficio Total', 'Balance y Equidad', 'Retracción Máxima'].map(tab => (
                 <button 
                    key={tab} 
                    onClick={() => setRentabilidadTab(tab)} 
                    className={`flex-shrink-0 py-2 px-4 whitespace-nowrap text-sm focus:outline-none ${ 
                        rentabilidadTab === tab 
                        ? 'text-cyan-400 border-b-2 border-cyan-400 font-medium' 
                        : 'text-gray-400 hover:text-white md:border-b-2 md:border-transparent' 
                    }`}
                 >
                    {tab}
                 </button>
                ))}
              </div>
             {/* Dropdown de Rango */} 
             <div className="flex-shrink-0 w-full md:w-auto">
                 <CustomRangeDropdown 
                   selectedOption={rentabilidadRange}
                   options={['Día', 'Semana', 'Mes', 'Año']}
                   onSelect={setRentabilidadRange}
                   buttonClassName="w-full sm:w-auto bg-transparent"
                   menuClassName="w-full sm:w-40 bg-transparent"
                 />
            </div>
          </div>
          {/* Contenedor del Gráfico (Usa filteredChartData) */} 
          <div className="h-64 w-full">
             {filteredChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'balance' ? (
                      <LineChart data={filteredChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid stroke="#333" strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }}/>
                          <YAxis 
                    axisLine={false} 
                    tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                            tickFormatter={yAxisFormatter} 
                            domain={yDomain}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#232323', 
                              border: '1px solid #333', 
                              borderRadius: '8px', 
                              fontSize: '14px', 
                              color: '#ffffff',
                              padding: '8px'
                            }} 
                            labelStyle={{ color: '#ffffff' }}
                            itemStyle={{ color: '#ffffff' }}
                            formatter={tooltipFormatter} 
                            labelFormatter={(label) => `Fecha: ${label}`}
                          />
                          <Legend 
                            verticalAlign="top" 
                            align="left" 
                            height={36}
                            iconType="square"
                            wrapperStyle={{ paddingBottom: '10px' }}
                            formatter={(value, entry) => { 
                              let text = value; // Fallback al valor original (dataKey)
                              if (entry.dataKey === 'balance') {
                                text = 'Balance Máximo';
                              } else if (entry.dataKey === 'equity') {
                                text = 'Equidad Mínima';
                              }
                              return <span className="text-white text-xs ml-1">{text}</span>;
                            }}
                          />
                          <Line type="monotone" dataKey="balance" stroke="#22d3ee" strokeWidth={2} dot={false} name="Balance Máximo" />
                          <Line type="monotone" dataKey="equity" stroke="#FFFFFF" strokeWidth={2} dot={false} name="Equidad Mínima" />
                      </LineChart>
                  ) : (
                      <AreaChart data={filteredChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid stroke="#333" strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }}/>
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                            tickFormatter={yAxisFormatter} 
                            domain={yDomain}
                  />
                  <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#232323', 
                              border: '1px solid #333', 
                              borderRadius: '8px', 
                              fontSize: '14px', 
                              color: '#ffffff',
                              padding: '8px'
                            }} 
                            labelStyle={{ color: '#ffffff' }}
                            itemStyle={{ color: '#ffffff' }}
                            formatter={tooltipFormatter} 
                            labelFormatter={(label) => `Fecha: ${label}`}
                          />
                          <Area type="linear" dataKey="value" stroke="#22d3ee" strokeWidth={2} fillOpacity={0.1} fill="#22d3ee" dot={false}/>
                </AreaChart>
                  )}
              </ResponsiveContainer>
              ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No hay datos disponibles para este período.</div>
              )}
          </div>
        </div>

        {/* Sección Instrumentos de Trading (Usa filteredInstrumentData) */} 
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-5 md:p-6 rounded-xl border border-[#333] mb-6">
          <h2 className="text-lg font-medium mb-4">Instrumentos de Trading</h2>
          {filteredInstrumentData.length > 0 ? (
             <div className="flex flex-col md:flex-row items-center justify-between gap-6">
               {/* Leyenda */} 
               <div className="w-full md:w-auto flex flex-col space-y-2 order-2 md:order-1">
                  {filteredInstrumentData.map((entry, index) => (
                     <div key={`legend-${index}`} className="flex items-center">
                       <div style={{ width: 12, height: 12, backgroundColor: PIE_COLORS[index % PIE_COLORS.length], marginRight: 8, flexShrink: 0 }}></div>
                       <span className="text-sm text-gray-300 mr-2 truncate">{entry.name}</span>
                       <span className="text-sm text-white font-medium">{`${entry.value.toFixed(2)}%`}</span>
          </div>
                  ))}
            </div>
               {/* Gráfico */} 
               <div className="w-full md:w-1/2 lg:w-2/5 h-48 md:h-56 order-1 md:order-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={filteredInstrumentData}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       outerRadius="90%"
                       fill="#8884d8"
                       dataKey="value"
                     >
                       {filteredInstrumentData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={"#232323"} strokeWidth={2} />
                       ))}
                     </Pie>
                     <Tooltip
                       contentStyle={{
                         backgroundColor: '#232323',
                         border: '1px solid #333',
                         borderRadius: '8px',
                         fontSize: '14px',
                         color: '#ffffff',
                         padding: '8px'
                       }}
                       labelStyle={{ color: '#ffffff' }}
                       itemStyle={{ color: '#ffffff' }}
                       formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
                     />
                   </PieChart>
                 </ResponsiveContainer>
          </div>
          </div>
           ) : (
             <div className="text-center text-gray-500 py-10">No hay datos de instrumentos.</div>
           )}
        </div>

        {/* Historial de Operaciones (Usa filteredHistoryData) */} 
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-5 md:p-6 rounded-xl border border-[#333]">
           {/* Header y Filtro */} 
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
             <h2 className="text-lg font-medium">Historial de Operaciones</h2>
             <div className="relative flex-shrink-0 w-full sm:w-auto">
                <CustomRangeDropdown 
                   selectedOption={historialFilter}
                   options={['Hoy', 'Última Semana', 'Último Mes', 'Todo']}
                   onSelect={setHistorialFilter}
                   buttonClassName="w-full sm:w-auto"
                   menuClassName="w-full sm:w-40 bg-transparent"
                 />
             </div>
           </div>
           {/* Tabla */} 
          <div className="overflow-x-auto">
             <table className="w-full min-w-[600px]">
               <thead className="text-left text-xs text-gray-400 border-b border-[#333]">
                  <tr>
                    <th className="py-2 pl-2 font-normal">Posición</th>
                    <th className="py-2 px-2 font-normal">Valor Entrada</th>
                    <th className="py-2 px-2 font-normal">Hora Entrada</th>
                    <th className="py-2 px-2 font-normal">Valor Salida</th>
                    <th className="py-2 px-2 font-normal">Hora Salida</th>
                    <th className="py-2 px-2 font-normal">Ganancia</th>
                    <th className="py-2 pr-2 font-normal text-right">ID Orden</th>
                </tr>
              </thead>
               <tbody className="text-sm divide-y divide-[#333]">
                 {filteredHistoryData.length > 0 ? (
                    filteredHistoryData.map((trade) => (
                       <tr key={trade.id}>
                          <td className="py-3 pl-2">{trade.position}</td>
                          <td className="py-3 px-2">{formatCurrency(trade.entryValue)}</td>
                          <td className="py-3 px-2 text-gray-400">{trade.entryTime}</td>
                          <td className="py-3 px-2">{formatCurrency(trade.exitValue)}</td>
                          <td className="py-3 px-2 text-gray-400">{trade.exitTime}</td>
                          <td className={`py-3 px-2 font-medium ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(trade.profit)}</td>
                          <td className="py-3 pr-2 text-gray-400 text-right">{trade.id}</td>
                       </tr>
                    ))
                  ) : (
                   <tr>
                     <td colSpan="7" className="py-6 text-center text-gray-500">
                       No hay operaciones registradas para este período.
                    </td>
                  </tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

   // --- Renderizado de la lista de traders (NUEVO DISEÑO v3) --- 
  return (
    <div className="p-4 md:p-6 bg-[#232323] text-white flex flex-col">

      {/* Contenedor Superior Unificado: Título, Búsqueda y Filtros */} 
      <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-3xl border border-[#333]">
        {/* Fila Superior: Título y Búsqueda */} 
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
          {/* Título y Subtítulo */} 
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-semibold mb-1">Copytrading</h1>
            <p className="text-lg md:text-xl text-gray-400">Busca a quien quieres copiar</p>
          </div>
          {/* Barra de Búsqueda - Added flex-grow */} 
          <div className="relative w-full md:w-auto md:max-w-md lg:max-w-lg flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o número de cuenta"
              className="w-full bg-[#2a2a2a] border border-[#444] rounded-full pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 placeholder-gray-500 text-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Grid para Secciones de Filtros (Debajo de Título/Búsqueda) */} 
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 border-t border-[#333] pt-6">
          {/* Sección Filtrar por */} 
          <div>
            <h3 className="text-base font-medium mb-3 text-gray-300">Filtrar por</h3>
            <div className="space-y-2.5">
              {[ 
                { key: 'misFavoritos', label: 'Mis favoritos' },
                { key: 'tasaVolumen', label: 'Tasa de volúmen' },
                { key: 'tasaRendimiento', label: 'Tasa de rendimiento' },
              ].map(filter => (
                <div key={filter.key} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleFilter(filter.key)}>
                  <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${filters[filter.key] ? 'bg-cyan-500 border-cyan-500' : 'border-[#555] group-hover:border-gray-400'}`}>
                    {filters[filter.key] && ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg> )}
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-200 select-none transition-colors">{filter.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sección Antigüedad (Estilo Checkbox) */} 
          <div>
             <h3 className="text-base font-medium mb-3 text-gray-300">Antigüedad</h3>
             <div className="space-y-2.5">
               {[ 
                 { value: '1m', label: '+1 mes' }, { value: '2m', label: '+2 meses' }, { value: '3m', label: '+3 meses' },
                 { value: '6m', label: '+6 meses' }, { value: '1a', label: '+1 año' },
               ].map(item => (
                 <div key={item.value} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => handleAntiguedadSelect(item.value)}>
                    <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${antiguedadFilter === item.value ? 'bg-cyan-500 border-cyan-500' : 'border-[#555] group-hover:border-gray-400'}`}>
                      {antiguedadFilter === item.value && ( <div className="w-2 h-2 bg-white rounded-full"></div> )} {/* Indicador simple */} 
              </div>
                    <span className={`text-sm select-none transition-colors ${antiguedadFilter === item.value ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-200'}`}>{item.label}</span>
            </div>
               ))}
              </div>
            </div>
            
          {/* Sección Comisión (Estilo Checkbox) */} 
          <div>
             <h3 className="text-base font-medium mb-3 text-gray-300">Comisión</h3>
             <div className="space-y-2.5">
               {[ 
                 { value: '0', label: 'Trader sin comisión' }, { value: '1-5', label: '1%-5%' }, { value: '5-10', label: '5%-10%' }, 
                 { value: '10-20', label: '10%-20%' }, { value: '20-30', label: '20%-30%' }, { value: '+30', label: '+30%' },
               ].map(item => (
                 <div key={item.value} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => handleComisionSelect(item.value)}>
                    <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${comisionFilter === item.value ? 'bg-cyan-500 border-cyan-500' : 'border-[#555] group-hover:border-gray-400'}`}>
                      {comisionFilter === item.value && ( <div className="w-2 h-2 bg-white rounded-full"></div> )} {/* Indicador simple */} 
              </div>
                    <span className={`text-sm select-none transition-colors ${comisionFilter === item.value ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-200'}`}>{item.label}</span>
            </div>
               ))}
            </div>
          </div>
        </div>
      </div> 

      {/* Contenedor Lista de Traders (Se mantiene igual, debajo del contenedor superior) */} 
      <div className="flex-1 min-w-0">
        {/* Contenedor de la tabla con scroll horizontal si es necesario */} 
        <div className="overflow-x-auto bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-3xl border border-[#333] p-1">
          {/* Encabezado de la tabla */} 
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] grid grid-cols-[auto,minmax(150px,2fr),repeat(9,minmax(100px,1fr))] gap-x-4 px-4 py-3 border-b border-[#333] text-xs text-gray-400 sticky top-0 bg-[#191919] z-10">
            <div className="text-right">#</div>
            <div className="">Traders</div>
            <div className="text-right">PNL en USD</div>
            <div className="text-right">Rendimiento</div>
            <div className="text-right">Retracción máxima</div>
            <div className="text-right">Cuenta abierta días</div>
            <div className="text-right">Balance propio</div>
            <div className="text-right">Capital administrado</div>
            <div className="text-right">Operaciones</div>
            <div className="text-right">Inversores</div>
            <div className="text-center">Cartera</div>
        </div>
        
          {/* Cuerpo de la tabla */} 
          <div className="divide-y divide-[#333]">
            {filteredCuentas.length > 0 ? (
              filteredCuentas.map((cuenta, index) => (
                <div 
                   key={cuenta.id} 
                   className="grid grid-cols-[auto,minmax(150px,2fr),repeat(9,minmax(100px,1fr))] gap-x-4 px-4 py-3 items-center hover:bg-[#2a2a2a] cursor-pointer transition-colors text-sm"
                   onClick={() => handleTraderSelect(cuenta)}
                 >
                  {/* Número */} 
                  <div className="text-right text-gray-400">{index + 1}.</div>
                  {/* Trader Info */} 
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={cuenta.imagen} 
                      alt={cuenta.nombre} 
                      className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                      onError={(e) => { /* ... fallback */ }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate text-white">{cuenta.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">{cuenta.serverType} | Cuenta: {cuenta.accountNumber}</p>
                    </div>
                  </div>
                  {/* Métricas */} 
                  <div className="text-right font-medium">{formatCurrency(cuenta.pnlUSD)}</div>
                  <div className={`text-right font-medium ${cuenta.rendimientoPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercentage(cuenta.rendimientoPercent)}</div>
                  <div className={`text-right font-medium ${cuenta.retraccionMaxPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercentage(cuenta.retraccionMaxPercent)}</div>
                  <div className="text-right">{cuenta.cuentaAbiertaDias}</div>
                  <div className="text-right">{formatCurrency(cuenta.balancePropio)}</div>
                  <div className="text-right">{formatCurrency(cuenta.capitalAdministrado)}</div>
                  <div className="text-right">{cuenta.operacionesCount}</div>
                  <div className="text-right">{cuenta.inversoresCount}</div>
                  {/* Cartera Icon */} 
                  <div className="flex justify-center items-center">
                    <BarChart2 size={20} className="text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">No se encontraron traders</p>
                <p className="text-sm">Intenta ajustar los filtros para ver más resultados</p>
              </div>
            )}
            </div>
        </div>
      </div>

    </div>
  );
 };

// --- Componente Auxiliar: Custom Dropdown (Estilo ajustado) --- 
const CustomRangeDropdown = ({ selectedOption, options, onSelect, buttonClassName = '', menuClassName = '' }) => {
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRangeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        className={`inline-flex justify-between items-center w-full rounded-full bg-[#333] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#444] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#333] focus:ring-cyan-500 transition-colors duration-150 ${buttonClassName}`}
        onClick={() => setIsRangeDropdownOpen(!isRangeDropdownOpen)}
      >
        {selectedOption}
        <ChevronDown className="-ml-1 ml-2 h-4 w-4" aria-hidden="true" />
      </button>

      {isRangeDropdownOpen && (
        <div className={`origin-top-right absolute right-0 mt-2 w-40 rounded-lg shadow-lg bg-[#333] ring-1 ring-black ring-opacity-5 focus:outline-none z-10 ${menuClassName}`}>
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelect(option);
                  setIsRangeDropdownOpen(false);
                }}
                className="text-white block w-full px-4 py-2 text-xs text-left hover:bg-[#444] rounded-md mx-1"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inversor;