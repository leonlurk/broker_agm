import React, { useState } from 'react';
import { X, Copy, DollarSign, AlertTriangle, TrendingUp, Users, Target, BarChart2 } from 'lucide-react';

const CopiarEstrategiaModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    gestorACopiar: '',
    porcentajeCapital: 50,
    limitePerdida: 2000,
    limiteGanancia: 15000,
    copiarOperaciones: true,
    copiarParametros: true,
    ajustarRiesgo: true,
    factorEscala: 1.0,
    tiempoRetraso: 0,
    mercadosPermitidos: ['Forex', 'Criptomonedas']
  });

  const [errors, setErrors] = useState({});

  // Dynamic managers data - would be fetched from API
  const gestoresDisponibles = [
    // Will be populated from API call to get available trading managers
  ];

  const mercadosDisponibles = ['Forex', 'Criptomonedas', 'Acciones', 'Índices', 'Materias Primas'];

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

  const handleMercadoChange = (mercado) => {
    setFormData(prev => ({
      ...prev,
      mercadosPermitidos: prev.mercadosPermitidos.includes(mercado)
        ? prev.mercadosPermitidos.filter(m => m !== mercado)
        : [...prev.mercadosPermitidos, mercado]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.gestorACopiar) {
      newErrors.gestorACopiar = 'Selecciona un gestor para copiar';
    }

    if (!formData.porcentajeCapital || formData.porcentajeCapital < 10 || formData.porcentajeCapital > 100) {
      newErrors.porcentajeCapital = 'El porcentaje debe estar entre 10% y 100%';
    }

    if (!formData.limitePerdida || formData.limitePerdida < 500) {
      newErrors.limitePerdida = 'El límite de pérdida mínimo es $500';
    }

    if (!formData.factorEscala || formData.factorEscala < 0.1 || formData.factorEscala > 5) {
      newErrors.factorEscala = 'El factor de escala debe estar entre 0.1 y 5.0';
    }

    if (formData.mercadosPermitidos.length === 0) {
      newErrors.mercadosPermitidos = 'Selecciona al menos un mercado';
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

  const getSelectedGestor = () => {
    return gestoresDisponibles.find(g => g.id === formData.gestorACopiar);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 bg-opacity-20 rounded-lg">
              <Copy className="text-purple-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Copiar Estrategia</h2>
              <p className="text-sm text-gray-400">Replica la estrategia de otro gestor exitoso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selección de Gestor */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Users size={20} />
              Seleccionar Gestor
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {gestoresDisponibles.map((gestor) => (
                <div
                  key={gestor.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.gestorACopiar === gestor.id
                      ? 'border-purple-500 bg-purple-500 bg-opacity-10'
                      : 'border-[#333] bg-[#2a2a2a] hover:border-[#444]'
                  }`}
                  onClick={() => handleInputChange('gestorACopiar', gestor.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{gestor.nombre}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-gray-400">Rendimiento</p>
                          <p className="text-green-400 font-medium">+{gestor.rendimiento}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Drawdown</p>
                          <p className="text-red-400 font-medium">{gestor.drawdown}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Sharpe Ratio</p>
                          <p className="text-blue-400 font-medium">{gestor.sharpeRatio}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Inversores</p>
                          <p className="text-white font-medium">{gestor.inversores}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Capital Gestionado</p>
                      <p className="text-white font-medium">${(gestor.capitalGestionado / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.gestorACopiar && (
              <p className="text-red-400 text-sm">{errors.gestorACopiar}</p>
            )}
          </div>

          {/* Configuración de Copia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Target size={20} />
                Configuración de Capital
              </h3>

              {/* Porcentaje de Capital */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Porcentaje de Capital a Copiar
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={formData.porcentajeCapital}
                    onChange={(e) => handleInputChange('porcentajeCapital', parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="50"
                  />
                  <span className="absolute right-3 top-3 text-gray-400">%</span>
                </div>
                {errors.porcentajeCapital && (
                  <p className="text-red-400 text-sm">{errors.porcentajeCapital}</p>
                )}
              </div>

              {/* Límite de Pérdida */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Límite de Pérdida
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="number"
                    min="500"
                    value={formData.limitePerdida}
                    onChange={(e) => handleInputChange('limitePerdida', parseInt(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="2000"
                  />
                </div>
                {errors.limitePerdida && (
                  <p className="text-red-400 text-sm">{errors.limitePerdida}</p>
                )}
              </div>

              {/* Límite de Ganancia */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Límite de Ganancia
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="number"
                    min="1000"
                    value={formData.limiteGanancia}
                    onChange={(e) => handleInputChange('limiteGanancia', parseInt(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="15000"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <BarChart2 size={20} />
                Configuración Avanzada
              </h3>

              {/* Factor de Escala */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Factor de Escala
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={formData.factorEscala}
                  onChange={(e) => handleInputChange('factorEscala', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="1.0"
                />
                <p className="text-xs text-gray-500">Multiplica el tamaño de las operaciones copiadas</p>
                {errors.factorEscala && (
                  <p className="text-red-400 text-sm">{errors.factorEscala}</p>
                )}
              </div>

              {/* Tiempo de Retraso */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Retraso en Segundos
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={formData.tiempoRetraso}
                  onChange={(e) => handleInputChange('tiempoRetraso', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500">Retraso antes de copiar operaciones</p>
              </div>

              {/* Mercados Permitidos */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Mercados Permitidos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {mercadosDisponibles.map((mercado) => (
                    <label key={mercado} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mercadosPermitidos.includes(mercado)}
                        onChange={() => handleMercadoChange(mercado)}
                        className="w-4 h-4 text-purple-500 bg-[#2a2a2a] border-[#333] rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-300">{mercado}</span>
                    </label>
                  ))}
                </div>
                {errors.mercadosPermitidos && (
                  <p className="text-red-400 text-sm">{errors.mercadosPermitidos}</p>
                )}
              </div>
            </div>
          </div>

          {/* Opciones de Copia */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Opciones de Copia</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-300">Copiar Operaciones</p>
                  <p className="text-xs text-gray-500">Replica las operaciones en tiempo real</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.copiarOperaciones}
                    onChange={(e) => handleInputChange('copiarOperaciones', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-300">Copiar Parámetros</p>
                  <p className="text-xs text-gray-500">Adopta la configuración de riesgo</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.copiarParametros}
                    onChange={(e) => handleInputChange('copiarParametros', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-300">Ajustar Riesgo</p>
                  <p className="text-xs text-gray-500">Adapta el riesgo a tu perfil</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ajustarRiesgo}
                    onChange={(e) => handleInputChange('ajustarRiesgo', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Resumen de la Estrategia Seleccionada */}
          {formData.gestorACopiar && (
            <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#333]">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Resumen de la Estrategia</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Gestor Seleccionado</p>
                  <p className="text-white font-medium">{getSelectedGestor()?.nombre}</p>
                </div>
                <div>
                  <p className="text-gray-400">Capital a Copiar</p>
                  <p className="text-purple-400 font-medium">{formData.porcentajeCapital}%</p>
                </div>
                <div>
                  <p className="text-gray-400">Factor de Escala</p>
                  <p className="text-blue-400 font-medium">{formData.factorEscala}x</p>
                </div>
                <div>
                  <p className="text-gray-400">Mercados</p>
                  <p className="text-white font-medium">{formData.mercadosPermitidos.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-6 border-t border-[#333]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-colors font-medium"
            >
              Copiar Estrategia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CopiarEstrategiaModal; 