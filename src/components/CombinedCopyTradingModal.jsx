import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, Shield, Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { useAccounts } from '../contexts/AccountsContext';
import { useTranslation } from 'react-i18next';
import { followMaster } from '../services/copytradingService';
import { supabase } from '../supabase/config';
import toast from 'react-hot-toast';

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Simplified copy trading configuration
  const [formData, setFormData] = useState({
    montoInversion: 1000,
    metodoAsignacion: 'proporcional', // 'proporcional' or 'fijo'
    copyStopLoss: 40,
    // Advanced settings (hidden by default)
    multiplicadorLote: 1.0,
    copiarSL: true,
    copiarTP: true
  });

  // Reset modal when opening/closing
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('account-selection');
      setSelectedAccount(null);
      setShowAdvanced(false);
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
      toast.error('Por favor selecciona una cuenta valida');
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
        toast.error('Error: No se pudo obtener la informacion del trader');
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
        toast.error('Error: El trader no tiene configurada una cuenta MT5 como master');
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

      console.log('Copy Trading activado desde modal combinado:', response);
      toast.success(`Ahora estas copiando a ${trader.name}`);

      if (onConfirm) {
        onConfirm(formData, trader, selectedAccount);
      }

      onClose();
    } catch (error) {
      console.error('Error al copiar trader:', error);
      toast.error(`Error: ${error.error || error.message || 'No se pudo activar el copy trading'}`);
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
                ← Atras
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
                  : 'Configura los parametros de copy trading'
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

              {/* Simplified Copy Configuration */}
              <div className="space-y-5">
                {/* Investment Amount */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Monto de Inversion (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="number"
                      value={formData.montoInversion}
                      onChange={(e) => setFormData(prev => ({...prev, montoInversion: Number(e.target.value)}))}
                      className="w-full pl-10 pr-4 py-3 bg-[#2b2b2b] border border-[#333] rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                      min="100"
                      step="100"
                      placeholder="1000"
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">Minimo: $100</p>
                </div>

                {/* Allocation Method */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Metodo de Asignacion
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, metodoAsignacion: 'proporcional'}))}
                      className={`p-3 rounded-lg border transition-colors text-sm ${
                        formData.metodoAsignacion === 'proporcional'
                          ? 'border-cyan-500 bg-cyan-500 bg-opacity-20 text-cyan-400'
                          : 'border-[#333] bg-[#2b2b2b] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium">Proporcional</div>
                      <div className="text-xs text-gray-400 mt-1">Ajusta segun balance</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, metodoAsignacion: 'fijo'}))}
                      className={`p-3 rounded-lg border transition-colors text-sm ${
                        formData.metodoAsignacion === 'fijo'
                          ? 'border-cyan-500 bg-cyan-500 bg-opacity-20 text-cyan-400'
                          : 'border-[#333] bg-[#2b2b2b] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium">Monto Fijo</div>
                      <div className="text-xs text-gray-400 mt-1">Mismo lote siempre</div>
                    </button>
                  </div>
                </div>

                {/* Copy Stop Loss Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-white font-medium">
                      Copy Stop Loss
                    </label>
                    <span className="text-cyan-400 font-medium">{formData.copyStopLoss}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={formData.copyStopLoss}
                    onChange={(e) => setFormData(prev => ({...prev, copyStopLoss: Number(e.target.value)}))}
                    className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10%</span>
                    <span>100%</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    Detiene el copiado si tu cuenta pierde este porcentaje del monto invertido
                  </p>
                </div>

                {/* Advanced Settings Collapsible */}
                <div className="border border-[#333] rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-4 bg-[#2b2b2b] hover:bg-[#333] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Settings size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-300">Configuracion Avanzada</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showAdvanced && (
                    <div className="p-4 bg-[#1C1C1C] space-y-4">
                      {/* Lot Multiplier */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Multiplicador de Lote
                        </label>
                        <input
                          type="number"
                          value={formData.multiplicadorLote}
                          onChange={(e) => setFormData(prev => ({...prev, multiplicadorLote: Number(e.target.value)}))}
                          className="w-full px-4 py-2 bg-[#2b2b2b] border border-[#333] rounded-lg text-white text-sm focus:border-cyan-400 focus:outline-none"
                          min="0.1"
                          max="10"
                          step="0.1"
                        />
                        <p className="text-gray-500 text-xs mt-1">
                          Factor de multiplicacion para el tamano de las operaciones
                        </p>
                      </div>

                      {/* Copy SL/TP */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Copiar Stop Loss del trader</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.copiarSL}
                            onChange={(e) => setFormData(prev => ({...prev, copiarSL: e.target.checked}))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#333] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Copiar Take Profit del trader</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.copiarTP}
                            onChange={(e) => setFormData(prev => ({...prev, copiarTP: e.target.checked}))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#333] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                        </label>
                      </div>
                    </div>
                  )}
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
