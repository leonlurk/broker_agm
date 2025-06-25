import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChevronLeft } from 'lucide-react';

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

  // VISTA GENERAL DE CUENTAS
  if (viewMode === 'overview') {
    return (
      <div className="flex flex-col p-4 bg-[#232323] text-white min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-6">Tus Cuentas</h1>
          
          {/* Create Account Button */}
          <button 
            onClick={handleCreateAccount}
            className="w-full py-3 px-4 bg-gradient-to-br from-[#0F7490] to-[#053a4b] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center mb-6"
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
                    ? 'bg-gradient-to-br from-[#0F7490] to-[#053a4b] text-white border border-cyan-500'
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
    <div className="flex flex-col p-4 bg-[#232323] text-white min-h-screen">
      {/* Back Button */}
      <button 
        onClick={handleBackToOverview}
        className="flex items-center text-cyan-400 hover:text-cyan-300 mb-4 transition"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Volver a Cuentas
      </button>

      {/* Layout de 3 columnas según Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* COLUMNA CENTRAL - Tus Cuentas */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#232323] to-[#1e1e1e] rounded-3xl p-6 border-t border-l border-r border-cyan-500">
          <h1 className="text-2xl font-semibold mb-6">Tus Cuentas</h1>
          
          {/* Create Account Button */}
          <button 
            onClick={handleCreateAccount}
            className="w-full py-3 px-4 bg-gradient-to-br from-[#0F7490] to-[#053a4b] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center mb-6"
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
                    ? 'bg-gradient-to-br from-[#0F7490] to-[#053a4b] text-white border border-cyan-500'
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
        <div className="lg:col-span-8 space-y-6">
          {selectedAccountId ? (
            <>
              {/* Header Hola Santiago */}
              <div className="bg-gradient-to-br from-[#232323] to-[#1e1e1e] rounded-3xl p-6 border-t border-l border-r border-cyan-500">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold mr-4">
                    S
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Hola, Santiago</h2>
                    <p className="text-gray-400 text-sm">Aquí puedes ver los datos de esta cuenta</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">Cuenta {selectedAccountId} (ID: 3452)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">💰 Depósito inicial: $1,000</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">⚡ Tipo de cuenta: Swipe</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">📅 Cuenta activa hace: 1 mes</span>
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
            <div className="bg-gradient-to-br from-[#232323] to-[#1e1e1e] rounded-3xl p-6 border border-[#333] flex items-center justify-center h-64">
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
            <div className="lg:col-span-2 p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl">
              <h2 className="text-2xl font-bold mb-4">Balance</h2>
              <div className="flex items-center mb-6">
                <span className="text-3xl font-bold mr-3">$5,000.00</span>
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
              <div className="flex-1 p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center">
                <h3 className="text-lg font-bold mb-2">Profit/Loss</h3>
                <div className="flex items-center mb-1">
                  <span className="text-2xl font-bold mr-2">$1,000.00</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-xs">+24.0%</span>
                </div>
                <p className="text-sm text-gray-400">Lun, 13 Enero</p>
              </div>

              {/* Drawdown */}
              <div className="flex-1 p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center">
                <h3 className="text-lg font-bold mb-2">Drawdown</h3>
                <div className="flex items-center mb-1">
                  <span className="text-2xl font-bold mr-2">$200.00</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-xs">+25.0%</span>
                </div>
                <p className="text-sm text-gray-400">Total • Diario</p>
              </div>

              {/* Días de Trading */}
              <div className="flex-1 p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex flex-col justify-center">
                <h3 className="text-lg font-bold mb-2">Días de Trading</h3>
                <div className="text-2xl font-bold">5 Días</div>
              </div>
            </div>
          </div>
          
          {/* Grid de métricas - 6 cards en layout 2x3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Pérdida Promedio Por Operación</h3>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-red-400">$77.61</span>
                  <span className="bg-red-800 bg-opacity-30 text-red-400 px-1 py-0.5 rounded text-xs ml-2">-12.5%</span>
                </div>
              </div>
              <div className="bg-[#2d2d2d] p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Ganancia Promedio Por Operación</h3>
                <div className="flex items-center">
                  <span className="text-xl font-bold">$20.61</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-1 py-0.5 rounded text-xs ml-2">+24.0%</span>
                </div>
              </div>
              <div className="bg-[#2d2d2d] p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Lotaje Promedio Por Operación</h3>
                <span className="text-xl font-bold">3.26</span>
              </div>
              <div className="bg-[#2d2d2d] p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Duración Promedio Por Operación</h3>
                <span className="text-xl font-bold">02:25:36</span>
              </div>
              <div className="bg-[#2d2d2d] p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Relación Riesgo Beneficio</h3>
                <span className="text-xl font-bold">1:3</span>
              </div>
              <div className="bg-[#2d2d2d] p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">Ratio De Ganancia</h3>
                <span className="text-xl font-bold">20%</span>
              </div>
              <div className="bg-[#2d2d2d] p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Tabla de Transacciones */}
          <div className="p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#444]">
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Fecha De Apertura</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Instrumento</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Precio De Apertura</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Stop Loss</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Take Profit</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">ID De Posición</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Tipo</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Lotaje</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Fecha De Cierre</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Precio De Cierre</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { fechaApertura: '12:00 20-Feb', instrumento: 'EUR/USD', precioApertura: '$290.32', stopLoss: '$95.00', takeProfit: '$110.00', idPosicion: '41528236', tipo: 'Compra', lotaje: '1', fechaCierre: '12:00 20-Feb', precioCierre: '$285.58', resultado: '+$195.58', color: 'text-green-400' },
                    { fechaApertura: '12:00 20-Feb', instrumento: 'EUR/USD', precioApertura: '$290.32', stopLoss: '$95.00', takeProfit: '$110.00', idPosicion: '41528236', tipo: 'Venta', lotaje: '1', fechaCierre: '12:00 20-Feb', precioCierre: '$285.58', resultado: '+$195.58', color: 'text-red-400' },
                    { fechaApertura: '12:00 20-Feb', instrumento: 'EUR/USD', precioApertura: '$290.32', stopLoss: '$95.00', takeProfit: '$110.00', idPosicion: '41528236', tipo: 'Compra', lotaje: '1', fechaCierre: '12:00 20-Feb', precioCierre: '$285.58', resultado: '+$195.58', color: 'text-green-400' },
                    { fechaApertura: '12:00 20-Feb', instrumento: 'EUR/USD', precioApertura: '$290.32', stopLoss: '$95.00', takeProfit: '$110.00', idPosicion: '41528236', tipo: 'Venta', lotaje: '1', fechaCierre: '12:00 20-Feb', precioCierre: '$285.58', resultado: '+$195.58', color: 'text-red-400' },
                    { fechaApertura: '12:00 20-Feb', instrumento: 'EUR/USD', precioApertura: '$290.32', stopLoss: '$95.00', takeProfit: '$110.00', idPosicion: '41528236', tipo: 'Compra', lotaje: '1', fechaCierre: '12:00 20-Feb', precioCierre: '$285.58', resultado: '+$195.58', color: 'text-green-400' },
                    { fechaApertura: '12:00 20-Feb', instrumento: 'EUR/USD', precioApertura: '$290.32', stopLoss: '$95.00', takeProfit: '$110.00', idPosicion: '41528236', tipo: 'Venta', lotaje: '1', fechaCierre: '12:00 20-Feb', precioCierre: '$285.58', resultado: '+$195.58', color: 'text-red-400' },
                  ].map((transaction, index) => (
                    <tr key={index} className="border-b border-[#333] hover:bg-[#2a2a2a] transition-colors">
                      <td className="py-3 px-2 text-white text-xs">{transaction.fechaApertura}</td>
                      <td className="py-3 px-2 text-white font-medium">{transaction.instrumento}</td>
                      <td className="py-3 px-2 text-gray-300">{transaction.precioApertura}</td>
                      <td className="py-3 px-2 text-gray-300">{transaction.stopLoss}</td>
                      <td className="py-3 px-2 text-gray-300">{transaction.takeProfit}</td>
                      <td className="py-3 px-2 text-gray-300">{transaction.idPosicion}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.tipo === 'Compra' ? 'bg-blue-800 bg-opacity-30 text-blue-400' : 'bg-red-800 bg-opacity-30 text-red-400'
                        }`}>
                          {transaction.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-300">{transaction.lotaje}</td>
                      <td className="py-3 px-2 text-white text-xs">{transaction.fechaCierre}</td>
                      <td className="py-3 px-2 text-gray-300">{transaction.precioCierre}</td>
                      <td className={`py-3 px-2 font-medium ${transaction.color}`}>{transaction.resultado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Total */}
              <div className="mt-4 pt-4 border-t border-[#444] flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold text-green-400">$1,250.24 <span className="text-sm">+8.0%</span></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingAccounts; 