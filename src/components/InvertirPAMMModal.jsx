import React, { useState } from 'react';
import { X, DollarSign, AlertTriangle, TrendingUp, Calendar, Bell, Shield } from 'lucide-react';
import { useAccounts } from '../contexts/AccountsContext';

const InvertirPAMMModal = ({ isOpen, onClose, gestor, onConfirm }) => {
  const { getAllAccounts } = useAccounts();
  const accounts = getAllAccounts();
  const realAccounts = accounts.filter(acc =>
    acc.account_type === 'Real' ||
    acc.accountType === 'Real' ||
    acc.account_type === 'real' ||
    acc.accountType === 'real'
  );

  const [formData, setFormData] = useState({
    montoInversion: 5000,
    cuentaMT5Seleccionada: realAccounts[0]?.login?.toString() || '',
    tipoInversion: 'Fija',
    periodoInversion: '3 meses',
    reinvertirGanancias: true,
    limiteRiesgo: 20,
    notificaciones: true,
    retiroAutomatico: false,
    condicionesRetiro: 'Al finalizar periodo'
  });

  const [errors, setErrors] = useState({});
  const [showCalculadora, setShowCalculadora] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null); // { success: boolean, message: string }

  const tiposInversion = ['Fija', 'Variable'];
  const periodosInversion = ['1 mes', '3 meses', '6 meses', '1 año'];
  const condicionesRetiroDisponibles = ['Al finalizar periodo', 'En cualquier momento'];

  const handleInputChange = (field, value) => {
    console.log('[InvertirPAMMModal] Input change:', { field, value, type: typeof value });

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.montoInversion || formData.montoInversion < (gestor?.inversionMinima || gestor?.min_investment || 1000)) {
      newErrors.montoInversion = `El monto mínimo es $${gestor?.inversionMinima || gestor?.min_investment || 1000}`;
    }

    if (!formData.cuentaMT5Seleccionada) {
      newErrors.cuentaMT5Seleccionada = 'Debes seleccionar una cuenta MT5';
    }

    if (!formData.limiteRiesgo || formData.limiteRiesgo < 5 || formData.limiteRiesgo > 100) {
      newErrors.limiteRiesgo = 'El límite de riesgo debe estar entre 5% y 100%';
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
          message: '¡Inversión realizada exitosamente!'
        });

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setSubmitResult({
          success: false,
          message: result?.error || 'Error al procesar la inversión'
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: error.message || 'Error al procesar la inversión'
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

  // Calculadora de rendimiento estimado
  const calcularRendimientoEstimado = () => {
    const rendimientoAnual = gestor?.rendimiento || 18.5;
    const meses = {
      '1 mes': 1,
      '3 meses': 3,
      '6 meses': 6,
      '1 año': 12
    };
    
    const periodoMeses = meses[formData.periodoInversion];
    const rendimientoEstimado = (formData.montoInversion * (rendimientoAnual / 100) * (periodoMeses / 12));
    const managementFee = formData.montoInversion * ((gestor?.managementFee || 2) / 100) * (periodoMeses / 12);
    const performanceFee = rendimientoEstimado * ((gestor?.performanceFee || 20) / 100);
    const gananciaLimpia = rendimientoEstimado - performanceFee;
    const montoFinal = formData.montoInversion + gananciaLimpia - managementFee;
    
    return {
      rendimientoEstimado,
      managementFee,
      performanceFee,
      gananciaLimpia,
      montoFinal
    };
  };

  const rendimiento = calcularRendimientoEstimado();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
              <TrendingUp className="text-green-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Invertir en Fondo PAMM</h2>
              <p className="text-sm text-gray-400">Configura tu inversión</p>
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

        {/* Información del Gestor */}
        <div className="p-6 border-b border-[#333] bg-[#2a2a2a]">
          <div className="flex items-center gap-4">
            <img 
              src={gestor?.foto || '/default-avatar.png'} 
              alt={gestor?.nombre || 'Gestor'} 
              className="w-12 h-12 rounded-full border-2 border-green-500"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{gestor?.nombreFondo || 'Fondo PAMM'}</h3>
              <p className="text-sm text-gray-400">Gestor: {gestor?.nombre || 'Gestor'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Rendimiento</p>
              <p className="text-lg font-semibold text-green-500">+{gestor?.rendimiento || 18.5}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Formulario */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Monto de Inversión */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Monto de Inversión
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    value={formData.montoInversion}
                    onChange={(e) => handleInputChange('montoInversion', Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                    placeholder="5000"
                    min={gestor?.inversionMinima || 1000}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Mínimo: ${gestor?.inversionMinima || 1000} • Máximo: ${gestor?.capitalMaximo || 100000}
                </p>
                {errors.montoInversion && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.montoInversion}
                  </p>
                )}
              </div>

              {/* Cuenta MT5 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Cuenta MT5 para Invertir
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

              {/* Tipo de Inversión */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Tipo de Inversión
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {tiposInversion.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => handleInputChange('tipoInversion', tipo)}
                      className={`p-3 rounded-lg border transition-colors ${
                        formData.tipoInversion === tipo
                          ? 'border-green-500 bg-green-500 bg-opacity-20 text-green-500'
                          : 'border-[#333] bg-[#2a2a2a] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {formData.tipoInversion === 'Fija' 
                    ? 'Monto fijo durante todo el período' 
                    : 'Permite ajustar el monto durante el período'
                  }
                </p>
              </div>

              {/* Período de Inversión */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Período de Inversión
                </label>
                <select
                  value={formData.periodoInversion}
                  onChange={(e) => handleInputChange('periodoInversion', e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-green-500 focus:outline-none"
                >
                  {periodosInversion.map((periodo) => (
                    <option key={periodo} value={periodo}>{periodo}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Lock-up period: {gestor?.lockupPeriod || 30} días
                </p>
              </div>

              {/* Límite de Riesgo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Límite de Riesgo Aceptado (%)
                </label>
                <input
                  type="number"
                  value={formData.limiteRiesgo}
                  onChange={(e) => handleInputChange('limiteRiesgo', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                  placeholder="20"
                  min="5"
                  max="100"
                />
                <p className="text-xs text-gray-500">
                  Drawdown máximo histórico del gestor: {gestor?.drawdown || -12.1}%
                </p>
                {errors.limiteRiesgo && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.limiteRiesgo}
                  </p>
                )}
              </div>

              {/* Opciones Adicionales */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Reinvertir Ganancias</p>
                    <p className="text-xs text-gray-500">Capitalizar ganancias automáticamente</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.reinvertirGanancias}
                      onChange={(e) => handleInputChange('reinvertirGanancias', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Notificaciones</p>
                    <p className="text-xs text-gray-500">Recibir alertas sobre el rendimiento</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notificaciones}
                      onChange={(e) => handleInputChange('notificaciones', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Retiro Automático</p>
                    <p className="text-xs text-gray-500">Retirar al finalizar período</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.retiroAutomatico}
                      onChange={(e) => handleInputChange('retiroAutomatico', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>

              {/* Condiciones de Retiro */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Condiciones de Retiro
                </label>
                <select
                  value={formData.condicionesRetiro}
                  onChange={(e) => handleInputChange('condicionesRetiro', e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-green-500 focus:outline-none"
                >
                  {condicionesRetiroDisponibles.map((condicion) => (
                    <option key={condicion} value={condicion}>{condicion}</option>
                  ))}
                </select>
              </div>
            </form>
          </div>

          {/* Calculadora de Rendimiento */}
          <div className="space-y-6">
            <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#333]">
              <h3 className="text-lg font-semibold text-white mb-4">Proyección de Rendimiento</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Inversión inicial:</span>
                  <span className="text-white font-medium">${formData.montoInversion.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Período:</span>
                  <span className="text-white font-medium">{formData.periodoInversion}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Rendimiento estimado:</span>
                  <span className="text-green-500 font-medium">+${rendimiento.rendimientoEstimado.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Management Fee ({gestor?.managementFee || 2}%):</span>
                  <span className="text-red-400">-${rendimiento.managementFee.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Performance Fee ({gestor?.performanceFee || 20}%):</span>
                  <span className="text-red-400">-${rendimiento.performanceFee.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-[#333] pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Ganancia limpia:</span>
                    <span className="text-green-500 font-medium">+${rendimiento.gananciaLimpia.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span className="text-white">Monto final estimado:</span>
                    <span className="text-green-500">${rendimiento.montoFinal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Fondo */}
            <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#333]">
              <h3 className="text-lg font-semibold text-white mb-4">Información del Fondo</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tipo de estrategia:</span>
                  <span className="text-white">{gestor?.tipoEstrategia || 'Moderado'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Sharpe Ratio:</span>
                  <span className="text-white">{gestor?.sharpeRatio || 1.95}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Inversores actuales:</span>
                  <span className="text-white">{gestor?.inversores || 89}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Capital total:</span>
                  <span className="text-white">${(gestor?.capitalTotal || 1250000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result Message */}
        {submitResult && (
          <div className={`mx-6 mb-4 p-4 rounded-lg ${
            submitResult.success
              ? 'bg-green-900/30 border border-green-500/50 text-green-400'
              : 'bg-red-900/30 border border-red-500/50 text-red-400'
          }`}>
            <p className="text-sm font-medium">{submitResult.message}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 p-6 border-t border-[#333]">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Procesando...
              </>
            ) : (
              'Confirmar Inversión'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvertirPAMMModal; 