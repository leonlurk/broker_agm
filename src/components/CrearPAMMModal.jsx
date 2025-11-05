import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, AlertTriangle, TrendingUp, Shield, Users, Clock, Target, Star, Settings, ChevronLeft, ChevronRight, Copy, Percent, User } from 'lucide-react';
import { useAccounts } from '../contexts/AccountsContext';
import { supabase } from '../supabase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { createPammFund } from '../services/pammService';

const CrearPAMMModal = ({ isOpen, onClose, onConfirm, mode = 'create', fundData = null, onFundCreated = null }) => {
  const { getAllAccounts } = useAccounts();
  const { user } = useAuth();
  const { t } = useTranslation();
  const getInitialFormData = () => {
    if (mode === 'configure' && fundData) {
      return {
        // Fund creation fields
        nombreFondo: fundData.name || '',
        descripcion: fundData.strategy ? `Estrategia ${fundData.strategy}` : '',
        capitalMinimo: 1000,
        capitalMaximo: 100000,
        inversionMinima: fundData.minInvestment || 500,
        managementFee: fundData.managementFee || 2.0,
        performanceFee: fundData.performanceFee || 20.0,
        lockupPeriod: fundData.lockupPeriod || 30,
        tipoEstrategia: fundData.strategy || 'Moderado',
        mercados: ['Forex'],
        riesgoMaximo: Math.abs(fundData.maxDrawdown) || 15,
        horarioOperacion: '24/7',
        experienciaRequerida: 'Principiante',
        // Contract configuration fields
        tipoContrato: 'PAMM Standard',
        biografia: '',
        cuentaCopiar: '',
        cuentaMT5Seleccionada: '',
        convertirseEnManager: false,
        profitSplit: 80,
        tradingExperience: '',
        riskManagement: '',
        minBalance: fundData.balance || 10000,
        maxInvestors: fundData.investors || 50,
        copyRatio: 1.0
      };
    }
    return {
      // Fund creation fields
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
      experienciaRequerida: 'Principiante',
      // Contract configuration fields
      tipoContrato: 'PAMM Standard',
      biografia: '',
      cuentaCopiar: '',
      cuentaMT5Seleccionada: '',
      convertirseEnManager: mode === 'create', // ✅ Activado por defecto en modo 'create'
      profitSplit: 80,
      tradingExperience: '',
      riskManagement: '',
      minBalance: 10000,
      maxInvestors: 50,
      copyRatio: 1.0
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxSteps = mode === 'configure' ? 3 : 4;
  
  // Obtener cuentas MT5 reales del usuario
  const accounts = getAllAccounts();
  const realAccounts = accounts.filter(acc => 
    acc.account_type === 'Real' || 
    acc.accountType === 'Real' ||
    acc.account_type === 'real' ||
    acc.accountType === 'real'
  );

  // Reset form data when modal opens or fundData changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setCurrentStep(1);
      setErrors({});
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, fundData, mode]);

  const tiposEstrategia = ['Conservador', 'Moderado', 'Agresivo'];
  const mercadosDisponibles = ['Forex', 'Criptomonedas', 'Acciones', 'Índices', 'Materias Primas'];
  const horariosOperacion = ['24/7', '08:00-18:00 GMT', '14:00-22:00 GMT', 'Solo sesión europea', 'Solo sesión americana'];
  const nivelesExperiencia = ['Principiante', 'Intermedio', 'Avanzado'];
  const tiposContrato = ['PAMM Standard', 'PAMM Pro', 'PAMM Elite', 'Copy Trading Híbrido'];

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

    if (mode === 'configure') {
      // Contract configuration validation
      if (step === 1) {
        if (!formData.tipoContrato) {
          newErrors.tipoContrato = 'Selecciona un tipo de contrato';
        }
        if (!formData.biografia.trim()) {
          newErrors.biografia = 'La biografía es obligatoria';
        }
        if (formData.biografia.length < 50) {
          newErrors.biografia = 'La biografía debe tener al menos 50 caracteres';
        }
      }
      if (step === 2) {
        if (!formData.cuentaMT5Seleccionada) {
          newErrors.cuentaMT5Seleccionada = 'Selecciona una cuenta para copiar';
        }
        if (!formData.profitSplit || formData.profitSplit < 50 || formData.profitSplit > 95) {
          newErrors.profitSplit = 'El profit split debe estar entre 50% y 95%';
        }
      }
      if (step === 3) {
        if (!formData.tradingExperience.trim()) {
          newErrors.tradingExperience = 'La experiencia de trading es obligatoria';
        }
        if (!formData.riskManagement.trim()) {
          newErrors.riskManagement = 'La gestión de riesgo es obligatoria';
        }
      }
    } else {
      // Fund creation validation
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
      if (formData.convertirseEnManager && !formData.cuentaMT5Seleccionada) {
        newErrors.cuentaMT5Seleccionada = 'Selecciona una cuenta MT5 para el fondo PAMM';
      }
      if (realAccounts.length === 0) {
        newErrors.cuentaMT5Seleccionada = 'Necesitas al menos una cuenta MT5 Real para crear un fondo PAMM';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(maxSteps)) return;

    setIsSubmitting(true);
    try {
      console.log('[CrearPAMMModal] handleSubmit called', {
        convertirseEnManager: formData.convertirseEnManager,
        userId: user?.id,
        cuentaMT5: formData.cuentaMT5Seleccionada
      });

      // Si el usuario quiere convertirse en PAMM manager, actualizar Supabase
      if (formData.convertirseEnManager && user?.id) {
        console.log('[CrearPAMMModal] Updating profile to PAMM manager...');
        const { error } = await supabase
          .from('profiles')
          .update({
            is_pamm_manager: true,
            pamm_config: {
              fund_name: formData.nombreFondo,
              description: formData.descripcion,
              strategy_type: formData.tipoEstrategia,
              management_fee: formData.managementFee,
              performance_fee: formData.performanceFee,
              lockup_period: formData.lockupPeriod,
              min_investment: formData.inversionMinima,
              max_risk: formData.riesgoMaximo,
              markets: formData.mercados,
              trading_hours: formData.horarioOperacion,
              pamm_mt5_account: formData.cuentaMT5Seleccionada,
              min_capital: formData.capitalMinimo,
              max_capital: formData.capitalMaximo,
              created_at: new Date().toISOString()
            }
          })
          .eq('id', user.id);
          
        if (error) {
          console.error('[CrearPAMMModal] Error updating PAMM manager status:', error);
          alert('Error al configurar como PAMM manager: ' + error.message);
          setIsSubmitting(false);
          return;
        }

        console.log('[CrearPAMMModal] Profile updated successfully, creating fund...');

        // Show success notification with enhanced UI feedback
        const successNotification = document.createElement('div');
        successNotification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-3';
        successNotification.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <div class="font-semibold">PAMM Manager Status Activated!</div>
            <div class="text-sm opacity-90">You can now create and manage PAMM funds</div>
          </div>
        `;
        document.body.appendChild(successNotification);
        setTimeout(() => {
          document.body.removeChild(successNotification);
        }, 5000);

        // Crear el fondo PAMM a través del backend
        try {
          const fundDataForBackend = {
            name: formData.nombreFondo,
            description: formData.descripcion,
            manager_mt5_account_id: formData.cuentaMT5Seleccionada, // ✅ Parámetro correcto
            min_investment: formData.inversionMinima,
            max_investment: formData.capitalMaximo,
            performance_fee: formData.performanceFee / 100, // ✅ Convertir a decimal (20 → 0.2)
            management_fee: formData.managementFee / 100, // ✅ Convertir a decimal (2 → 0.02)
            is_public: true,
            // Campos adicionales para metadata (opcional)
            strategy_type: formData.tipoEstrategia,
            lockup_period: formData.lockupPeriod,
            max_risk: formData.riesgoMaximo,
            markets: formData.mercados,
            trading_hours: formData.horarioOperacion
          };

          console.log('[CrearPAMMModal] Creating fund with data:', fundDataForBackend);
          const fundResult = await createPammFund(fundDataForBackend);
          console.log('[CrearPAMMModal] Fund created successfully:', fundResult);

          // Enhanced success feedback
          const fundSuccessNotification = document.createElement('div');
          fundSuccessNotification.className = 'fixed top-16 right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-3';
          fundSuccessNotification.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
            <div>
              <div class="font-semibold">PAMM Fund Created Successfully!</div>
              <div class="text-sm opacity-90">${formData.nombreFondo} is now live and accepting investors</div>
            </div>
          `;
          document.body.appendChild(fundSuccessNotification);
          setTimeout(() => {
            document.body.removeChild(fundSuccessNotification);
          }, 5000);

          // Trigger parent refresh if callback provided
          if (onFundCreated) {
            onFundCreated();
          }

        } catch (fundError) {
          console.error('[CrearPAMMModal] Error creating PAMM fund:', fundError);
          alert('Error al crear el fondo PAMM: ' + (fundError.message || 'Error desconocido'));
          setIsSubmitting(false);
          return;
        }
      } else {
        console.log('[CrearPAMMModal] Skipping fund creation - convertirseEnManager:', formData.convertirseEnManager, 'user.id:', user?.id);
      }

      onConfirm(formData);
      onClose();
    } catch (error) {
      console.error('[CrearPAMMModal] Error in handleSubmit:', error);
      alert('Error al crear el fondo PAMM: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const renderStep = () => {
    if (mode === 'configure') {
      return renderConfigureStep();
    }
    return renderCreateStep();
  };

  const renderConfigureStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-full w-16 h-16 mx-auto mb-4">
                <Settings className="text-blue-500 w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-white">Configuración de Contrato</h3>
              <p className="text-gray-400">Define el tipo de contrato y tu perfil</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Tipo de Contrato *
                </label>
                <select
                  value={formData.tipoContrato}
                  onChange={(e) => handleInputChange('tipoContrato', e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  {tiposContrato.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                {errors.tipoContrato && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.tipoContrato}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Biografía Profesional *
                </label>
                <textarea
                  value={formData.biografia}
                  onChange={(e) => handleInputChange('biografia', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Describe tu experiencia en trading, metodología, logros y filosofía de inversión..."
                />
                <p className="text-xs text-gray-500">
                  {formData.biografia.length}/800 caracteres (mínimo 50)
                </p>
                {errors.biografia && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.biografia}
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
                <Copy className="text-green-500 w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-white">Configuración de Copia</h3>
              <p className="text-gray-400">Define la cuenta y distribución de ganancias</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Cuenta a Copiar *
                </label>
                <select
                  value={formData.cuentaMT5Seleccionada}
                  onChange={(e) => handleInputChange('cuentaMT5Seleccionada', e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">{t('pamm.selectMT5Account')}</option>
                  {realAccounts.map((account) => (
                    <option key={account.id} value={account.accountNumber || account.account_number || account.login}>
                      {account.name || account.accountName || account.account_name || `Account ${account.accountNumber || account.account_number || account.login}`} - ${account.balance?.toLocaleString() || '0'} USD (Leverage 1:{account.leverage})
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Profit Split - Trader (%) *
                  </label>
                  <div className="relative">
                    <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="number"
                      value={formData.profitSplit}
                      onChange={(e) => handleInputChange('profitSplit', Number(e.target.value))}
                      className="w-full pr-10 pl-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                      placeholder="80"
                      min="50"
                      max="95"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Inversores reciben: {100 - formData.profitSplit}%
                  </p>
                  {errors.profitSplit && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {errors.profitSplit}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Ratio de Copia
                  </label>
                  <input
                    type="number"
                    value={formData.copyRatio}
                    onChange={(e) => handleInputChange('copyRatio', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                    placeholder="1.0"
                    min="0.1"
                    max="10.0"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500">
                    Multiplicador de volumen (1.0 = copia exacta)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Balance Mínimo Requerido
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="number"
                      value={formData.minBalance}
                      onChange={(e) => handleInputChange('minBalance', Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                      placeholder="10000"
                      min="1000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Máximo de Inversores
                  </label>
                  <input
                    type="number"
                    value={formData.maxInvestors}
                    onChange={(e) => handleInputChange('maxInvestors', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                    placeholder="50"
                    min="1"
                    max="200"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="p-3 bg-purple-500 bg-opacity-20 rounded-full w-16 h-16 mx-auto mb-4">
                <User className="text-purple-500 w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-white">Experiencia y Gestión de Riesgo</h3>
              <p className="text-gray-400">Detalla tu metodología y experiencia</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Experiencia en Trading *
                </label>
                <textarea
                  value={formData.tradingExperience}
                  onChange={(e) => handleInputChange('tradingExperience', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                  placeholder="Años de experiencia, mercados operados, estrategias utilizadas..."
                />
                {errors.tradingExperience && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.tradingExperience}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Gestión de Riesgo *
                </label>
                <textarea
                  value={formData.riskManagement}
                  onChange={(e) => handleInputChange('riskManagement', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                  placeholder="Stop loss, money management, drawdown máximo, diversificación..."
                />
                {errors.riskManagement && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.riskManagement}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderCreateStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Toggle Convertirse en PAMM Manager */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 bg-opacity-20 rounded-lg">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Convertirse en PAMM Manager</h3>
                    <p className="text-sm text-gray-400">Crea y gestiona fondos PAMM para que otros usuarios inviertan</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-xs text-purple-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Earn management fees
                      </div>
                      <div className="flex items-center gap-1 text-xs text-purple-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Performance bonuses
                      </div>
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.convertirseEnManager}
                    onChange={(e) => handleInputChange('convertirseEnManager', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>
              {formData.convertirseEnManager && (
                <div className="mt-4 p-3 bg-purple-500 bg-opacity-10 border border-purple-500 border-opacity-30 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-400 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>You will be set as a PAMM Manager upon fund creation. This enables you to receive management fees and performance bonuses.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selección de Cuenta MT5 PAMM */}
            {formData.convertirseEnManager && (
              <div className="bg-[#2a2a2a] border border-[#333] rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings size={20} className="text-purple-400" />
                  Cuenta MT5 para Fondo PAMM
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Selecciona la cuenta MT5 que utilizarás para gestionar el fondo PAMM
                </p>
                
                {realAccounts.length > 0 ? (
                  <div className="space-y-3">
                    {realAccounts.map((account) => {
                      // Extraer el login MT5 correcto
                      const mt5Login = String(account.accountNumber || account.account_number || account.login || '');
                      
                      return (
                        <label
                          key={account.id}
                          className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                            formData.cuentaMT5Seleccionada === mt5Login
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-[#333] bg-[#1a1a1a] hover:border-[#444]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cuentaMT5PAMM"
                            value={mt5Login}
                            checked={formData.cuentaMT5Seleccionada === mt5Login}
                            onChange={(e) => handleInputChange('cuentaMT5Seleccionada', e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <h4 className="font-semibold text-white">{account.accountName || account.name || `Account ${mt5Login}`}</h4>
                              <p className="text-sm text-gray-400">#{mt5Login}</p>
                              <p className="text-xs text-gray-500">{account.accountTypeSelection || account.account_type || 'Real'} • Apalancamiento 1:{account.leverage || 100}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-white font-semibold">
                                <DollarSign size={14} />
                                <span>{account.balance?.toLocaleString() || '0'}</span>
                              </div>
                              <p className="text-xs text-gray-400">{t('pamm.balance')} USD</p>
                            </div>
                          </div>
                          {formData.cuentaMT5Seleccionada === mt5Login && (
                            <div className="ml-3">
                              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 font-medium mb-2">No tienes cuentas MT5 reales</p>
                      <p className="text-sm text-gray-400">
                        Necesitas al menos una cuenta MT5 Real para crear un fondo PAMM.
                        Ve a "Nueva Cuenta" para crear una.
                      </p>
                    </div>
                  </div>
                )}
                
                {errors.cuentaMT5Seleccionada && (
                  <p className="text-red-400 text-sm flex items-center gap-1 mt-3">
                    <AlertTriangle size={14} />
                    {errors.cuentaMT5Seleccionada}
                  </p>
                )}
              </div>
            )}

            <div className="text-center mb-6">
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-full w-16 h-16 mx-auto mb-4">
                <TrendingUp className="text-blue-500 w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-white">Información del Fondo</h3>
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
                    <label key={mercado} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mercados.includes(mercado)}
                        onChange={() => handleMercadoChange(mercado)}
                        className="w-5 h-5 text-orange-500 bg-[#2a2a2a] border-[#333] rounded focus:ring-orange-500"
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
  
  console.log('CrearPAMMModal rendering:', { isOpen, mode, fundData });

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      style={{ 
        zIndex: 999999, 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" 
        style={{ zIndex: 1000000 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
              <Users className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {mode === 'configure' ? 'Configurar Contrato PAMM' : 'Crear Fondo PAMM'}
              </h2>
              <p className="text-sm text-gray-400">Paso {currentStep} de {maxSteps}</p>
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
            <span className="text-sm text-gray-400">{Math.round((currentStep / maxSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-[#333] rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / maxSteps) * 100}%` }}
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
          
          {currentStep < maxSteps ? (
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
              disabled={isSubmitting}
              className={`px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Creando...' : (mode === 'configure' ? 'Guardar Configuración' : 'Crear Fondo')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Use createPortal to render the modal outside the component tree
  return createPortal(modalContent, document.body);
};

export default CrearPAMMModal; 