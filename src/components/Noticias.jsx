import React, { useState } from 'react';
import { ChevronDown, Calendar, Clock, AlertTriangle } from 'lucide-react';

const Noticias = () => {
  const [activeDay, setActiveDay] = useState('Lunes');
  const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
  
  const startDate = 16;
  const endDate = 20;
  const currentYear = 2025;
  
  // Filter states
  const [impactFilters, setImpactFilters] = useState({
    feriados: false,
    bajo: false,
    medio: false,
    alto: false
  });

  const [visibilityFilters, setVisibilityFilters] = useState({
    ocultarNoticias: false,
    mostrarRestringidos: false
  });

  const events = [
    {
      description: 'Revised Industrial Production m/m',
      instrument: 'USD',
      time: '12:00',
      date: '20 Feb',
      timestamp: '00:30:23',
      actual: '-',
      forecast: '0,6%',
      previous: '0,2%',
      impact: 'high',
      color: 'cyan'
    },
    {
      description: 'Revised Industrial Production m/m',
      instrument: 'USD',
      time: '12:00',
      date: '20 Feb',
      timestamp: '00:30:23',
      actual: '-',
      forecast: '0,6%',
      previous: '0,2%',
      impact: 'medium',
      color: 'green'
    },
    {
      description: 'Revised Industrial Production m/m',
      instrument: 'USD',
      time: '12:00',
      date: '20 Feb',
      timestamp: '00:30:23',
      actual: '-',
      forecast: '0,6%',
      previous: '0,2%',
      impact: 'low',
      color: 'red'
    },
    {
      description: 'Revised Industrial Production m/m',
      instrument: 'USD',
      time: '12:00',
      date: '20 Feb',
      timestamp: '00:30:23',
      actual: '-',
      forecast: '0,6%',
      previous: '0,2%',
      impact: 'medium',
      color: 'green',
      highlighted: true
    }
  ];

  const toggleImpactFilter = (filter) => {
    setImpactFilters({
      ...impactFilters,
      [filter]: !impactFilters[filter]
    });
  };

  const toggleVisibilityFilter = (filter) => {
    setVisibilityFilters({
      ...visibilityFilters,
      [filter]: !visibilityFilters[filter]
    });
  };

  const getImpactColor = (color) => {
    switch (color) {
      case 'cyan':
        return 'bg-cyan-500';
      case 'green':
        return 'bg-green-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#232323] text-white p-2 sm:p-4">
      {/* Days of the week tabs - Scrollable on mobile */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
        {days.map((day) => (
          <button
            key={day}
            className={`px-4 sm:px-8 md:px-12 py-2 sm:py-3 rounded-full whitespace-nowrap focus:outline-none ${
              activeDay === day 
                ? 'bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-cyan-500 text-white' 
                : 'bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] text-gray-300 hover:bg-[#2a2a2a]'
            }`}
            onClick={() => setActiveDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Date selector - Stack on mobile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-2 sm:gap-0">
        <div className="p-2 sm:p-3 text-base sm:text-xl bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-full border border-[#333] text-white mr-0 sm:mr-4">
          El día de hoy
        </div>
        <div className="p-2 sm:p-3 text-base sm:text-xl bg-transparent text-white mr-0 sm:mr-auto">
          Feb <span className="text-[#a0a0a0]">{startDate}</span> - Feb <span className="text-[#a0a0a0]">{endDate}</span>, {currentYear}
        </div>
        <div className="flex items-center p-2 sm:p-3 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-full border border-[#333] text-white w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center">
            <img 
              src="/pin.png" 
              alt="Location Pin" 
              className="w-6 h-6 sm:w-8 sm:h-8 mr-2"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E";
              }}
            />
            <span className="mr-2 text-sm sm:text-xl truncate">10:55 America/Argentina/Buenos Aires</span>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Filters - Stack on mobile */}
      <div className="flex flex-col mb-6 gap-4">
        {/* Impact filter */}
        <div>
          <h3 className="text-gray-400 mb-2 text-xl">Filtrar por impacto</h3>
          <div className="grid grid-cols-2 sm:flex sm:space-x-3 gap-2 sm:gap-0">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox h-4 w-4 text-cyan-500 rounded bg-[#333] border-[#444]"
                checked={impactFilters.feriados}
                onChange={() => toggleImpactFilter('feriados')}
              />
              <span>Feriados</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox h-4 w-4 text-cyan-500 rounded bg-[#333] border-[#444]"
                checked={impactFilters.bajo}
                onChange={() => toggleImpactFilter('bajo')}
              />
              <span>Bajo</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox h-4 w-4 text-cyan-500 rounded bg-[#333] border-[#444]"
                checked={impactFilters.medio}
                onChange={() => toggleImpactFilter('medio')}
              />
              <span>Medio</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox h-4 w-4 text-cyan-500 rounded bg-[#333] border-[#444]"
                checked={impactFilters.alto}
                onChange={() => toggleImpactFilter('alto')}
              />
              <span>Alto</span>
            </label>
          </div>
        </div>

        {/* Visibility filter */}
        <div>
          <h3 className="text-gray-400 mb-2">Filtrar por visibilidad</h3>
          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox h-4 w-4 text-cyan-500 rounded bg-[#333] border-[#444]"
                checked={visibilityFilters.ocultarNoticias}
                onChange={() => toggleVisibilityFilter('ocultarNoticias')}
              />
              <span>Ocultar noticias pasadas</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox h-4 w-4 text-cyan-500 rounded bg-[#333] border-[#444]"
                checked={visibilityFilters.mostrarRestringidos}
                onChange={() => toggleVisibilityFilter('mostrarRestringidos')}
              />
              <span>Mostrar solo eventos restringidos</span>
            </label>
          </div>
        </div>
      </div>

      {/* Events table - Card view on mobile, table on desktop */}
      <div className="p-2 sm:p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
        {/* Desktop Table (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="py-4 px-3 font-medium">Descripcion</th>
                <th className="py-4 px-3 font-medium">Instrumento</th>
                <th className="py-4 px-3 font-medium">Fecha</th>
                <th className="py-4 px-3 font-medium">Actual</th>
                <th className="py-4 px-3 font-medium">Pronostico</th>
                <th className="py-4 px-3 font-medium">Previo</th>
                <th className="py-4 px-3 font-medium">Accion</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr 
                  key={index}
                  className={`border-b border-gray-800 ${event.highlighted ? 'bg-[#3d2c2e]' : ''}`}
                >
                  <td className="py-4 px-3">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${getImpactColor(event.color)}`}></div>
                        <span>{event.description}</span>
                      </div>
                      {event.highlighted && (
                        <div className="flex items-center text-red-500 text-xs mt-1 ml-6">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Evento Restringido
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 mr-2 flex items-center justify-center">
                        <img src="/us.png" alt="USD" className="max-w-full max-h-full" 
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'%3E%3Crect width='24' height='16' fill='%233C3B6E'/%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      <span>{event.instrument}</span>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <div>
                      <div>{event.time} {event.date}</div>
                      {event.color !== 'red' && (
                        <div className="text-xs text-gray-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {event.timestamp}
                        </div>
                      )}
                      {event.color === 'red' && (
                        <div className="text-xs text-cyan-500 mt-1">Expirado</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-3">{event.actual}</td>
                  <td className="py-4 px-3">{event.forecast}</td>
                  <td className="py-4 px-3">{event.previous}</td>
                  <td className="py-4 px-3">
                    <button className="p-2 bg-transparent">
                    <img src="/calendar.png" className="max-w-full max-h-full" 
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'%3E%3Crect width='24' height='16' fill='%233C3B6E'/%3E%3C/svg%3E";
                        }}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (hidden on desktop) */}
        <div className="md:hidden space-y-4">
          {events.map((event, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg border border-gray-800 ${event.highlighted ? 'bg-[#3d2c2e]' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getImpactColor(event.color)}`}></div>
                  <span className="font-medium">{event.description}</span>
                </div>
                <button className="p-1 bg-transparent">
                  <Calendar className="h-5 w-5" />
                </button>
              </div>

              {event.highlighted && (
                <div className="flex items-center text-red-500 text-xs mb-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Evento Restringido
                </div>
              )}

              <div className="grid grid-cols-2 gap-y-2">
                <div>
                  <div className="text-xs text-gray-400">Instrumento</div>
                  <div className="flex items-center">
                    <div className="w-5 h-3 mr-1 flex items-center justify-center">
                      <img src="/us.png" alt="USD" className="max-w-full max-h-full" 
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'%3E%3Crect width='24' height='16' fill='%233C3B6E'/%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <span>{event.instrument}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">Fecha</div>
                  <div>
                    <div>{event.time} {event.date}</div>
                    {event.color !== 'red' && (
                      <div className="text-xs text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {event.timestamp}
                      </div>
                    )}
                    {event.color === 'red' && (
                      <div className="text-xs text-red-500">Vencido</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">Actual</div>
                  <div>{event.actual}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">Pronostico</div>
                  <div>{event.forecast}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">Previo</div>
                  <div>{event.previous}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Noticias;