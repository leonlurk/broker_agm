import React, { useState, useEffect } from 'react';
import { Search, Calendar, ArrowDown, ChevronDown, Copy, DollarSign, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const OperationsHistory = () => {
  const { t } = useTranslation('common');
  const allOperaciones = [
    { estado: 'Terminado', fecha: '12/1/2025 14:48', numOrden: '73c5cd26-21a8-4c03', tipo: 'Purchase - 5K Standard', metodo: 'Criptomoneda', cantidad: '$280.00' },
    { estado: 'Pendiente', fecha: '11/1/2025 10:22', numOrden: '82d6fe37-32b9-5d14', tipo: 'Purchase - 10K Standard', metodo: 'Tarjeta', cantidad: '$390.00' },
    { estado: 'Vencido', fecha: '10/1/2025 09:17', numOrden: '91e7fg48-43c0-6e25', tipo: 'Purchase - 25K Standard', metodo: 'Criptomoneda', cantidad: '$540.00' },
    { estado: 'Terminado', fecha: '9/1/2025 16:33', numOrden: '61a3bc15-10a7-3b02', tipo: 'Purchase - 5K Standard', metodo: 'Tarjeta', cantidad: '$280.00' },
    { estado: 'Pendiente', fecha: '8/1/2025 11:05', numOrden: '52b4cd27-22a9-4d04', tipo: 'Purchase - 50K Standard', metodo: 'Criptomoneda', cantidad: '$780.00' },
    { estado: 'Vencido', fecha: '7/1/2025 15:41', numOrden: '43c5de38-33b0-5e15', tipo: 'Purchase - 10K Standard', metodo: 'Tarjeta', cantidad: '$390.00' },
    { estado: 'Terminado', fecha: '6/1/2025 13:29', numOrden: '34d6ef49-44c1-6f26', tipo: 'Purchase - 25K Standard', metodo: 'Criptomoneda', cantidad: '$540.00' },
    { estado: 'Pendiente', fecha: '5/1/2025 10:57', numOrden: '25e7fg50-55d2-7g37', tipo: 'Purchase - 5K Standard', metodo: 'Tarjeta', cantidad: '$280.00' },
    { estado: 'Vencido', fecha: '4/1/2025 08:12', numOrden: '16f8gh61-66e3-8h48', tipo: 'Purchase - 50K Standard', metodo: 'Criptomoneda', cantidad: '$780.00' },
    { estado: 'Terminado', fecha: '3/1/2025 14:46', numOrden: '07g9hi72-77f4-9i59', tipo: 'Purchase - 10K Standard', metodo: 'Tarjeta', cantidad: '$390.00' },
    { estado: 'Pendiente', fecha: '2/1/2025 12:38', numOrden: '98h0ij83-88g5-0j60', tipo: 'Purchase - 25K Standard', metodo: 'Criptomoneda', cantidad: '$540.00' },
  ];

  const [operaciones, setOperaciones] = useState(allOperaciones);
  
  // Estados para los filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [metodoFilter, setMetodoFilter] = useState('');
  
  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Estados para las ganancias y proceso de retiro
  const [gananciaRetirable, setGananciaRetirable] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [walletAddress, setWalletAddress] = useState('TRC20_wallet_address_here');
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Simular carga de datos de ganancias desde una API
  useEffect(() => {
    const fetchGanancias = async () => {
      setIsLoading(true);
      try {
        // Simulación de llamada a API con un delay y valor aleatorio
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generar una ganancia aleatoria entre 1000 y 10000
        const randomGanancia = (Math.random() * 9000 + 1000).toFixed(2);
        setGananciaRetirable(randomGanancia);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error al cargar ganancias:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGanancias();
    
    // Actualizar las ganancias cada 30 segundos (simula actualizaciones en tiempo real)
    const intervalId = setInterval(() => {
      fetchGanancias();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Función para formatear cantidades monetarias
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Función para manejar el retiro de ganancias
  const handleWithdraw = async () => {
    if (gananciaRetirable <= 0) {
      setWithdrawError('No hay ganancias disponibles para retirar');
      return;
    }
    
    setIsWithdrawing(true);
    setWithdrawError(null);
    
    try {
      // Simulación de proceso de retiro
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulación de éxito con 80% de probabilidad
      if (Math.random() > 0.2) {
        setWithdrawSuccess(true);
        setGananciaRetirable(0);
        
        // Agregar el retiro como una nueva operación
        const newOperacion = {
          estado: 'Pendiente',
          fecha: new Date().toLocaleDateString('es-ES') + ' ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          numOrden: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          tipo: 'Retiro de ganancias',
          metodo: 'Criptomoneda',
          cantidad: `$${parseFloat(gananciaRetirable).toFixed(2)}`
        };
        
        setOperaciones([newOperacion, ...operaciones]);
        
        // Resetear el estado de éxito después de 3 segundos
        setTimeout(() => {
          setWithdrawSuccess(false);
        }, 3000);
      } else {
        // Simulación de error
        setWithdrawError('Error en la red de la blockchain. Intente nuevamente.');
      }
    } catch (error) {
      setWithdrawError('Error al procesar el retiro. Intente más tarde.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Aplicar filtros cuando cambian
  useEffect(() => {
    let filteredData = allOperaciones;
    
    // Filtrar por búsqueda de número de orden
    if (searchQuery) {
      filteredData = filteredData.filter(op => 
        op.numOrden.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filtrar por estado
    if (estadoFilter) {
      filteredData = filteredData.filter(op => op.estado === estadoFilter);
    }
    
    // Filtrar por método de pago
    if (metodoFilter) {
      filteredData = filteredData.filter(op => op.metodo === metodoFilter);
    }
    
    // Filtrar por fecha de inicio
    if (fechaInicio) {
      const fechaInicioObj = new Date(convertirFecha(fechaInicio));
      filteredData = filteredData.filter(op => {
        const opFecha = new Date(convertirFecha(op.fecha.split(' ')[0]));
        return opFecha >= fechaInicioObj;
      });
    }
    
    // Filtrar por fecha de fin
    if (fechaFin) {
      const fechaFinObj = new Date(convertirFecha(fechaFin));
      filteredData = filteredData.filter(op => {
        const opFecha = new Date(convertirFecha(op.fecha.split(' ')[0]));
        return opFecha <= fechaFinObj;
      });
    }
    
    setOperaciones(filteredData);
    setCurrentPage(1); // Resetear a la primera página cuando se aplican filtros
  }, [searchQuery, fechaInicio, fechaFin, estadoFilter, metodoFilter]);
  
  // Función para convertir fecha de formato DD/MM/YYYY a MM/DD/YYYY para comparación
  const convertirFecha = (fecha) => {
    if (!fecha) return '';
    const partes = fecha.split('/');
    if (partes.length !== 3) return fecha; // Si no tiene el formato esperado, devolver como está
    return `${partes[1]}/${partes[0]}/${partes[2]}`;
  };

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
  
  // Obtener operaciones para la página actual
  const paginatedOperaciones = operaciones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Calcular número total de páginas
  const totalPages = Math.ceil(operaciones.length / itemsPerPage);
  
  // Manejar cambio de página
  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Función para copiar al portapapeles
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(t('clipboard.orderNumberCopied'));
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
        toast.error(t('clipboard.copyError'));
      });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#232323] text-white p-4 md:p-6">
      {/* Top Section - Ganancia Retirable y Billetera */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Ganancia Retirable */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333] relative">
          <h2 className="text-2xl md:text-3xl font-medium mb-2 flex items-center">
            Ganancia Retirable
            {isLoading && (
              <Loader size={18} className="ml-2 animate-spin text-cyan-500" />
            )}
          </h2>
          <div className="flex items-center mb-1">
            <p className="text-2xl md:text-3xl font-regular">
              {isLoading ? (
                <span className="text-gray-400">Cargando...</span>
              ) : (
                formatCurrency(gananciaRetirable)
              )}
            </p>
            {!isLoading && lastUpdate && (
              <span className="text-xs text-gray-400 ml-2">
                Actualizado: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {!isLoading && gananciaRetirable > 0 && (
            <p className="text-sm text-gray-400 mb-4">
              Mínimo de retiro: {formatCurrency(100)} - Disponible para retirar
            </p>
          )}
          {!isLoading && gananciaRetirable <= 0 && (
            <p className="text-sm text-yellow-400 mb-4">
              No hay ganancias disponibles para retirar
            </p>
          )}
          
          <div className="mb-4">
            {withdrawSuccess && (
              <div className="text-green-400 text-sm mb-2 bg-green-900/20 p-2 rounded">
                Solicitud de retiro enviada con éxito. El proceso puede tardar hasta 24 horas.
              </div>
            )}
            {withdrawError && (
              <div className="text-red-400 text-sm mb-2 bg-red-900/20 p-2 rounded">
                {withdrawError}
              </div>
            )}
          </div>
          
          <button 
            className={`relative overflow-hidden ${
              gananciaRetirable > 0 && !isLoading
                ? "bg-transparent border border-cyan-500 text-white py-2 px-4 md:px-6 rounded-full hover:bg-cyan-900/20 transition"
                : "bg-transparent border border-gray-600 text-gray-400 py-2 px-4 md:px-6 rounded-full"
            }`}
            style={{ outline: 'none' }}
            onClick={handleWithdraw}
            disabled={gananciaRetirable <= 0 || isLoading || isWithdrawing}
          >
            {isWithdrawing ? (
              <>
                <span className="flex items-center justify-center">
                  <Loader size={16} className="animate-spin mr-2" />
                  Procesando...
                </span>
              </>
            ) : (
              "Retirar Ganancia"
            )}
          </button>
        </div>

        {/* Billetera de retiros */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-[#202c36] to-[#0a5a72] rounded-xl border border-[#333] relative">
          <h2 className="text-2xl md:text-3xl font-medium mb-2">Billetera de retiros</h2>
          <p className="text-lg md:text-2xl text-gray-300 mb-1">Tether USDT (Tron TRC20 Network)</p>
          <div className="bg-[#1a1a1a] p-2 rounded-md mb-4 flex items-center">
            <span className="text-gray-400 font-mono text-sm truncate">{walletAddress}</span>
            <button 
              className="ml-2 p-1 hover:bg-[#333] rounded" 
              onClick={() => copyToClipboard(walletAddress)}
            >
              <Copy size={12} className="text-gray-400" />
            </button>
          </div>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="A"
                    className="pl-4 pr-9 py-5 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] w-full text-lg"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Filtro de Estado */}
            <div className="flex flex-col space-y-2">
              <span className="text-lg font-medium">Estado</span>
              <div className="relative">
                <select 
                  className="appearance-none pl-4 pr-9 py-5 rounded-full bg-gradient-to-br text-[#929292] from-[#232323] to-[#2d2d2d] border border-[#333] w-full text-lg"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                >
                  <option value="">Todo</option>
                  <option value="Terminado">Terminado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Vencido">Vencido</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            {/* Filtro de Tipo de pago */}
            <div className="flex flex-col space-y-2">
              <span className="text-lg font-medium">Tipo de pago</span>
              <div className="relative">
                <select 
                  className="appearance-none pl-4 pr-9 py-5 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-[#929292] rounded-full border border-[#333] w-full text-lg"
                  value={metodoFilter}
                  onChange={(e) => setMetodoFilter(e.target.value)}
                >
                  <option value="">Todo</option>
                  <option value="Criptomoneda">Criptomoneda</option>
                  <option value="Tarjeta">Tarjeta</option>
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
        
        {/* Tabla de operaciones - con mensaje si no hay resultados */}
        <div className="overflow-x-auto">
          {paginatedOperaciones.length > 0 ? (
            paginatedOperaciones.map((op, index) => (
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
                    <button onClick={() => copyToClipboard(op.numOrden)}>
                      <Copy size={12} className="text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="text-gray-400">Tipo:</div>
                  <div>{op.tipo}</div>
                  
                  <div className="text-gray-400">Método:</div>
                  <div>{op.metodo}</div>
                  
                  <div className="text-gray-400">Cantidad:</div>
                  <div className="font-medium text-white">{op.cantidad}</div>
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
                  <button className="ml-1" onClick={() => copyToClipboard(op.numOrden)}>
                    <Copy size={12} className="text-gray-500" />
                  </button>
                </div>
                <div className="hidden md:block px-2">{op.tipo}</div>
                <div className="hidden md:block px-2">{op.metodo}</div>
                <div className="hidden md:block px-2 font-medium text-white">{op.cantidad}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No se encontraron operaciones con los filtros aplicados
            </div>
          )}
        </div>
        
        {/* Paginación */}
        {operaciones.length > 0 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2">
              <button 
                className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ArrowDown size={16} className="transform rotate-90 text-gray-400" />
              </button>
              
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                // Determinar qué páginas mostrar basado en la página actual
                let pageNum;
                if (totalPages <= 3) {
                  pageNum = i + 1;
                } else if (currentPage === 1) {
                  pageNum = i + 1;
                } else if (currentPage === totalPages) {
                  pageNum = totalPages - 2 + i;
                } else {
                  pageNum = currentPage - 1 + i;
                }
                
                return (
                  <button 
                    key={i}
                    className={`w-8 h-8 rounded-full ${
                      pageNum === currentPage 
                        ? 'bg-cyan-900/30 border border-cyan-500' 
                        : 'border border-[#333]'
                    } flex items-center justify-center`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ArrowDown size={16} className="transform -rotate-90 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsHistory;