import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const TradingAccounts = ({ setSelectedOption, setSelectedAccount }) => {
  const [activeTab, setActiveTab] = useState('Cuentas Reales');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  
  const accounts = [
    { id: 1, name: 'Cuenta 1' },
    { id: 2, name: 'Cuenta 2' }
  ];
  
  const handleCreateAccount = () => {
    // Lógica para crear una cuenta
    setSelectedOption && setSelectedOption("Desafio");
  };

  const handleAccountClick = (accountId) => {
    setSelectedAccountId(accountId);
  };

  const handleBackToAccounts = () => {
    setSelectedAccountId(null);
  };
  
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

  return (
    <div className="flex flex-col p-4 bg-[#232323] text-white min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* Accounts Container - Left Side */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#232323] to-[#1e1e1e] rounded-3xl p-4 min-h-[500px] border-t border-l border-r border-cyan-500 shadow-md">
          <h1 className="text-2xl font-semibold mb-4">Tus Cuentas</h1>
          
          {/* Create Account Button */}
          <button 
            onClick={handleCreateAccount}
            className="w-full py-3 px-4 bg-gradient-to-br from-[#0F7490] to-[#053a4b] text-white rounded-md hover:opacity-90 transition flex items-center justify-center"
          >
            + Crear Cuenta
          </button>
          
          {/* Divider line */}
          <div className="h-px bg-[#333] w-full my-4"></div>
          
          {/* Spacing */}
          <div className="h-8"></div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-4">
            {['Cuentas Reales', 'Cuentas Demo'].map((tab) => (
              <button
                key={tab}
                className={`px-6 py-2 rounded-md focus:outline-none ${
                  activeTab === tab
                    ? 'bg-gradient-to-br from-[#0F7490] to-[#053a4b] text-white'
                    : 'bg-[#2d2d2d] text-gray-300'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Account List */}
          <div className="space-y-1">
            {accounts.map((account) => (
              <button 
                key={account.id} 
                className="p-4 w-full bg-[#232323] rounded-md border border-[#333] flex items-center justify-between hover:bg-[#333] transition"
                onClick={() => {
                  handleAccountClick(account.id);
                  setSelectedAccount && setSelectedAccount(account.id);
                }}
              >
                <span className="font-medium">{account.name}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
        
        {/* Right Side - Dashboard Content */}
        <div className="md:col-span-7 bg-gradient-to-br from-[#232323] to-[#3f3f3f] border border-[#333] rounded-3xl min-h-[400px] p-4">
          {selectedAccountId ? (
            <div className="space-y-4">
              {/* Balance Card */}
              <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl">
                <h2 className="text-xl md:text-3xl font-bold mb-4">Balance</h2>
                <div className="flex items-center mb-6">
                  <span className="text-2xl md:text-4xl font-bold mr-3">$5.000,00</span>
                  <span className="bg-green-800 bg-opacity-30 text-green-400 px-2 py-1 rounded text-sm">+24.7%</span>
                </div>
                
                <div className="w-full h-48">
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
              
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              {/* Trading Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">Pérdida promedio</h3>
                    <span className="text-xl md:text-2xl font-bold">$77,61</span>
                  </div>
                  <div className="bg-[#2d2d2d] p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">Ganancia promedio</h3>
                    <span className="text-xl md:text-2xl font-bold">$20,61</span>
                  </div>
                  <div className="bg-[#2d2d2d] p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">Ratio de victorias</h3>
                    <span className="text-xl md:text-2xl font-bold">$20,61</span>
                  </div>
                  <div className="bg-[#2d2d2d] p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">Lotes</h3>
                    <span className="text-xl md:text-2xl font-bold">3.26</span>
                  </div>
                  <div className="bg-[#2d2d2d] p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleBackToAccounts}
                className="mt-4 flex items-center text-cyan-500 hover:text-cyan-400 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Volver a cuentas
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg">Selecciona una cuenta para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Metrics Grid - Now populate with data when account is selected */}
      {selectedAccountId ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="row-span-1 col-span-1 md:col-span-3 h-24 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333] p-4">
            <h2 className="text-xl font-semibold mb-2">Rendimiento Mensual</h2>
            <div className="flex items-center">
              <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-2/3 mr-4"></div>
              <span>67%</span>
            </div>
          </div>
          
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333] p-4">
            <h3 className="text-gray-400 text-sm mb-1">Duración promedio del trading</h3>
            <span className="text-xl md:text-2xl font-bold">02:25:36</span>
          </div>
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333] p-4">
            <h3 className="text-gray-400 text-sm mb-1">Factor de beneficio</h3>
            <span className="text-xl md:text-2xl font-bold">$20,61</span>
          </div>
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333] p-4">
            <h3 className="text-gray-400 text-sm mb-1">Comisiones totales</h3>
            <span className="text-xl md:text-2xl font-bold">$125,30</span>
          </div>
          
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333] p-4">
            <h3 className="text-gray-400 text-sm mb-1">Operaciones totales</h3>
            <span className="text-xl md:text-2xl font-bold">23</span>
          </div>
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333] p-4">
            <h3 className="text-gray-400 text-sm mb-1">Operaciones ganadoras</h3>
            <span className="text-xl md:text-2xl font-bold">15</span>
          </div>
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333] p-4">
            <h3 className="text-gray-400 text-sm mb-1">Operaciones perdedoras</h3>
            <span className="text-xl md:text-2xl font-bold">8</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="row-span-1 col-span-1 md:col-span-3 h-24 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333]"></div>
          
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333]"></div>
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333]"></div>
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333]"></div>
          
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333]"></div>
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333]"></div>
          <div className="h-32 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-xl border border-[#333]"></div>
        </div>
      )}
    </div>
  );
};

export default TradingAccounts;