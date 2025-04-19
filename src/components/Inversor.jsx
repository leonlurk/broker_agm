import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowLeft, ChevronUp, AlertTriangle, Star, Copy } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid, LineChart, Line } from 'recharts';

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
      porcentaje: '-29.88%', 
      imagen: './Icono.svg',
      type: 'Premium',
      since: 'Enero 2023',
      profit: '+12.4%',
      riesgo: 'Alto',
      rentabilidad: '+187.4%',
    activoDias: 51,
    accountNumber: '657237', 
    server: 'MT5', 
    accountType: 'CopyFX MT5 Prime', 
    verified: true, 
    balance: 5000.23, 
    managedCapital: 75009.73, 
    leverage: 300,
    strategyName: 'Scalping Pro',
    minDeposit: 100,
    commissionType: '20%',
    paymentFrequency: '1 semana',
    copyMode: 'Proporcional',
    totalProfitabilityPercent: 191,
    totalProfitabilityValue: 6238.99,
    followers: 20,
    followersChangePercent: -34.7,
    totalTrades: 7,
    winRate: 85.71,
    winningTrades: 6,
    maxDrawdown: -48.40,
    avgProfit: 5,
    maxProfitTrade: 1915.17,
    minProfitTrade: -124.75,
    activeSubscribers: 8,
    },
    { 
      id: 2, 
      nombre: 'Trading Master', 
      porcentaje: '+32.7%', 
      imagen: './Icono.svg',
      type: 'Verificado',
      since: 'Marzo 2023',
      profit: '+8.2%',
      riesgo: 'Medio',
    rentabilidad: '+142.7%',
    activoDias: 250,
    maxDrawdown: -15.5
    // ... (añadir más datos si es necesario para los filtros)
    },
    { 
      id: 3, 
      nombre: 'ForexPro', 
      porcentaje: '+18.5%', 
      imagen: './Icono.svg',
      type: 'Premium',
      since: 'Junio 2023',
      profit: '+5.7%',
      riesgo: 'Medio-Alto',
    rentabilidad: '+156.3%',
    activoDias: 180,
    maxDrawdown: -22.0
    },
    { 
      id: 4, 
      nombre: 'TradingAlpha', 
      porcentaje: '+9.2%', 
      imagen: './Icono.svg',
      type: 'Nuevo',
      since: 'Septiembre 2024',
      profit: '+4.1%',
      riesgo: 'Bajo',
    rentabilidad: '+21.4%',
    activoDias: 100,
    maxDrawdown: -8.0
  },
  // ... (añadir más cuentas si es necesario)
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
    perdidaMax: false,
    cantDias: false,
    riesgoAlto: false,
    premium: false
  });
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

  const filteredCuentas = cuentas.filter(cuenta => {
    // Filtro de búsqueda
    let matchesSearch = cuenta.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Filtros de checkboxes
    // Asumiendo que `cuenta.porcentaje` es string como '-29.88%'
    if (filters.perdidaMax && parseFloat(cuenta.porcentaje) > 0) return false; 
    if (filters.cantDias && cuenta.activoDias < 90) return false; // Ejemplo: menos de 90 días activos
    if (filters.riesgoAlto && cuenta.riesgo?.toLowerCase() !== 'alto') return false;
    if (filters.premium && cuenta.type?.toLowerCase() !== 'premium') return false;
    
    return true;
  });

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
    setSelectedTraderDetails({});
  };

  // Vista de Carga Principal
  if (isLoading) {
    return <div className="p-6 text-center text-gray-400">Cargando cuentas...</div>;
  }

  // Vista de Detalle del Trader
  if (selectedTrader) {
    if (isLoadingDetails) {
      return (
        <div className="p-4 md:p-6 bg-[#232323] text-white min-h-screen flex flex-col">
          <div className="mb-4">
            <button onClick={handleBackToList} className="flex items-center text-cyan-500 hover:text-cyan-400 transition text-sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </button>
          </div>
          <div className="text-center py-10 text-gray-400">Cargando detalles del trader...</div>
        </div>
      );
    }

    // Usar selectedTraderDetails para la información estática
    const trader = selectedTraderDetails;

    // Determinar formateadores y tipo de gráfico (sin cambios)
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
      <div className="p-4 md:p-6 bg-[#232323] text-white min-h-screen flex flex-col">
        {/* Botón Volver */} 
        <div className="mb-4">
           <button onClick={handleBackToList} className="flex items-center text-cyan-500 hover:text-cyan-400 transition text-sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
           </button>
        </div>

        {/* Sección Principal del Perfil (Datos de `trader`) */} 
        <div className="bg-[#232323] p-5 md:p-6 rounded-xl border border-[#333] mb-6">
          {/* Header del Perfil */} 
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
            <div className="flex items-center gap-3">
              <img 
                  src={trader.imagen || '/default-avatar.png'}
                  alt={trader.nombre || 'Trader'} 
                  className="h-12 w-12 rounded-full border-2 border-cyan-500 object-cover"
                  onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23333'/%3E%3C/svg%3E"; }}
              />
              <div>
                <h1 className="text-xl md:text-2xl font-semibold">{trader.nombre || 'Nombre Trader'}</h1>
                <p className="text-sm text-gray-400">Activo hace {trader.activoDias || 'N/A'} días</p> 
              </div>
            </div>
             {/* ... (Botones Star y Copy) ... */} 
          </div>

          {/* Información y Reglas (Datos de `trader`) */} 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Tarjeta Izquierda: Información */} 
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-4 rounded-xl border border-[#333] space-y-2">
              <h2 className="text-lg font-medium mb-2 border-b border-[#333] pb-1">Información</h2>
              {[
                { label: 'Número de cuenta', value: trader.accountNumber || 'N/A' },
                { label: 'Nombre del servidor', value: trader.server || 'N/A' },
                { label: 'Tipo de cuenta', value: trader.accountType || 'N/A' },
                { label: 'Verificado', value: trader.verified ? 'Sí' : 'No', color: trader.verified ? 'text-green-500' : 'text-red-500' },
                { label: 'Saldo de la cuenta', value: `${formatCurrency(trader.balance || 0)} USD` },
                { label: 'Capital administrado', value: `${formatCurrency(trader.managedCapital || 0)} USD` },
                { label: 'Apalancamiento', value: `1:${trader.leverage || 'N/A'}` },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.label}</span>
                  <span className={`font-medium ${item.color || 'text-white'}`}>{item.value}</span> 
              </div>
              ))}
            </div>
            {/* Tarjeta Derecha: Reglas (Datos de `trader`) */} 
             <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-4 rounded-xl border border-[#333] space-y-2">
              <h2 className="text-lg font-medium mb-2 border-b border-[#333] pb-1">Reglas</h2>
              {[
                { label: 'Nombre de la estrategia', value: trader.strategyName || 'N/A' },
                { label: 'Depósito mínimo', value: `${formatCurrency(trader.minDeposit || 0)} USD` },
                { label: 'Tipo de comisión', value: trader.commissionType || 'N/A' },
                { label: 'Frecuencia de pagos', value: trader.paymentFrequency || 'N/A' },
                { label: 'Modo de copia', value: trader.copyMode || 'N/A' },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
            </div>
            
          {/* Métricas de Rendimiento (Datos de `trader`) */} 
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Rentabilidad total', value1: formatPercentage(trader.totalProfitabilityPercent), value2: `${formatCurrency(trader.totalProfitabilityValue)} USD`, color1: 'text-green-500' },
              { label: 'Seguidores actuales', value1: trader.followers, value2: formatPercentage(trader.followersChangePercent), color2: trader.followersChangePercent >= 0 ? 'text-green-500' : 'text-red-500' },
              { label: 'Operaciones', value1: trader.totalTrades },
              { label: 'Winrate', value1: formatPercentage(trader.winRate), value2: `${trader.winningTrades || 0} Ganadas` },
              { label: 'Retracción Máxima', value1: formatPercentage(trader.maxDrawdown), color1: 'text-red-500' },
              { label: 'Promedio de Ganancia', value1: formatPercentage(trader.avgProfit), color1: 'text-green-500' },
              { label: 'Beneficio', value1: `Mayor ${formatCurrency(trader.maxProfitTrade)}`, value2: `Menor ${formatCurrency(trader.minProfitTrade)}`, color1: 'text-green-500', color2: 'text-red-500', size1: 'text-sm', size2: 'text-sm' },
              { label: 'Suscriptores Activos', value1: trader.activeSubscribers },
            ].map(metric => (
               <div key={metric.label} className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-3 rounded-lg border border-[#333]">
                 <p className="text-xs text-gray-400 mb-1 truncate">{metric.label}</p>
                 <p className={`text-lg font-medium ${metric.color1 || 'text-white'} ${metric.size1 || ''} truncate`}>{metric.value1 ?? 'N/A'}</p>
                 {metric.value2 && (
                   <p className={`text-xs ${metric.color2 || 'text-gray-500'} ${metric.size2 || ''} truncate`}>{metric.value2}</p>
                 )}
              </div>
            ))}
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
                            contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '4px', fontSize: '12px', padding: '5px' }} 
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
                            contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '4px', fontSize: '12px', padding: '5px' }} 
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

   // --- Renderizado de la lista de traders --- 
  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-4">Cuentas de Copytrading</h1>
        
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar"
              className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg pl-4 pr-10 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          <div className="flex gap-4 flex-wrap items-center">
            <div className="text-gray-400 self-center whitespace-nowrap">Filtrar por</div>
            
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleFilter('perdidaMax')}>
              <div className={`w-4 h-4 border ${filters.perdidaMax ? 'bg-cyan-500 border-cyan-500' : 'border-[#444]'} rounded flex items-center justify-center transition-colors`}>
                {filters.perdidaMax && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                     <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-white text-sm select-none">Pérdida máx.</span>
            </div>
            
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleFilter('cantDias')}>
                 <div className={`w-4 h-4 border ${filters.cantDias ? 'bg-cyan-500 border-cyan-500' : 'border-[#444]'} rounded flex items-center justify-center transition-colors`}>
                   {/* Checkmark SVG si está activo */} 
                 </div>
                 <span className="text-white text-sm select-none">Días &gt; 90</span>
             </div>
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleFilter('riesgoAlto')}>
                 <div className={`w-4 h-4 border ${filters.riesgoAlto ? 'bg-cyan-500 border-cyan-500' : 'border-[#444]'} rounded flex items-center justify-center transition-colors`}>
                    {/* Checkmark SVG si está activo */} 
              </div>
                 <span className="text-white text-sm select-none">Riesgo alto</span>
            </div>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleFilter('premium')}>
                 <div className={`w-4 h-4 border ${filters.premium ? 'bg-cyan-500 border-cyan-500' : 'border-[#444]'} rounded flex items-center justify-center transition-colors`}>
                    {/* Checkmark SVG si está activo */} 
              </div>
                 <span className="text-white text-sm select-none">Premium</span>
            </div>
            
          </div>
        </div>
        
        {/* Lista de cuentas (Usa filteredCuentas) */} 
        <div className="space-y-3">
          {filteredCuentas.map((cuenta) => (
            <div key={cuenta.id} className="bg-[#1f1f1f] border border-[#333] rounded-xl hover:border-cyan-500 overflow-hidden transition-colors duration-200">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => handleTraderSelect(cuenta)}
              >
                <div className="flex items-center min-w-0 mr-4">
                  <div className="w-10 h-10 rounded-lg mr-3 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={cuenta.imagen} 
                      alt={cuenta.nombre} 
                      className="w-12 h-12 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%23333'/%3E%3Cpath d='M12 13c-3.3 0-6 2.7-6 6v1h12v-1c0-3.3-2.7-6-6-6z' fill='%23333'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{cuenta.nombre}</h3>
                    <p className={`text-sm ${parseFloat(cuenta.porcentaje) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {cuenta.porcentaje}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredCuentas.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No se encontraron resultados para tu búsqueda o filtros.
            </div>
          )}
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