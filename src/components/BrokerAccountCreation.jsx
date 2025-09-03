import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createBrokerAccount, checkBrokerApiStatus } from '../services/brokerAccountsService';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

const BrokerAccountCreation = ({ onAccountCreated, onCancel }) => {
  const { currentUser } = useAuth();
  
  // Log component initialization
  useEffect(() => {
    logger.info('BrokerAccountCreation component mounted');
    console.log('[BrokerAccountCreation] Component initialized');
  }, []);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    accountType: 'standard',
    leverage: 100,
    initialDeposit: 0,
    currency: 'USD'
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiStatus, setApiStatus] = useState(null);
  const [isCheckingApi, setIsCheckingApi] = useState(true);

  // Check API status on component mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        const isAvailable = await checkBrokerApiStatus();
        setApiStatus(isAvailable);
      } catch (error) {
        logger.error('Error checking broker API status', error);
        setApiStatus(false);
      } finally {
        setIsCheckingApi(false);
      }
    };

    checkApi();
  }, []);

  // Pre-fill user data if available
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || prev.email,
        name: currentUser.displayName || prev.name
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Nombre completo es requerido';
    if (!formData.email.trim()) newErrors.email = 'Email es requerido';
    if (!formData.country.trim()) newErrors.country = 'País es requerido';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Leverage validation
    if (formData.leverage < 1 || formData.leverage > 200) {
      newErrors.leverage = 'Apalancamiento debe estar entre 1 y 200';
    }

    // Initial deposit validation
    if (formData.initialDeposit < 0) {
      newErrors.initialDeposit = 'Depósito inicial no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!apiStatus) {
      setErrors({ submit: 'Broker API no está disponible en este momento' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      logger.info('Creating broker account with data:', formData);
      logger.info('Current user:', { uid: currentUser?.uid, email: currentUser?.email });
      logger.info('API URL from config:', window.location.origin);

      // Create broker account using real MT5 API
      const result = await createBrokerAccount({
        ...formData,
        client_id: currentUser?.uid,
        notes: `Account created via frontend by ${currentUser?.email || 'unknown'}`
      });

      logger.info('Broker account creation result:', result);

      if (result.success && result.account) {
        logger.info('Broker account created successfully:', result.account);

        // Call success callback
        if (onAccountCreated) {
          onAccountCreated(result.account);
        }

        // Show success message with MT5 credentials
        toast.success(
          <div>
            <h4 className="font-bold mb-2">¡Cuenta Real creada exitosamente!</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Login:</span> {result.account.accountNumber}</p>
              <p><span className="font-medium">Password:</span> {result.account.password}</p>
              <p><span className="font-medium">Investor Password:</span> {result.account.investorPassword}</p>
              <p><span className="font-medium">Balance:</span> ${result.account.balance}</p>
              <p><span className="font-medium">Servidor:</span> AGM-Server</p>
            </div>
            <p className="text-xs mt-2 opacity-75">Guarda estas credenciales en un lugar seguro</p>
          </div>,
          { duration: 8000 }
        );
      } else {
        throw new Error('Account creation failed');
      }
    } catch (error) {
      logger.error('Error creating broker account:', error);
      setErrors({
        submit: error.message || 'Error al crear la cuenta. Por favor intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking API
  if (isCheckingApi) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando disponibilidad del servicio...</p>
        </div>
      </div>
    );
  }

  // API not available
  if (!apiStatus) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-6">
        <div className="text-center">
          <div className="bg-red-500/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Servicio No Disponible</h3>
          <p className="text-gray-400 mb-4">
            El servicio de creación de cuentas reales no está disponible en este momento.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Por favor contacta al soporte técnico o intenta más tarde.
          </p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          Crear Cuenta Real de Broker
        </h2>
        <p className="text-gray-400 text-sm">
          Esta cuenta será creada directamente en el servidor MetaTrader 5 con acceso real al mercado.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Ej: Juan Pérez"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.email ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="tu@email.com"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              País *
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.country ? 'border-red-500' : 'border-gray-600'
              }`}
            >
              <option value="">Seleccionar país</option>
              <option value="US">Estados Unidos</option>
              <option value="CA">Canadá</option>
              <option value="MX">México</option>
              <option value="ES">España</option>
              <option value="AR">Argentina</option>
              <option value="CO">Colombia</option>
              <option value="CL">Chile</option>
              <option value="PE">Perú</option>
            </select>
            {errors.country && (
              <p className="text-red-400 text-xs mt-1">{errors.country}</p>
            )}
          </div>
        </div>

        {/* Account Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Cuenta
            </label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Apalancamiento
            </label>
            <select
              name="leverage"
              value={formData.leverage}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.leverage ? 'border-red-500' : 'border-gray-600'
              }`}
            >
              <option value={10}>1:10</option>
              <option value={20}>1:20</option>
              <option value={30}>1:30</option>
              <option value={40}>1:40</option>
              <option value={50}>1:50</option>
              <option value={60}>1:60</option>
              <option value={70}>1:70</option>
              <option value={80}>1:80</option>
              <option value={90}>1:90</option>
              <option value={100}>1:100</option>
              <option value={125}>1:125</option>
              <option value={150}>1:150</option>
              <option value={175}>1:175</option>
              <option value={200}>1:200</option>
            </select>
            {errors.leverage && (
              <p className="text-red-400 text-xs mt-1">{errors.leverage}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Depósito Inicial (USD)
            </label>
            <input
              type="number"
              name="initialDeposit"
              value={formData.initialDeposit}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.initialDeposit ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="0.00"
            />
            {errors.initialDeposit && (
              <p className="text-red-400 text-xs mt-1">{errors.initialDeposit}</p>
            )}
          </div>
        </div>

        {/* Error message */}
        {errors.submit && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-md p-3">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-md transition-colors"
            >
              Cancelar
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] hover:opacity-90 disabled:opacity-50 text-white rounded-md transition-opacity flex items-center space-x-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{isLoading ? 'Creando...' : 'Crear Cuenta Real'}</span>
          </button>
        </div>
      </form>

      {/* Information note */}
      <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-md">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Información importante:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-400">
              <li>Esta cuenta será creada directamente en el servidor MetaTrader 5</li>
              <li>Recibirás las credenciales de acceso una vez creada la cuenta</li>
              <li>El depósito inicial es opcional y puede realizarse después</li>
              <li>La cuenta estará activa inmediatamente después de la creación</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerAccountCreation;