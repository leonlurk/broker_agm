import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, Shield, Settings, ChevronRight } from 'lucide-react';
import { useAccounts } from '../contexts/AccountsContext';
import { useTranslation } from 'react-i18next';
import { followMaster } from '../services/copytradingService';
import { supabase } from '../supabase/config';

const CombinedCopyTradingModal = ({ 
  isOpen, 
  onClose, 
  trader, 
  onConfirm 
}) => {
  const { t } = useTranslation('copytrading');
  const { accounts } = useAccounts();
  
  // Modal steps: 'account-selection' -> 'copy-configuration'
  const [currentStep, setCurrentStep] = useState('account-selection');
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  // Copy trading configuration
  const [formData, setFormData] = useState({
    capitalAsignado: 5000,
    porcentajeRiesgo: 5,
    limitePerdida: 1000,
    limiteGanancia: 10000,
    copiarTodas: true,
    instrumentosSeleccionados: [],
    multiplicadorLote: 1.0,
    detenerSiPerdida: true,
    detenerSiGanancia: false
  });

  // Reset modal when opening/closing
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('account-selection');
      setSelectedAccount(null);
    }
  }, [isOpen]);

  if (!isOpen || !trader) return null;

  const handleAccountSelect = (account) => {
    console.log('Account selected in combined modal:', account);
    setSelectedAccount(account);
    setCurrentStep('copy-configuration');
  };

  const handleBackToAccountSelection = () => {
    setCurrentStep('account-selection');
  };

  const handleConfirm = async () => {
    console.log('Combined modal confirm - trader:', trader);
    console.log('Combined modal confirm - account:', selectedAccount);
    console.log('Combined modal confirm - formData:', formData);
    
    if (!selectedAccount || !trader) {
      alert('Por favor selecciona una cuenta válida');
      return;
    }

    try {
      // Fetch full trader profile data from Supabase to get master_config
      console.log('Fetching full trader profile for ID:', trader.id);
      const { data: traderProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', trader.id)
        .single();

      if (error) {
        console.error('Error fetching trader profile:', error);
        alert('Error: No se pudo obtener la información del trader');
        return;
      }

      console.log('Debug - Full trader profile from DB:', traderProfile);
      console.log('Debug - trader profile master_config:', traderProfile?.master_config);

      // Extract master MT5 account from the full profile data
      const masterMt5Account = traderProfile?.master_config?.cuentaMT5Seleccionada || 
                              traderProfile?.master_config?.master_mt5_account ||
                              traderProfile?.master_config?.master_account ||
                              traderProfile?.masterAccount ||
                              traderProfile?.mt5Account;
      
      console.log('Debug - Extracted masterMt5Account from profile:', masterMt5Account);
      
      if (!masterMt5Account) {
        console.error('Debug - No MT5 account found in trader profile:', traderProfile);
        alert('Error: El trader no tiene configurada una cuenta MT5 como master');
        return;
      }

      const requestParams = {
        master_user_id: trader.id,
        master_mt5_account_id: masterMt5Account,
        follower_mt5_account_id: selectedAccount.account_number || selectedAccount.id,
        risk_ratio: formData.multiplicadorLote || 1.0
      };
      
      console.log('Debug - Request parameters being sent to backend:', requestParams);
      
      const response = await followMaster(requestParams);
      
      console.log('✅ Copy Trading activado desde modal combinado:', response);
      alert(`✅ Ahora estás copiando a ${trader.name}`);
      
      if (onConfirm) {
        onConfirm(formData, trader, selectedAccount);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Error al copiar trader:', error);
      alert(`Error: ${error.error || error.message || 'No se pudo activar el copy trading'}`);
    }
  };

  const realAccounts = accounts?.['Cuentas Reales'] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-4">
            {currentStep === 'copy-configuration' && (
              <button
                onClick={handleBackToAccountSelection}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                ← Atrás
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-white">
                {currentStep === 'account-selection' 
                  ? 'Seleccionar Cuenta' 
                  : `Copiar a ${trader.name}`
                }
              </h2>
              <p className="text-gray-400 text-sm">
                {currentStep === 'account-selection'
                  ? 'Elige la cuenta para copiar las operaciones'
                  : 'Configura los parámetros de copy trading'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'account-selection' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <img 
                    src={trader.avatar} 
                    alt={trader.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-white">{trader.name}</h3>
                    <p className="text-gray-400">Performance: {trader.monthlyPerformance}%</p>
                  </div>
                </div>
              </div>

              {realAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No tienes cuentas reales disponibles</p>
                  <button
                    onClick={onClose}
                    className="bg-[#0F7490] text-white px-6 py-2 rounded-lg hover:bg-[#0A5A72] transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-white font-medium mb-3">Selecciona una cuenta real:</h4>
                  {realAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => handleAccountSelect(account)}
                      className="bg-[#2b2b2b] border border-[#333] rounded-xl p-4 cursor-pointer hover:border-cyan-400 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#0F7490] to-[#0A5A72] rounded-lg flex items-center justify-center">
                              <DollarSign size={20} className="text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{account.account_name}</h3>
                              <p className="text-gray-400 text-sm">#{account.account_number}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Balance:</span>
                              <span className="text-white ml-2">${account.balance?.toLocaleString() || '0'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Equity:</span>
                              <span className="text-white ml-2">${account.equity?.toLocaleString() || '0'}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 'copy-configuration' && selectedAccount && (
            <div className="space-y-6">
              {/* Selected Account Info */}
              <div className="bg-[#2b2b2b] border border-[#333] rounded-xl p-4">
                <h4 className="text-white font-medium mb-2">Cuenta seleccionada:</h4>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#0F7490] to-[#0A5A72] rounded-lg flex items-center justify-center">
                    <DollarSign size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white">{selectedAccount.account_name}</p>
                    <p className="text-gray-400 text-sm">#{selectedAccount.account_number}</p>
                  </div>
                </div>
              </div>

              {/* Copy Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Capital Asignado (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.capitalAsignado}
                    onChange={(e) => setFormData(prev => ({...prev, capitalAsignado: Number(e.target.value)}))}
                    className="w-full bg-[#2b2b2b] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    min="100"
                    step="100"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Multiplicador de Lote
                  </label>
                  <input
                    type="number"
                    value={formData.multiplicadorLote}
                    onChange={(e) => setFormData(prev => ({...prev, multiplicadorLote: Number(e.target.value)}))}
                    className="w-full bg-[#2b2b2b] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    min="0.1"
                    max="10"
                    step="0.1"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Factor de multiplicación para el tamaño de las operaciones
                  </p>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Porcentaje de Riesgo (%)
                  </label>
                  <input
                    type="number"
                    value={formData.porcentajeRiesgo}
                    onChange={(e) => setFormData(prev => ({...prev, porcentajeRiesgo: Number(e.target.value)}))}
                    className="w-full bg-[#2b2b2b] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    min="1"
                    max="20"
                    step="1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Límite de Pérdida (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.limitePerdida}
                      onChange={(e) => setFormData(prev => ({...prev, limitePerdida: Number(e.target.value)}))}
                      className="w-full bg-[#2b2b2b] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                      min="0"
                      step="100"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Límite de Ganancia (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.limiteGanancia}
                      onChange={(e) => setFormData(prev => ({...prev, limiteGanancia: Number(e.target.value)}))}
                      className="w-full bg-[#2b2b2b] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="copiarTodas"
                    checked={formData.copiarTodas}
                    onChange={(e) => setFormData(prev => ({...prev, copiarTodas: e.target.checked}))}
                    className="w-4 h-4 text-cyan-400 bg-[#2b2b2b] border-[#333] rounded focus:ring-cyan-400"
                  />
                  <label htmlFor="copiarTodas" className="text-white">
                    Copiar todas las operaciones del trader
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBackToAccountSelection}
                  className="flex-1 bg-[#2b2b2b] text-white py-3 px-6 rounded-xl hover:bg-[#333] transition-colors border border-[#333]"
                >
                  Cambiar Cuenta
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-6 rounded-xl hover:opacity-90 transition-opacity font-medium"
                >
                  Confirmar Copy Trading
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CombinedCopyTradingModal;
