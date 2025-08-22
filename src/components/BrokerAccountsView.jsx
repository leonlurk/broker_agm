import React, { useState } from 'react';
import { useAccounts, ACCOUNT_CATEGORIES } from '../contexts/AccountsContext';
import BrokerAccountCreation from './BrokerAccountCreation';
import { ArrowLeft, Plus } from 'lucide-react';

const BrokerAccountsView = ({ setSelectedOption, onBack }) => {
  const { accounts, isLoading, error, getAccountsByCategory } = useAccounts();
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'create'
  
  const realAccounts = getAccountsByCategory(ACCOUNT_CATEGORIES.REAL);

  const handleCreateAccount = () => {
    setCurrentView('create');
  };

  const handleBackToList = () => {
    setCurrentView('list');
  };

  const handleAccountCreated = (newAccount) => {
    console.log('New broker account created:', newAccount);
    // Account is automatically added to context via addAccount in BrokerAccountCreation
    setCurrentView('list');
  };

  // Create Account View
  if (currentView === 'create') {
    return (
      <div className="p-4 text-white">
        <div className="mb-6">
          <button
            onClick={handleBackToList}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Volver a Cuentas</span>
          </button>
          <h1 className="text-2xl font-semibold">Crear Cuenta Real de Broker</h1>
        </div>
        
        <BrokerAccountCreation
          onAccountCreated={handleAccountCreated}
          onCancel={handleBackToList}
        />
      </div>
    );
  }

  // Main Accounts List View
  return (
    <div className="p-4 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-4">Cuentas de Broker</h1>
        <p className="text-gray-400 mb-6">
          Gestiona tus cuentas reales de trading conectadas directamente al servidor MetaTrader 5.
        </p>

        {/* Create Account Button */}
        <button
          onClick={handleCreateAccount}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] hover:opacity-90 text-white rounded-lg transition-opacity"
        >
          <Plus size={20} />
          <span>Crear Cuenta Real</span>
        </button>
      </div>

      {/* Accounts List */}
      <div>
        <h2 className="text-lg font-medium mb-4">Tus Cuentas Reales ({realAccounts.length})</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando cuentas...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400">Error: {error}</p>
          </div>
        ) : realAccounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-700 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Plus size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No tienes cuentas reales</h3>
            <p className="text-gray-400 mb-6">
              Crea tu primera cuenta real para comenzar a operar en el mercado.
            </p>
            <button
              onClick={handleCreateAccount}
              className="px-6 py-3 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] hover:opacity-90 text-white rounded-lg transition-opacity"
            >
              Crear Mi Primera Cuenta
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {realAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-[#2a2a2a] border border-[#333] rounded-lg p-6 hover:border-cyan-500/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {account.accountName}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Login: {account.accountNumber} • {account.group || 'Standard Group'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        account.status === 'Active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {account.status}
                    </span>
                    {account.isBroker && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                        REAL
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Balance</p>
                    <p className="text-lg font-semibold text-white">
                      ${account.balance?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Equity</p>
                    <p className="text-lg font-semibold text-white">
                      ${account.equity?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Apalancamiento</p>
                    <p className="text-lg font-semibold text-white">
                      1:{account.leverage || 100}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Servidor</p>
                    <p className="text-sm text-white">{account.server || 'AGM-Server'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#333]">
                  <div className="text-xs text-gray-400">
                    Creada: {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                      Depositar
                    </button>
                    <button className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors">
                      Retirar
                    </button>
                    <button className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors">
                      Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Section */}
      <div className="mt-8 p-6 bg-[#1a1a1a] border border-[#333] rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">
          Información sobre Cuentas Reales
        </h3>
        <div className="space-y-2 text-sm text-gray-400">
          <p>• Las cuentas reales están conectadas directamente al servidor MetaTrader 5</p>
          <p>• Todas las operaciones se ejecutan en tiempo real en el mercado</p>
          <p>• Los depósitos y retiros afectan el balance real de tu cuenta</p>
          <p>• Puedes acceder a estas cuentas desde cualquier terminal MT5 con tus credenciales</p>
        </div>
      </div>
    </div>
  );
};

export default BrokerAccountsView;