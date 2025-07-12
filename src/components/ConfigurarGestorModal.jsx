import React, { useState } from 'react';
import { X, DollarSign, AlertTriangle, TrendingUp, Shield, Users, Clock, Target, Star } from 'lucide-react';

const ConfigurarGestorModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    nombreEstrategia: '',
    descripcionEstrategia: '',
    comisionSolicitada: 25,
    riesgoMaximo: 10,
    drawdownMaximo: 15,
    experienciaRequerida: 'Intermedio',
    mercadosOperados: ['Forex'],
    horariosOperacion: '08:00-18:00 GMT',
    capitalMinimo: 100,
    maximoSeguidores: 100
  });

  const [errors, setErrors] = useState({});

  const experienciaNiveles = ['Principiante', 'Intermedio', 'Avanzado'];
  const mercadosDisponibles = ['Forex', 'Criptomonedas', 'Acciones', 'Índices', 'Materias Primas'];
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

  const handleMercadoChange = (mercado) => {
    setFormData(prev => ({
      ...prev,
      mercadosOperados: prev.mercadosOperados.includes(mercado)
        ? prev.mercadosOperados.filter(m => m !== mercado)
        : [...prev.mercadosOperados, mercado]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombreEstrategia.trim()) {
      newErrors.nombreEstrategia = 'El nombre de la estrategia es obligatorio';
    }

    if (!formData.descripcionEstrategia.trim()) {
      newErrors.descripcionEstrategia = 'La descripción es obligatoria';
    }

    if (formData.descripcionEstrategia.length < 30) {
      newErrors.descripcionEstrategia = 'La descripción debe tener al menos 30 caracteres';
    }

    if (!formData.comisionSolicitada || formData.comisionSolicitada < 0 || formData.comisionSolicitada > 50) {
      newErrors.comisionSolicitada = 'La comisión debe estar entre 0% y 50%';
    }

    if (!formData.riesgoMaximo || formData.riesgoMaximo < 1 || formData.riesgoMaximo > 50) {
      newErrors.riesgoMaximo = 'El riesgo máximo debe estar entre 1% y 50%';
    }

    if (!formData.drawdownMaximo || formData.drawdownMaximo < 1 || formData.drawdownMaximo > 50) {
      newErrors.drawdownMaximo = 'El drawdown máximo debe estar entre 1% y 50%';
    }

    if (formData.mercadosOperados.length === 0) {
      newErrors.mercadosOperados = 'Selecciona al menos un mercado';
    }

    if (!formData.capitalMinimo || formData.capitalMinimo < 10) {
      newErrors.capitalMinimo = 'El capital mínimo debe ser al menos $10';
    }

    if (!formData.maximoSeguidores || formData.maximoSeguidores < 1 || formData.maximoSeguidores > 1000) {
      newErrors.maximoSeguidores = 'El máximo de seguidores debe estar entre 1 y 1000';
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
              <Star className="text-cyan-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Configurar Perfil de Gestor</h2>
              <p className="text-sm text-gray-400">Define tu estrategia de Copy Trading</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-[#333] pb-2">
              Información Básica
            </h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Nombre de la Estrategia *
              </label>
              <input
                type="text"
                value={formData.nombreEstrategia}
                onChange={(e) => handleInputChange('nombreEstrategia', e.target.value)}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Ej: Scalping EUR/USD"
              />
              {errors.nombreEstrategia && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.nombreEstrategia}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Descripción de la Estrategia *
              </label>
              <textarea
                value={formData.descripcionEstrategia}
                onChange={(e) => handleInputChange('descripcionEstrategia', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
                placeholder="Describe tu estrategia de trading, metodología y enfoque..."
              />
              <p className="text-xs text-gray-500">
                {formData.descripcionEstrategia.length}/500 caracteres (mínimo 30)
              </p>
              {errors.descripcionEstrategia && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.descripcionEstrategia}
                </p>
              )}
            </div>
          </div>

          {/* Configuración de Riesgo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-[#333] pb-2">
              Configuración de Riesgo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Comisión Solicitada (%)
                </label>
                <input
                  type="number"
                  value={formData.comisionSolicitada}
                  onChange={(e) => handleInputChange('comisionSolicitada', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="25"
                  min="0"
                  max="50"
                />
                {errors.comisionSolicitada && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.comisionSolicitada}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Riesgo Máximo (%)
                </label>
                <input
                  type="number"
                  value={formData.riesgoMaximo}
                  onChange={(e) => handleInputChange('riesgoMaximo', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="10"
                  min="1"
                  max="50"
                />
                {errors.riesgoMaximo && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.riesgoMaximo}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Drawdown Máximo (%)
              </label>
              <input
                type="number"
                value={formData.drawdownMaximo}
                onChange={(e) => handleInputChange('drawdownMaximo', Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                placeholder="15"
                min="1"
                max="50"
              />
              {errors.drawdownMaximo && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.drawdownMaximo}
                </p>
              )}
            </div>
          </div>

          {/* Mercados y Horarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-[#333] pb-2">
              Mercados y Horarios
            </h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Mercados Operados *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {mercadosDisponibles.map((mercado) => (
                  <label key={mercado} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mercadosOperados.includes(mercado)}
                      onChange={() => handleMercadoChange(mercado)}
                      className="w-4 h-4 text-cyan-500 bg-[#2a2a2a] border-[#333] rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-300">{mercado}</span>
                  </label>
                ))}
              </div>
              {errors.mercadosOperados && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.mercadosOperados}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Horarios de Operación
              </label>
              <select
                value={formData.horariosOperacion}
                onChange={(e) => handleInputChange('horariosOperacion', e.target.value)}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              >
                {horariosDisponibles.map((horario) => (
                  <option key={horario} value={horario}>{horario}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Configuración de Seguidores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-[#333] pb-2">
              Configuración de Seguidores
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Capital Mínimo (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    value={formData.capitalMinimo}
                    onChange={(e) => handleInputChange('capitalMinimo', Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="100"
                    min="10"
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
                  Máximo de Seguidores
                </label>
                <input
                  type="number"
                  value={formData.maximoSeguidores}
                  onChange={(e) => handleInputChange('maximoSeguidores', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="100"
                  min="1"
                  max="1000"
                />
                {errors.maximoSeguidores && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.maximoSeguidores}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Experiencia Requerida
              </label>
              <select
                value={formData.experienciaRequerida}
                onChange={(e) => handleInputChange('experienciaRequerida', e.target.value)}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              >
                {experienciaNiveles.map((nivel) => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>
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
              Configurar Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigurarGestorModal; 