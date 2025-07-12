import React, { useState } from 'react';
import { X, DollarSign, AlertTriangle, TrendingUp, Shield, Users, Clock, Target } from 'lucide-react';

const CrearPAMMModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    nombreFondo: '',
    descripcion: '',
    capitalMinimo: 1000,
    capitalMaximo: 100000,
    inversionMinima: 500,
    managementFee: 2.0,
    performanceFee: 20.0,
    lockupPeriod: 30,
    tipoEstrategia: 'Moderado',
    mercados: ['Forex'],
    riesgoMaximo: 15,
    horarioOperacion: '24/7',
    experienciaRequerida: 'Principiante'
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const tiposEstrategia = ['Conservador', 'Moderado', 'Agresivo'];
  const mercadosDisponibles = ['Forex', 'Criptomonedas', 'Acciones', 'Índices', 'Materias Primas'];
  const horariosOperacion = ['24/7', '08:00-18:00 GMT', '14:00-22:00 GMT', 'Solo sesión europea', 'Solo sesión americana'];
  const nivelesExperiencia = ['Principiante', 'Intermedio', 'Avanzado'];

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
      mercados: prev.mercados.includes(mercado)
        ? prev.mercados.filter(m => m !== mercado)
        : [...prev.mercados, mercado]
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.nombreFondo.trim()) {
        newErrors.nombreFondo = 'El nombre del fondo es obligatorio';
      }
      if (!formData.descripcion.trim()) {
        newErrors.descripcion = 'La descripción es obligatoria';
      }
      if (formData.descripcion.length < 50) {
        newErrors.descripcion = 'La descripción debe tener al menos 50 caracteres';
      }
    }

    if (step === 2) {
      if (!formData.capitalMinimo || formData.capitalMinimo < 1000) {
        newErrors.capitalMinimo = 'El capital mínimo debe ser al menos $1,000';
      }
      if (!formData.capitalMaximo || formData.capitalMaximo < formData.capitalMinimo) {
        newErrors.capitalMaximo = 'El capital máximo debe ser mayor al mínimo';
      }
      if (!formData.inversionMinima || formData.inversionMinima < 100) {
        newErrors.inversionMinima = 'La inversión mínima debe ser al menos $100';
      }
      if (formData.inversionMinima > formData.capitalMinimo) {
        newErrors.inversionMinima = 'La inversión mínima no puede ser mayor al capital mínimo';
      }
    }

    if (step === 3) {
      if (!formData.managementFee || formData.managementFee < 0 || formData.managementFee > 10) {
        newErrors.managementFee = 'La comisión de gestión debe estar entre 0% y 10%';
      }
      if (!formData.performanceFee || formData.performanceFee < 0 || formData.performanceFee > 50) {
        newErrors.performanceFee = 'La comisión de rendimiento debe estar entre 0% y 50%';
      }
      if (!formData.lockupPeriod || formData.lockupPeriod < 1 || formData.lockupPeriod > 365) {
        newErrors.lockupPeriod = 'El período de lock-up debe estar entre 1 y 365 días';
      }
    }

    if (step === 4) {
      if (formData.mercados.length === 0) {
        newErrors.mercados = 'Selecciona al menos un mercado';
      }
      if (!formData.riesgoMaximo || formData.riesgoMaximo < 5 || formData.riesgoMaximo > 50) {
        newErrors.riesgoMaximo = 'El riesgo máximo debe estar entre 5% y 50%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(4)) {
      onConfirm(formData);
      onClose();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-full w-16 h-16 mx-auto mb-4">
                <TrendingUp className="text-blue-500 w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-white">Información Básica</h3>
              <p className="text-gray-400">Define el nombre y descripción de tu fondo</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Nombre del Fondo *
                </label>
                <input
                  type="text"
                  value={formData.nombreFondo}
                  onChange={(e) => handleInputChange('nombreFondo', e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Fondo Alpha Growth"
                />
                {errors.nombreFondo && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.nombreFondo}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Descripción del Fondo *
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Describe tu estrategia de inversión, objetivos y filosofía de gestión..."
                />
                <p className="text-xs text-gray-500">
                  {formData.descripcion.length}/500 caracteres (mínimo 50)
                </p>
                {errors.descripcion && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.descripcion}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-full w-16 h-16 mx-auto mb-4">
                <DollarSign className="text-green-500 w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-white">Configuración de Capital</h3>
              <p className="text-gray-400">Define los límites de inversión</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Capital Mínimo *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    value={formData.capitalMinimo}
                    onChange={(e) => handleInputChange('capitalMinimo', Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                    placeholder="1000"
                    min="1000"
                  />
                </div>
                {errors.capitalMinimo && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.capitalMinimo}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Capital Máximo *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    value={formData.capitalMaximo}
                    onChange={(e) => handleInputChange('capitalMaximo', Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                    placeholder="100000"
                    min="1000"
                  />
                </div>
                {errors.capitalMaximo && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.capitalMaximo}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Inversión Mínima por Inversor *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="number"
                  value={formData.inversionMinima}
                  onChange={(e) => handleInputChange('inversionMinima', Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                  placeholder="500"
                  min="100"
                />
              </div>
              {errors.inversionMinima && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.inversionMinima}
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="p-3 bg-purple-500 bg-opacity-20 rounded-full w-16 h-16 mx-auto mb-4">
                <Target className="text-purple-500 w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-white">Estructura de Comisiones</h3>
              <p className="text-gray-400">Define tus comisiones y períodos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Management Fee (% anual) *
                </label>
                <input
                  type="number"
                  value={formData.managementFee}
                  onChange={(e) => handleInputChange('managementFee', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="2.0"
                  min="0"
                  max="10"
                  step="0.1"
                />
                {errors.managementFee && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.managementFee}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Performance Fee (% de ganancias) *
                </label>
                <input
                  type="number"
                  value={formData.performanceFee}
                  onChange={(e) => handleInputChange('performanceFee', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="20.0"
                  min="0"
                  max="50"
                  step="0.1"
                />
                {errors.performanceFee && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.performanceFee}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Período de Lock-up (días) *
              </label>
              <input
                type="number"
                value={formData.lockupPeriod}
                onChange={(e) => handleInputChange('lockupPeriod', Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="30"
                min="1"
                max="365"
              />
              <p className="text-xs text-gray-500">
                Tiempo mínimo que los inversores deben mantener su inversión
              </p>
              {errors.lockupPeriod && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.lockupPeriod}
                </p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="p-3 bg-orange-500 bg-opacity-20 rounded-full w-16 h-16 mx-auto mb-4">
                <Shield className="text-orange-500 w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-white">Estrategia y Riesgo</h3>
              <p className="text-gray-400">Define tu estrategia de inversión</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Tipo de Estrategia *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {tiposEstrategia.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => handleInputChange('tipoEstrategia', tipo)}
                      className={`p-3 rounded-lg border transition-colors ${
                        formData.tipoEstrategia === tipo
                          ? 'border-orange-500 bg-orange-500 bg-opacity-20 text-orange-500'
                          : 'border-[#333] bg-[#2a2a2a] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Mercados a Operar *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {mercadosDisponibles.map((mercado) => (
                    <label key={mercado} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mercados.includes(mercado)}
                        onChange={() => handleMercadoChange(mercado)}
                        className="w-4 h-4 text-orange-500 bg-[#2a2a2a] border-[#333] rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-300">{mercado}</span>
                    </label>
                  ))}
                </div>
                {errors.mercados && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.mercados}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Riesgo Máximo (% drawdown) *
                </label>
                <input
                  type="number"
                  value={formData.riesgoMaximo}
                  onChange={(e) => handleInputChange('riesgoMaximo', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                  placeholder="15"
                  min="5"
                  max="50"
                />
                {errors.riesgoMaximo && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.riesgoMaximo}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Horario de Operación
                </label>
                <select
                  value={formData.horarioOperacion}
                  onChange={(e) => handleInputChange('horarioOperacion', e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-orange-500 focus:outline-none"
                >
                  {horariosOperacion.map((horario) => (
                    <option key={horario} value={horario}>{horario}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Experiencia Requerida
                </label>
                <select
                  value={formData.experienciaRequerida}
                  onChange={(e) => handleInputChange('experienciaRequerida', e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-orange-500 focus:outline-none"
                >
                  {nivelesExperiencia.map((nivel) => (
                    <option key={nivel} value={nivel}>{nivel}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
              <Users className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Crear Fondo PAMM</h2>
              <p className="text-sm text-gray-400">Paso {currentStep} de 4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-[#333]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progreso</span>
            <span className="text-sm text-gray-400">{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-[#333] rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStep()}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 border-t border-[#333]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-4 py-3 bg-[#444] hover:bg-[#555] text-white rounded-lg transition-colors"
            >
              Anterior
            </button>
          )}
          
          <div className="flex-1"></div>
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-colors font-medium"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors font-medium"
            >
              Crear Fondo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrearPAMMModal; 