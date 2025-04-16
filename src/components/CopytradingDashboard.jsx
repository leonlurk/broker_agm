import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TraderProfileDetail from './TraderProfileDetail';

const CopytradingDashboard = () => {
  const [activeTab, setActiveTab] = useState('traders');
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [expandedTrader, setExpandedTrader] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  
  console.log("Current state:", { activeTab, selectedTrader, expandedTrader, searchTerm, typeFilter, riskFilter });
  
  // Datos de ejemplo para traders disponibles
  const availableTraders = [
    {
      id: "trader-gold",
      name: "Trader Gold",
      profit: "+45.8%",
      since: "Feb 2023",
      type: "Premium",
      typeColor: "bg-yellow-600",
      rentabilidad: "+187.4%",
      rentabilidadPercentage: "75%",
      riesgo: "Medio",
      riesgoColor: "text-yellow-400",
      riesgoPercentage: "50%",
      riesgoBarColor: "bg-yellow-500"
    },
    {
      id: "forex-master",
      name: "Forex Master",
      profit: "+32.1%",
      since: "Ago 2022",
      type: "Verificado",
      typeColor: "bg-blue-600",
      rentabilidad: "+142.7%",
      rentabilidadPercentage: "65%",
      riesgo: "Alto",
      riesgoColor: "text-red-400",
      riesgoPercentage: "80%",
      riesgoBarColor: "bg-red-500"
    },
    {
      id: "crypto-trader",
      name: "Crypto Trader",
      profit: "+27.5%",
      since: "Jun 2023",
      type: "Nuevo",
      typeColor: "bg-gray-600",
      rentabilidad: "+86.2%",
      rentabilidadPercentage: "40%",
      riesgo: "Bajo",
      riesgoColor: "text-green-400",
      riesgoPercentage: "30%",
      riesgoBarColor: "bg-green-500"
    },
    {
      id: "options-expert",
      name: "Options Expert",
      profit: "+38.2%",
      since: "Nov 2023",
      type: "Premium",
      typeColor: "bg-yellow-600",
      rentabilidad: "+125.9%",
      rentabilidadPercentage: "60%",
      riesgo: "Medio-Alto",
      riesgoColor: "text-orange-400",
      riesgoPercentage: "65%",
      riesgoBarColor: "bg-orange-500"
    },
    {
      id: "index-trader",
      name: "Index Trader",
      profit: "+22.3%",
      since: "Mar 2024",
      type: "Nuevo",
      typeColor: "bg-gray-600",
      rentabilidad: "+52.1%",
      rentabilidadPercentage: "35%",
      riesgo: "Bajo",
      riesgoColor: "text-green-400",
      riesgoPercentage: "25%",
      riesgoBarColor: "bg-green-500"
    }
  ];
  
  // Datos para las suscripciones activas
  const activeSubscriptions = [
    {
      id: "sub-forex-master",
      traderId: "forex-master",
      name: "Forex Master",
      invested: "$5,000",
      profit: "+$860.50",
      profitPercentage: "+17.2%",
      status: "Activo",
      startedDate: "15 Mar 2025"
    },
    {
      id: "sub-trader-gold",
      traderId: "trader-gold",
      name: "Trader Gold",
      invested: "$2,500",
      profit: "+$412.75",
      profitPercentage: "+16.5%",
      status: "Activo",
      startedDate: "02 Abr 2025"
    }
  ];
  
  const handleViewTraderDetails = (trader) => {
    console.log("Viewing trader details for:", trader);
    setSelectedTrader(trader);
  };
  
  const handleBackToTraders = () => {
    console.log("Going back to traders list");
    setSelectedTrader(null);
  };
  
  const toggleExpandTrader = (traderId) => {
    console.log("Toggling expanded trader:", traderId);
    if (expandedTrader === traderId) {
      setExpandedTrader(null);
    } else {
      setExpandedTrader(traderId);
    }
  };
  
  // Si hay un trader seleccionado, mostrar sus detalles
  if (selectedTrader) {
    console.log("Rendering TraderProfileDetail for:", selectedTrader);
    return <TraderProfileDetail 
             trader={selectedTrader} 
             onBack={handleBackToTraders} 
           />;
  }

  // Renderizar tarjeta de trader
  const renderTraderCard = (trader) => {
    const isExpanded = expandedTrader === trader.id;
    
    return (
      <div key={trader.id} className="bg-[#191919] p-6 rounded-xl border border-[#333] mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">{trader.name}</h3>
            <p className="text-green-500 text-sm">{trader.profit} último mes</p>
            <p className="text-gray-400 text-sm mt-1">Operando desde: {trader.since}</p>
          </div>
          <div className={`${trader.typeColor} text-xs px-2 py-1 rounded text-white`}>
            {trader.type}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Rentabilidad</span>
            <span className="text-xs text-green-400">{trader.rentabilidad}</span>
          </div>
          <div className="w-full bg-[#333] h-2 rounded-full">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: trader.rentabilidadPercentage }}></div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Riesgo</span>
            <span className={`text-xs ${trader.riesgoColor}`}>{trader.riesgo}</span>
          </div>
          <div className="w-full bg-[#333] h-2 rounded-full">
            <div className={`${trader.riesgoBarColor} h-2 rounded-full`} style={{ width: trader.riesgoPercentage }}></div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="flex-1 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md text-sm">
            Copiar
          </button>
          <button 
            className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded-md text-sm"
            onClick={() => handleViewTraderDetails(trader)}
          >
            Ver
          </button>
                      <button 
            className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded-md text-sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              console.log("Toggle expand button clicked for trader:", trader.id);
              toggleExpandTrader(trader.id);
            }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        
        {/* Panel expandible con vista previa de trader profile */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#333]">
            <div className="bg-[#232323] p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Rentabilidad total</p>
                  <p className="text-xl font-medium text-green-500">{trader.rentabilidad}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Operaciones</p>
                  <p className="text-xl font-medium">{Math.floor(Math.random() * 100) + 250}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Nivel de riesgo</p>
                  <p className={`text-xl font-medium ${trader.riesgoColor}`}>{trader.riesgo}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 mb-2">Instrumentos preferidos:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <div className="bg-[#191919] p-2 rounded text-sm">EUR/USD</div>
                <div className="bg-[#191919] p-2 rounded text-sm">GBP/USD</div>
                <div className="bg-[#191919] p-2 rounded text-sm">XAU/USD</div>
                <div className="bg-[#191919] p-2 rounded text-sm">US100</div>
              </div>
              
                              <button 
                className="w-full px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md text-sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  console.log("Ver perfil completo clicked for trader:", trader);
                  handleViewTraderDetails(trader);
                }}
              >
                Ver perfil completo
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar tarjeta de suscripción
  const renderSubscriptionCard = (subscription) => {
    return (
      <div key={subscription.id} className="bg-[#191919] p-6 rounded-xl border border-[#333] mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">{subscription.name}</h3>
            <p className="text-green-500 text-sm">{subscription.profitPercentage}</p>
            <p className="text-gray-400 text-sm mt-1">Activo desde: {subscription.startedDate}</p>
          </div>
          <div className="bg-green-600 text-xs px-2 py-1 rounded text-white">
            {subscription.status}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-400">Invertido</p>
            <p className="text-lg font-medium">{subscription.invested}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Beneficio</p>
            <p className="text-lg font-medium text-green-500">{subscription.profit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Rentabilidad</p>
            <p className="text-lg font-medium text-green-500">{subscription.profitPercentage}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="flex-1 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md text-sm"
            onClick={() => handleViewTraderDetails(
              availableTraders.find(trader => trader.id === subscription.traderId)
            )}
          >
            Ver trader
          </button>
          <button className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md text-sm">
            Detener
          </button>
        </div>
      </div>
    );
  };
  
  // Renderizar contenido del rendimiento
  const renderPerformanceContent = () => {
    return (
      <div className="bg-[#191919] p-6 rounded-xl border border-[#333]">
        <h3 className="text-lg font-medium mb-4">Resumen de rendimiento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#232323] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Inversión total</p>
            <p className="text-2xl font-medium">$7,500</p>
          </div>
          <div className="bg-[#232323] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Beneficio total</p>
            <p className="text-2xl font-medium text-green-500">+$1,273.25</p>
          </div>
          <div className="bg-[#232323] p-4 rounded-lg">
            <p className="text-sm text-gray-400">Rentabilidad</p>
            <p className="text-2xl font-medium text-green-500">+17.0%</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mb-2">Distribución por trader:</p>
        <div className="space-y-4">
          {activeSubscriptions.map(sub => (
            <div key={sub.id} className="flex justify-between items-center bg-[#232323] p-3 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{sub.name}</p>
                <p className="text-xs text-gray-400">Inversión: {sub.invested}</p>
              </div>
              <div className="text-right">
                <p className="text-green-500">{sub.profit}</p>
                <p className="text-xs text-green-400">{sub.profitPercentage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-[#232323] text-white">
      <h1 className="text-2xl font-semibold mb-4">Copytrading</h1>
      <p className="text-gray-400 mb-6">Gestiona tus operaciones de copytrading.</p>
      
      {/* Tabs */}
      <div className="flex mb-6 border-b border-[#333] overflow-x-auto">
        <button
          onClick={() => setActiveTab('traders')}
          className={`py-3 px-6 whitespace-nowrap ${
            activeTab === 'traders'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Traders disponibles
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`py-3 px-6 whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Mis suscripciones
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`py-3 px-6 whitespace-nowrap ${
            activeTab === 'performance'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Rendimiento
        </button>
      </div>
      
      {/* Contenido según tab seleccionado */}
      {activeTab === 'traders' && (
        <div className="space-y-4">
          {/* Filtros y búsqueda */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar traders..."
                className="w-full p-3 bg-[#191919] border border-[#333] rounded-lg text-white"
                value={searchTerm}
                onChange={(e) => {
                  console.log("Search term changed:", e.target.value);
                  setSearchTerm(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <select 
                className="p-3 bg-[#191919] border border-[#333] rounded-lg text-white"
                value={typeFilter}
                onChange={(e) => {
                  console.log("Type filter changed:", e.target.value);
                  setTypeFilter(e.target.value);
                }}
              >
                <option value="">Todos los tipos</option>
                <option value="Premium">Premium</option>
                <option value="Verificado">Verificado</option>
                <option value="Nuevo">Nuevo</option>
              </select>
              <select 
                className="p-3 bg-[#191919] border border-[#333] rounded-lg text-white"
                value={riskFilter}
                onChange={(e) => {
                  console.log("Risk filter changed:", e.target.value);
                  setRiskFilter(e.target.value);
                }}
              >
                <option value="">Todos los riesgos</option>
                <option value="Bajo">Riesgo bajo</option>
                <option value="Medio">Riesgo medio</option>
                <option value="Alto">Riesgo alto</option>
                <option value="Medio-Alto">Riesgo medio-alto</option>
              </select>
            </div>
          </div>
          
          {/* Lista de traders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableTraders
              .filter(trader => {
                // Filter by search term
                const matchesSearch = searchTerm === '' || 
                  trader.name.toLowerCase().includes(searchTerm.toLowerCase());
                
                // Filter by type
                const matchesType = typeFilter === '' || 
                  trader.type === typeFilter;
                
                // Filter by risk
                const matchesRisk = riskFilter === '' || 
                  trader.riesgo === riskFilter;
                
                console.log(`Filtering trader ${trader.name}:`, { 
                  matchesSearch, 
                  matchesType, 
                  matchesRisk 
                });
                
                return matchesSearch && matchesType && matchesRisk;
              })
              .map(trader => renderTraderCard(trader))}
          </div>
        </div>
      )}
      
      {/* Mis suscripciones */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {activeSubscriptions.length > 0 ? (
            activeSubscriptions.map(subscription => renderSubscriptionCard(subscription))
          ) : (
            <div className="bg-[#191919] p-8 rounded-xl border border-[#333] text-center">
              <p className="text-lg mb-2">No tienes suscripciones activas</p>
              <p className="text-gray-400 mb-4">Comienza a copiar traders para ver tus suscripciones aquí</p>
              <button
                onClick={() => setActiveTab('traders')}
                className="px-6 py-3 bg-cyan-700 hover:bg-cyan-600 rounded-md"
              >
                Explorar traders
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Rendimiento */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {activeSubscriptions.length > 0 ? (
            renderPerformanceContent()
          ) : (
            <div className="bg-[#191919] p-8 rounded-xl border border-[#333] text-center">
              <p className="text-lg mb-2">No hay datos de rendimiento</p>
              <p className="text-gray-400 mb-4">Necesitas tener al menos una suscripción activa</p>
              <button
                onClick={() => setActiveTab('traders')}
                className="px-6 py-3 bg-cyan-700 hover:bg-cyan-600 rounded-md"
              >
                Explorar traders
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// For debugging purposes
window.handleViewTraderDetails = (trader) => {
  console.log("Global handleViewTraderDetails called with:", trader);
};

export default CopytradingDashboard;