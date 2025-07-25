import React, { useState, useEffect } from 'react';
import { Star, Users, DollarSign, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Eye, Settings, BarChart3, Activity, Award, Calendar, Copy, MoreHorizontal, Edit, Camera, Save, X, Info, Shield, Target, Briefcase, Search, Filter, SlidersHorizontal, Pause, StopCircle, MessageCircle, UserCheck, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import CrearPAMMModal from './CrearPAMMModal';
import CopiarEstrategiaModal from './CopiarEstrategiaModal';
import { scrollToTopManual } from '../hooks/useScrollToTop';

// Datos mock para el dashboard del gestor PAMM
const mockPAMMGestorData = {
  totalCapital: 250000,
  rendimiento: 18.5,
  numeroInversores: 12,
  comisionesGeneradas: 5200,
  drawdownMaximo: -8.3,
  sharpeRatio: 1.85,
  // Datos adicionales para el dashboard
  nombreFondo: "Alpha Growth Fund",
  tipoEstrategia: "Moderado",
  managementFee: 2.0,
  performanceFee: 20.0,
  lockupPeriod: 30,
  mercadosOperados: ["Forex", "Criptomonedas", "Acciones"],
  rendimientoMensual: [2.1, 3.8, -1.2, 4.5, 2.8, 1.9, 3.2, 2.5, 4.1, 1.8, 2.7, 3.5],
  operacionesExitosas: 142,
  operacionesTotales: 207,
  winRate: 68.5,
  volumenOperado: 250000,
  tiempoPromedioOperacion: "2.5 horas",
  pairesOperados: ["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD"],
  // Lista de inversores mock
  inversores: [
    {
      id: 1,
      nombre: "Carlos Rodriguez",
      montoInvertido: 15000,
      fechaEntrada: "2024-01-15",
      gananciaActual: 2750,
      rendimientoPersonal: 18.3,
      estado: "Activo"
    },
    {
      id: 2,
      nombre: "Maria González",
      montoInvertido: 8500,
      fechaEntrada: "2024-02-03",
      gananciaActual: 1190,
      rendimientoPersonal: 14.0,
      estado: "Activo"
    },
    {
      id: 3,
      nombre: "Roberto Silva",
      montoInvertido: 25000,
      fechaEntrada: "2023-12-10",
      gananciaActual: 5250,
      rendimientoPersonal: 21.0,
      estado: "Activo"
    },
    {
      id: 4,
      nombre: "Ana Martínez",
      montoInvertido: 12000,
      fechaEntrada: "2024-01-28",
      gananciaActual: 1800,
      rendimientoPersonal: 15.0,
      estado: "Activo"
    }
  ],
  // Lista de traders disponibles para copiar estrategia
  tradersDisponibles: [
    {
      id: 1,
      nombre: "Alpha Capital Fund",
      rendimiento: 28.5,
      drawdown: 8.2,
      sharpeRatio: 2.1,
      inversores: 145,
      capitalGestionado: 2500000,
      tipoEstrategia: "Agresivo",
      mercados: ["Forex", "Criptomonedas"]
    },
    {
      id: 2,
      nombre: "Momentum Trading Pro",
      rendimiento: 35.2,
      drawdown: 12.5,
      sharpeRatio: 1.8,
      inversores: 89,
      capitalGestionado: 1800000,
      tipoEstrategia: "Moderado",
      mercados: ["Forex", "Acciones"]
    },
    {
      id: 3,
      nombre: "Conservative Growth",
      rendimiento: 18.7,
      drawdown: 4.8,
      sharpeRatio: 2.4,
      inversores: 203,
      capitalGestionado: 4200000,
      tipoEstrategia: "Conservador",
      mercados: ["Forex", "Índices"]
    },
    {
      id: 4,
      nombre: "Tech Growth Fund",
      rendimiento: 42.1,
      drawdown: 15.3,
      sharpeRatio: 1.6,
      inversores: 67,
      capitalGestionado: 1200000,
      tipoEstrategia: "Agresivo",
      mercados: ["Criptomonedas", "Acciones"]
    }
  ]
};

// Componente para una tarjeta de estadística individual
const StatCard = ({ icon, title, value, detail }) => {
  const Icon = icon;
  return (
    <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-[#333] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-gray-400">{title}</h3>
        <Icon className="text-cyan-500" size={24} />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {detail && <p className="text-sm text-gray-500 mt-1">{detail}</p>}
      </div>
    </div>
  );
};

const PammGestorAdminDashboard = ({ setSelectedOption, navigationParams, setNavigationParams, scrollContainerRef }) => {
  const [view, setView] = useState('dashboard'); // dashboard, investorDetail
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [investors] = useState(mockPAMMGestorData.inversores);
  const [tradersDisponibles] = useState(mockPAMMGestorData.tradersDisponibles);
  const [isLoading] = useState(false);
  const [error] = useState(null);
  const [showCrearFondoModal, setShowCrearFondoModal] = useState(false);
  const [showCopiarEstrategiaModal, setShowCopiarEstrategiaModal] = useState(false);
  const [showFundConfigModal, setShowFundConfigModal] = useState(false);
  const [selectedFundForConfig, setSelectedFundForConfig] = useState(null);

  const data = mockPAMMGestorData;

  // Efecto para hacer scroll hacia arriba cuando cambie la vista
  useEffect(() => {
    scrollToTopManual(scrollContainerRef);
  }, [view, selectedInvestor]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%';
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const handleConfigureContract = () => {
    console.log('Opening contract configuration modal');
    setShowCrearFondoModal(true);
  };

  const handleManageFund = (fund) => {
    setSelectedInvestor(fund);
    setView('fundDetail');
  };

  const handleConfigureFund = (fund) => {
    console.log('Configuring individual fund:', fund);
    setSelectedFundForConfig(fund);
    setShowFundConfigModal(true);
    // Force the modal to appear on top by ensuring other modals are closed
    setShowCrearFondoModal(false);
    setShowCopiarEstrategiaModal(false);
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedInvestor(null);
  };

  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = searchTerm === '' || 
      investor.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || 
      investor.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Mock data for account cards with extended information
  const accountsData = [
    {
      id: 1,
      name: "Alpha Growth Fund",
      type: "PAMM",
      balance: 245000,
      monthlyReturn: 18.7,
      totalReturn: 34.5,
      investors: 12,
      status: "Activo",
      managementFee: 2.0,
      performanceFee: 20.0,
      maxDrawdown: -8.3,
      winRate: 68.5,
      totalTrades: 207,
      strategy: "Crecimiento Agresivo",
      createdDate: "2024-01-15",
      lockupPeriod: 30,
      minInvestment: 1000,
      riskLevel: "Alto",
      sharpeRatio: 1.85
    },
    {
      id: 2,
      name: "Conservative PAMM",
      type: "PAMM",
      balance: 125000,
      monthlyReturn: 8.3,
      totalReturn: 16.2,
      investors: 8,
      status: "Activo",
      managementFee: 1.5,
      performanceFee: 15.0,
      maxDrawdown: -4.1,
      winRate: 72.3,
      totalTrades: 156,
      strategy: "Conservador",
      createdDate: "2024-02-10",
      lockupPeriod: 15,
      minInvestment: 500,
      riskLevel: "Bajo",
      sharpeRatio: 2.1
    }
  ];

  if (view === 'fundDetail' && selectedInvestor) {
    const fund = selectedInvestor;
    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white border border-[#333] rounded-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="p-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors"
            >
              <ArrowUp className="rotate-[-90deg]" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">{fund.name}</h1>
              <p className="text-gray-400">Gestión detallada del fondo PAMM</p>
            </div>
          </div>
          <button
            onClick={() => handleConfigureFund(fund)}
            className="flex items-center gap-2 bg-[#0F7490] hover:bg-[#0A5A72] text-white py-2 px-4 rounded-lg transition-colors"
          >
            <Settings size={16} />
            Configurar
          </button>
        </div>

        {/* Fund Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#2a2a2a] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">AUM</span>
              <DollarSign className="text-cyan-500" size={16} />
            </div>
            <div className="text-xl font-bold">{formatCurrency(fund.balance)}</div>
          </div>
          
          <div className="bg-[#2a2a2a] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Rendimiento Total</span>
              <TrendingUp className="text-green-500" size={16} />
            </div>
            <div className="text-xl font-bold text-green-500">{formatPercentage(fund.totalReturn)}</div>
          </div>
          
          <div className="bg-[#2a2a2a] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Inversores</span>
              <Users className="text-blue-500" size={16} />
            </div>
            <div className="text-xl font-bold">{fund.investors}</div>
          </div>
          
          <div className="bg-[#2a2a2a] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Tasa de Éxito</span>
              <Award className="text-yellow-500" size={16} />
            </div>
            <div className="text-xl font-bold">{fund.winRate}%</div>
          </div>
        </div>

        {/* Fund Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Información del Fondo</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Estrategia:</span>
                <span className="font-medium">{fund.strategy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nivel de Riesgo:</span>
                <span className={`font-medium ${
                  fund.riskLevel === 'Alto' ? 'text-red-400' :
                  fund.riskLevel === 'Medio' ? 'text-yellow-400' : 'text-green-400'
                }`}>{fund.riskLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Drawdown Máximo:</span>
                <span className="font-medium text-red-400">{fund.maxDrawdown}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sharpe Ratio:</span>
                <span className="font-medium">{fund.sharpeRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Operaciones:</span>
                <span className="font-medium">{fund.totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha Creación:</span>
                <span className="font-medium">{new Date(fund.createdDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volumen Operado:</span>
                <span className="font-medium">{formatCurrency(250000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Operaciones Exitosas:</span>
                <span className="font-medium">142/{fund.totalTrades}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Configuración de Comisiones</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Comisión de Gestión:</span>
                <span className="font-medium">{fund.managementFee}% anual</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Performance Fee:</span>
                <span className="font-medium">{fund.performanceFee}% ganancias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lock-up Period:</span>
                <span className="font-medium">{fund.lockupPeriod} días</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Inversión Mínima:</span>
                <span className="font-medium">{formatCurrency(fund.minInvestment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Inversión Máxima:</span>
                <span className="font-medium">{formatCurrency(50000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">High Water Mark:</span>
                <span className="font-medium text-green-400">Activo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Frecuencia de Pago:</span>
                <span className="font-medium">Mensual</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Próximo Cierre:</span>
                <span className="font-medium">15/01/2025</span>
              </div>
            </div>
          </div>
        </div>

        {/* Investors List */}
        <div className="bg-[#2a2a2a] p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Inversores del Fondo</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#333]">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-3">Inversor</th>
                  <th className="pb-3">Inversión</th>
                  <th className="pb-3">Ganancia</th>
                  <th className="pb-3">Rendimiento</th>
                  <th className="pb-3">Fecha Entrada</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {investors.filter(inv => inv.id <= fund.investors).map((investor) => (
                  <tr key={investor.id} className="hover:bg-[#333] transition-colors">
                    <td className="py-3 font-medium">{investor.nombre}</td>
                    <td className="py-3">{formatCurrency(investor.montoInvertido)}</td>
                    <td className="py-3 text-green-500">{formatCurrency(investor.gananciaActual)}</td>
                    <td className="py-3 text-green-500">{formatPercentage(investor.rendimientoPersonal)}</td>
                    <td className="py-3 text-gray-400">{new Date(investor.fechaEntrada).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        investor.estado === 'Activo' 
                          ? 'bg-green-500 bg-opacity-20 text-green-400' 
                          : 'bg-gray-500 bg-opacity-20 text-gray-400'
                      }`}>
                        {investor.estado}
                      </span>
                    </td>
                    <td className="py-3">
                      <button className="p-1 hover:bg-[#444] rounded transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Rendimiento Mensual</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.rendimientoMensual.map((value, index) => ({
                  mes: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][index],
                  rendimiento: value
                }))}>
                  <defs>
                    <linearGradient id="colorRendimiento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F7490" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0F7490" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mes" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    formatter={(value) => [`${value}%`, 'Rendimiento']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rendimiento" 
                    stroke="#0F7490" 
                    fillOpacity={1} 
                    fill="url(#colorRendimiento)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Distribución por Mercado</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Forex', value: 45, color: '#0F7490' },
                      { name: 'Criptomonedas', value: 30, color: '#FFB800' },
                      { name: 'Acciones', value: 25, color: '#10B981' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Forex', value: 45, color: '#0F7490' },
                      { name: 'Criptomonedas', value: 30, color: '#FFB800' },
                      { name: 'Acciones', value: 25, color: '#10B981' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Activity & Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
            <div className="space-y-3">
              {[
                { action: 'Nueva inversión', user: 'Carlos Rodriguez', amount: '$5,000', time: 'Hace 2 horas' },
                { action: 'Retiro parcial', user: 'Ana Martínez', amount: '$1,200', time: 'Hace 5 horas' },
                { action: 'Comisión cobrada', user: 'Sistema', amount: '$420', time: 'Hace 1 día' },
                { action: 'Nueva inversión', user: 'Pedro García', amount: '$3,500', time: 'Hace 2 días' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#333] rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity size={16} className="text-cyan-500" />
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-400">{activity.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activity.amount}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Mensajes de Inversores</h3>
            <div className="space-y-3">
              {[
                { from: 'Carlos Rodriguez', message: '¿Cuándo es el próximo cierre?', time: 'Hace 1 hora', unread: true },
                { from: 'Maria González', message: 'Excelente rendimiento este mes', time: 'Hace 3 horas', unread: false },
                { from: 'Roberto Silva', message: 'Solicito información adicional', time: 'Hace 5 horas', unread: true }
              ].map((msg, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#333] rounded-lg hover:bg-[#444] cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageCircle size={16} className={msg.unread ? 'text-cyan-500' : 'text-gray-400'} />
                    <div>
                      <p className="text-sm font-medium">{msg.from}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{msg.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{msg.time}</p>
                    {msg.unread && <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mt-1"></span>}
                  </div>
                </div>
              ))}
              <button className="w-full py-2 bg-[#333] hover:bg-[#444] rounded-lg text-sm text-gray-400 transition-colors">
                Ver todos los mensajes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'investorDetail') {
    return (
      <div className="p-4 md:p-6 bg-[#232323] text-white border border-[#333] rounded-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="p-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors"
            >
              <ArrowUp className="rotate-[-90deg]" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">Mis Inversores</h1>
              <p className="text-gray-400">Gestiona los inversores de tus fondos PAMM</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar inversores..."
              className="w-full p-3 bg-[#191919] border border-[#333] rounded-lg text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 bg-[#191919] border border-[#333] rounded-lg text-white"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Pausado">Pausado</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {/* All Investors Table */}
        <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] overflow-hidden">
          <div className="p-4 border-b border-[#333]">
            <h3 className="text-lg font-semibold">Todos los Inversores</h3>
            <p className="text-sm text-gray-400">Gestiona todos los inversores de tus fondos PAMM</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-[#333]">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="p-4">Inversor</th>
                  <th className="p-4">Fondo</th>
                  <th className="p-4">Inversión</th>
                  <th className="p-4">Ganancia</th>
                  <th className="p-4">Rendimiento</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {filteredInvestors.map((investor, index) => {
                  // Assign fund based on investor ID for demonstration
                  const assignedFund = accountsData[index % accountsData.length];
                  return (
                    <tr key={investor.id} className="hover:bg-[#333] transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{investor.nombre}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-400">{assignedFund.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{formatCurrency(investor.montoInvertido)}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-green-500">{formatCurrency(investor.gananciaActual)}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-green-500">{formatPercentage(investor.rendimientoPersonal)}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          investor.estado === 'Activo' 
                            ? 'bg-green-500 bg-opacity-20 text-green-400' 
                            : 'bg-gray-500 bg-opacity-20 text-gray-400'
                        }`}>
                          {investor.estado}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">
                        {new Date(investor.fechaEntrada).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[#232323] text-white border border-[#333] rounded-3xl space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">PAMM Gestor</h1>
          <p className="text-sm md:text-base text-gray-400">
            Gestiona tus fondos PAMM y monitorea el rendimiento
          </p>
        </div>
        <button
          onClick={() => setShowCrearFondoModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-5 rounded-lg hover:opacity-90 transition"
        >
          <Plus size={18} />
          Crear Fondo
        </button>
      </div>

      {/* Portfolio Section */}
      <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-[#333]">
        <h2 className="text-xl font-semibold mb-6">Portfolio</h2>
        
        {/* Basic KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#333] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">AUM Total</span>
              <DollarSign className="text-cyan-500" size={20} />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.totalCapital)}</div>
          </div>
          
          <div className="bg-[#333] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Rendimiento</span>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-green-500">{formatPercentage(data.rendimiento)}</div>
          </div>
          
          <div className="bg-[#333] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Inversores</span>
              <Users className="text-blue-500" size={20} />
            </div>
            <div className="text-2xl font-bold">{data.numeroInversores}</div>
          </div>
          
          <div className="bg-[#333] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Comisiones</span>
              <Award className="text-yellow-500" size={20} />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.comisionesGeneradas)}</div>
          </div>
        </div>
      </div>

      {/* Mis Fondos PAMM Section */}
      <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-[#333]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Mis Fondos PAMM</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {accountsData.map((account) => (
            <div key={account.id} className="bg-[#333] p-6 rounded-xl border border-[#444]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{account.name}</h3>
                  <span className="text-sm text-gray-400">{account.type} • {account.strategy}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  account.status === 'Activo' 
                    ? 'bg-green-500 bg-opacity-20 text-green-400' 
                    : 'bg-gray-500 bg-opacity-20 text-gray-400'
                }`}>
                  {account.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">AUM:</span>
                  <span className="font-medium">{formatCurrency(account.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rendimiento Mes:</span>
                  <span className="font-medium text-green-500">{formatPercentage(account.monthlyReturn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rendimiento Total:</span>
                  <span className="font-medium text-green-500">{formatPercentage(account.totalReturn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Inversores:</span>
                  <span className="font-medium">{account.investors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tasa de Éxito:</span>
                  <span className="font-medium">{account.winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Drawdown Máx:</span>
                  <span className="font-medium text-red-400">{account.maxDrawdown}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Comisión:</span>
                  <span className="font-medium">{account.managementFee}% + {account.performanceFee}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Nivel Riesgo:</span>
                  <span className={`font-medium ${
                    account.riskLevel === 'Alto' ? 'text-red-400' :
                    account.riskLevel === 'Medio' ? 'text-yellow-400' : 'text-green-400'
                  }`}>{account.riskLevel}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleManageFund(account)}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Gestionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Modal de Crear/Configurar Fondo PAMM */}
      <CrearPAMMModal 
        isOpen={showCrearFondoModal}
        onClose={() => setShowCrearFondoModal(false)}
        mode="configure"
        onConfirm={(formData) => {
          console.log('Contrato PAMM configurado:', formData);
          // Aquí integrarías con tu API para configurar el contrato
        }}
      />

      {/* Modal de Copiar Estrategia */}
      <CopiarEstrategiaModal 
        isOpen={showCopiarEstrategiaModal}
        onClose={() => setShowCopiarEstrategiaModal(false)}
        onConfirm={(formData) => {
          console.log('Estrategia copiada:', formData);
          // Aquí integrarías con tu API para copiar la estrategia
        }}
      />

      {/* Modal de Configuración de Fondo Individual */}
      {showFundConfigModal && (
        <CrearPAMMModal 
          isOpen={showFundConfigModal}
          onClose={() => {
            setShowFundConfigModal(false);
            setSelectedFundForConfig(null);
          }}
          mode="configure"
          fundData={selectedFundForConfig}
          onConfirm={(formData) => {
            console.log('Configuración de fondo actualizada:', formData);
            // Aquí integrarías con tu API para actualizar la configuración del fondo
            setShowFundConfigModal(false);
            setSelectedFundForConfig(null);
          }}
        />
      )}
    </div>
  );
};

export default PammGestorAdminDashboard; 