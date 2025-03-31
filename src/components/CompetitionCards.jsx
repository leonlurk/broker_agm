import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const CompetitionCards = ({ onShowLeaderboard }) => {
  const [activeTab, setActiveTab] = useState('Gratuitas');
  
  const competitions = [
    {
      id: 1,
      title: 'Competencia de Enero',
      status: 'Activo',
      startDate: '1/01/2025',
      endDate: '31/01/2025',
      prize: '100k Challenge',
      participants: '8,691',
      timeRemaining: '7:5:27:20'
    },
    {
      id: 2,
      title: 'Competencia de Enero',
      status: 'Finalizada',
      startDate: '1/01/2025',
      endDate: '31/01/2025',
      prize: '100k Challenge',
      participants: '8,691',
      timeRemaining: '7:5:27:20'
    },
    {
      id: 3,
      title: 'Competencia de Enero',
      status: 'Proximamente',
      startDate: '1/01/2025',
      endDate: '31/01/2025',
      prize: '100k Challenge',
      participants: '8,691',
      timeRemaining: '7:5:27:20'
    }
  ];
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Activo':
        return 'bg-cyan-700 text-white';
      case 'Finalizada':
        return 'bg-gray-700 text-white';
      case 'Proximamente':
        return 'bg-gray-700 text-white';
      default:
        return 'bg-gray-800 text-gray-400';
    }
  };
  
  return (
    <div className="flex flex-col p-4 bg-[#232323] text-white min-h-screen">
      {/* Tab Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            className={`px-6 py-2 rounded-full flex items-center space-x-2 focus:outline-none ${
              activeTab === 'Gratuitas'
                ? 'border border-cyan-500 bg-gradient-to-br from-[#232323] to-[#2d2d2d]'
                : 'border border-[#333] bg-gradient-to-br from-[#232323] to-[#2d2d2d]'
            }`}
            onClick={() => setActiveTab('Gratuitas')}
          >
            <img src="/trophy_icon.png" alt="Trophy" className="w-5 h-5" />
            <span>Gratuitas</span>
          </button>
          <button
            className={`px-6 py-2 rounded-full flex items-center space-x-2 focus:outline-none ${
              activeTab === 'APE'
                ? 'border border-cyan-500 bg-gradient-to-br from-[#232323] to-[#2d2d2d]'
                : 'border border-[#333] bg-gradient-to-br from-[#232323] to-[#2d2d2d]'
            }`}
            onClick={() => setActiveTab('APE')}
          >
            <img src="/cup_icon.png" alt="Cup" className="w-5 h-5" />
            <span>APE Funded Cup</span>
          </button>
        </div>
        
        <button className="focus:outline-none px-6 py-2 rounded-full border border-[#333] bg-gradient-to-br from-[#232323] to-[#2d2d2d] flex items-center space-x-2">
          <img src="/filter_icon.png" alt="Filter" className="w-5 h-5" />
          <span>Filtros</span>
        </button>
      </div>
      
      {/* Competition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitions.map((competition) => (
          <div 
            key={competition.id} 
            className="p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <img 
                src={competition.status === 'Activo' ? "/trophy_competition.png" : "/trophy_competition_gray.png"} 
                alt="Trophy" 
                className="w-8 h-8 mr-3" 
              />
                <div className="font-medium">{competition.title}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(competition.status)}`}>
                {competition.status}
              </span>
            </div>
            
            {/* Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <img src="/calendar_icon.png" alt="Calendar" className="w-8 h-8 mr-3" />
                <div className="grid grid-cols-2 gap-x-6 w-full">
                  <div>
                    <div className="text-sm text-gray-400">Inicio</div>
                    <div>{competition.startDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Fin</div>
                    <div>{competition.endDate}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <img src="/medal_icon.png" alt="Medal" className="w-6 h-8 mr-3" />
                <div>
                  <div className="text-sm text-gray-400">Premio</div>
                  <div>{competition.prize}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <img src="/users_icon.png" alt="Users" className="w-6 h-6 mr-3" />
                <div>
                  <div className="text-sm text-gray-400">Participantes</div>
                  <div>{competition.participants}</div>
                </div>
              </div>
            </div>
            
            {/* Timer */}
            <div>
              <div className="text-sm text-gray-400 mb-2">
                Tiempo Restante <span className="text-xs">(GMT +2:00)</span>
              </div>
              <div className="grid grid-cols-4 mb-2">
                <div className="text-3xl font-bold text-center">{competition.timeRemaining.split(':')[0]}</div>
                <div className="text-3xl font-bold text-center">{competition.timeRemaining.split(':')[1]}</div>
                <div className="text-3xl font-bold text-center">{competition.timeRemaining.split(':')[2]}</div>
                <div className="text-3xl font-bold text-center">{competition.timeRemaining.split(':')[3]}</div>
                </div>
                <div className="grid grid-cols-4 text-xs text-gray-400">
                <div className="text-center">Días</div>
                <div className="text-center">Horas</div>
                <div className="text-center">Minutos</div>
                <div className="text-center">Segundos</div>
                </div>
            </div>
            
            {/* Buttons */}
            <div className="flex mt-6 space-x-2">
              <button 
                className="focus:outline-none flex-1 py-2 rounded-md bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] hover:bg-gradient-to-br hover:from-[#262626] hover:to-[#303030] transition-all"
                onClick={onShowLeaderboard} // Añadimos el evento para abrir el modal Leaderboard
              >
                Detalles
              </button>
              <button className="focus:outline-none flex-1 py-2 rounded-md bg-gradient-to-br from-[#0a5a72] to-[#202c36] text-white hover:opacity-90 transition-all">
                Ingresar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Definimos las PropTypes para validar props
CompetitionCards.propTypes = {
  onShowLeaderboard: PropTypes.func
};

// Valores predeterminados para evitar errores si no se pasa la prop
CompetitionCards.defaultProps = {
  onShowLeaderboard: () => {}
};

export default CompetitionCards;