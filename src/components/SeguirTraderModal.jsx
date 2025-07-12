import React, { useState } from 'react';
import { X, DollarSign, AlertTriangle, Settings, Clock, Target } from 'lucide-react';

const SeguirTraderModal = ({ isOpen, onClose, trader, onConfirm }) => {
  const [formData, setFormData] = useState({
    capitalAsignado: 5000,
    porcentajeRiesgo: 5,
    limitePerdida: 1000,
    limiteGanancia: 10000,
    copiarTodas: true,
    tiposOperacion: ['Forex', 'Criptomonedas'],
    horarioCopiado: '24/7',
    autoStop: true,
    comisionTrader: 25
  });

  const [errors, setErrors] = useState({});

  const tiposOperacionDisponibles = ['Forex', 'Criptomonedas', 'Acciones', 'Índices', 'Materias Primas'];
  const horariosDisponibles = ['24/7', '08:00-18:00 GMT', '14:00-22:00 GMT', 'Solo sesión europea', 'Solo sesión americana'];

  const handleInputChange = (field, value) => {
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

  const handleTipoOperacionChange = (tipo) => {
    setFormData(prev => ({
      ...prev,
      tiposOperacion: prev.tiposOperacion.includes(tipo)
        ? prev.tiposOperacion.filter(t => t !== tipo)
        : [...prev.tiposOperacion, tipo]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.capitalAsignado || formData.capitalAsignado < 100) {
      newErrors.capitalAsignado = 'El capital mínimo es $100';
    }

    if (!formData.porcentajeRiesgo || formData.porcentajeRiesgo < 1 || formData.porcentajeRiesgo > 50) {
      newErrors.porcentajeRiesgo = 'El riesgo debe estar entre 1% y 50%';
    }

    if (!formData.limitePerdida || formData.limitePerdida < 100) {
      newErrors.limitePerdida = 'El límite de pérdida mínimo es $100';
    }

    if (formData.tiposOperacion.length === 0) {
      newErrors.tiposOperacion = 'Selecciona al menos un tipo de operación';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onConfirm(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500 bg-opacity-20 rounded-lg">
              <Target className="text-cyan-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Seguir Trader</h2>
              <p className="text-sm text-gray-400">Configura tu estrategia de copia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Información del Trader */}
        <div className="p-6 border-b border-[#333] bg-[#2a2a2a]">
          <div className="flex items-center gap-4">
            <img 
              src={trader?.avatar || '/default-avatar.png'} 
              alt={trader?.nombre || 'Trader'} 
              className="w-12 h-12 rounded-full border-2 border-cyan-500"
            />
            <div>
              <h3 className="text-lg font-semibold text-white">{trader?.nombre || 'Trader'}</h3>
              <p className="text-sm text-gray-400">Rendimiento: {trader?.rendimiento || '+0.0%'}</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Capital Asignado */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Capital Asignado
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="number"
                value={formData.capitalAsignado}
                onChange={(e) => handleInputChange('capitalAsignado', Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                placeholder="5000"
                min="100"
              />
            </div>
            {errors.capitalAsignado && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertTriangle size={14} />
                {errors.capitalAsignado}
              </p>
            )}
          </div>

          {/* Porcentaje de Riesgo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Porcentaje de Riesgo (%)
            </label>
            <input
              type="number"
              value={formData.porcentajeRiesgo}
              onChange={(e) => handleInputChange('porcentajeRiesgo', Number(e.target.value))}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              placeholder="5"
              min="1"
              max="50"
            />
            {errors.porcentajeRiesgo && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertTriangle size={14} />
                {errors.porcentajeRiesgo}
              </p>
            )}
          </div>

          {/* Límites */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Límite de Pérdida
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="number"
                  value={formData.limitePerdida}
                  onChange={(e) => handleInputChange('limitePerdida', Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="1000"
                  min="100"
                />
              </div>
              {errors.limitePerdida && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.limitePerdida}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Límite de Ganancia
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="number"
                  value={formData.limiteGanancia}
                  onChange={(e) => handleInputChange('limiteGanancia', Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="10000"
                />
              </div>
            </div>
          </div>

          {/* Tipos de Operación */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Tipos de Operación
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {tiposOperacionDisponibles.map((tipo) => (
                <label key={tipo} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tiposOperacion.includes(tipo)}
                    onChange={() => handleTipoOperacionChange(tipo)}
                    className="w-4 h-4 text-cyan-500 bg-[#2a2a2a] border-[#333] rounded focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">{tipo}</span>
                </label>
              ))}
            </div>
            {errors.tiposOperacion && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertTriangle size={14} />
                {errors.tiposOperacion}
              </p>
            )}
          </div>

          {/* Horario de Copiado */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Horario de Copiado
            </label>
            <select
              value={formData.horarioCopiado}
              onChange={(e) => handleInputChange('horarioCopiado', e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            >
              {horariosDisponibles.map((horario) => (
                <option key={horario} value={horario}>{horario}</option>
              ))}
            </select>
          </div>

          {/* Opciones Adicionales */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Copiar Todas las Operaciones</p>
                <p className="text-xs text-gray-500">Incluir todas las operaciones del trader</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.copiarTodas}
                  onChange={(e) => handleInputChange('copiarTodas', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Auto-Stop</p>
                <p className="text-xs text-gray-500">Detener automáticamente si se alcanza el límite</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoStop}
                  onChange={(e) => handleInputChange('autoStop', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>

          {/* Comisión del Trader */}
          <div className="p-4 bg-[#2a2a2a] rounded-lg border border-[#333]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Comisión del Trader</p>
                <p className="text-xs text-gray-500">Porcentaje de ganancias que se paga al trader</p>
              </div>
              <p className="text-lg font-semibold text-cyan-500">{formData.comisionTrader}%</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              Confirmar Seguimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeguirTraderModal; 