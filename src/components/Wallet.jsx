import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccounts, WALLET_OPERATIONS } from '../contexts/AccountsContext';
import { DatabaseAdapter } from '../services/database.adapter';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import CryptoDepositModal from './CryptoDepositModal';
import emailServiceProxy from '../services/emailServiceProxy';
import transactionService from '../services/transactionService';
import useTransactionMonitor from '../hooks/useTransactionMonitor';
import { supabase } from '../supabase/config';
import { Coins, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';

const Wallet = () => {
  const { t } = useTranslation('wallet');
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
  
  // Estados locales del componente - Sistema de tabs fusionado
  const [activeTab, setActiveTab] = useState(() => {
    // Determinar tab inicial basado en la operación actual
    if (currentOperation === WALLET_OPERATIONS.DEPOSIT) return 'depositar';
    if (currentOperation === WALLET_OPERATIONS.WITHDRAW) return 'retirar';
    return 'depositar'; // Default
  });
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
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showCryptoDepositModal, setShowCryptoDepositModal] = useState(false);
  const dropdownRef = useRef(null);
  const transferDropdownRef = useRef(null);

  // Estados para historial de transacciones
  const [transactions, setTransactions] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  
  // Hook para monitoreo en tiempo real de transacciones
  const { refresh: refreshMonitor } = useTransactionMonitor(
    currentUser?.id,
    (update) => {
      console.log('Transaction status updated:', update);
      // Recargar transacciones cuando hay un cambio de estado
      loadTransactions();
    }
  );

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

  // Función para abrir detalles de transacción
  const handleViewTransactionDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetail(true);
  };

  // Cargar transacciones iniciales
  useEffect(() => {
    loadTransactions();
    // Hacer supabase disponible globalmente para pruebas
    if (typeof window !== 'undefined') {
      window.supabase = supabase;
    }
  }, [currentUser]);

  // Auto-seleccionar cuenta si viene del contexto
  useEffect(() => {
    if (operationData?.account && !selectedAccount) {
      selectAccount(operationData.account);
    }
  }, [operationData, selectedAccount, selectAccount]);

  // Auto-seleccionar crypto cuando es la única opción
  useEffect(() => {
    if ((activeTab === 'depositar' || activeTab === 'retirar') && !selectedMethod) {
      setSelectedMethod({ id: 'crypto', name: t('common.methods.crypto'), icon: <Coins className="w-6 h-6 text-white" /> });
    }
  }, [activeTab, selectedMethod, t]);

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
    if (currentOperation === WALLET_OPERATIONS.DEPOSIT) return t('tabs.deposit');
    if (currentOperation === WALLET_OPERATIONS.WITHDRAW) return t('tabs.withdraw');
    if (currentOperation === WALLET_OPERATIONS.TRANSFER) return t('tabs.transfer');
    return t('title');
  };

  const getOperationColor = () => {
    if (currentOperation === WALLET_OPERATIONS.DEPOSIT) return 'text-white';
    if (currentOperation === WALLET_OPERATIONS.WITHDRAW) return 'text-white';
    if (currentOperation === WALLET_OPERATIONS.TRANSFER) return 'text-white';
    return 'text-white';
  };

  // Cargar transacciones desde Supabase
  const loadTransactions = async () => {
    if (!currentUser) return;
    
    try {
      // Cargar transacciones reales usando el servicio
      const result = await transactionService.getUserTransactions('all', 50);
      
      if (result.success) {
        // Combinar y formatear todas las transacciones
        const allTransactions = [];
        
        // Agregar depósitos
        if (result.deposits) {
          result.deposits.forEach(dep => {
            allTransactions.push({
              id: dep.id,
              amount: dep.amount || dep.amount_usd,
              currency: dep.currency || 'USD',
              type: 'deposit',
              method: dep.payment_method === 'crypto' ? t('common.methods.crypto') : dep.payment_method,
              date: new Date(dep.submitted_at),
              status: dep.status,
              account: dep.account_name,
              txHash: dep.transaction_hash
            });
          });
        }
        
        // Agregar retiros
        if (result.withdrawals) {
          result.withdrawals.forEach(wit => {
            allTransactions.push({
              id: wit.id,
              amount: wit.amount,
              currency: wit.currency || 'USD',
              type: 'withdrawal',
              method: wit.withdrawal_type === 'crypto' ? t('common.methods.crypto') : t('common.methods.bank'),
              date: new Date(wit.requested_at),
              status: wit.status,
              account: wit.account_name,
              txHash: wit.transaction_hash
            });
          });
        }
        
        // Agregar transferencias
        if (result.transfers) {
          result.transfers.forEach(tra => {
            allTransactions.push({
              id: tra.id,
              amount: tra.amount,
              currency: tra.currency || 'USD',
              type: 'transfer',
              method: t('common.methods.internal'),
              date: new Date(tra.requested_at),
              status: tra.status,
              account: `${tra.from_account_name} → ${tra.to_account_name}`
            });
          });
        }
        
        // Ordenar por fecha más reciente
        allTransactions.sort((a, b) => b.date - a.date);
        setTransactions(allTransactions);
        
      } else {
        // Si falla, usar datos de ejemplo como fallback
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
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // En caso de error, intentar con datos locales
      setTransactions([]);
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
      setError(t('transfer.errors.sameAccount'));
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
      setError(t('common.errors.selectAccount'));
      return;
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError(t('common.errors.invalidAmount'));
      return;
    }

    // Validar monto mínimo para depósitos
    if (activeTab === 'depositar' && parseFloat(amount) < 100) {
      setError(t('deposit.errors.minAmount'));
      return;
    }

    if ((activeTab === 'retirar' || activeTab === 'transferir') && parseFloat(amount) > selectedAccount.balance) {
      setError(t('common.errors.insufficientBalance'));
      return;
    }

    if ((activeTab === 'retirar' || activeTab === 'depositar') && !selectedMethod) {
      setError(t('common.errors.selectMethod'));
      return;
    }

    if (activeTab === 'transferir' && !transferToAccount) {
      setError(t('transfer.errors.selectAccount'));
      return;
    }

    if (!acceptTerms) {
      setError(t('common.errors.acceptTerms'));
      return;
    }

    // Si es un depósito crypto, abrir el modal especial
    if (activeTab === 'depositar' && selectedMethod?.id === 'crypto' && selectedCoin) {
      console.log('🚀 ABRIENDO MODAL CRYPTO:', {
        activeTab,
        selectedMethod,
        selectedCoin,
        amount,
        userEmail: currentUser?.email
      });
      setShowCryptoDepositModal(true);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let result;
      const amountNum = parseFloat(amount);

      // Usar las funciones RPC según el tipo de operación
      if (activeTab === 'retirar') {
        // Crear solicitud de retiro
        result = await transactionService.createWithdrawalRequest({
          account_id: selectedAccount.id,
          account_name: selectedAccount.account_name,
          amount: amountNum,
          withdrawal_type: selectedMethod?.id === 'crypto' ? 'crypto' : 'bank',
          crypto_currency: selectedCoin,
          wallet_address: walletAddress,
          network: selectedCoin === 'USDT_TRC20' ? 'tron' : 'bsc'
        });
        
        if (!result.success) {
          throw new Error(result.error || t('withdraw.errors.processingError'));
        }
      } else if (activeTab === 'transferir') {
        // Crear solicitud de transferencia interna
        result = await transactionService.createTransferRequest({
          from_account_id: selectedAccount.id,
          from_account_name: selectedAccount.account_name,
          to_account_id: transferToAccount.id,
          to_account_name: transferToAccount.account_name,
          amount: amountNum
        });
        
        if (!result.success) {
          throw new Error(result.error || t('transfer.errors.processingError'));
        }
      }
      // Nota: Los depósitos se manejan diferente (a través del CryptoDepositModal)

      // Manejar notificaciones según el tipo de operación
      if (activeTab === 'depositar') {
        const depositAmount = parseFloat(amount);
        setSuccess(t('deposit.success', { amount }));
        notifyDeposit(depositAmount, selectedAccount.account_name);
        
        // Send deposit confirmation email
        try {
          await emailServiceProxy.sendDepositConfirmation(
            { email: currentUser.email, name: currentUser.displayName || 'Usuario' },
            { amount: depositAmount, accountName: selectedAccount.account_name, currency: 'USD', method: selectedMethod }
          );
          console.log('[Wallet] Deposit confirmation email sent');
        } catch (emailError) {
          console.error('[Wallet] Error sending deposit email:', emailError);
        }
      } else if (activeTab === 'retirar') {
        const withdrawAmount = parseFloat(amount);
        setSuccess(t('withdraw.success', { amount }));
        notifyWithdrawal(withdrawAmount, selectedAccount.account_name);
        
        // Send withdrawal confirmation email  
        try {
          await emailServiceProxy.sendWithdrawalConfirmation(
            { email: currentUser.email, name: currentUser.displayName || 'Usuario' },
            { amount: withdrawAmount, accountName: selectedAccount.account_name, currency: 'USD', method: selectedMethod }
          );
          console.log('[Wallet] Withdrawal confirmation email sent');
        } catch (emailError) {
          console.error('[Wallet] Error sending withdrawal email:', emailError);
        }
      } else if (activeTab === 'transferir') {
        const transferAmount = parseFloat(amount);
        setSuccess(t('transfer.success', { amount }));
        notifyTransfer(transferAmount, selectedAccount.account_name, transferToAccount.account_name);
      }

      // Limpiar formulario
      resetForm();
      
      // Recargar cuentas
      await loadAccounts();
      
      // Recargar transacciones
      await loadTransactions();

    } catch (error) {
      console.error('Error processing operation:', error);
      const errorMessage = t('common.errors.processingError');
      setError(errorMessage);
      notifyError(t('common.errors.operationError'), errorMessage);
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

  // Manejar confirmación de depósito crypto
  const handleCryptoDepositConfirmed = async (depositData) => {
    try {
      // Crear solicitud de depósito usando RPC (Payroll ya confirmó el pago)
      const result = await transactionService.createDepositRequest({
        account_id: selectedAccount.id,
        account_name: selectedAccount.account_name,
        amount: parseFloat(amount),
        payment_method: 'crypto',
        crypto_currency: selectedCoin,
        crypto_network: depositData.network,
        wallet_address: depositData.walletAddress,
        transaction_hash: depositData.txHash,
        payroll_data: {
          confirmed: true,
          amount: depositData.amount,
          network: depositData.network,
          tx_hash: depositData.txHash,
          confirmed_at: new Date().toISOString()
        }
      });

      if (!result.success) {
        throw new Error(result.error || t('deposit.errors.processingError'));
      }

      // Notificar al usuario
      const depositAmount = parseFloat(amount);
      setSuccess(t('deposit.pending', { amount }));
      notifyDeposit(depositAmount, selectedAccount.account_name);

      // Cerrar modal y resetear
      setShowCryptoDepositModal(false);
      resetForm();
      
      // Recargar cuentas y transacciones
      await loadAccounts();
      await loadTransactions();
    } catch (error) {
      console.error('Error processing crypto deposit:', error);
      notifyError(t('deposit.title'), t('deposit.errors.processingError'));
    }
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

  // Opciones de métodos según el tab activo - Solo crypto
  const getMethodOptions = () => {
    if (activeTab === 'depositar') {
      return [
        { id: 'crypto', name: t('common.methods.crypto'), icon: <Coins className="w-6 h-6 text-white" /> }
      ];
    }
    if (activeTab === 'retirar') {
      return [
        { id: 'crypto', name: t('common.methods.crypto'), icon: <Coins className="w-6 h-6 text-white" /> }
      ];
    }
    return [];
  };

  // Opciones de criptomonedas - USDT en ambas redes
  const getCryptoOptions = () => [
    { id: 'USDT_TRC20', name: 'USDT (TRC-20)', network: 'Tron', min: 100, confirmations: 20 },
    { id: 'USDT_ERC20', name: 'USDT (ERC-20)', network: 'Ethereum', min: 100, confirmations: 12 }
  ];

  // Filtrar cuentas disponibles para selección - Solo cuentas reales
  const availableAccounts = getAllAccounts().filter(account => {
    // Solo mostrar cuentas reales (verificar diferentes variaciones del campo)
    const isRealAccount = account.account_type === 'Real' || 
                         account.account_type === 'real' || 
                         account.accountType === 'Real' ||
                         account.accountType === 'real' ||
                         account.type === 'Real' ||
                         account.type === 'real';
    
    if (!isRealAccount) return false;
    
    // En transferencias, excluir la cuenta origen
    if (currentOperation === WALLET_OPERATIONS.TRANSFER && account.id === selectedAccount?.id) return false;
    return true;
  });

  // Debug: Log para verificar cuentas (comentado para reducir ruido)
  // console.log('Debug Wallet - currentUser:', currentUser);
  // console.log('Debug Wallet - currentUser keys:', currentUser ? Object.keys(currentUser) : 'null');
  // console.log('Debug Wallet - getAllAccounts():', getAllAccounts());
  // console.log('Debug Wallet - availableAccounts:', availableAccounts);
  // console.log('Debug Wallet - accounts from context:', accounts);
  // console.log('Debug Wallet - isLoading:', isLoading);
  // console.log('Debug Wallet - error:', error);

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
        <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 1 ? 'border-[#06b6d4]' : 'border-[#334155]'}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">{t('common.steps.step1')}</h3>
          <p className="text-[#9ca3af] mb-6 text-sm">{t('transfer.selectDestination')}</p>
          
          <div className="relative" ref={transferDropdownRef}>
            <button 
              onClick={() => setShowTransferAccountDropdown(!showTransferAccountDropdown)}
              className="w-full p-4 text-left rounded-lg border-2 border-[#4b5563] bg-[#1e1e1e] hover:bg-[#374151] transition-colors font-medium text-[#9ca3af] hover:text-white"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-white" />
                <span>
                  {transferToAccount ? `${transferToAccount.account_name} (${transferToAccount.account_number})` : t('transfer.selectDestination')}
                </span>
              </div>
            </button>

            {showTransferAccountDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#232323] border border-[#334155] rounded-lg shadow-xl z-50">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {availableAccounts.filter(acc => acc.id !== selectedAccount?.id).map((account) => (
                    <button
                      key={account.id}
                      onClick={() => handleSelectTransferAccount(account)}
                      className="w-full p-3 text-left rounded-lg hover:bg-[#374151] transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-white">{account.account_name}</div>
                          <div className="text-xs text-[#9ca3af]">{account.account_type} • {account.account_number}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">${(account.balance || 0).toLocaleString()}</div>
                          <div className="text-xs text-[#9ca3af]">USD</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {transferToAccount && (
            <button 
              onClick={() => goToStep(3)}
              className="mt-4 w-full py-2 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-lg transition-colors"
            >
              {t('common.continue')}
            </button>
          )}
        </div>

        {/* Paso 2: Información de transferencia */}
        <div className={`bg-[#232323] rounded-xl border-2 p-6 border-[#334155] ${transferToAccount ? '' : 'opacity-60'}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">{t('common.steps.step2')}</h3>
          <p className="text-[#9ca3af] mb-6 text-sm">{t('transfer.transferInfo')}</p>
          
          {transferToAccount && (
            <div className="space-y-4">
              <div className="p-4 bg-[#1e1e1e] rounded-lg border border-[#334155]">
                <div className="flex items-center gap-3 mb-3">
                  <ArrowUp className="w-6 h-6 text-white" />
                  <div>
                    <div className="font-medium text-white">{t('transfer.fromAccount')}</div>
                    <div className="text-sm text-[#9ca3af]">{selectedAccount?.accountName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowDown className="w-6 h-6 text-white" />
                  <div>
                    <div className="font-medium text-white">{t('transfer.toAccount')}</div>
                    <div className="text-sm text-[#9ca3af]">{transferToAccount.accountName}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-[#1e1e1e] rounded-lg border border-[#334155]">
                <p className="text-[#22d3ee] mb-2 text-sm font-medium">{t('common.important')}:</p>
                <p className="text-[#9ca3af] text-xs leading-relaxed">
                  {t('transfer.instant')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Paso 3: Monto y confirmación */}
        <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 3 ? 'border-[#06b6d4]' : 'border-[#334155]'} ${currentStep < 3 ? 'opacity-60' : ''}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">{t('common.steps.step3')}</h3>
          <p className="text-[#9ca3af] mb-6 text-sm">{t('transfer.completeTransfer')}</p>
          
          {currentStep >= 3 && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                  {t('common.amount')} (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#4b5563] rounded-lg text-white placeholder-[#6b7280] focus:border-[#06b6d4] focus:outline-none"
                />
              </div>

              <div className="bg-[#1e1e1e] p-4 rounded-lg mb-6 border border-[#334155]">
                <p className="text-[#22d3ee] mb-2 text-sm font-medium">{t('common.important')}:</p>
                <p className="text-[#9ca3af] text-xs leading-relaxed">
                  {t('transfer.instantNote')}
                </p>
              </div>

              <div className="flex items-center mb-6">
                <input 
                  type="checkbox" 
                  id="transferTerms" 
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mr-3 w-4 h-4 text-[#06b6d4] bg-[#1e1e1e] border-[#4b5563] rounded focus:ring-[#06b6d4] focus:ring-2"
                />
                <label htmlFor="transferTerms" className="text-sm text-[#9ca3af] font-medium">
                  {t('transfer.confirmData')}
                </label>
              </div>
              
              <button 
                onClick={handleProcessOperation}
                disabled={!acceptTerms || !amount || !transferToAccount || isLoading}
                className={`w-full py-3 rounded-lg text-center font-semibold transition-all ${
                  acceptTerms && amount && transferToAccount && !isLoading
                    ? 'bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#0e7490] text-white' 
                    : 'bg-[#374151] text-[#6b7280] cursor-not-allowed'
                }`}
              >
                {isLoading ? t('common.processing') : t('tabs.transfer')}
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
          <h3 className="text-lg font-semibold mb-2 text-white">{t('common.steps.step1')}</h3>
          <p className="text-[#9ca3af] mb-6 text-sm">{t('common.selectMethod')}</p>
          
          <div className="space-y-3">
            {methods.map((method) => (
              <button 
                key={method.id}
                onClick={() => handleSelectMethod(method)}
                className={`w-full p-4 text-left rounded-lg border-2 font-medium transition-all ${
                  selectedMethod?.id === method.id
                    ? 'bg-[#374151] border-[#06b6d4] text-white' 
                    : 'bg-[#1e1e1e] border-[#4b5563] text-[#9ca3af] hover:bg-[#374151] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center">{method.icon}</span>
                  <span>{method.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Paso 2: Seleccionar moneda (solo para crypto) */}
        <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 2 ? 'border-[#06b6d4]' : 'border-[#334155]'} ${currentStep < 2 ? 'opacity-60' : ''}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">{t('common.steps.step2')}</h3>
          <p className="text-[#9ca3af] mb-6 text-sm">
            {selectedMethod?.id === 'crypto' ? t('deposit.selectCoin') : t('common.methodDetails')}
          </p>
          
          {currentStep >= 2 && (
            <div className="space-y-3">
              {selectedMethod?.id === 'crypto' ? (
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
                    {selectedMethod?.id === 'bank_transfer' && t('common.methods.bankTransfer')}
                    {selectedMethod?.id === 'credit_card' && t('common.methods.creditCard')}
                    {selectedMethod?.id === 'skrill' && t('common.methods.skrill')}
                  </p>
                  <button 
                    onClick={() => goToStep(3)}
                    className="mt-3 w-full py-2 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-lg transition-colors"
                  >
                    {t('common.continue')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Paso 3: Monto y confirmación */}
        <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 3 ? 'border-[#06b6d4]' : 'border-[#334155]'} ${currentStep < 3 ? 'opacity-60' : ''}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">{t('common.steps.step3')}</h3>
          <p className="text-[#9ca3af] mb-6 text-sm">{t('common.completeOperation')}</p>
          
          {currentStep >= 3 && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                  {t('common.amount')} (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={activeTab === 'depositar' ? '100.00' : '0.00'}
                  min={activeTab === 'depositar' ? '100' : '0'}
                  className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#4b5563] rounded-lg text-white placeholder-[#6b7280] focus:border-[#06b6d4] focus:outline-none"
                />
                {activeTab === 'depositar' && (
                  <p className="text-xs text-[#22d3ee] mt-1">
                    {t('deposit.minAmount', { amount: '$100 USD' })}
                  </p>
                )}
              </div>

              {selectedMethod?.id === 'crypto' && activeTab === 'retirar' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    {t('withdraw.walletAddress')}
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder={t('withdraw.walletPlaceholder')}
                    className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#4b5563] rounded-lg text-white placeholder-[#6b7280] focus:border-[#06b6d4] focus:outline-none"
                  />
                </div>
              )}

              <div className="bg-[#1e1e1e] p-4 rounded-lg mb-6 border border-[#334155]">
                <p className="text-[#22d3ee] mb-2 text-sm font-medium">{t('common.important')}:</p>
                <p className="text-[#9ca3af] text-xs leading-relaxed">
                  {activeTab === 'depositar' ? 
                    t('deposit.importantNote') :
                    t('withdraw.processingTime')
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
                  {t('common.acceptTerms')}
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
      <div className="h-full flex flex-col bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-none md:rounded-2xl border-0 md:border border-[#333] overflow-hidden">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-6 border-b border-[#333] flex-shrink-0">
          <div className="flex flex-wrap gap-2 mb-4 md:mb-0 w-full md:w-auto">
            {[
              { key: 'all', label: t('history.filters.all') },
              { key: 'deposits', label: t('history.filters.deposits') },
              { key: 'withdrawals', label: t('history.filters.withdrawals') },
              { key: 'transfers', label: t('history.filters.transfers') }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setHistoryFilter(filter.key)}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
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
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#2a2a2a] rounded-lg text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors text-xs md:text-sm w-full md:w-auto justify-center md:justify-start"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('history.refresh')}
          </button>
        </div>

        {/* Vista Desktop */}
        <div className="hidden md:block flex-1 overflow-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full h-full">
              <thead className="bg-[#1a1a1a] sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">{t('history.table.date')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">{t('history.table.type')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">{t('history.table.amount')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">{t('history.table.method')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">{t('history.table.status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">{t('history.table.account')}</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">{t('history.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                      {t('history.empty')}
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
                          {transaction.type === 'deposit' ? t('tabs.deposit') :
                           transaction.type === 'withdrawal' ? t('tabs.withdraw') : t('tabs.transfer')}
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
                          {transaction.status === 'completed' ? t('history.status.completed') :
                           transaction.status === 'pending' ? t('history.status.pending') : t('history.status.failed')}
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
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewTransactionDetail(transaction)}
                          className="inline-flex items-center px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {t('history.viewMore')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vista Móvil */}
        <div className="md:hidden flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {t('history.empty')}
              </div>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <div key={transaction.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-white font-semibold text-lg">
                        ${transaction.amount.toLocaleString()} {transaction.currency}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {transaction.date.toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'deposit' ? 'bg-green-900 text-green-200' :
                      transaction.type === 'withdrawal' ? 'bg-red-900 text-red-200' :
                      'bg-blue-900 text-blue-200'
                    }`}>
                      {transaction.type === 'deposit' ? t('tabs.deposit') :
                       transaction.type === 'withdrawal' ? t('tabs.withdraw') : t('tabs.transfer')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <div className="text-gray-400">{t('history.table.method')}</div>
                      <div className="text-white">{transaction.method}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">{t('history.table.status')}</div>
                      <span className={`font-medium ${
                        transaction.status === 'completed' ? 'text-green-400' : 
                        transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {transaction.status === 'completed' ? t('history.status.completed') :
                         transaction.status === 'pending' ? t('history.status.pending') : t('history.status.failed')}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-400">{t('history.table.account')}</div>
                      <div className="text-white">
                        {transaction.account}
                        {transaction.toAccount && (
                          <span className="text-gray-500"> → {transaction.toAccount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleViewTransactionDetail(transaction)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {t('history.viewDetails')}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col p-4 text-white min-h-screen">
      {/* Header unificado con tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {currentOperation && (
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
          )}
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
        </div>
        
        {/* Tabs y botón historial */}
        <div className="flex items-center justify-between">
          <div className="flex bg-[#2a2a2a] rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTab('depositar');
                resetForm();
              }}
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === 'depositar'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('tabs.deposit')}
            </button>
            <button
              onClick={() => {
                setActiveTab('retirar');
                resetForm();
              }}
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === 'retirar'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('tabs.withdraw')}
            </button>
            <button
              onClick={() => {
                setActiveTab('transferir');
                resetForm();
              }}
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === 'transferir'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('tabs.transfer')}
            </button>
          </div>
          
          {/* Botón Historial */}
          <button
            onClick={() => setShowHistorialModal(true)}
            className="flex items-center space-x-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-lg px-4 py-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('tabs.history')}</span>
          </button>
        </div>
      </div>

      {/* Selección de cuenta */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <label className="text-sm text-gray-400">{t('common.selectAccount')}:</label>
          <button 
            onClick={loadAccounts}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? t('common.loading') : t('common.reload')}
          </button>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center justify-between w-full max-w-md px-4 py-3 bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] hover:from-[#3a3a3a] hover:to-[#2e2e2e] rounded-xl border border-[#333] transition-all duration-200"
          >
            <span className="text-white font-medium">
              {selectedAccount ? `${selectedAccount.account_name} (${selectedAccount.account_number})` : t('common.selectAccount')}
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
                {availableAccounts.length > 0 ? (
                  availableAccounts.map((account) => (
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
                          <div className="font-medium text-white">{account.account_name}</div>
                          <div className="text-xs text-gray-400">{account.account_type} • {account.account_number}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">${(account.balance || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-400">USD</div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    <p className="mb-2">{t('common.noAccounts')}</p>
                    <p className="text-sm">{t('common.createAccountFirst')}</p>
                  </div>
                )}
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
                <p className="text-gray-400 mb-2 text-sm font-medium">{t('common.availableBalance')}</p>
                <h2 className="text-3xl font-bold text-white">${(selectedAccount.balance || 0).toLocaleString()}</h2>
                <p className="text-xs text-gray-400 mt-2">{selectedAccount.accountType} • {selectedAccount.accountNumber}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-2">{t('common.activeAccount')}</div>
                <div className="text-lg font-semibold text-white">{selectedAccount.accountName}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1">
        {activeTab === 'depositar' || activeTab === 'retirar' ? (
          <div>
            {renderDepositWithdrawContent()}
          </div>
        ) : activeTab === 'transferir' ? (
          <div>
            {renderTransferContent()}
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

      {/* Modal de Historial */}
      {showHistorialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-[#232323] rounded-xl max-w-6xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#333] flex-shrink-0">
              <h3 className="text-lg md:text-xl font-semibold">{t('history.title')}</h3>
              <button
                onClick={() => setShowHistorialModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#333] transition-colors"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderTransactionHistory()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Transacción */}
      {showTransactionDetail && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 md:p-4">
          <div className="bg-[#232323] rounded-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#333]">
              <h3 className="text-lg md:text-xl font-semibold">{t('history.transactionDetails')}</h3>
              <button
                onClick={() => {
                  setShowTransactionDetail(false);
                  setSelectedTransaction(null);
                }}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#333] transition-colors"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="space-y-6">
                {/* Header con monto y tipo */}
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    ${selectedTransaction.amount.toLocaleString()} {selectedTransaction.currency}
                  </div>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    selectedTransaction.type === 'deposit' ? 'bg-green-900 text-green-200' :
                    selectedTransaction.type === 'withdrawal' ? 'bg-red-900 text-red-200' :
                    'bg-blue-900 text-blue-200'
                  }`}>
                    {selectedTransaction.type === 'deposit' ? t('tabs.deposit') :
                     selectedTransaction.type === 'withdrawal' ? t('tabs.withdraw') : t('tabs.transfer')}
                  </span>
                </div>

                {/* Información general */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">{t('history.transactionId')}</div>
                    <div className="text-white font-mono">{selectedTransaction.id}</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">{t('history.dateTime')}</div>
                    <div className="text-white">
                      {selectedTransaction.date.toLocaleDateString()} - {selectedTransaction.date.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">{t('history.table.method')}</div>
                    <div className="text-white">{selectedTransaction.method}</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">{t('history.table.status')}</div>
                    <span className={`font-medium ${
                      selectedTransaction.status === 'completed' ? 'text-green-400' : 
                      selectedTransaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {selectedTransaction.status === 'completed' ? t('history.status.completed') :
                       selectedTransaction.status === 'pending' ? t('history.status.pending') : t('history.status.failed')}
                    </span>
                  </div>
                </div>

                {/* Información de cuentas */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">{t('history.accountInfo')}</div>
                  <div className="text-white">
                    <div className="mb-1">
                      <span className="text-gray-400">{t('history.table.account')}: </span>
                      {selectedTransaction.account}
                    </div>
                    {selectedTransaction.toAccount && (
                      <div>
                        <span className="text-gray-400">{t('transfer.toAccount')}: </span>
                        {selectedTransaction.toAccount}
                      </div>
                    )}
                  </div>
                </div>

                {/* Información adicional según el tipo */}
                {selectedTransaction.type === 'deposit' && (
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-2">{t('deposit.depositInfo')}</div>
                    <div className="space-y-2 text-sm">
                      <div className="text-white">
                        <span className="text-gray-400">{t('history.processingTime')}: </span>
                        {t('deposit.processingTimeInfo')}
                      </div>
                      <div className="text-white">
                        <span className="text-gray-400">{t('history.fees')}: </span>
                        $0.00 USD
                      </div>
                    </div>
                  </div>
                )}

                {selectedTransaction.type === 'withdrawal' && (
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-2">{t('withdraw.withdrawInfo')}</div>
                    <div className="space-y-2 text-sm">
                      <div className="text-white">
                        <span className="text-gray-400">{t('history.processingTime')}: </span>
                        {t('withdraw.processingTimeInfo')}
                      </div>
                      <div className="text-white">
                        <span className="text-gray-400">{t('history.fees')}: </span>
                        $2.50 USD
                      </div>
                    </div>
                  </div>
                )}

                {selectedTransaction.type === 'transfer' && (
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-2">{t('transfer.transferInfo')}</div>
                    <div className="space-y-2 text-sm">
                      <div className="text-white">
                        <span className="text-gray-400">{t('history.processingTime')}: </span>
                        {t('transfer.instantProcessing')}
                      </div>
                      <div className="text-white">
                        <span className="text-gray-400">{t('history.fees')}: </span>
                        $0.00 USD
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón de cerrar */}
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setShowTransactionDetail(false);
                      setSelectedTransaction(null);
                    }}
                    className="w-full px-4 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Depósito Crypto */}
      <CryptoDepositModal
        isOpen={showCryptoDepositModal}
        onClose={() => setShowCryptoDepositModal(false)}
        selectedCoin={selectedCoin}
        amount={amount}
        onDepositConfirmed={handleCryptoDepositConfirmed}
        userEmail={currentUser?.email}
      />
    </div>
  );
};

export default Wallet; 