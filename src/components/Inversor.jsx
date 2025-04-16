import React, { useState } from 'react';
import { ChevronDown, ArrowLeft, ChevronUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Inversor = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    perdidaMax: false,
    cantDias: false,
    riesgoAlto: false,
    premium: false
  });
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [activeTab, setActiveTab] = useState('statistics');
  const [showAllTrades, setShowAllTrades] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Semana Pasada');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  // Función para manejar cambios en los filtros
  const toggleFilter = (filter) => {
    setFilters({
      ...filters,
      [filter]: !filters[filter]
    });
  };

  // Datos de ejemplo para las cuentas
  const cuentas = [
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
      activoDias: 51
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
      rentabilidad: '+142.7%'
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
      rentabilidad: '+156.3%'
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
      rentabilidad: '+21.4%'
    },
    { 
      id: 5, 
      nombre: 'MarketWizard', 
      porcentaje: '+27.6%', 
      imagen: './Icono.svg',
      type: 'Verificado',
      since: 'Agosto 2023',
      profit: '+7.8%',
      riesgo: 'Medio-Alto',
      rentabilidad: '+132.5%'
    },
    { 
      id: 6, 
      nombre: 'SwingProTrader', 
      porcentaje: '-4.2%', 
      imagen: './Icono.svg',
      type: 'Nuevo',
      since: 'Diciembre 2023',
      profit: '+2.3%',
      riesgo: 'Medio',
      rentabilidad: '+45.8%'
    },
  ];

  // Función para filtrar las cuentas según los filtros seleccionados
  const filteredCuentas = cuentas.filter(cuenta => {
    let matchesSearch = cuenta.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Aplicar filtros adicionales
    if (filters.perdidaMax && !cuenta.porcentaje.startsWith('-')) return false;
    if (filters.cantDias && cuenta.since.includes('2024')) return false;
    if (filters.riesgoAlto && cuenta.riesgo !== 'Alto') return false;
    if (filters.premium && cuenta.type !== 'Premium') return false;
    
    return matchesSearch;
  });

  // Datos para el gráfico de retorno
  const performanceData = [
    { name: 'Ene', value: 0 },
    { name: 'Feb', value: 25000 },
    { name: 'Mar', value: 50000 },
    { name: 'Abr', value: 25000 },
    { name: 'May', value: 75000 },
    { name: 'Jun', value: 150000 },
    { name: 'Jul', value: 130000 },
    { name: 'Ago', value: 175000 },
    { name: 'Sep', value: 250000 },
    { name: 'Oct', value: 200000 },
    { name: 'Nov', value: 150000 },
    { name: 'Dic', value: 100000 },
  ];

  // Datos específicos por trader
  const traderPerformanceData = {
    1: performanceData,
    2: [
      { name: 'Ene', value: 10000 },
      { name: 'Feb', value: 30000 },
      { name: 'Mar', value: 45000 },
      { name: 'Abr', value: 35000 },
      { name: 'May', value: 70000 },
      { name: 'Jun', value: 120000 },
      { name: 'Jul', value: 140000 },
      { name: 'Ago', value: 160000 },
      { name: 'Sep', value: 200000 },
      { name: 'Oct', value: 180000 },
      { name: 'Nov', value: 170000 },
      { name: 'Dic', value: 160000 },
    ],
    // Para otros traders...
  };

  const getTraderPerformanceData = (traderId) => {
    return traderPerformanceData[traderId] || performanceData;
  };

  // Datos para las operaciones/pedidos
  const operaciones = [
    { id: 1, posicion: 'XAUUSD', entrada: '2,670,89', salida: '2,670,89', ganancia: '$-0.40', orden: '484247', fechaEntrada: '10/01/2025 20:20:00', fechaSalida: '10/01/2025 01:26:07' },
    { id: 2, posicion: 'Índice SPX500', entrada: '5,895,53', salida: '5,894,88', ganancia: '$0.85', orden: '484253', fechaEntrada: '10/01/2025 20:20:00', fechaSalida: '10/01/2025 01:26:26' },
    { id: 3, posicion: 'XAUUSD', entrada: '2,669,61', salida: '2,670,73', ganancia: '$-1.22', orden: '484271', fechaEntrada: '10/01/2025 21:00:00', fechaSalida: '10/01/2025 02:00:46' },
    { id: 4, posicion: 'XAUUSD', entrada: '2,869,70', salida: '2,870,53', ganancia: '$-4.65', orden: '499421', fechaEntrada: '10/01/2025 21:00:00', fechaSalida: '10/01/2025 02:00:46' },
  ];

  // Función para seleccionar un trader y mostrar su perfil
  const handleTraderSelect = (trader) => {
    setSelectedTrader(trader);
  };

  // Función para volver a la lista de traders
  const handleBackToList = () => {
    setSelectedTrader(null);
  };

  // Renderiza el perfil del trader seleccionado con el layout de dashboard
  if (selectedTrader) {
    // Si el trader seleccionado es Fxzio test (id: 1)
    return (
      <div className="min-h-screen bg-[#232323] p-4 rounded-3xl">
        {/* Header con información del trader */}
        <div className="bg-[#232323] rounded-t-xl relative mb-2">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center">
              <img 
                src={selectedTrader.imagen} 
                alt={selectedTrader.nombre} 
                className="w-12 h-12 mr-4"
                onError={(e) => {
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23333'/%3E%3C/svg%3E";
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-white">{selectedTrader.nombre}</h1>
                <p className="text-gray-300">Activo hace {selectedTrader.activoDias || 51} días</p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleBackToList}
                className="mr-4 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex gap-2">
                <button
                  className="text-white"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="rounded-md bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-6">
                  Copiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="col-span-1 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl p-4 border border-[#333]">
            <h2 className="text-xl text-white mb-4">Performance</h2>
            
            {/* Selector de periodo */}
            <div className="relative mb-4">
              <button 
                className="flex items-center justify-between w-full py-2 px-3 bg-[#383838] rounded-md text-white"
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              >
                <span>{selectedPeriod}</span>
                <ChevronDown size={18} />
              </button>
              {showPeriodMenu && (
                <div className="absolute z-10 mt-1 w-full bg-[#383838] rounded-md shadow-lg">
                  <button 
                    className="w-full text-left px-3 py-2 hover:bg-[#444] text-white"
                    onClick={() => {
                      setSelectedPeriod('Semana Pasada');
                      setShowPeriodMenu(false);
                    }}
                  >
                    Semana Pasada
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 hover:bg-[#444] text-white"
                    onClick={() => {
                      setSelectedPeriod('Este Mes');
                      setShowPeriodMenu(false);
                    }}
                  >
                    Este Mes
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 hover:bg-[#444] text-white"
                    onClick={() => {
                      setSelectedPeriod('Último Mes');
                      setShowPeriodMenu(false);
                    }}
                  >
                    Último Mes
                  </button>
                </div>
              )}
            </div>
            
            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="py-2">
                <p className="text-gray-400 text-sm">0%</p>
                <p className="text-white text-xs">Retorno de la inversión</p>
              </div>
              <div className="py-2">
                <p className="text-gray-400 text-sm">$0.00</p>
                <p className="text-white text-xs">Beneficio total</p>
              </div>
              <div className="py-2">
                <p className="text-gray-400 text-sm">0.00%</p>
                <p className="text-white text-xs">Caída máxima</p>
              </div>
              <div className="py-2">
                <p className="text-gray-400 text-sm">0</p>
                <p className="text-white text-xs">Seguidores Totales</p>
              </div>
              <div className="py-2">
                <p className="text-gray-400 text-sm">$0.00</p>
                <p className="text-white text-xs">PnL de los seguidores</p>
              </div>
              <div className="py-2">
                <p className="text-gray-400 text-sm">0.00%</p>
                <p className="text-white text-xs">Tasa de victorias</p>
              </div>
              <div className="py-2">
                <p className="text-gray-400 text-sm">$0.00</p>
                <p className="text-white text-xs">AUM</p>
              </div>
              <div className="py-2">
                <p className="text-gray-400 text-sm">00:00</p>
                <p className="text-white text-xs">Última hora de negociación</p>
              </div>
              <div className="py-2">
                <p className="text-gray-400 text-sm">1 / 7 días</p>
                <p className="text-white text-xs">Frecuencia de negociación</p>
              </div>
            </div>
          </div>

          {/* Gráfico de retorno */}
          <div className="col-span-2 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl p-4 border border-[#333]">
            <h2 className="text-xl text-white mb-2">Retorno de la inversión</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={getTraderPerformanceData(selectedTrader.id)}
                  margin={{ top: 20, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 250000]}
                    ticks={[0, 25000, 50000, 100000, 150000, 200000, 250000]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => value === 0 ? '0k' : `${value/1000}k`}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '4px' }}
                    formatter={(value) => [`$${value}`, 'Retorno']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0a84ff"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorReturn)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Estadísticas de frecuencia y operaciones */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl p-4 border border-[#333]">
            <h3 className="text-white mb-2">Frecuencia de Navegación</h3>
            <p className="text-2xl text-white">1 / 7 días</p>
          </div>
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl p-4 border border-[#333]">
            <div className="flex justify-between">
              <h3 className="text-white mb-2">Seguidores Actuales</h3>
              <span className="text-xs bg-green-900/40 text-green-500 px-2 py-1 rounded-md">+24.7%</span>
            </div>
            <p className="text-2xl text-white">0</p>
          </div>
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl p-4 border border-[#333]">
            <h3 className="text-white mb-2">Operaciones Rentables</h3>
            <p className="text-2xl text-white">0</p>
          </div>
          <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl p-4 border border-[#333]">
            <h3 className="text-white mb-2">Operaciones Perdedoras</h3>
            <p className="text-2xl text-white">0</p>
          </div>
        </div>

        {/* Tabla de pedidos/operaciones */}
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl p-4 border border-[#333]">
          <h2 className="text-xl text-white mb-4">Pedidos</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="text-left text-gray-400 border-b border-[#555]">
                <tr>
                  <th className="pb-3 font-medium">Posición</th>
                  <th className="pb-3 font-medium">Entrada</th>
                  <th className="pb-3 font-medium">Salida</th>
                  <th className="pb-3 font-medium">Ganancia</th>
                  <th className="pb-3 font-medium">Orden</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {operaciones.map((op) => (
                  <tr key={op.id} className="border-b border-[#555]">
                    <td className="py-3">{op.posicion}</td>
                    <td className="py-3">
                      {op.entrada}
                      <div className="text-xs text-gray-400">{op.fechaEntrada}</div>
                    </td>
                    <td className="py-3">
                      {op.salida}
                      <div className="text-xs text-gray-400">{op.fechaSalida}</div>
                    </td>
                    <td className={`py-3 ${op.ganancia.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                      {op.ganancia}
                    </td>
                    <td className="py-3">{op.orden}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

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
            
            <div className="flex items-center gap-2" onClick={() => toggleFilter('perdidaMax')}>
              <div className="w-4 h-4 border border-[#444] rounded flex items-center justify-center cursor-pointer">
                {filters.perdidaMax && (
                  <div className="w-2 h-2 bg-cyan-500 rounded-sm"></div>
                )}
              </div>
              <span className="text-white text-sm cursor-pointer">Pérdida máx.</span>
            </div>
            
            <div className="flex items-center gap-2" onClick={() => toggleFilter('cantDias')}>
              <div className="w-4 h-4 border border-[#444] rounded flex items-center justify-center cursor-pointer">
                {filters.cantDias && (
                  <div className="w-2 h-2 bg-cyan-500 rounded-sm"></div>
                )}
              </div>
              <span className="text-white text-sm cursor-pointer">Cant. de días</span>
            </div>
            
            <div className="flex items-center gap-2" onClick={() => toggleFilter('riesgoAlto')}>
              <div className="w-4 h-4 border border-[#444] rounded flex items-center justify-center cursor-pointer">
                {filters.riesgoAlto && (
                  <div className="w-2 h-2 bg-cyan-500 rounded-sm"></div>
                )}
              </div>
              <span className="text-white text-sm cursor-pointer">Riesgo alto</span>
            </div>
            
            <div className="flex items-center gap-2" onClick={() => toggleFilter('premium')}>
              <div className="w-4 h-4 border border-[#444] rounded flex items-center justify-center cursor-pointer">
                {filters.premium && (
                  <div className="w-2 h-2 bg-cyan-500 rounded-sm"></div>
                )}
              </div>
              <span className="text-white text-sm cursor-pointer">Premium</span>
            </div>
          </div>
        </div>
        
        {/* Lista de cuentas */}
        <div className="space-y-3">
          {filteredCuentas.map((cuenta) => (
            <div key={cuenta.id} className="bg-[#1f1f1f] border border-[#333] rounded-xl hover:border-cyan-500 overflow-hidden">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg mr-3 flex items-center justify-center">
                    <img 
                      src={cuenta.imagen} 
                      alt={cuenta.nombre} 
                      className="w-12 h-12"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%23333'/%3E%3Cpath d='M12 13c-3.3 0-6 2.7-6 6v1h12v-1c0-3.3-2.7-6-6-6z' fill='%23333'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{cuenta.nombre}</h3>
                    <p className={`text-sm ${cuenta.porcentaje.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>
                      {cuenta.porcentaje}
                    </p>
                  </div>
                </div>
                <button 
                  className="text-gray-400"
                  onClick={() => handleTraderSelect(cuenta)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          {filteredCuentas.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No se encontraron resultados para tu búsqueda
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inversor;