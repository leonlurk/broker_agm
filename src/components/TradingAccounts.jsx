import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const TradingAccounts = () => {
  const [activeTab, setActiveTab] = useState('Fase 1');
  
  const accounts = [
    { id: 1, status: 'Activa', type: 'ONE STEP CHALLENGE 100K' },
    { id: 2, status: 'Aprobada', type: 'ONE STEP CHALLENGE 100K' },
    { id: 3, status: 'Perdida', type: 'ONE STEP CHALLENGE 100K' },
    { id: 4, status: 'Activa', type: 'ONE STEP CHALLENGE 100K' },
    { id: 5, status: 'Aprobada', type: 'ONE STEP CHALLENGE 100K' }
  ];
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Activa':
        return 'bg-cyan-500/30 text-cyan-500';
      case 'Aprobada':
        return 'bg-green-900/30 text-green-600';
      case 'Perdida':
        return 'bg-red-900/30 text-red-500';
      default:
        return 'bg-gray-800 text-gray-400';
    }
  };
  
  return (
    <div className="flex flex-col p-4 bg-[#232323] text-white min-h-screen">
      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {['Fase 1', 'Fase 2', 'Cuenta Real'].map((tab) => (
          <button
            key={tab}
            className={`px-6 py-3 rounded-full focus:outline-none ${
              activeTab === tab
                ? 'border border-cyan-500 bg-gradient-to-br from-[#232323] to-[#2d2d2d]'
                : 'border border-[#333] bg-gradient-to-br from-[#232323] to-[#2d2d2d]'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Account List */}
      <div className="space-y-4">
        {accounts.map((account) => (
          <div 
            key={account.id} 
            className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333] flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="w-14 h-14 mr-4 flex items-center justify-center">
              <img src="/userchart.png"/>
              </div>
              <div>
                <div className="font-medium text-lg">{account.type}</div>
                <div className="text-gray-400 text-sm">
                  Server Type: MT5
                  <br />
                  Cuenta: 657237
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-1 rounded-full text-sm ${getStatusBadgeClass(account.status)}`}>
                {account.status}
              </span>
              <button className="px-4 py-2 rounded-full bg-[#232323] border border-[#333] hover:bg-[#2a2a2a] transition focus:outline-none">
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradingAccounts;