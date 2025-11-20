import React, { useState } from 'react';
import { X, DollarSign, AlertTriangle, Settings, Target, ChevronDown } from 'lucide-react';
import useTranslation from '../hooks/useTranslation';

const SeguirTraderModal = ({ isOpen, onClose, trader, selectedAccount, onConfirm }) => {
  const { t } = useTranslation();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Simplified form data
  const [formData, setFormData] = useState({
    montoInversion: 1000,
    metodoAsignacion: 'proporcional', // 'proporcional' or 'fijo'
    copyStopLoss: 40,
    // Advanced settings (hidden by default)
    multiplicadorLote: 1.0,
    copiarSL: true,
    copiarTP: true
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.montoInversion || formData.montoInversion < 100) {
      newErrors.montoInversion = t('followTrader.minCapitalError') || 'El monto minimo es $100';
    }

    if (formData.multiplicadorLote < 0.1 || formData.multiplicadorLote > 10) {
      newErrors.multiplicadorLote = 'El multiplicador debe estar entre 0.1 y 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onConfirm(formData, trader, selectedAccount);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500 bg-opacity-20 rounded-lg">
              <Target className="text-cyan-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{t('followTrader.followTrader') || 'Seguir Trader'}</h2>
              <p className="text-sm text-gray-400">{t('followTrader.configureFollow') || 'Configura tu seguimiento'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Selected Account Info */}
        {selectedAccount && (
          <div className="p-6 border-b border-[#333] bg-[#262626]">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Cuenta seleccionada para copiar</h4>
            <div className="flex items-center justify-between bg-[#2a2a2a] p-4 rounded-lg border border-[#333]">
              <div>
                <h5 className="font-semibold text-white">{selectedAccount.accountName || selectedAccount.account_name}</h5>
                <p className="text-sm text-gray-400">#{selectedAccount.accountNumber || selectedAccount.account_number}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-white font-semibold">
                  <DollarSign size={14} />
                  <span>{selectedAccount.balance?.toLocaleString() || '0'}</span>
                </div>
                <p className="text-xs text-gray-400">Balance disponible</p>
              </div>
            </div>
          </div>
        )}

        {/* Simplified Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Investment Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {t('followTrader.assignedCapital') || 'Monto de Inversion'} *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="number"
                value={formData.montoInversion}
                onChange={(e) => handleInputChange('montoInversion', Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                placeholder="1000"
                min="100"
              />
            </div>
            <p className="text-xs text-gray-500">Minimo: $100</p>
            {errors.montoInversion && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertTriangle size={14} />
                {errors.montoInversion}
              </p>
            )}
          </div>

          {/* Allocation Method */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Metodo de Asignacion
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('metodoAsignacion', 'proporcional')}
                className={`p-3 rounded-lg border transition-colors text-sm ${
                  formData.metodoAsignacion === 'proporcional'
                    ? 'border-cyan-500 bg-cyan-500 bg-opacity-20 text-cyan-400'
                    : 'border-[#333] bg-[#2a2a2a] text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="font-medium">Proporcional</div>
                <div className="text-xs text-gray-400 mt-1">Ajusta segun balance</div>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('metodoAsignacion', 'fijo')}
                className={`p-3 rounded-lg border transition-colors text-sm ${
                  formData.metodoAsignacion === 'fijo'
                    ? 'border-cyan-500 bg-cyan-500 bg-opacity-20 text-cyan-400'
                    : 'border-[#333] bg-[#2a2a2a] text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="font-medium">Monto Fijo</div>
                <div className="text-xs text-gray-400 mt-1">Mismo lote siempre</div>
              </button>
            </div>
          </div>

          {/* Copy Stop Loss Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-300">
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
              onChange={(e) => handleInputChange('copyStopLoss', Number(e.target.value))}
              className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10%</span>
              <span>100%</span>
            </div>
            <p className="text-xs text-gray-500">
              Detiene el copiado si tu cuenta pierde este porcentaje del monto invertido
            </p>
          </div>

          {/* Advanced Settings Collapsible */}
          <div className="border border-[#333] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-4 bg-[#2a2a2a] hover:bg-[#333] transition-colors"
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
                    onChange={(e) => handleInputChange('multiplicadorLote', Number(e.target.value))}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#333] rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                    min="0.1"
                    max="10"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Factor de multiplicacion para el tamano de las operaciones
                  </p>
                  {errors.multiplicadorLote && (
                    <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                      <AlertTriangle size={12} />
                      {errors.multiplicadorLote}
                    </p>
                  )}
                </div>

                {/* Copy SL/TP */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Copiar Stop Loss del trader</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.copiarSL}
                      onChange={(e) => handleInputChange('copiarSL', e.target.checked)}
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
                      onChange={(e) => handleInputChange('copiarTP', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#333] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
            >
              {t('followTrader.cancel') || 'Cancelar'}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              {t('followTrader.follow') || 'Seguir Trader'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeguirTraderModal;
