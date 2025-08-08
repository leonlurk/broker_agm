import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { createTradingAccount } from '../services/tradingAccounts';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';

export default function TradingChallengeUI() {
  const { currentUser } = useAuth();
  const { notifyAccountCreated } = useNotifications();
  const [accountType, setAccountType] = useState('Real');
  const [accountName, setAccountName] = useState('');
  const [accountTypeSelection, setAccountTypeSelection] = useState('Zero Spread');
  const [leverage, setLeverage] = useState('');
  const [showLeverageDropdown, setShowLeverageDropdown] = useState(false);
  
  // Loading and feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mt5Credentials, setMt5Credentials] = useState(null);

  const leverageOptions = ['1:50', '1:100', '1:200', '1:500', '1:1000'];

  const handleLeverageSelect = (option) => {
    setLeverage(option);
    setShowLeverageDropdown(false);
  };

  const handleCreateAccount = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Validation
    if (!accountName.trim()) {
      setError('El nombre de la cuenta es requerido');
      return;
    }
    
    if (!leverage) {
      setError('Debe seleccionar un apalancamiento');
      return;
    }
    
    if (!currentUser) {
      setError('Debe estar autenticado para crear una cuenta');
      return;
    }

    setIsLoading(true);

    try {
      const accountData = {
        accountName: accountName.trim(),
        accountType,
        accountTypeSelection,
        leverage
      };

      const result = await createTradingAccount(currentUser.id, accountData);

      if (result.success) {
        setSuccess(`¡Cuenta creada exitosamente! Número de cuenta: ${result.accountNumber}`);
        
        // Store MT5 credentials if available
        if (result.mt5Credentials) {
          setMt5Credentials(result.mt5Credentials);
        }
        
        // Crear notificación
        notifyAccountCreated(accountName.trim(), `${accountType} - ${accountTypeSelection}`);
        
        // Reset form
        setAccountName('');
        setLeverage('');
        setAccountType('Real');
        setAccountTypeSelection('Zero Spread');
    } else {
        setError(result.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      setError('Error inesperado al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#232323] text-white bg-gradient-to-br from-[#232323] to-[#2d2d2d]">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-center">
          {/* Main Content */}
          <div className="w-full max-w-2xl p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-2xl border border-[#333]">
            <div className="mb-6 md:mb-10">
              {/* Title */}
              <div className="mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-medium">Crear Cuenta</h2>
              </div>
              
              {/* Success/Error Messages */}
              {success && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-500 rounded-lg">
                  <p className="text-green-400 text-sm md:text-base mb-3">{success}</p>
                  
                  {/* MT5 Credentials Display */}
                  {mt5Credentials && (
                    <div className="mt-4 p-3 bg-black/30 rounded-lg">
                      <p className="text-cyan-400 font-semibold mb-2">Credenciales MT5:</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Login:</span>
                          <span className="text-white font-mono">{mt5Credentials.login}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Contraseña:</span>
                          <span className="text-white font-mono">{mt5Credentials.password}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Contraseña Investor:</span>
                          <span className="text-white font-mono">{mt5Credentials.investor_password}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Servidor:</span>
                          <span className="text-white">{mt5Credentials.server || 'AGM-Server'}</span>
                        </div>
                      </div>
                      <p className="text-yellow-400 text-xs mt-3">
                        ⚠️ Guarde estas credenciales de forma segura. No podrán ser recuperadas posteriormente.
                      </p>
                    </div>
                  )}
              </div>
              )}
              
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm md:text-base">{error}</p>
              </div>
              )}
              
              {/* Account Type Toggle (DEMO/Real) */}
              <div className="mb-6 md:mb-8">
                <div className="flex space-x-2 mb-4">
                <button 
                    className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-regular border focus:outline-none transition-colors ${
                      accountType === 'DEMO' 
                        ? 'border-cyan-500 bg-transparent text-white' 
                        : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-gray-400'
                    }`}
                    onClick={() => setAccountType('DEMO')}
                    disabled={isLoading}
                  >
                    DEMO
                </button>
                <button 
                    className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-regular border focus:outline-none transition-colors ${
                      accountType === 'Real' 
                        ? 'border-cyan-500 bg-transparent text-white' 
                        : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-gray-400'
                    }`}
                    onClick={() => setAccountType('Real')}
                    disabled={isLoading}
                  >
                    Real
                </button>
                </div>
              </div>
              
              {/* Account Name Input */}
              <div className="mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-medium mb-3 md:mb-4">Nombre De La Cuenta</h3>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Nombre"
                  disabled={isLoading}
                  className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-base md:text-lg focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
                />
              </div>
              
              {/* Account Type Selection */}
              <div className="mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-medium mb-3 md:mb-4">Tipo De Cuenta</h3>
                <div className="flex space-x-3 md:space-x-4">
                  <button 
                    className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-regular border focus:outline-none transition-colors ${
                      accountTypeSelection === 'Zero Spread' 
                        ? 'border-cyan-500 bg-transparent text-white' 
                        : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-gray-400'
                    }`}
                    onClick={() => setAccountTypeSelection('Zero Spread')}
                    disabled={isLoading}
                  >
                    Zero Spread
                  </button>
                  <button 
                    className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-regular border focus:outline-none transition-colors ${
                      accountTypeSelection === 'Standard' 
                        ? 'border-cyan-500 bg-transparent text-white' 
                        : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-gray-400'
                    }`}
                    onClick={() => setAccountTypeSelection('Standard')}
                    disabled={isLoading}
                  >
                    Standard
                  </button>
                </div>
                  </div>
                  
              {/* Leverage Selection */}
              <div className="mb-8 md:mb-10">
                <h3 className="text-lg md:text-xl font-medium mb-3 md:mb-4">Apalancamiento</h3>
                <div className="relative">
                  <button
                    onClick={() => !isLoading && setShowLeverageDropdown(!showLeverageDropdown)}
                    disabled={isLoading}
                    className="w-full md:w-auto min-w-[200px] flex items-center justify-between border border-gray-700 rounded-lg px-4 py-3 text-base md:text-lg focus:outline-none focus:border-cyan-500 transition-colors bg-gradient-to-br from-[#232323] to-[#2d2d2d] disabled:opacity-50"
                  >
                    <span className={leverage ? 'text-white' : 'text-gray-400'}>
                      {leverage || 'Seleccionar'}
                    </span>
                    <ChevronDown size={20} className="text-gray-400" />
                  </button>
                  
                  {showLeverageDropdown && !isLoading && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-gray-700 rounded-lg shadow-lg z-10">
                      {leverageOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleLeverageSelect(option)}
                          className="w-full px-4 py-3 text-left text-base md:text-lg hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Create Account Button */}
              <div className="mt-8">
                <button 
                  onClick={handleCreateAccount}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 md:py-4 px-6 rounded-lg text-base md:text-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creando Cuenta...
                </div>
                  ) : (
                    '+ Crear Cuenta'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}