import React, { useState } from 'react';
import { X, Plus, DollarSign, Settings } from 'lucide-react';
import { useAccounts } from '../contexts/AccountsContext';

const AccountSelectionModal = ({ isOpen, onClose, trader, onAccountSelected }) => {
  const { getAllAccounts, isLoading } = useAccounts();
  const [selectedAccount, setSelectedAccount] = useState(null);

  const accounts = getAllAccounts();
  const realAccounts = accounts.filter(acc => 
    acc.account_type === 'Real' || 
    acc.accountType === 'Real'
  );

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
  };

  const handleContinue = () => {
    if (selectedAccount) {
      onAccountSelected(selectedAccount);
      onClose();
    }
  };

  const handleCreateAccount = () => {
    // This could trigger a navigation to create account or open another modal
    // For now, we'll just close this modal and user can create account elsewhere
    onClose();
    // TODO: Implement navigation to create account flow
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500 bg-opacity-20 rounded-lg">
              <Settings className="text-cyan-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Seleccionar Cuenta</h2>
              <p className="text-sm text-gray-400">Elige la cuenta para copiar a {trader?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Cargando cuentas...</p>
            </div>
          ) : realAccounts.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">
                Selecciona una cuenta real para comenzar a copiar las operaciones:
              </p>
              
              {realAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => handleAccountSelect(account)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedAccount?.id === account.id
                      ? 'border-cyan-500 bg-cyan-500 bg-opacity-10'
                      : 'border-[#333] bg-[#2a2a2a] hover:border-[#444] hover:bg-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{account.account_name || account.accountName}</h3>
                      <p className="text-sm text-gray-400">#{account.account_number || account.accountNumber}</p>
                      <p className="text-xs text-gray-500">{account.account_type_selection || account.accountTypeSelection} • Apalancamiento 1:{account.leverage}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-white font-semibold">
                        <DollarSign size={14} />
                        <span>{account.balance?.toLocaleString() || '0'}</span>
                      </div>
                      <p className="text-xs text-gray-400">Balance</p>
                    </div>
                  </div>
                  
                  {selectedAccount?.id === account.id && (
                    <div className="mt-3 pt-3 border-t border-cyan-500 border-opacity-30">
                      <p className="text-xs text-cyan-400">✓ Cuenta seleccionada</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 bg-[#2a2a2a] rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No tienes cuentas reales</h3>
              <p className="text-gray-400 mb-4 text-sm">
                Necesitas al menos una cuenta real para poder copiar traders.
              </p>
              <button
                onClick={handleCreateAccount}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                <Plus size={16} />
                Crear Cuenta Real
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {realAccounts.length > 0 && (
          <div className="flex gap-3 p-6 border-t border-[#333]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedAccount}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSelectionModal;