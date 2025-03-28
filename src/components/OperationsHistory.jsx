import React, { useState } from 'react';
import { Search, Calendar, ArrowDown, ChevronDown, Copy } from 'lucide-react';

const OperationsHistory = () => {
  const [operaciones, setOperaciones] = useState([
    { estado: 'Terminado', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Pendiente', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Vencido', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Terminado', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Pendiente', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Vencido', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Terminado', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Pendiente', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Vencido', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Terminado', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Pendiente', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
  ]);

  // Estado del color de cada fila
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Terminado':
        return 'bg-green-900/30 text-green-500';
      case 'Pendiente':
        return 'bg-yellow-900/30 text-yellow-500';
      case 'Vencido':
        return 'bg-red-900/30 text-red-500';
      default:
        return 'bg-gray-900/30 text-gray-500';
    }
  };

  // Estado del color de fondo de cada registro
  const getRowColor = (estado) => {
    switch (estado) {
      case 'Terminado':
        return 'bg-[#232323] hover:bg-[#2a2a2a]';
      case 'Pendiente':
        return 'bg-[#232323] hover:bg-[#2a2a2a]';
      case 'Vencido':
        return 'bg-[#232323] hover:bg-[#2a2a2a]';
      default:
        return 'bg-[#232323] hover:bg-[#2a2a2a]';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#232323] text-white p-4 md:p-6">
      {/* Top Section - Ganancia Retirable y Billetera */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Ganancia Retirable */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333] relative">
          <h2 className="text-2xl md:text-3xl font-medium mb-2">Ganancia Retirable</h2>
          <p className="text-2xl md:text-3xl font-regular mb-4">$4.650,00</p>
          <button className="bg-transparent border border-cyan-500 text-white py-2 px-4 md:px-6 rounded-full hover:bg-cyan-900/20 transition"
          style={{ outline: 'none' }}>
            Retirar Ganancia
          </button>
        </div>

        {/* Billetera de retiros */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-[#202c36] to-[#0a5a72] rounded-xl border border-[#333] relative">
          <h2 className="text-2xl md:text-3xl font-medium mb-2">Billetera de retiros</h2>
          <p className="text-lg md:text-2xl text-gray-300 mb-2">Tether USDT (Tron TRC20 Network)</p>
          <button className="bg-[#232323] border border-transparent text-white py-2 px-4 md:px-6 rounded-full hover:bg-[#2a2a2a] transition"
          style={{ outline: 'none' }}>
            Cambiar Billetera
          </button>
        </div>
      </div>

      {/* Contenedor principal de Historial y Filtros */}
      <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333] mb-6">
        {/* Título y buscador */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold">Historial de Operaciones</h2>
          
          <div className="relative w-full md:w-64 mt-2 md:mt-0">
            <input
              type="text"
              placeholder="Numero de orden"
              className="pl-4 pr-10 py-2 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] w-full text-sm"
            />
            <Search size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {/* Filtros */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de fecha */}
            <div className="flex flex-col space-y-2">
              <span className="text-lg font-medium">Fecha</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="De"
                    className="pl-4 pr-9 py-5 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] w-full text-lg"
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="A"
                    className="pl-4 pr-9 py-5 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] w-full text-lg"
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Filtro de Estado */}
            <div className="flex flex-col space-y-2">
              <span className="text-lg font-medium">Estado</span>
              <div className="relative">
                <select className="appearance-none pl-4 pr-9 py-5 rounded-full bg-gradient-to-br text-[#929292] from-[#232323] to-[#2d2d2d] border border-[#333] w-full text-lg">
                  <option value="">Todo</option>
                  <option value="terminado">Terminado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="vencido">Vencido</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            {/* Filtro de Tipo de pago */}
            <div className="flex flex-col space-y-2">
              <span className="text-lg font-medium">Tipo de pago</span>
              <div className="relative">
                <select className="appearance-none pl-4 pr-9 py-5 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-[#929292] rounded-full  border border-[#333] w-full text-lg">
                  <option value="">Todo</option>
                  <option value="cripto">Criptomoneda</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabla de operaciones - Contenedor separado */}
      <div className="bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333] p-4 md:p-6 mb-6">
        {/* Cabecera de la tabla */}
        <div className="hidden md:grid grid-cols-6 text-left text-gray-400 border-b border-gray-700 py-2 mb-2 gap-2">
          <div className="font-medium px-2">Estado</div>
          <div className="font-medium px-2">Fecha</div>
          <div className="font-medium px-2">N° de orden</div>
          <div className="font-medium px-2">Tipo de producto</div>
          <div className="font-medium px-2">Método de pago</div>
          <div className="font-medium px-2">Cantidad</div>
        </div>
        
        {/* Tabla de operaciones */}
        <div className="overflow-x-auto">
          {operaciones.map((op, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-1 md:grid-cols-6 border-b border-gray-800 ${getRowColor(op.estado)} py-2 md:py-3 gap-y-2 md:gap-y-0 md:gap-x-2 text-sm rounded-lg mb-2`}
            >
              {/* Para móvil */}
              <div className="md:hidden grid grid-cols-2 gap-2 px-2">
                <div className="text-gray-400">Estado:</div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(op.estado)} inline-block w-fit`}>
                  {op.estado}
                </div>
                
                <div className="text-gray-400">Fecha:</div>
                <div>{op.fecha}</div>
                
                <div className="text-gray-400">N° de orden:</div>
                <div className="flex items-center space-x-1">
                  <span>{op.numOrden.substring(0, 10)}...</span>
                  <button>
                    <Copy size={12} className="text-gray-500" />
                  </button>
                </div>
                
                <div className="text-gray-400">Tipo:</div>
                <div>{op.tipo}</div>
                
                <div className="text-gray-400">Método:</div>
                <div>{op.metodo}</div>
                
                <div className="text-gray-400">Cantidad:</div>
                <div className="font-medium">{op.cantidad}</div>
              </div>
              
              {/* Para desktop */}
              <div className="hidden md:block px-2">
                <div className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(op.estado)} inline-block`}>
                  {op.estado}
                </div>
              </div>
              <div className="hidden md:block px-2">{op.fecha}</div>
              <div className="hidden md:flex items-center px-2">
                <span className="truncate">{op.numOrden}</span>
                <button className="ml-1">
                  <Copy size={12} className="text-gray-500" />
                </button>
              </div>
              <div className="hidden md:block px-2">{op.tipo}</div>
              <div className="hidden md:block px-2">{op.metodo}</div>
              <div className="hidden md:block px-2 font-medium">{op.cantidad}</div>
            </div>
          ))}
        </div>
        
        {/* Paginación */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <button className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center">
              <ArrowDown size={16} className="transform rotate-90 text-gray-400" />
            </button>
            <button className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500 flex items-center justify-center">
              1
            </button>
            <button className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center">
              2
            </button>
            <button className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center">
              <ArrowDown size={16} className="transform -rotate-90 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsHistory;