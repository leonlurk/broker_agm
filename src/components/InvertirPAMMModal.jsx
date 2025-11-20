import React, { useState } from 'react';
import { X, DollarSign, AlertTriangle, TrendingUp, Info, CheckCircle } from 'lucide-react';
import { useAccounts } from '../contexts/AccountsContext';

const InvertirPAMMModal = ({ isOpen, onClose, gestor, onConfirm }) => {
  const { getAllAccounts } = useAccounts();
  const accounts = getAllAccounts();

  // Normalize accounts to ensure they have login field
  const normalizeAccount = (acc) => ({
    ...acc,
    login: acc.login || acc.account_number || acc.accountNumber || acc.id,
    name: acc.name || acc.account_name || 'Cuenta Real'
  });

  const realAccounts = accounts
    .filter(acc =>
      acc.account_type === 'Real' ||
      acc.accountType === 'Real' ||
      acc.account_type === 'real' ||
      acc.accountType === 'real'
    )
    .map(normalizeAccount);

  const [formData, setFormData] = useState({
    montoInversion: gestor?.minInvestment || gestor?.min_investment || gestor?.inversionMinima || 1000,
    cuentaMT5Seleccionada: realAccounts[0]?.login?.toString() || '',
    profitHandling: 'compound',
    reinvestPercentage: 100,
    aceptaTerminos: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

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
    const minInvestment = gestor?.inversionMinima || gestor?.min_investment || 1000;

    if (!formData.montoInversion || formData.montoInversion < minInvestment) {
      newErrors.montoInversion = `El monto minimo es $${minInvestment}`;
    }

    if (!formData.cuentaMT5Seleccionada) {
      newErrors.cuentaMT5Seleccionada = 'Debes seleccionar una cuenta MT5';
    }

    if (!formData.aceptaTerminos) {
      newErrors.aceptaTerminos = 'Debes aceptar los terminos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await onConfirm(formData);

      if (result && result.success !== false) {
        setSubmitResult({
          success: true,
          message: 'Inversion realizada exitosamente!'
        });

        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setSubmitResult({
          success: false,
          message: result?.error || 'Error al procesar la inversion'
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: error.message || 'Error al procesar la inversion'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitting(false);
    setSubmitResult(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  // Fund terms data
  const minInvestment = gestor?.minInvestment || gestor?.min_investment || gestor?.inversionMinima || 1000;
  const maxInvestment = gestor?.maxInvestment || gestor?.max_investment || gestor?.capitalMaximo || 100000;
  const managementFee = gestor?.managementFee || gestor?.management_fee || 2;
  const performanceFee = gestor?.performanceFee || gestor?.performance_fee || 20;
  const lockupPeriod = gestor?.lockupPeriod || gestor?.lockup_period || 30;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
              <TrendingUp className="text-green-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Invertir en Fondo PAMM</h2>
              <p className="text-sm text-gray-400">{gestor?.nombreFondo || gestor?.name || 'Fondo PAMM'}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Investment Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Monto de Inversion *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="number"
                value={formData.montoInversion}
                onChange={(e) => handleInputChange('montoInversion', Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                placeholder="5000"
                min={minInvestment}
              />
            </div>
            <p className="text-xs text-gray-500">
              Minimo: ${minInvestment.toLocaleString()} | Maximo: ${maxInvestment.toLocaleString()}
            </p>
            {errors.montoInversion && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertTriangle size={14} />
                {errors.montoInversion}
              </p>
            )}
          </div>

          {/* MT5 Account Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Cuenta MT5 para Invertir *
            </label>
            <select
              value={formData.cuentaMT5Seleccionada}
              onChange={(e) => handleInputChange('cuentaMT5Seleccionada', e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
            >
              <option value="">Selecciona una cuenta MT5</option>
              {realAccounts.map((account) => (
                <option key={account.login} value={account.login}>
                  {account.login} - {account.name || 'Cuenta Real'} (Balance: ${account.balance || 0})
                </option>
              ))}
            </select>
            {errors.cuentaMT5Seleccionada && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertTriangle size={14} />
                {errors.cuentaMT5Seleccionada}
              </p>
            )}
          </div>

          {/* Profit Handling */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Manejo de Ganancias
            </label>

            {/* Compound Option */}
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.profitHandling === 'compound'
                ? 'border-green-500 bg-green-500 bg-opacity-10'
                : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
            }`}>
              <input
                type="radio"
                name="profitHandling"
                value="compound"
                checked={formData.profitHandling === 'compound'}
                onChange={(e) => handleInputChange('profitHandling', e.target.value)}
                className="mt-1 accent-green-500"
              />
              <div>
                <p className="text-sm font-medium text-white">Interes Compuesto</p>
                <p className="text-xs text-gray-400">Reinvertir todas las ganancias automaticamente</p>
              </div>
            </label>

            {/* Withdraw Option */}
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.profitHandling === 'withdraw'
                ? 'border-green-500 bg-green-500 bg-opacity-10'
                : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
            }`}>
              <input
                type="radio"
                name="profitHandling"
                value="withdraw"
                checked={formData.profitHandling === 'withdraw'}
                onChange={(e) => handleInputChange('profitHandling', e.target.value)}
                className="mt-1 accent-green-500"
              />
              <div>
                <p className="text-sm font-medium text-white">Retirar Ganancias</p>
                <p className="text-xs text-gray-400">Recibir las ganancias en tu cuenta MT5</p>
              </div>
            </label>

            {/* Partial Option */}
            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.profitHandling === 'partial'
                ? 'border-green-500 bg-green-500 bg-opacity-10'
                : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
            }`}>
              <input
                type="radio"
                name="profitHandling"
                value="partial"
                checked={formData.profitHandling === 'partial'}
                onChange={(e) => handleInputChange('profitHandling', e.target.value)}
                className="mt-1 accent-green-500"
              />
              <div>
                <p className="text-sm font-medium text-white">Parcial</p>
                <p className="text-xs text-gray-400">Elegir que porcentaje reinvertir</p>
              </div>
            </label>

            {/* Reinvest Percentage Slider */}
            {formData.profitHandling === 'partial' && (
              <div className="mt-3 p-4 bg-[#1C1C1C] rounded-lg border border-[#333]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Porcentaje a reinvertir</span>
                  <span className="text-sm font-medium text-green-500">{formData.reinvestPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.reinvestPercentage}
                  onChange={(e) => handleInputChange('reinvestPercentage', Number(e.target.value))}
                  className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0% (Retirar todo)</span>
                  <span>100% (Reinvertir todo)</span>
                </div>
              </div>
            )}
          </div>

          {/* Fund Terms (Read-only) */}
          <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333]">
            <div className="flex items-center gap-2 mb-3">
              <Info size={16} className="text-gray-400" />
              <h3 className="text-sm font-medium text-white">Terminos del Fondo</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Management Fee:</span>
                <span className="text-white">{managementFee}% anual</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Performance Fee:</span>
                <span className="text-white">{performanceFee}% de ganancias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Periodo de bloqueo:</span>
                <span className="text-white">{lockupPeriod} dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rendimiento historico:</span>
                <span className="text-green-500">+{gestor?.rendimiento || gestor?.totalReturn || gestor?.total_return || 0}%</span>
              </div>
            </div>
          </div>

          {/* Accept Terms */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.aceptaTerminos}
                onChange={(e) => handleInputChange('aceptaTerminos', e.target.checked)}
                className="mt-1 w-4 h-4 text-green-500 bg-[#2a2a2a] border-[#333] rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-300">
                Acepto los terminos y condiciones del fondo PAMM, incluyendo las comisiones y el periodo de bloqueo establecido.
              </span>
            </label>
            {errors.aceptaTerminos && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertTriangle size={14} />
                {errors.aceptaTerminos}
              </p>
            )}
          </div>

          {/* Result Message */}
          {submitResult && (
            <div className={`p-4 rounded-lg ${
              submitResult.success
                ? 'bg-green-900/30 border border-green-500/50 text-green-400'
                : 'bg-red-900/30 border border-red-500/50 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {submitResult.success && <CheckCircle size={16} />}
                {!submitResult.success && <AlertTriangle size={16} />}
                <p className="text-sm font-medium">{submitResult.message}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.aceptaTerminos}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                'Confirmar Inversion'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvertirPAMMModal;
