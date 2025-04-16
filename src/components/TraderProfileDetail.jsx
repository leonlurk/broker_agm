import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TraderProfileDetail = ({ trader, onBack }) => {
  const [activeTab, setActiveTab] = useState('statistics');
  const [showAllTrades, setShowAllTrades] = useState(false);
  
  // Datos de ejemplo para los gráficos
  const performanceData = [
    { name: 'Jan', value: 8500 },
    { name: 'Feb', value: 12000 },
    { name: 'Mar', value: 10000 },
    { name: 'Apr', value: 15000 },
    { name: 'May', value: 13000 },
    { name: 'Jun', value: 18000 },
    { name: 'Jul', value: 22000 },
    { name: 'Aug', value: 19000 },
    { name: 'Sep', value: 25000 },
    { name: 'Oct', value: 32000 },
    { name: 'Nov', value: 28000 },
    { name: 'Dec', value: 34000 }
  ];
  
  // Datos de ejemplo para las operaciones - podría venir del trader en el futuro
  const trades = [
    { id: 1, symbol: 'EUR/USD', type: 'Compra', size: '0.12 lotes', entry: '1.0835', exit: '1.0892', profit: '+$85.50', date: '12 Abr 2025' },
    { id: 2, symbol: 'GBP/JPY', type: 'Venta', size: '0.25 lotes', entry: '191.420', exit: '190.850', profit: '+$107.50', date: '10 Abr 2025' },
    { id: 3, symbol: 'USD/CAD', type: 'Venta', size: '0.15 lotes', entry: '1.3642', exit: '1.3690', profit: '-$28.80', date: '8 Abr 2025' },
    { id: 4, symbol: 'XAU/USD', type: 'Compra', size: '0.10 lotes', entry: '2381.25', exit: '2395.60', profit: '+$143.50', date: '5 Abr 2025' },
    { id: 5, symbol: 'EUR/GBP', type: 'Compra', size: '0.18 lotes', entry: '0.8590', exit: '0.8640', profit: '+$67.50', date: '2 Abr 2025' },
    { id: 6, symbol: 'AUD/USD', type: 'Venta', size: '0.20 lotes', entry: '0.6720', exit: '0.6690', profit: '+$60.00', date: '1 Abr 2025' },
  ];
  
  // Datos para crear estadísticas específicas según el perfil del trader
  const getTraderStats = () => {
    // Si el trader es de tipo "Premium", retornamos estadísticas más altas
    if (trader.type === "Premium") {
      return {
        totalProfit: trader.rentabilidad || "+187.4%",
        winRate: "68%",
        operations: "324",
        maxDrawdown: "12.4%",
        drawdownDate: "Agosto 2024"
      };
    } else if (trader.type === "Verificado") {
      return {
        totalProfit: trader.rentabilidad || "+142.7%",
        winRate: "62%",
        operations: "256",
        maxDrawdown: "15.8%",
        drawdownDate: "Octubre 2024"
      };
    } else {
      return {
        totalProfit: trader.rentabilidad || "+86.2%",
        winRate: "58%",
        operations: "175",
        maxDrawdown: "10.2%",
        drawdownDate: "Noviembre 2024"
      };
    }
  };
  
  const traderStats = getTraderStats();
  
  const visibleTrades = showAllTrades ? trades : trades.slice(0, 3);
  
  // Determinar el color del tipo de trader
  const getTypeColor = () => {
    switch(trader.type) {
      case "Premium": return "bg-yellow-600";
      case "Verificado": return "bg-blue-600";
      case "Nuevo": return "bg-gray-600";
      default: return "bg-gray-600";
    }
  };
  
  // Determinar el color del riesgo
  const getRiskColor = () => {
    const riesgo = trader.riesgo || "Medio";
    switch(riesgo) {
      case "Alto": return "text-red-400";
      case "Medio-Alto": return "text-orange-400";
      case "Medio": return "text-yellow-400";
      case "Bajo": return "text-green-400";
      default: return "text-yellow-400";
    }
  };
  
  // Nombre a mostrar desde el objeto trader
  const traderName = trader.name || trader.nombre || "Trader";
  
  // Profit a mostrar (siempre con signo)
  const traderProfit = trader.profit || "+0%";
  
  return (
    <div className="p-4 md:p-6 bg-[#232323] text-white flex flex-col h-full">
      {/* Header con botón de regreso */}
      <div className="mb-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="flex items-center text-cyan-500 hover:text-cyan-400 transition"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Volver
        </button>
      </div>
      
      {/* Perfil del trader */}
      <div className="bg-[#191919] p-6 rounded-xl border border-[#333] mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          {/* Información principal */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">{traderName}</h1>
                <div className={`${getTypeColor()} text-xs px-2 py-1 rounded text-white w-fit mt-2`}>
                  {trader.type}
                </div>
                <p className="text-gray-400 text-sm mt-2">Operando desde: {trader.since}</p>

                <div className="bg-green-900/20 text-green-500 px-3 py-1 rounded-full text-sm font-medium mt-2">
                  {traderProfit} último mes
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-sm text-gray-400">Rentabilidad total</p>
                <p className="text-xl font-medium text-green-500">{traderStats.totalProfit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Operaciones</p>
                <p className="text-xl font-medium">{traderStats.operations}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Nivel de riesgo</p>
                <p className={`text-xl font-medium ${getRiskColor()}`}>{trader.riesgo || "Medio"}</p>
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex flex-col space-y-2 w-full md:w-auto">
            <button className="w-full md:w-40 px-4 py-3 bg-cyan-700 hover:bg-cyan-600 rounded-md text-white">
              Copiar ahora
            </button>
            <button className="w-full md:w-40 px-4 py-3 bg-[#333] hover:bg-[#444] rounded-md text-white">
              Ver certificado
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex mb-6 border-b border-[#333] overflow-x-auto">
        <button
          onClick={() => setActiveTab('statistics')}
          className={`py-3 px-6 whitespace-nowrap ${
            activeTab === 'statistics'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Estadísticas
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`py-3 px-6 whitespace-nowrap ${
            activeTab === 'operations'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Operaciones
        </button>
        <button
          onClick={() => setActiveTab('configuration')}
          className={`py-3 px-6 whitespace-nowrap ${
            activeTab === 'configuration'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Configuración
        </button>
      </div>
      
      {/* Contenido según tab seleccionado */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#232323] p-4 rounded-lg border border-[#333]">
              <p className="text-sm text-gray-400">Rentabilidad total</p>
              <p className="text-2xl font-medium text-green-500">{traderStats.totalProfit}</p>
              <p className="text-xs text-gray-400 mt-1">Desde {trader.since}</p>
            </div>
            <div className="bg-[#232323] p-4 rounded-lg border border-[#333]">
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="text-2xl font-medium">{traderStats.winRate}</p>
              <p className="text-xs text-gray-400 mt-1">{Math.round(parseInt(traderStats.operations) * parseInt(traderStats.winRate) / 100)} ganadas / {Math.round(parseInt(traderStats.operations) * (100 - parseInt(traderStats.winRate)) / 100)} perdidas</p>
            </div>
            <div className="bg-[#232323] p-4 rounded-lg border border-[#333]">
              <p className="text-sm text-gray-400">Drawdown máximo</p>
              <p className="text-2xl font-medium text-yellow-400">{traderStats.maxDrawdown}</p>
              <p className="text-xs text-gray-400 mt-1">{traderStats.drawdownDate}</p>
            </div>
          </div>
          
          {/* Gráfico de rendimiento */}
          <div className="bg-[#191919] p-4 rounded-xl border border-[#333]">
            <h3 className="text-lg font-medium mb-4">Rendimiento histórico</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={performanceData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
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
                    domain={['dataMin', 'dataMax']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    width={40}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '4px' }}
                    formatter={(value) => [`$${value}`, 'Balance']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0a84ff"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPerformance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Instrumentos preferidos */}
          <div className="bg-[#191919] p-4 rounded-xl border border-[#333]">
            <h3 className="text-lg font-medium mb-4">Instrumentos preferidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#232323] p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-2">
                    <img src="/eu.png" alt="EUR/USD" className="w-full h-full rounded-full" 
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23333'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <span>EUR/USD</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">Operaciones</span>
                  <span className="text-xs">94</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Efectividad</span>
                  <span className="text-xs text-green-500">72%</span>
                </div>
              </div>
              
              <div className="bg-[#232323] p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-2">
                    <img src="/gbp.png" alt="GBP/USD" className="w-full h-full rounded-full" 
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23333'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <span>GBP/USD</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">Operaciones</span>
                  <span className="text-xs">68</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Efectividad</span>
                  <span className="text-xs text-green-500">65%</span>
                </div>
              </div>
              
              <div className="bg-[#232323] p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-2">
                    <img src="/xau.png" alt="XAU/USD" className="w-full h-full rounded-full" 
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23333'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <span>XAU/USD</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">Operaciones</span>
                  <span className="text-xs">57</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Efectividad</span>
                  <span className="text-xs text-green-500">78%</span>
                </div>
              </div>
              
              <div className="bg-[#232323] p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-2">
                    <img src="/nq.png" alt="US100" className="w-full h-full rounded-full" 
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23333'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <span>US100</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">Operaciones</span>
                  <span className="text-xs">42</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Efectividad</span>
                  <span className="text-xs text-green-500">69%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'operations' && (
        <div className="space-y-6">
          {/* Tabla de operaciones */}
          <div className="bg-[#191919] p-4 rounded-xl border border-[#333]">
            <h3 className="text-lg font-medium mb-4">Operaciones recientes</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="text-left text-sm text-gray-400 border-b border-[#333]">
                  <tr>
                    <th className="pb-2">Símbolo</th>
                    <th className="pb-2">Tipo</th>
                    <th className="pb-2">Tamaño</th>
                    <th className="pb-2">Entrada/Salida</th>
                    <th className="pb-2">Beneficio</th>
                    <th className="pb-2">Fecha</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {visibleTrades.map((trade) => (
                    <tr key={trade.id} className="border-b border-[#333]">
                      <td className="py-3">{trade.symbol}</td>
                      <td className="py-3">{trade.type}</td>
                      <td className="py-3">{trade.size}</td>
                      <td className="py-3">{trade.entry} / {trade.exit}</td>
                      <td className={`py-3 ${trade.profit.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{trade.profit}</td>
                      <td className="py-3">{trade.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {trades.length > 3 && (
              <button 
                className="w-full mt-4 py-2 border border-[#333] rounded-md flex items-center justify-center hover:bg-[#232323] transition"
                onClick={() => setShowAllTrades(!showAllTrades)}
              >
                {showAllTrades ? (
                  <>
                    <span>Mostrar menos</span>
                    <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span>Ver todas ({trades.length})</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'configuration' && (
        <div className="space-y-6">
          {/* Configuración de copia */}
          <div className="bg-[#191919] p-4 rounded-xl border border-[#333]">
            <h3 className="text-lg font-medium mb-4">Configuración de copia</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-1">Seleccionar cuenta</p>
              <div className="relative">
                <select className="w-full p-3 bg-[#232323] border border-[#333] rounded-lg appearance-none text-white">
                  <option>Seleccionar cuenta de trading</option>
                  <option>Cuenta Standard - $5,000</option>
                  <option>Cuenta Gold - $10,000</option>
                  <option>Cuenta Platinum - $25,000</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-1">Monto a invertir</p>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full p-3 bg-[#232323] border border-[#333] rounded-lg text-white"
                  placeholder="1000"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">USD</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Mínimo $500, Máximo $50,000</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-1">Modo de copia</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 border border-cyan-500 bg-cyan-900/20 rounded-lg text-center cursor-pointer">
                  <span className="text-sm">Proporcional</span>
                  <p className="text-xs text-gray-400 mt-1">Copia según proporciones</p>
                </div>
                <div className="p-3 border border-[#333] rounded-lg text-center cursor-pointer hover:bg-[#232323]">
                  <span className="text-sm">Fijo</span>
                  <p className="text-xs text-gray-400 mt-1">Copia tamaños fijos</p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-1">Máximo drawdown permitido</p>
              <div className="relative">
                <input 
                  type="range" 
                  min="5" 
                  max="30" 
                  defaultValue="15"
                  className="w-full h-2 bg-[#333] rounded-lg"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5%</span>
                  <span>15%</span>
                  <span>30%</span>
                </div>
              </div>
              <p className="text-xs text-yellow-400 mt-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Se detendrá la copia automáticamente si alcanza este nivel
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-6">
              <button className="p-3 bg-[#333] hover:bg-[#444] rounded-lg text-center">
                Ver términos y condiciones
              </button>
              <button className="p-3 bg-cyan-700 hover:bg-cyan-600 rounded-lg text-center">
                Comenzar a copiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraderProfileDetail;