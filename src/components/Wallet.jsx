import React, { useState, useEffect, useRef } from 'react';
import { useAccounts, WALLET_OPERATIONS } from '../contexts/AccountsContext';
import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';

const Wallet = () => {
  const {
    accounts,
    selectedAccount,
    currentOperation,
    operationData,
    selectAccount,
    finishWalletOperation,
    loadAccounts,
    getAllAccounts
  } = useAccounts();
  
  const { currentUser } = useAuth();
  
  const { 
    notifyDeposit, 
    notifyWithdrawal, 
    notifyTransfer, 
    notifyError 
  } = useNotifications();
  
  // Estados locales del componente
  const [activeTab, setActiveTab] = useState('operations');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [transferToAccount, setTransferToAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showTransferAccountDropdown, setShowTransferAccountDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const transferDropdownRef = useRef(null);

  // Estados para historial de transacciones
  const [transactions, setTransactions] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');

  // Función de utilidad para scroll
  const scrollToTop = () => {
    // Usar el mismo comportamiento que el hook global para consistencia
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto', // Scroll instantáneo para mejor UX en navegación interna
      });
    } catch (e) {
      // Fallback para navegadores antiguos
      window.scrollTo(0, 0);
    }
  };

  // Cargar transacciones iniciales
  useEffect(() => {
    loadTransactions();
  }, [currentUser]);

  // Auto-seleccionar cuenta si viene del contexto
  useEffect(() => {
    if (operationData?.account && !selectedAccount) {
      selectAccount(operationData.account);
    }
  }, [operationData, selectedAccount, selectAccount]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
      if (transferDropdownRef.current && !transferDropdownRef.current.contains(event.target)) {
        setShowTransferAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determinar el título y operación actual
  const getOperationTitle = () => {
    if (currentOperation === WALLET_OPERATIONS.DEPOSIT) return 'Depositar';
    if (currentOperation === WALLET_OPERATIONS.WITHDRAW) return 'Retirar';
    if (currentOperation === WALLET_OPERATIONS.TRANSFER) return 'Transferir';
    return 'Wallet';
  };

  const getOperationColor = () => {
    if (currentOperation === WALLET_OPERATIONS.DEPOSIT) return 'text-white';
    if (currentOperation === WALLET_OPERATIONS.WITHDRAW) return 'text-white';
    if (currentOperation === WALLET_OPERATIONS.TRANSFER) return 'text-white';
    return 'text-white';
  };

  // Cargar transacciones desde Firebase
  const loadTransactions = async () => {
    if (!currentUser) return;
    
    try {
      // Aquí cargarías las transacciones reales desde Firebase
      // Por ahora uso datos de ejemplo
      const sampleTransactions = [
        { 
          id: '1', 
          amount: 1200, 
          currency: 'USD', 
          type: 'withdrawal',
          method: 'Criptomoneda', 
          date: new Date('2025-01-15'),
          status: 'completed',
          account: 'Cuenta 1',
          txHash: '0x123...'
        },
        { 
          id: '2', 
          amount: 500, 
          currency: 'USD', 
          type: 'deposit',
          method: 'Transferencia', 
          date: new Date('2025-01-14'),
          status: 'pending',
          account: 'Cuenta 2'
        },
        { 
          id: '3', 
          amount: 300, 
          currency: 'USD', 
          type: 'transfer',
          method: 'Transferencia Interna', 
          date: new Date('2025-01-13'),
          status: 'completed',
          account: 'Cuenta 1',
          toAccount: 'Cuenta 3'
        }
      ];
      setTransactions(sampleTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Manejar selección de método
  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    goToStep(2);
    setError('');
  };

  // Manejar selección de moneda
  const handleSelectCoin = (coin) => {
    setSelectedCoin(coin);
    goToStep(3);
    setError('');
  };

  // Manejar selección de cuenta para transferencia
  const handleSelectTransferAccount = (account) => {
    if (account.id === selectedAccount?.id) {
      setError('No puedes transferir a la misma cuenta');
      return;
    }
    setTransferToAccount(account);
    setShowTransferAccountDropdown(false);
    goToStep(3);
    setError('');
  };

  // Procesar operación
  const handleProcessOperation = async () => {
    if (!selectedAccount || !currentUser) {
      setError('Debe seleccionar una cuenta');
      return;
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Ingrese un monto válido');
      return;
    }

    if (currentOperation === WALLET_OPERATIONS.WITHDRAW && parseFloat(amount) > selectedAccount.balance) {
      setError('Saldo insuficiente');
      return;
    }

    if (currentOperation === WALLET_OPERATIONS.TRANSFER && !transferToAccount) {
      setError('Debe seleccionar una cuenta de destino');
      return;
    }

    if ((currentOperation === WALLET_OPERATIONS.WITHDRAW || currentOperation === WALLET_OPERATIONS.DEPOSIT) && !selectedMethod) {
      setError('Debe seleccionar un método');
      return;
    }

    if (!acceptTerms) {
      setError('Debe aceptar los términos y condiciones');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Crear registro de transacción
      const transactionData = {
        userId: currentUser.uid,
        accountId: selectedAccount.id,
        amount: parseFloat(amount),
        currency: 'USD',
        type: currentOperation.toLowerCase(),
        method: selectedMethod || 'Transferencia Interna',
        status: 'pending',
        createdAt: Timestamp.now(),
        ...(currentOperation === WALLET_OPERATIONS.TRANSFER && { 
          toAccountId: transferToAccount.id,
          toAccountName: transferToAccount.name 
        }),
        ...(selectedCoin && { coin: selectedCoin }),
        ...(walletAddress && { walletAddress })
      };

      // Guardar en Firebase
      await addDoc(collection(db, 'transactions'), transactionData);

      // Actualizar balances localmente (en producción esto se haría en el backend)
      if (currentOperation === WALLET_OPERATIONS.TRANSFER) {
        const transferAmount = parseFloat(amount);
        setSuccess(`Transferencia de $${amount} USD iniciada correctamente`);
        notifyTransfer(transferAmount, selectedAccount.accountName, transferToAccount.accountName);
      } else if (currentOperation === WALLET_OPERATIONS.DEPOSIT) {
        const depositAmount = parseFloat(amount);
        setSuccess(`Depósito de $${amount} USD iniciado correctamente`);
        notifyDeposit(depositAmount, selectedAccount.accountName);
      } else {
        const withdrawAmount = parseFloat(amount);
        setSuccess(`Retiro de $${amount} USD iniciado correctamente`);
        notifyWithdrawal(withdrawAmount, selectedAccount.accountName);
      }

      // Limpiar formulario
      resetForm();
      
      // Recargar cuentas
      await loadAccounts();
      
      // Recargar transacciones
      await loadTransactions();

    } catch (error) {
      console.error('Error processing operation:', error);
      const errorMessage = 'Error al procesar la operación. Intente nuevamente.';
      setError(errorMessage);
      notifyError('Error en Operación', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setCurrentStep(1);
    setSelectedMethod(null);
    setSelectedCoin(null);
    setTransferToAccount(null);
    setAmount('');
    setWalletAddress('');
    setAcceptTerms(false);
  };

  // Wrapper para cambiar de paso y hacer scroll
  const goToStep = (step) => {
    setCurrentStep(step);
    scrollToTop();
  };

  // Wrapper para cambiar de tab y hacer scroll
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    scrollToTop();
  };

  // Opciones de métodos según la operación
  const getMethodOptions = () => {
    if (currentOperation === WALLET_OPERATIONS.DEPOSIT) {
      return [
        { id: 'bank_transfer', name: 'Transferencia Bancaria', icon: '🏦' },
        { id: 'crypto', name: 'Criptomoneda', icon: '₿' },
        { id: 'credit_card', name: 'Tarjeta de Crédito/Débito', icon: '💳' }
      ];
    }
    if (currentOperation === WALLET_OPERATIONS.WITHDRAW) {
      return [
        { id: 'skrill', name: 'Skrill', icon: '💰' },
        { id: 'crypto', name: 'Criptomoneda', icon: '₿' },
        { id: 'bank_transfer', name: 'Transferencia Bancaria', icon: '🏦' }
      ];
    }
    return [];
  };

  // Opciones de criptomonedas
  const getCryptoOptions = () => [
    { id: 'USDT_ETH', name: 'USDT (ETH)', network: 'Ethereum', min: 25, confirmations: 3 },
    { id: 'USDC_ETH', name: 'USDC (ETH)', network: 'Ethereum', min: 25, confirmations: 3 },
    { id: 'USDT_TRC20', name: 'USDT (TRC-20)', network: 'Tron', min: 12, confirmations: 20 }
  ];

  // Filtrar cuentas disponibles para selección
  const availableAccounts = getAllAccounts().filter(account => 
    currentOperation !== WALLET_OPERATIONS.TRANSFER || account.id !== selectedAccount?.id
  );

  // Filtrar transacciones según el filtro activo
  const filteredTransactions = transactions.filter(transaction => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'deposits') return transaction.type === 'deposit';
    if (historyFilter === 'withdrawals') return transaction.type === 'withdrawal';
    if (historyFilter === 'transfers') return transaction.type === 'transfer';
    return true;
  });

  // Renderizar contenido de operación según tipo
  const renderOperationContent = () => {
    if (currentOperation === WALLET_OPERATIONS.TRANSFER) {
      return renderTransferContent();
    } else {
      return renderDepositWithdrawContent();
    }
  };

  // Contenido para transferencias
  const renderTransferContent = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paso 1: Seleccionar cuenta destino */}
        <div className={`bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-xl border-2 p-6 ${currentStep === 1 ? 'border-cyan-500' : 'border-[#333]'}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">Paso 1</h3>
          <p className="text-gray-400 mb-6 text-sm">Seleccionar cuenta de destino</p>
          
          <div className="relative" ref={transferDropdownRef}>
            <button 
              onClick={() => setShowTransferAccountDropdown(!showTransferAccountDropdown)}
              className="w-full p-4 text-left rounded-lg border-2 border-[#333] bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors"
            >
              <span className="text-white">
                {transferToAccount ? `${transferToAccount.accountName} (${transferToAccount.accountNumber})` : 'Seleccionar cuenta destino'}
              </span>
            </button>

            {showTransferAccountDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] border border-[#333] rounded-lg shadow-xl z-50">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {availableAccounts.filter(acc => acc.id !== selectedAccount?.id).map((account) => (
                    <button
                      key={account.id}
                      onClick={() => handleSelectTransferAccount(account)}
                      className="w-full p-3 text-left rounded-lg hover:bg-[#3a3a3a] transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-white">{account.accountName}</div>
                          <div className="text-xs text-gray-400">{account.accountType} • {account.accountNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">${(account.balance || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-400">USD</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Paso 2: Vacío para transferencias */}
        <div className={`bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-xl border-2 p-6 opacity-60 border-[#333]`}>
          <h3 className="text-lg font-semibold mb-2 text-white">Paso 2</h3>
          <p className="text-gray-400 mb-6 text-sm">-</p>
        </div>

        {/* Paso 3: Monto y confirmación */}
        <div className={`bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-xl border-2 p-6 ${currentStep === 3 ? 'border-cyan-500' : 'border-[#333]'} ${currentStep < 3 ? 'opacity-60' : ''}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">Paso 3</h3>
          <p className="text-gray-400 mb-6 text-sm">Monto a transferir</p>
          
          {currentStep >= 3 && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Monto (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center mb-6">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mr-3 w-4 h-4 text-cyan-500 bg-[#1a1a1a] border-[#333] rounded focus:ring-cyan-500 focus:ring-2"
                />
                <label htmlFor="terms" className="text-sm text-gray-400 font-medium">
                  Confirmo que los datos son correctos
                </label>
              </div>
              
              <button 
                onClick={handleProcessOperation}
                disabled={!acceptTerms || !amount || !transferToAccount || isLoading}
                className={`w-full py-3 rounded-lg text-center font-semibold transition-all ${
                  acceptTerms && amount && transferToAccount && !isLoading
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white' 
                    : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Procesando...' : 'Transferir'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Contenido para depósitos y retiros
  const renderDepositWithdrawContent = () => {
    const methods = getMethodOptions();
    const cryptoOptions = getCryptoOptions();

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paso 1: Seleccionar método */}
        <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 1 ? 'border-[#06b6d4]' : 'border-[#334155]'}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">Paso 1</h3>
          <p className="text-[#9ca3af] mb-6 text-sm">Seleccionar método</p>
          
          <div className="space-y-3">
            {methods.map((method) => (
              <button 
                key={method.id}
                onClick={() => handleSelectMethod(method.id)}
                className={`w-full p-4 text-left rounded-lg border-2 font-medium transition-all ${
                  selectedMethod === method.id
                    ? 'bg-[#374151] border-[#06b6d4] text-white' 
                    : 'bg-[#1e1e1e] border-[#4b5563] text-[#9ca3af] hover:bg-[#374151] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.icon}</span>
                  <span>{method.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Paso 2: Seleccionar moneda (solo para crypto) */}
        <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 2 ? 'border-[#06b6d4]' : 'border-[#334155]'} ${currentStep < 2 ? 'opacity-60' : ''}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">Paso 2</h3>
          <p className="text-[#9ca3af] mb-6 text-sm">
            {selectedMethod === 'crypto' ? 'Seleccionar moneda' : 'Detalles del método'}
          </p>
          
          {currentStep >= 2 && (
            <div className="space-y-3">
              {selectedMethod === 'crypto' ? (
                cryptoOptions.map((crypto) => (
                  <button 
                    key={crypto.id}
                    onClick={() => handleSelectCoin(crypto.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedCoin === crypto.id
                        ? 'bg-[#374151] border-[#06b6d4]' 
                        : 'bg-[#1e1e1e] border-[#4b5563] hover:bg-[#374151]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">{crypto.name}</span>
                      <span className="text-[#22d3ee] text-sm font-medium">{crypto.network}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#9ca3af] mt-2">
                      <span>Mínimo: ${crypto.min}</span>
                      <span>Confirmaciones: {crypto.confirmations}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 bg-[#1e1e1e] rounded-lg border border-[#334155]">
                  <p className="text-[#9ca3af] text-sm">
                    {selectedMethod === 'bank_transfer' && 'Se procesará mediante transferencia bancaria'}
                    {selectedMethod === 'credit_card' && 'Se procesará mediante tarjeta de crédito'}
                    {selectedMethod === 'skrill' && 'Se procesará mediante Skrill'}
                  </p>
                  <button 
                    onClick={() => goToStep(3)}
                    className="mt-3 w-full py-2 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-lg transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Paso 3: Monto y confirmación */}
        <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 3 ? 'border-[#06b6d4]' : 'border-[#334155]'} ${currentStep < 3 ? 'opacity-60' : ''}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">Paso 3</h3>
          <p className="text-[#9ca3af] mb-6 text-sm">Completar operación</p>
          
          {currentStep >= 3 && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                  Monto (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#4b5563] rounded-lg text-white placeholder-[#6b7280] focus:border-[#06b6d4] focus:outline-none"
                />
              </div>

              {selectedMethod === 'crypto' && currentOperation === WALLET_OPERATIONS.WITHDRAW && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Dirección de Wallet
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Ingrese la dirección de su wallet"
                    className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#4b5563] rounded-lg text-white placeholder-[#6b7280] focus:border-[#06b6d4] focus:outline-none"
                  />
                </div>
              )}

              <div className="bg-[#1e1e1e] p-4 rounded-lg mb-6 border border-[#334155]">
                <p className="text-[#22d3ee] mb-2 text-sm font-medium">Importante:</p>
                <p className="text-[#9ca3af] text-xs leading-relaxed">
                  {currentOperation === WALLET_OPERATIONS.DEPOSIT ? 
                    'Asegúrese de que los fondos provienen de una fuente legítima.' :
                    'Los retiros pueden tardar entre 1-3 días hábiles en procesarse.'
                  }
                </p>
              </div>
              
              <div className="flex items-center mb-6">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mr-3 w-4 h-4 text-[#06b6d4] bg-[#1e1e1e] border-[#4b5563] rounded focus:ring-[#06b6d4] focus:ring-2"
                />
                <label htmlFor="terms" className="text-sm text-[#9ca3af] font-medium">
                  Entiendo y acepto los términos
                </label>
              </div>
              
              <button 
                onClick={handleProcessOperation}
                disabled={!acceptTerms || !amount || isLoading}
                className={`w-full py-3 rounded-lg text-center font-semibold transition-all ${
                  acceptTerms && amount && !isLoading
                    ? 'bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#0e7490] text-white' 
                    : 'bg-[#374151] text-[#6b7280] cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Procesando...' : getOperationTitle()}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar historial de transacciones
  const renderTransactionHistory = () => {
    return (
      <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-2xl border border-[#333] overflow-hidden">
        {/* Filtros */}
        <div className="flex flex-wrap justify-between items-center p-6 border-b border-[#333]">
          <div className="flex flex-wrap gap-2 mb-4 lg:mb-0">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'deposits', label: 'Depósitos' },
              { key: 'withdrawals', label: 'Retiros' },
              { key: 'transfers', label: 'Transferencias' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setHistoryFilter(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  historyFilter === filter.key
                    ? 'bg-cyan-600 text-white'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button 
            onClick={loadTransactions}
            className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-lg text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        {/* Tabla de transacciones */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Monto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Método</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Cuenta</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                    No hay transacciones para mostrar
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <tr key={transaction.id} className={`${index % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#2a2a2a]'} hover:bg-[#3a3a3a] transition-colors`}>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {transaction.date.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'deposit' ? 'bg-green-900 text-green-200' :
                        transaction.type === 'withdrawal' ? 'bg-red-900 text-red-200' :
                        'bg-blue-900 text-blue-200'
                      }`}>
                        {transaction.type === 'deposit' ? 'Depósito' :
                         transaction.type === 'withdrawal' ? 'Retiro' : 'Transferencia'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-semibold text-sm">
                      ${transaction.amount.toLocaleString()} {transaction.currency}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {transaction.method}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium ${
                        transaction.status === 'completed' ? 'text-green-400' : 
                        transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {transaction.status === 'completed' ? 'Completado' :
                         transaction.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {transaction.account}
                      {transaction.toAccount && (
                        <div className="text-xs text-gray-500">
                          → {transaction.toAccount}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col p-4 text-white min-h-screen">
      {/* Header con título y botón de volver */}
      <div className="flex items-center gap-4 mb-6">
        {!currentOperation ? (
          <h1 className="text-2xl font-semibold">Billetera</h1>
        ) : (
          <>
            <div className="flex-shrink-0">
              <img 
                src="/Back.svg" 
                alt="Back" 
                onClick={() => {
                  finishWalletOperation();
                  resetForm();
                  scrollToTop();
                }}
                className="w-10 h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
              />
            </div>
            <h1 className={`text-2xl font-semibold ${getOperationColor()}`}>
              {getOperationTitle()}
            </h1>
          </>
        )}
      </div>

      {/* Selección de cuenta */}
      <div className="mb-6">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center justify-between w-full max-w-md px-4 py-3 bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] hover:from-[#3a3a3a] hover:to-[#2e2e2e] rounded-xl border border-[#333] transition-all duration-200"
          >
            <span className="text-white font-medium">
              {selectedAccount ? `${selectedAccount.accountName} (${selectedAccount.accountNumber})` : 'Seleccionar Cuenta'}
            </span>
            <svg 
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showAccountDropdown ? 'rotate-180' : ''}`} 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dropdown de cuentas */}
          {showAccountDropdown && (
            <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] border border-[#333] rounded-xl shadow-xl z-50">
              <div className="p-2 max-h-60 overflow-y-auto">
                {availableAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      selectAccount(account);
                      setShowAccountDropdown(false);
                    }}
                    className={`w-full p-4 text-left rounded-lg transition-all duration-200 ${
                      selectedAccount?.id === account.id
                        ? 'bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 border border-cyan-500/50'
                        : 'hover:bg-[#3a3a3a]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-white">{account.accountName}</div>
                        <div className="text-xs text-gray-400">{account.accountType} • {account.accountNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">${(account.balance || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">USD</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Balance Card */}
      {selectedAccount && (
        <div className="mb-8">
          <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-2xl p-6 border-t border-l border-r border-cyan-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400 mb-2 text-sm font-medium">Balance Disponible</p>
                <h2 className="text-3xl font-bold text-white">${(selectedAccount.balance || 0).toLocaleString()}</h2>
                <p className="text-xs text-gray-400 mt-2">{selectedAccount.accountType} • {selectedAccount.accountNumber}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-2">Cuenta Activa</div>
                <div className="text-lg font-semibold text-white">{selectedAccount.accountName}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex border-b border-[#333]">
          <button 
            onClick={() => handleTabClick('operations')}
            className={`px-6 py-3 font-medium text-sm transition-all relative ${
              activeTab === 'operations' 
                ? 'text-white border-b-2 border-cyan-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {getOperationTitle()}
          </button>
          <button 
            onClick={() => handleTabClick('history')}
            className={`px-6 py-3 font-medium text-sm transition-all relative ${
              activeTab === 'history' 
                ? 'text-white border-b-2 border-cyan-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* Contenido de tabs */}
      <div className="flex-1">
        {activeTab === 'operations' ? (
          <div>
            {!currentOperation ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-gray-400 text-lg mb-4 text-center">
                  Selecciona una operación desde el Dashboard
                </div>
                <div className="text-sm text-gray-500 text-center">
                  Usa los botones Depositar, Retirar o Transferir para comenzar
                </div>
              </div>
            ) : (
              <div>
                {/* Contenido dinámico según la operación */}
                {renderOperationContent()}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Historial de transacciones */}
            {renderTransactionHistory()}
          </div>
        )}
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-200">
          {success}
        </div>
      )}
    </div>
  );
};

export default Wallet; 