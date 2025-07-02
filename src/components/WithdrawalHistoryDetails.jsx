import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Lock, Calendar, ChevronDown, ArrowUpRight, ArrowDownRight, Filter, TrendingUp, TrendingDown } from 'lucide-react';

// Mock Data based on screenshots
const userDetails = {
  name: 'Nombre Trader',
  avatar: '/Foto.svg',
  commissions: {
    totalCollected: '100,00 USD',
    totalLotsCollected: 10,
    toBeCollected: '75,00 USD',
    toBeCollectedLots: 10,
  },
  tier: {
    current: 1,
    next: 2,
    progress: 30,
  },
  stats: [
    { label: 'Número de Cuenta', value: '657237' },
    { label: 'Tiempo Activo', value: '51 Días' },
    { label: 'Rentabilidad Total', value: '8.91%', subValue: '6,298.99 USD' },
    { label: 'Operaciones', value: '7' },
    { label: 'Win Rate', value: '6', subValue: '(85.71%)', description: 'Operaciones Rentables' },
    { label: 'Retracción Máxima', value: '-48.40%', isNegative: true },
    { label: 'Promedio de Ganancia', value: '$20.000 / 5%' },
    { label: 'Beneficio', value: '1,915.17 USD', subValue: '-124.75 USD', subValueLabel: 'Menor', valueLabel: 'Mayor' },
  ],
  operations: [
    { id: 1, openTime: '12:00', openDate: '20 Feb', closeTime: '12:00', closeDate: '20 Feb', instrument: 'EURUSD', type: 'Compra', lots: 1, sl: '95,00', tp: '110,00', openPrice: '290,32', closePrice: '285,58', pips: 263.5, positionId: '41528296', result: '+195,58', resultPercent: '+19.5%', isProfit: true },
    { id: 2, openTime: '12:00', openDate: '20 Feb', closeTime: '12:00', closeDate: '20 Feb', instrument: 'EURUSD', type: 'Venta', lots: 1, sl: '95,00', tp: '110,00', openPrice: '290,32', closePrice: '285,58', pips: 263.5, positionId: '41528296', result: '+195,58', resultPercent: '-19.5%', isProfit: false },
     // ... more mock operations
  ],
  withdrawals: [
    { id: 1, startDate: '25/04/2025', endDate: '25/04/2025', lots: '10 Lotes', amount: '$50,00,00 USD', status: 'Cobrado', orderNumber: '123456' },
    { id: 2, startDate: '25/04/2025', endDate: '25/04/2025', lots: '10 Lotes', amount: '$50,00,00 USD', status: 'Cobrado', orderNumber: '123456' },
    { id: 3, startDate: '25/04/2025', endDate: '25/04/2025', lots: '10 Lotes', amount: '$50,00,00 USD', status: 'Cobrado', orderNumber: '123456' },
  ]
};

// Fill operations for visual representation
if (userDetails.operations.length < 6) {
    for (let i = userDetails.operations.length; i < 6; i++) {
        userDetails.operations.push({ ...userDetails.operations[i % 2], id: i + 1, isProfit: i % 2 === 0 });
    }
}


const WithdrawalHistoryDetails = ({ user, onBack }) => {
  const topRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es dispositivo móvil
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

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  // In a real app, you'd use the `user` prop. For now, we use mock data.
  const data = userDetails;

  // Renderizar card móvil para operaciones
  const renderMobileOperationCard = (operation) => (
    <div key={operation.id} className="bg-[#202020] rounded-xl p-4 space-y-3">
      {/* Header con instrumento y resultado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/Foto.svg" className="w-6 h-6" alt="Instrument" />
          <div>
            <div className="font-semibold">{operation.instrument}</div>
            <div className="text-sm text-gray-400">{operation.type}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
          operation.isProfit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <span className="font-semibold">{operation.result}</span>
          <span className="text-sm">{operation.resultPercent}</span>
          {operation.isProfit ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-400">Apertura</div>
          <div>{operation.openTime} {operation.openDate}</div>
        </div>
        <div>
          <div className="text-gray-400">Cierre</div>
          <div>{operation.closeTime} {operation.closeDate}</div>
        </div>
      </div>

      {/* Precios y datos */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-400">Lotes</div>
          <div className="font-semibold">{operation.lots}</div>
        </div>
        <div>
          <div className="text-gray-400">Pips</div>
          <div className="font-semibold">{operation.pips}</div>
        </div>
        <div>
          <div className="text-gray-400">Precio Apertura</div>
          <div>${operation.openPrice}</div>
        </div>
        <div>
          <div className="text-gray-400">Precio Cierre</div>
          <div>${operation.closePrice}</div>
        </div>
      </div>

      {/* SL/TP */}
      <div className="flex space-x-3 text-sm">
        <div className="flex-1">
          <div className="text-gray-400 text-xs">Stop Loss</div>
          <div className="bg-gray-600/50 text-center p-2 rounded">{operation.sl}</div>
        </div>
        <div className="flex-1">
          <div className="text-gray-400 text-xs">Take Profit</div>
          <div className="bg-gray-600/50 text-center p-2 rounded">{operation.tp}</div>
        </div>
      </div>

      {/* ID Posición */}
      <div className="pt-2 border-t border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">ID Posición</span>
          <span className="font-mono">{operation.positionId}</span>
        </div>
      </div>
    </div>
  );

  // Renderizar card móvil para retiros
  const renderMobileWithdrawalCard = (withdrawal) => (
    <div key={withdrawal.id} className="bg-[#202020] rounded-xl p-4 space-y-3">
      {/* Header con estado */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Orden #{withdrawal.orderNumber}</div>
        <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold">
          {withdrawal.status}
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-400">Fecha Inicio</div>
          <div>{withdrawal.startDate}</div>
        </div>
        <div>
          <div className="text-gray-400">Fecha Fin</div>
          <div>{withdrawal.endDate}</div>
        </div>
      </div>

      {/* Montos */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-400">Lotes</div>
          <div className="font-semibold">{withdrawal.lots}</div>
        </div>
        <div>
          <div className="text-gray-400">Comisión</div>
          <div className="font-semibold text-cyan-400">{withdrawal.amount}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={topRef} className="flex flex-col min-h-screen bg-[#232323] text-white p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="mb-2 md:mb-4">
        <img 
          src="/Back.svg" 
          alt="Back" 
          onClick={onBack}
          className="w-8 h-8 md:w-10 md:h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
        />
      </div>
      <h1 className="text-xl md:text-2xl font-bold -mt-2 md:-mt-4">Historial de Retiros</h1>

      {/* User Info & Commissions */}
      <div className="p-4 md:p-6 bg-[#2d2d2d] rounded-xl space-y-4 md:space-y-6">
        <div className="flex items-center space-x-3 md:space-x-4">
          <img src={data.avatar} alt={data.name} className="w-10 h-10 md:w-12 md:h-12" />
          <h1 className="text-lg md:text-xl font-semibold">{data.name}</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Comisiones Totales */}
          <div className="p-4 bg-[#202020] rounded-lg">
            <h3 className="font-bold text-gray-300 mb-2 text-sm md:text-base">Comisiones Totales Cobradas</h3>
            <p className="text-xl md:text-2xl font-semibold">{data.commissions.totalCollected}</p>
            <p className="text-gray-400 text-sm">{data.commissions.totalLotsCollected} Lotes</p>
          </div>
          
          {/* Card Comisiones a Cobrar */}
          <div className="p-4 bg-[#202020] rounded-lg">
            <h3 className="font-bold text-gray-300 mb-2 text-sm md:text-base">Comisiones A Cobrar</h3>
            <p className="text-xl md:text-2xl font-semibold">{data.commissions.toBeCollected}</p>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <p className="text-gray-400 text-sm">{data.commissions.toBeCollectedLots} Lotes</p>
              <button className="border border-cyan-500 text-cyan-500 rounded-lg px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold hover:bg-cyan-500 hover:text-white transition-colors">
                Solicitar Comisión
              </button>
            </div>
          </div>
        </div>
        
        {/* Tier Progress */}
        <div className="p-4 bg-[#202020] rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-300 text-sm md:text-base">Tier {data.tier.current}</span>
                <div className="flex items-center space-x-1 text-gray-400 text-sm">
                    <span>Tier {data.tier.next}</span>
                    <Lock size={14} />
                </div>
            </div>
            <div className="relative w-full bg-gray-700 rounded-full h-3 md:h-4">
                <div className="bg-cyan-500 h-3 md:h-4 rounded-full" style={{ width: `${data.tier.progress}%` }}></div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{data.tier.progress}%</span>
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {data.stats.map((stat, index) => (
          <div key={index} className="p-3 md:p-4 bg-[#2d2d2d] rounded-xl">
            <h4 className="text-gray-400 text-xs md:text-sm mb-1">{stat.label}</h4>
            {stat.description && <p className="text-xs text-gray-500">{stat.description}</p>}
            <p className={`text-lg md:text-3xl font-bold ${stat.isNegative ? 'text-red-500' : 'text-white'}`}>{stat.value}</p>
            {stat.subValue && !stat.valueLabel && <p className="text-xs md:text-sm text-gray-300">{stat.subValue}</p>}
            {stat.valueLabel && (
                <div className="text-xs md:text-sm space-y-1 mt-2">
                    <div className="flex justify-between"><span>{stat.valueLabel}</span><span>{stat.value}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">{stat.subValueLabel}</span><span className="text-red-500">{stat.subValue}</span></div>
                </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Operations History */}
      <div className="p-4 md:p-6 bg-[#2d2d2d] rounded-xl space-y-4">
        <h2 className="text-lg md:text-xl font-semibold">Historial de Operaciones</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                <div className="flex items-center bg-[#202020] rounded-lg p-2">
                    <input type="text" value="Compra" className="bg-transparent w-full focus:outline-none text-sm" readOnly />
                    <ChevronDown size={16} />
                </div>
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Desde</label>
                <div className="flex items-center bg-[#202020] rounded-lg p-2">
                    <input type="text" value="24/06/2025" className="bg-transparent w-full focus:outline-none text-sm" readOnly />
                    <Calendar size={16} />
                </div>
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Hasta</label>
                <div className="flex items-center bg-[#202020] rounded-lg p-2">
                    <input type="text" value="26/06/2025" className="bg-transparent w-full focus:outline-none text-sm" readOnly />
                    <Calendar size={16} />
                </div>
            </div>
        </div>
        
        {/* Desktop Table */}
        {!isMobile && (
          <div className="overflow-x-auto">
              <div className="min-w-full text-xs whitespace-nowrap">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 text-gray-400 py-2">
                      <div className="col-span-2">Fecha</div>
                      <div>Instrumento</div>
                      <div>Tipo</div>
                      <div>Lotaje</div>
                      <div>Stop Loss</div>
                      <div>Take Profit</div>
                      <div>Precio Apertura</div>
                      <div>Precio Cierre</div>
                      <div>Pips</div>
                      <div>ID Posición</div>
                      <div className="col-span-1 text-right">Resultado</div>
                  </div>
                  {/* Body */}
                  <div className="space-y-2">
                  {data.operations.map(op => (
                      <div key={op.id} className="grid grid-cols-12 gap-4 items-center bg-[#202020] p-2 rounded-md">
                          <div className="col-span-2">
                              <div>{op.openTime} <span className="text-gray-400">{op.openDate}</span></div>
                              <div className="text-gray-400">{op.closeTime} <span className="text-gray-400">{op.closeDate}</span></div>
                          </div>
                          <div className="flex items-center space-x-2">
                              <img src="/Foto.svg" className="w-5 h-5" />
                              <span>{op.instrument}</span>
                          </div>
                          <div>{op.type}</div>
                          <div>{op.lots}</div>
                          <div className="bg-gray-600/50 text-center p-1 rounded">{op.sl}</div>
                          <div className="bg-gray-600/50 text-center p-1 rounded">{op.tp}</div>
                          <div>${op.openPrice}</div>
                          <div>${op.closePrice}</div>
                          <div>{op.pips}</div>
                          <div>{op.positionId}</div>
                          <div className={`col-span-1 flex items-center justify-end gap-1 p-1 rounded ${op.isProfit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              <span>{op.result}</span>
                              <span>{op.resultPercent}</span>
                              {op.isProfit ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                          </div>
                      </div>
                  ))}
                  </div>
                  {/* Footer */}
                  <div className="flex justify-end items-center mt-4 p-2">
                      <span className="text-gray-400 mr-4">Total</span>
                      <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">$1.250,24</span>
                          <div className="flex items-center gap-1 p-1 rounded bg-green-500/20 text-green-400">
                             <span>+8.0%</span>
                             <ArrowUpRight size={14}/>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        )}

        {/* Mobile Cards */}
        {isMobile && (
          <div className="space-y-3">
            {data.operations.map(operation => renderMobileOperationCard(operation))}
            
            {/* Total móvil */}
            <div className="bg-[#202020] rounded-xl p-4 border-2 border-cyan-500/30">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Total General</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">$1.250,24</span>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400">
                     <span className="font-semibold">+8.0%</span>
                     <TrendingUp size={14}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      <div className="p-4 md:p-6 bg-[#2d2d2d] rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-lg md:text-2xl font-semibold">Historial de Retiros</h2>
          <div className="flex items-center bg-[#202020] rounded-lg p-2 min-w-[150px]">
              <Filter size={16} className="mr-2 text-gray-400" />
              <input type="text" value="Filtrar por" className="bg-transparent w-full focus:outline-none text-sm" readOnly />
              <ChevronDown size={16} />
          </div>
        </div>
        
        {/* Desktop Table */}
        {!isMobile && (
          <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                  <thead>
                      <tr className="border-b border-gray-700">
                          <th className="py-2">Fecha de Comienzo</th>
                          <th className="py-2">Fecha de Finalización</th>
                          <th className="py-2">Comisiones Por Lote</th>
                          <th className="py-2">Comisiones En USD</th>
                          <th className="py-2">Estado De La Orden</th>
                          <th className="py-2">Número De Orden</th>
                      </tr>
                  </thead>
                  <tbody>
                      {data.withdrawals.map(w => (
                          <tr key={w.id} className="border-b border-gray-700/50">
                              <td className="py-3">{w.startDate}</td>
                              <td className="py-3">{w.endDate}</td>
                              <td className="py-3">{w.lots}</td>
                              <td className="py-3">{w.amount}</td>
                              <td className="py-3">{w.status}</td>
                              <td className="py-3">{w.orderNumber}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
        )}

        {/* Mobile Cards */}
        {isMobile && (
          <div className="space-y-3">
            {data.withdrawals.map(withdrawal => renderMobileWithdrawalCard(withdrawal))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalHistoryDetails;
