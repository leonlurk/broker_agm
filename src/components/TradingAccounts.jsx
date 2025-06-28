import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend, CartesianGrid, LabelList } from 'recharts';

const TradingAccounts = ({ setSelectedOption, setSelectedAccount }) => {
  const [activeTab, setActiveTab] = useState('Todas');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' o 'details'
  
  const allAccounts = {
    'Todas': [
      { 
        id: 1, 
        name: 'CUENTA 1', 
        idNumber: '3452',
        serverType: 'MT5',
        cuenta: '657237',
        status: 'Activa',
        statusColor: 'bg-green-800 bg-opacity-30 text-green-400'
      },
      { 
        id: 2, 
        name: 'CUENTA 2', 
        idNumber: '3452',
        serverType: 'MT5',
        cuenta: '657237',
        status: 'Perdida',
        statusColor: 'bg-red-800 bg-opacity-30 text-red-400'
      },
    ],
    'Cuentas Reales': [
      { 
        id: 1, 
        name: 'CUENTA 1', 
        idNumber: '3452',
        serverType: 'MT5',
        cuenta: '657237',
        status: 'Activa',
        statusColor: 'bg-green-800 bg-opacity-30 text-green-400'
      },
    ],
    'Cuentas Demo': [
      { 
        id: 2, 
        name: 'CUENTA 2', 
        idNumber: '3452',
        serverType: 'MT5',
        cuenta: '657237',
        status: 'Perdida',
        statusColor: 'bg-red-800 bg-opacity-30 text-red-400'
      },
    ],
    'Copy Trading': [],
    'Pamm': []
  };
  
  const accounts = allAccounts[activeTab] || [];
  
  const handleCreateAccount = () => {
    setSelectedOption && setSelectedOption("Desafio");
  };

  const handleViewDetails = (accountId) => {
    setSelectedAccountId(accountId);
    setViewMode('details');
    setSelectedAccount && setSelectedAccount(accountId);
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedAccountId(null);
  };
  
  // Función para color dinámico de barras
  const getBarColor = (value) => {
    const maxValue = 20; // El valor máximo en los datos es ~20%
    const minLightness = 25; // Lightness para el valor más bajo
    const maxLightness = 50; // Lightness para el valor más alto
    const lightness = minLightness + (value / maxValue) * (maxLightness - minLightness);
    return `hsl(191, 95%, ${lightness}%)`;
  };
  
  // Datos para el gráfico de balance
  const balanceData = [
    { name: 'Ene', value: 25000 },
    { name: 'Feb', value: 50000 },
    { name: 'Mar', value: 75000 },
    { name: 'Abr', value: 100000 },
    { name: 'May', value: 130000 },
    { name: 'Jun', value: 110000 },
    { name: 'Jul', value: 200000 },
    { name: 'Ago', value: 180000 },
    { name: 'Sep', value: 250000 },
  ];

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
    { name: 'NQM25', value: 71.43, color: '#0e7490' },
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
    { posicion: 'XAUUSD', entrada: '2.670,89', entradaFecha: '10/01/2025 20:20:00', salida: '2.670,89', salidaFecha: '10/01/2025 01:26:07', ganancia: -0.40, orden: '484247' },
    { posicion: 'Índice SPX500', entrada: '5.895,53', entradaFecha: '10/01/2025 20:20:00', salida: '5.894,88', salidaFecha: '10/01/2025 01:26:26', ganancia: 0.65, orden: '484253' },
    { posicion: 'XAUUSD', entrada: '2.669,61', entradaFecha: '10/01/2025 21:00:00', salida: '2.670,73', salidaFecha: '10/01/2025 02:00:46', ganancia: -1.22, orden: '484271' },
    { posicion: 'XAUUSD', entrada: '2.869,70', entradaFecha: '10/01/2025 21:00:00', salida: '2.870,53', salidaFecha: '10/01/2025 02:00:46', ganancia: -4.65, orden: '499421' },
  ];

  // VISTA GENERAL DE CUENTAS
  if (viewMode === 'overview') {
  return (
      <div className="flex flex-col p-4 text-white min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-6">Tus Cuentas</h1>
          
          {/* Create Account Button */}
          <button 
            onClick={handleCreateAccount}
            className="w-full py-3 px-4 bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center mb-6"
          >
            + Crear Cuenta
          </button>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['Todas', 'Cuentas Reales', 'Cuentas Demo', 'Copy Trading', 'Pamm'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-full text-sm focus:outline-none transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                    : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium mb-4">Tus Cuentas</h2>
          
          {accounts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No tienes cuentas en esta categoría</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div 
                key={account.id} 
                className="p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center">
                  {/* Chart Icon */}
                  <div className="w-12 h-12 bg-[#2d2d2d] rounded-lg flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  
                  {/* Account Info */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{account.name} (ID: {account.idNumber})</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Server Type: {account.serverType}</span>
                      <span>Cuenta: {account.cuenta}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Status */}
                  <span className={`px-3 py-1 rounded-full text-sm ${account.statusColor}`}>
                    {account.status}
                  </span>
                  
                  {/* Ver Detalles Button */}
                  <button 
                    onClick={() => handleViewDetails(account.id)}
                    className="px-4 py-2 bg-[#2d2d2d] text-white rounded-lg hover:bg-[#3d3d3d] transition border border-[#444]"
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // VISTA DETALLADA DE CUENTA
  return (
    <div className="flex flex-col p-4 text-white min-h-screen">
      {/* Back Button */}
      <div className="mb-4">
        <img 
          src="/Back.svg" 
          alt="Back" 
          onClick={handleBackToOverview}
          className="w-10 h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
        />
      </div>

      {/* Layout de 3 columnas según Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* COLUMNA CENTRAL - Tus Cuentas */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-3xl p-6 border-t border-l border-r border-cyan-500">
          <h1 className="text-2xl font-semibold mb-6">Tus Cuentas</h1>
          
          {/* Create Account Button */}
          <button 
            onClick={handleCreateAccount}
            className="w-full py-3 px-4 bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center mb-6"
          >
            + Crear Cuenta
          </button>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['Todas', 'Cuentas Reales', 'Cuentas Demo'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-full text-sm focus:outline-none transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-br from-[#0891b2] to-[#0c4a6e] text-white border border-cyan-500'
                    : 'bg-[#2d2d2d] text-gray-300 border border-[#333] hover:border-gray-500'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Account List */}
          <div className="space-y-3">
            {accounts.map((account) => (
              <button 
                key={account.id} 
                className={`p-4 w-full rounded-xl border transition-all text-left ${
                  selectedAccountId === account.id 
                    ? 'bg-[#2a2a2a] border-cyan-500' 
                    : 'bg-[#1a1a1a] border-[#333] hover:border-gray-500'
                }`}
                onClick={() => setSelectedAccountId(account.id)}
              >
                <div className="font-medium text-white">{account.name} (ID: {account.idNumber})</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* COLUMNA DERECHA - Detalles de Cuenta */}
        <div className="lg:col-span-7 space-y-6">
          {selectedAccountId ? (
            <>
              {/* Header Hola Santiago */}
              <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-3xl p-6 border border-[#333]">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold mr-4">
                    S
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Hola, Santiago</h2>
                    <p className="text-gray-400 text-sm">Aquí puedes ver los datos de esta cuenta</p>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-6 h-6 mr-2" />
                    <span className="text-gray-400">Cuenta {selectedAccountId} (ID: 3452)</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-6 h-6 mr-2" />
                    <span className="text-gray-400">Depósito inicial: $1.000</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-6 h-6 mr-2" />
                    <span className="text-gray-400">Cuenta activa hace: 1 mes</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-6 h-6 mr-2" />
                    <span className="text-gray-400">Leverage: 1500</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-6 h-6 mr-2" />
                    <span className="text-gray-400">Tipo de cuenta: Swipe</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-6 h-6 mr-2" />
                    <span className="text-gray-400">Started: 17 Jun 2025 (7 días)</span>
                  </div>
                  <div className="flex items-center">
                    <img src="/lightning_ring.png" alt="" className="w-6 h-6 mr-2" />
                    <span className="text-gray-400">Timezone: GMT +0</span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-[#1a1a1a] rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Detalles De La Cuenta</h3>
                    <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-xs">Activa</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm auto-rows-fr">
                    <div className="flex flex-col justify-between p-2 bg-[#0f0f0f] rounded-lg">
                      <span className="text-gray-400 text-xs mb-1">MT5 Server</span>
                      <div className="text-white font-medium">AGM-Server01</div>
                    </div>
                    <div className="flex flex-col justify-between p-2 bg-[#0f0f0f] rounded-lg">
                      <span className="text-gray-400 text-xs mb-1">Master pass.</span>
                      <div className="text-white font-medium">••••••••</div>
                    </div>
                    <div className="flex flex-col justify-between p-2 bg-[#0f0f0f] rounded-lg">
                      <span className="text-gray-400 text-xs mb-1">Account Number</span>
                      <div className="text-white font-medium">452777</div>
                    </div>
                    <div className="flex flex-col justify-between p-2 bg-[#0f0f0f] rounded-lg">
                      <span className="text-gray-400 text-xs mb-1">Investor Pass</span>
                      <div className="text-white font-medium">Set Password</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-3xl p-6 border border-[#333] flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <h3 className="text-lg mb-2">Selecciona una cuenta</h3>
                <p>Elige una cuenta de la lista para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* SECCIÓN PRINCIPAL - Balance y Métricas */}
      {selectedAccountId && (
        <div className="space-y-6">
          {/* Sección Balance + Métricas lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            
            {/* Balance Card - Lado izquierdo (2 columnas - menos ancho) */}
            <div className="lg:col-span-2 p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
              <h2 className="text-3xl font-bold mb-4">Balance</h2>
              <div className="flex items-center mb-6">
                <span className="text-4xl font-bold mr-3">$5,000.00</span>
                <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-sm">+24.7%</span>
              </div>
              
              <div className="w-full h-64">
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
                      tickFormatter={(value) => `${value/1000}k`}
                      axisLine={false} tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      width={30} 
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
            <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
              {/* Profit/Loss */}
              <div className="flex-1 p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-2">Profit/Loss</h3>
                  <div className="flex items-center mb-1">
                  <span className="text-3xl font-bold mr-2">$1,000.00</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-xs">+25.0%</span>
                  </div>
                  <p className="text-sm text-gray-400">Lun, 13 Enero</p>
                </div>

              {/* Drawdown */}
              <div className="flex-1 p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-2">Drawdown</h3>
                <div className="flex items-center mb-1">
                  <span className="text-3xl font-bold mr-2">$200.00</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-xs">+25.0%</span>
                </div>
                <p className="text-sm text-gray-400">Total • Diario</p>
                </div>

              {/* Días de Trading */}
              <div className="flex-1 p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-2">Días de Trading</h3>
                  <div className="text-3xl font-bold">5 Días</div>
              </div>
                </div>
              </div>
              
          {/* ===== CAPTURA 3: GRID MÉTRICAS 3x3 ===== */}
          
          {/* Grid de métricas KPIs con iconos del public */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Pérdida Promedio Por Operación */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
                  <div>
                <h3 className="text-gray-400 text-sm mb-1">Pérdida Promedio Por Operación</h3>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-red-400">$77.61</span>
                  <span className="bg-red-800 bg-opacity-30 text-red-400 px-1 py-0.5 rounded text-xs ml-2">-25.0%</span>
                </div>
              </div>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/PerdidaIcono.svg" alt="" className="" />
                  </div>
                  </div>

            {/* 2. Ganancia Promedio Por Operación */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Ganancia Promedio Por Operación</h3>
                <div className="flex items-center">
                  <span className="text-xl font-bold">$20.61</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-1 py-0.5 rounded text-xs ml-2">+25.0%</span>
                </div>
              </div>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/GananciaIcono.svg" alt="" className="" />
                </div>
              </div>
              
            {/* 3. Lotaje Promedio Por Operación */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
                  <div>
                <h3 className="text-gray-400 text-sm mb-1">Lotaje Promedio Por Operación</h3>
                <span className="text-xl font-bold">3.26</span>
                  </div>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/Group.svg" alt="" className="" />
                  </div>
                </div>

            {/* 4. Duración Promedio Por Operación */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
                  <div>
                <h3 className="text-gray-400 text-sm mb-1">Duración Promedio Por Operación</h3>
                <span className="text-xl font-bold">02:25:36</span>
                  </div>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/RelojIcono.svg" alt="" className="" />
                  </div>
            </div>

            {/* 5. Relación Riesgo Beneficio */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Relación Riesgo Beneficio</h3>
                <span className="text-xl font-bold">1:3</span>
              </div>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/RatioVictoria.svg" alt="" className="w-12 h-12" />
                </div>
              </div>
              
            {/* 6. Ratio De Ganancia */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Ratio De Ganancia</h3>
                <span className="text-xl font-bold">20%</span>
              </div>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/MonedaIcono.svg" alt="" className="w-12 h-12" />
              </div>
            </div>

            {/* 7. Depósitos Totales */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Depósitos Totales</h3>
                <span className="text-xl font-bold">$10,000.00</span>
              </div>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/hugeicons.svg" alt="" className="w-12 h-12" />
              </div>
            </div>

            {/* 8. Retiros Totales */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Retiros Totales</h3>
                <span className="text-xl font-bold">$12,000.00</span>
              </div>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/ph.svg" alt="" className="w-12 h-12" />
        </div>
      </div>
      
            {/* 9. PNL */}
            <div className="p-4 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">PNL</h3>
                <span className="text-xl font-bold">$5,000.00 = 5%</span>
              </div>
              <div className="bg-[#2d2d2d] p-4 rounded-full">
                <img src="/streamline.svg" alt="" className="w-12 h-12" />
              </div>
            </div>
          </div>

          {/* ===== CAPTURA 4: TABLA DE TRANSACCIONES ===== */}
          
          {/* Filtros superiores */}
          <div className="p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Tipo */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Tipo</label>
                <div className="relative">
                  <select className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-2 text-white appearance-none">
                    <option>Compra</option>
                    <option>Venta</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Desde */}
                  <div>
                <label className="block text-gray-400 text-sm mb-2">Desde</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value="24/06/2025"
                    className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-2 text-white pr-10"
                    readOnly
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  </div>
                </div>

              {/* Hasta */}
                  <div>
                <label className="block text-gray-400 text-sm mb-2">Hasta</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value="26/06/2025"
                    className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-2 text-white pr-10"
                    readOnly
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Transacciones */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#333]">
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Fecha De Apertura
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Fecha De Cierre
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Instrumento</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Tipo</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Lotaje</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Stop Loss</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Take Profit</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Precio De Apertura</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Precio De Cierre</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Pips</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">ID De Posición</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      fechaApertura: '12:00 20 Feb',
                      fechaCierre: '12:00 20 Feb',
                      tiempoApertura: '00:30:23',
                      tiempoCierre: '00:30:23',
                      instrumento: 'EURUSD',
                      bandera: '🇺🇸',
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
                      resultadoColor: 'text-green-400'
                    },
                    {
                      fechaApertura: '12:00 20 Feb',
                      fechaCierre: '12:00 20 Feb',
                      tiempoApertura: '00:30:23',
                      tiempoCierre: '00:30:23',
                      instrumento: 'EURUSD',
                      bandera: '🇪🇺',
                      tipo: 'Venta',
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
                      resultadoPct: '-19.5%',
                      resultadoColor: 'text-red-400'
                    },
                    {
                      fechaApertura: '12:00 20 Feb',
                      fechaCierre: '12:00 20 Feb',
                      tiempoApertura: '00:30:23',
                      tiempoCierre: '00:30:23',
                      instrumento: 'EURUSD',
                      bandera: '🇺🇸',
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
                      resultadoColor: 'text-green-400'
                    },
                    {
                      fechaApertura: '12:00 20 Feb',
                      fechaCierre: '12:00 20 Feb',
                      tiempoApertura: '00:30:23',
                      tiempoCierre: '00:30:23',
                      instrumento: 'EURUSD',
                      bandera: '🇪🇺',
                      tipo: 'Venta',
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
                      resultadoPct: '-19.5%',
                      resultadoColor: 'text-red-400'
                    },
                    {
                      fechaApertura: '12:00 20 Feb',
                      fechaCierre: '12:00 20 Feb',
                      tiempoApertura: '00:30:23',
                      tiempoCierre: '00:30:23',
                      instrumento: 'EURUSD',
                      bandera: '🇺🇸',
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
                      resultadoColor: 'text-green-400'
                    },
                    {
                      fechaApertura: '12:00 20 Feb',
                      fechaCierre: '12:00 20 Feb',
                      tiempoApertura: '00:30:23',
                      tiempoCierre: '00:30:23',
                      instrumento: 'EURUSD',
                      bandera: '🇪🇺',
                      tipo: 'Venta',
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
                      resultadoPct: '-19.5%',
                      resultadoColor: 'text-red-400'
                    }
                  ].map((transaction, index) => (
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
                          <span className="text-lg">{transaction.bandera}</span>
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
                        <div className={`font-medium ${transaction.resultadoColor}`}>
                          {transaction.resultado}
                          <span className={`text-xs px-1 rounded ml-1 ${
                            transaction.resultadoColor === 'text-green-400' 
                              ? 'bg-green-800 bg-opacity-30 text-green-400' 
                              : 'bg-red-800 bg-opacity-30 text-red-400'
                          }`}>
                            {transaction.resultadoPct} ↗
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Total */}
              <div className="mt-6 pt-4 border-t border-[#333] flex justify-between items-center">
                <span className="text-xl font-bold text-white">Total</span>
                <div className="text-xl font-bold text-green-400">
                  $1,250.24 
                  <span className="text-sm bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded ml-2">
                    +8.0% ↗
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== CAPTURA 5: BENEFICIO TOTAL ===== */}
          
          {/* Sección Beneficio Total con Tabs */}
          <div className="p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
            {/* Header con Tabs y Filtro */}
            <div className="flex justify-between items-center mb-6">
              {/* Tabs */}
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-transparent border border-cyan-400 text-cyan-400 rounded-full text-sm font-medium">
                  Beneficio Total
                </button>
                <button className="px-4 py-2 bg-transparent text-gray-400 rounded-full text-sm font-medium hover:text-white transition">
                  Balance
                </button>
                <button className="px-4 py-2 bg-transparent text-gray-400 rounded-full text-sm font-medium hover:text-white transition">
                  Retracción
                </button>
              </div>
              
              {/* Filtro Dropdown */}
              <div className="relative">
                <select className="bg-[#3a3a3a] border border-[#444] rounded-lg px-4 py-2 text-gray-400 text-sm appearance-none pr-8">
                  <option>Filtrar por</option>
                  <option>Último mes</option>
                  <option>Últimos 3 meses</option>
                  <option>Último año</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                </div>
              </div>
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold mb-6 text-white">Beneficio Total</h2>
            
            {/* Gráfico */}
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { date: '01/04', value: 0 },
                  { date: '03/04', value: 0 },
                  { date: '05/04', value: -2000 },
                  { date: '07/04', value: -5000 },
                  { date: '09/04', value: -8000 },
                  { date: '11/04', value: -10000 },
                  { date: '13/04', value: -2000 },
                  { date: '15/04', value: 8000 },
                  { date: '16/04', value: 18000 },
                  { date: '18/04', value: 18000 },
                  { date: '20/04', value: 17000 },
                  { date: '22/04', value: 2000 },
                  { date: '24/04', value: 2000 },
                  { date: '26/04', value: 5000 }
                ]}>
                  <defs>
                    <linearGradient id="colorBeneficio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    domain={[-30000, 20000]}
                    tickFormatter={(value) => {
                      if (value === 0) return '0K';
                      if (value > 0) return `${value/1000}K`;
                      return `${value/1000}K`;
                    }}
                    ticks={[-30000, -20000, -10000, 0, 10000, 20000]}
                  />
                  <CartesianGrid 
                    strokeDasharray="none" 
                    stroke="#333" 
                    horizontal={true} 
                    vertical={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#06b6d4' }}
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
                <div className="relative">
                  <select className="bg-[#3a3a3a] border border-[#444] rounded-lg px-4 py-2 text-gray-400 text-sm appearance-none pr-8">
                    <option>Filtrar por</option>
                    <option>Ganancia</option>
                    <option>Pérdida</option>
                    <option>Volumen</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Body con Leyenda y Gráfico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Leyenda */}
                <div className="space-y-4">
                  {instrumentosData.map((entry, index) => (
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
                        data={instrumentosData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(2)}%`}
                        outerRadius={100}
                        dataKey="value"
                        stroke="#2a2a2a"
                        strokeWidth={4}
                      >
                        {instrumentosData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color}/>
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ===== CAPTURA 7: RENDIMIENTO ===== */}
            <div className="p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-white">Rendimiento</h2>
                  <div className="flex gap-2">
                    <button className="px-4 py-1 bg-transparent border border-cyan-400 text-cyan-400 rounded-full text-sm font-medium">
                      2024
                    </button>
                    <button className="px-4 py-1 bg-transparent border border-gray-600 text-gray-400 rounded-full text-sm font-medium hover:border-gray-400 transition">
                      2025
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <select className="bg-[#3a3a3a] border border-[#444] rounded-lg px-4 py-2 text-gray-400 text-sm appearance-none pr-8">
                    <option>Filtrar por</option>
                    <option>Mensual</option>
                    <option>Trimestral</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          </div>
          </div>
          
              {/* Gráfico */}
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rendimientoData} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
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
                      tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 30]}
                    />
                    <Bar dataKey="value" barSize={35} radius={[4, 4, 0, 0]}>
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        formatter={(value) => `${value.toFixed(1)}%`}
                        style={{ fill: '#a0a0a0', fontSize: '11px' }} 
                      />
                      {rendimientoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </div>

            {/* ===== Historial de Operaciones ===== */}
            <div className="p-6 bg-gradient-to-br from-[#2a2a2a] to-[#2d2d2d] border border-[#333] rounded-xl">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Historial de Operaciones</h2>
                <div className="relative">
                  <select className="bg-[#3a3a3a] border border-[#444] rounded-lg px-4 py-2 text-gray-400 text-sm appearance-none pr-8">
                    <option>Filtrar por</option>
                    <option>Últimas 24h</option>
                    <option>Últimos 7 días</option>
                    <option>Último mes</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          </div>
        </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="p-2 text-base font-semibold text-gray-300">Posición</th>
                      <th className="p-2 text-base font-semibold text-gray-300">Entrada</th>
                      <th className="p-2 text-base font-semibold text-gray-300">Salida</th>
                      <th className="p-2 text-base font-semibold text-gray-300">Ganancia</th>
                      <th className="p-2 text-base font-semibold text-gray-300">Orden</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialData.map((item, index) => (
                      <tr key={index} className="border-b border-[#333]">
                        <td className="p-2 font-medium text-white">{item.posicion}</td>
                        <td className="p-2">
                          <div className="font-medium text-white">{item.entrada}</div>
                          <div className="text-xs text-gray-400">{item.entradaFecha}</div>
                        </td>
                        <td className="p-2">
                          <div className="font-medium text-white">{item.salida}</div>
                          <div className="text-xs text-gray-400">{item.salidaFecha}</div>
                        </td>
                        <td className={`p-2 font-medium ${item.ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${item.ganancia.toFixed(2)}
                        </td>
                        <td className="p-2 font-medium text-white">{item.orden}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-[#333] flex justify-end items-center">
                <div className="flex items-center gap-4 text-white">
                  <span className="text-lg font-semibold">Total</span>
                  <div className="text-lg font-semibold text-green-400">
                    $1,250.24 
                    <span className="text-sm bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded ml-2">
                      +8.0% ↗
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingAccounts;