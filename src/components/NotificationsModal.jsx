import React from 'react';
import { X } from 'lucide-react';

const NotificationsModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Modal content */}
      <div className="bg-[#232323] border border-[#333] rounded-3xl w-full max-w-xl max-h-[80vh] overflow-y-auto z-10">
        <div className="p-4 flex justify-between items-center border-b border-[#333]">
          <h2 className="text-4xl text-white font-medium">Notificaciones</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:text-white transition-colors focus:outline-none"
          >
            <X size={30} />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
          {/* Notification item */}
          <div className="p-4 border-b border-[#333] hover:bg-[#2a2a2a] transition-colors">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="bg-[#2d2d2d] p-2 rounded-full">
                  <img 
                    src="/trophy_competition.png" 
                    alt="Trophy" 
                    className="w-8 h-8"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='%23FFD700' d='M11.23 6C11.23 4.89543 12.1254 4 13.23 4H21C22.1046 4 23 4.89543 23 6V8C23 9.10457 22.1046 10 21 10H13.23C12.1254 10 11.23 9.10457 11.23 8V6Z'/%3E%3Cpath fill='%23FFD700' d='M5 16.5C5 14.142 6.90279 12.1891 9.27759 12.0196C9.86318 12.0652 10.4219 12.2136 10.9384 12.4718C11.3619 12.7643 11.5287 13.3066 11.2826 13.7620L9.8455 16.169C9.6331 16.5485 9.15183 16.7188 8.7469 16.5475C7.5678 16.0925 6.7669 15.0151 6.7669 13.75C6.7669 13.4408 6.4377 13.2156 6.14645 13.3372C5.47363 13.6259 5 14.2909 5 15.0645V16.5Z'/%3E%3Cpath fill='%23FFD700' d='M1 10C1 8.89543 1.89543 8 3 8H11C12.1046 8 13 8.89543 13 10V13.5C13 16.5376 10.5376 19 7.5 19C4.46243 19 2 16.5376 2 13.5V13H1V10Z'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white text-xl font-medium">FELICITACIONES!!</h3>
                <p className="text-gray-400">Ganaste La Competencia De Enero</p>
              </div>
              <div>
                <button className="px-3 py-1 text-sm bg-[#2d2d2d] hover:bg-[#333] text-white rounded-md focus:outline-none">
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
          
          {/* Additional notifications would go here */}
          <div className="p-4 border-b border-[#333] hover:bg-[#2a2a2a] transition-colors">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="bg-[#2d2d2d] p-2 rounded-full">
                  <img 
                    src="/coins.png" 
                    alt="Coins" 
                    className="w-8 h-8"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='%23FFD700' d='M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white text-xl font-medium">Pago Recibido</h3>
                <p className="text-gray-400">Has recibido un pago de $1,250.00</p>
              </div>
              <div>
                <button className="px-3 py-1 text-sm bg-[#2d2d2d] hover:bg-[#333] text-white rounded-md focus:outline-none">
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-b border-[#333] hover:bg-[#2a2a2a] transition-colors">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="bg-[#2d2d2d] p-2 rounded-full">
                  <img 
                    src="/graph.png" 
                    alt="Graph" 
                    className="w-8 h-8"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='%234CAF50' d='M3.5 18.5L9.5 12.5L13.5 16.5L22 7.5L20.5 6L13.5 13.5L9.5 9.5L2 17L3.5 18.5Z'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white text-xl font-medium">Objetivo Alcanzado</h3>
                <p className="text-gray-400">Has superado tu objetivo de profit del mes</p>
              </div>
              <div>
                <button className="px-3 py-1 text-sm bg-[#2d2d2d] hover:bg-[#333] text-white rounded-md focus:outline-none">
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
          
          {/* Empty state if needed */}
          {/* Uncomment and use a state variable to show this when needed
            <div className="p-8 flex flex-col items-center justify-center">
              <div className="rounded-full bg-[#2d2d2d] p-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-gray-400 text-center">No tienes notificaciones nuevas</p>
            </div>
          */}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;