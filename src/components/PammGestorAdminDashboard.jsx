import React, { useState } from 'react';
import { Users, Settings, BarChart2, DollarSign, Copy } from 'lucide-react';
import CrearPAMMModal from './CrearPAMMModal';
import CopiarEstrategiaModal from './CopiarEstrategiaModal';

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

const PammGestorAdminDashboard = () => {
  const [investors] = useState(mockPAMMGestorData.inversores);
  const [isLoading] = useState(false);
  const [error] = useState(null);
  const [showCrearFondoModal, setShowCrearFondoModal] = useState(false);
  const [showCopiarEstrategiaModal, setShowCopiarEstrategiaModal] = useState(false);

  const data = mockPAMMGestorData;

  return (
    <div className="p-4 md:p-6 bg-[#232323] text-white border border-[#333] rounded-3xl space-y-8">

      {/* Cabecera del Dashboard */}
      <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-3xl border border-[#333]">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">{data.nombreFondo}</h1>
            <p className="text-sm md:text-base text-gray-400">
              Fondo PAMM • Estrategia {data.tipoEstrategia} • {data.numeroInversores} inversores activos
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setShowCopiarEstrategiaModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-5 rounded-lg hover:opacity-90 transition"
            >
              <Copy size={18} />
              Copiar Estrategia
            </button>
            <button
              onClick={() => setShowCrearFondoModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-5 rounded-lg hover:opacity-90 transition"
            >
              <Settings size={18} />
              Configurar Fondo
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={DollarSign} 
          title="Capital Total" 
          value={`$${data.totalCapital.toLocaleString()}`} 
          detail="Fondos bajo gestión"
        />
        <StatCard 
          icon={BarChart2} 
          title="Rendimiento Total" 
          value={`${data.rendimiento.toFixed(1)}%`}
          detail={`Drawdown Máx: ${data.drawdownMaximo}%`}
        />
        <StatCard 
          icon={Users} 
          title="Inversores Activos" 
          value={data.numeroInversores}
          detail="Participantes en el fondo"
        />
        <StatCard 
          icon={DollarSign} 
          title="Comisiones Generadas" 
          value={`$${data.comisionesGeneradas.toLocaleString()}`}
          detail={`Sharpe Ratio: ${data.sharpeRatio}`}
        />
      </div>

      {/* Estadísticas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-[#333]">
          <h3 className="text-lg font-semibold mb-4">Rendimiento Mensual</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Promedio:</span>
              <span className="text-green-500">+{(data.rendimientoMensual.reduce((a, b) => a + b, 0) / data.rendimientoMensual.length).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mejor mes:</span>
              <span className="text-green-500">+{Math.max(...data.rendimientoMensual).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Peor mes:</span>
              <span className="text-red-500">{Math.min(...data.rendimientoMensual).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-[#333]">
          <h3 className="text-lg font-semibold mb-4">Operaciones</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Win Rate:</span>
              <span className="text-green-500">{data.winRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Exitosas:</span>
              <span className="text-white">{data.operacionesExitosas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total:</span>
              <span className="text-white">{data.operacionesTotales}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-[#333]">
          <h3 className="text-lg font-semibold mb-4">Configuración</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Management Fee:</span>
              <span className="text-white">{data.managementFee}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Performance Fee:</span>
              <span className="text-white">{data.performanceFee}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lock-up:</span>
              <span className="text-white">{data.lockupPeriod} días</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor Tabla Inversores */}
      <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-3xl border border-[#333] p-1">
        <h2 className="text-xl font-semibold p-4">Lista de Inversores</h2>
        <div className="overflow-x-auto">
          {/* Encabezado de la tabla */}
          <div className="grid grid-cols-6 gap-x-4 px-4 py-3 border-b border-[#333] text-xs text-gray-400">
            <div className="text-left">Inversor</div>
            <div className="text-left">Monto Invertido</div>
            <div className="text-left">Fecha de Entrada</div>
            <div className="text-left">Ganancia Actual</div>
            <div className="text-left">Rendimiento</div>
            <div className="text-left">Estado</div>
          </div>

          {/* Cuerpo de la tabla */}
          <div className="divide-y divide-[#333]">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Cargando inversores...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">{error}</div>
            ) : investors.length > 0 ? (
              investors.map((investor) => (
                <div
                  key={investor.id}
                  className="grid grid-cols-6 gap-x-4 px-4 py-3 items-center text-sm transition-colors hover:bg-[#2a2a2a]"
                >
                  <div className="text-left truncate">{investor.nombre}</div>
                  <div className="text-left truncate font-medium">${investor.montoInvertido.toLocaleString()}</div>
                  <div className="text-left truncate">{new Date(investor.fechaEntrada).toLocaleDateString()}</div>
                  <div className="text-left truncate font-medium text-green-500">+${investor.gananciaActual.toLocaleString()}</div>
                  <div className="text-left truncate font-medium text-green-500">+{investor.rendimientoPersonal.toFixed(1)}%</div>
                  <div className="text-left truncate">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      investor.estado === 'Activo' 
                        ? 'bg-green-500 bg-opacity-20 text-green-400' 
                        : 'bg-gray-500 bg-opacity-20 text-gray-400'
                    }`}>
                      {investor.estado}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No hay inversores en tu fondo actualmente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Crear/Configurar Fondo PAMM */}
      <CrearPAMMModal 
        isOpen={showCrearFondoModal}
        onClose={() => setShowCrearFondoModal(false)}
        onConfirm={(formData) => {
          console.log('Fondo PAMM configurado:', formData);
          // Aquí integrarías con tu API para crear/configurar el fondo
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
    </div>
  );
};

export default PammGestorAdminDashboard; 