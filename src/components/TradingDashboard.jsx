import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const TradingDashboard = ({ accountId, onBack, previousSection }) => {
  // Datos para el gráfico de balance
  const balanceData = [
    { name: 'Ene', value: 50000 },
    { name: 'Feb', value: 80000 },
    { name: 'Mar', value: 30000 },
    { name: 'Abr', value: 25000 },
    { name: 'May', value: 130000 },
    { name: 'Jun', value: 110000 },
    { name: 'Jul', value: 200000 },
    { name: 'Ago', value: 180000 },
    { name: 'Sep', value: 220000 },
  ];

  const getBackText = () => {
    if (previousSection === "Cuentas") {
      return "Volver a cuentas";
    } else if (previousSection === "Dashboard") {
      return "Volver a inicio";
    } else {
      return "Volver"; // Fallback
    }
  };

  // Datos para la tabla de operaciones
  const operaciones = Array(9).fill().map(() => ({
    id: `41528296`,
    simbolo: 'USD',
    tipo: 'Comprar',
    volumen: 1,
    precio: '245,58',
    precioFinal: '285,58',
    fecha: '20 Feb',
    hora: '00:30:23'
  }));

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-white min-h-screen flex flex-col border border-[#333] rounded-3xl">
      {/* Botón de regreso */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center text-cyan-500 hover:text-cyan-400 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {getBackText()}
        </button>
      </div>
      
      {/* Header con saludo y detalles */}
      <div className="p-4 md:p-6 rounded-2xl relative bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] mb-4 md:mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center mb-3">
              <div className="w-16 h-16 bg-[#333] rounded-full flex items-center justify-center text-2xl mr-4">
                <img src="/IconoPerfil.png" alt="Avatar" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold">Hola, Isaac</h1>
                <p className="text-sm md:text-base text-gray-400">
                  Cuenta #{657230 + accountId} - Challenge de 100k
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center">
                <div className="mr-3">
                  <img src="/lightning_ring.png" alt="Lightning" className="w-6 h-6" onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23333'/%3E%3Cpath d='M12 6L9 13H12V18L15 11H12V6Z' fill='white'/%3E%3C/svg%3E";
                  }} />
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">Balance Inicial:</span>
                  <span className="font-medium">$100.000</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="mr-3">
                  <img src="/lightning_ring.png" alt="Lightning" className="w-6 h-6" onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23333'/%3E%3Cpath d='M12 6L9 13H12V18L15 11H12V6Z' fill='white'/%3E%3C/svg%3E";
                  }} />
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">Tipo de plan:</span>
                  <span className="font-medium">100k Challenge</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="mr-3">
                  <img src="/lightning_ring.png" alt="Lightning" className="w-6 h-6" onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23333'/%3E%3Cpath d='M12 6L9 13H12V18L15 11H12V6Z' fill='white'/%3E%3C/svg%3E";
                  }} />
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">Tipo de cuenta:</span>
                  <span className="font-medium">Swipe</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-teal-800 rounded-full py-1 px-4 text-white">
            Activa
          </div>
        </div>        
      </div>

      {/* Sección de balance y métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#434242] border border-[#333] rounded-xl">
          <h2 className="text-xl md:text-3xl font-bold mb-4">Balance</h2>
          <div className="flex items-center mb-6">
            <span className="text-2xl md:text-4xl font-bold mr-3">$5.000,00</span>
            <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-sm">+24.7%</span>
          </div>
          
          <div className="w-full aspect-square max-h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={balanceData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
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
                  domain={['0', 'dataMax + 50000']}
                  ticks={[0, 50000, 100000, 150000, 200000, 250000]} 
                  tickFormatter={(value) => value === 0 ? '0k' : `${value/1000}k`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  width={40}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl">
            <h2 className="text-xl font-bold mb-2">Profit/Loss</h2>
            <div className="flex items-center mb-1">
              <span className="text-2xl font-bold mr-3">$1.000,00</span>
              <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-sm">+21.7%</span>
            </div>
            <p className="text-sm text-gray-400">Lun, 13 Enero</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl">
            <h2 className="text-xl font-bold mb-2">Drawdown</h2>
            <div className="text-2xl font-bold">25%</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl">
            <h2 className="text-xl font-bold mb-2">Días de Trading</h2>
            <div className="text-2xl font-bold">5 Días</div>
          </div>
        </div>
      </div>

      {/* Sección de métricas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Pérdida promedio</h3>
            <span className="text-xl md:text-2xl font-bold">$77,61</span>
          </div>
          <div className="bg-[#2d2d2d] p-2 rounded-full">
            <img src="/loss.png" alt="Avatar" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Ganancia promedio</h3>
            <span className="text-xl md:text-2xl font-bold">$20,61</span>
          </div>
          <div className="bg-[#2d2d2d] p-2 rounded-full">
            <img src="/gain.png" alt="Avatar" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Ratio de victorias</h3>
            <span className="text-xl md:text-2xl font-bold">$20,61</span>
          </div>
          <div className="bg-[#2d2d2d] p-2 rounded-full">
            <img src="/victory.png" alt="Avatar" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Lotes</h3>
            <span className="text-xl md:text-2xl font-bold">3.26</span>
          </div>
          <div className="bg-[#2d2d2d] p-2 rounded-full">
            <img src="/graph.png" alt="Avatar" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Duración promedio del trading</h3>
            <span className="text-xl md:text-2xl font-bold">02:25:36</span>
          </div>
          <div className="bg-[#2d2d2d] p-2 rounded-full">
            <img src="/clock.png" alt="Avatar" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Factor de beneficio</h3>
            <span className="text-xl md:text-2xl font-bold">$20,61</span>
          </div>
          <div className="bg-[#2d2d2d] p-2 rounded-full">
            <img src="/coins.png" alt="Avatar" />
          </div>
        </div>
      </div>

      {/* Sección de Objetivos */}
      <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl mb-6">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Objetivos</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Límite diario de pérdidas</h3>
              <span className="bg-yellow-800 bg-opacity-30 text-yellow-400 px-2 py-1 rounded text-xs">En Proceso</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Límite máximo de pérdida</span>
              <span>$245.36</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Pérdida permitida hoy</span>
              <span>$4,661.81</span>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Límite de pérdida global</h3>
              <span className="bg-red-800 bg-opacity-30 text-red-400 px-2 py-1 rounded text-xs">Perdido</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Límite máximo de pérdida</span>
              <span>$245.36</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Pérdida máxima permitida</span>
              <span>$4,661.81</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Días mínimos de negociación</h3>
              <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-xs">Superado</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Mínimo</span>
              <span>5 Días</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Resultado actual</span>
              <span>7 Días</span>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Objetivo de ganancias</h3>
              <span className="bg-yellow-800 bg-opacity-30 text-yellow-400 px-2 py-1 rounded text-xs">En Proceso</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Mínimo</span>
              <span>$8,000.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Resultado actual</span>
              <span>$843.10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de operaciones */}
      <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl mb-6 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="py-2 px-4 font-medium">Abierta</th>
              <th className="py-2 px-4 font-medium">Símbolo</th>
              <th className="py-2 px-4 font-medium">ID de posicion</th>
              <th className="py-2 px-4 font-medium">Tipo</th>
              <th className="py-2 px-4 font-medium">Volumen</th>
              <th className="py-2 px-4 font-medium">Precio</th>
              <th className="py-2 px-4 font-medium">Cerrar</th>
              <th className="py-2 px-4 font-medium">Precio de cierre</th>
            </tr>
          </thead>
          <tbody>
            {operaciones.map((op, index) => (
              <tr key={index} className="border-b border-gray-800 text-sm">
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span>12:00 {op.fecha}</span>
                    <span className="text-gray-500 text-xs">{op.hora}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2">
                      <img src="/us.png" alt="Avatar" />
                    </div>
                    <span>{op.simbolo}</span>
                  </div>
                </td>
                <td className="py-3 px-4">{op.id}</td>
                <td className="py-3 px-4">{op.tipo}</td>
                <td className="py-3 px-4">{op.volumen}</td>
                <td className="py-3 px-4">${op.precio}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span>12:00 {op.fecha}</span>
                    <span className="text-gray-500 text-xs">{op.hora}</span>
                  </div>
                </td>
                <td className="py-3 px-4">${op.precioFinal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradingDashboard;