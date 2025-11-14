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
import toast from 'react-hot-toast';
import twoFactorService from '../services/twoFactorService';
import TwoFactorWithdrawModal from './TwoFactorWithdrawModal';
import { transferWalletToMT5, transferMT5ToMT5, transferMT5ToWallet } from '../services/mt5Api';
import { WalletLoader, TableLoader, useMinLoadingTime } from './WaveLoader';
import { WalletLayoutLoader } from './ExactLayoutLoaders';

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
  
  const { currentUser, userData } = useAuth();
  
  // Estado para el balance del broker (nuevo flujo)
  const [brokerBalance, setBrokerBalance] = useState(0);
  const [mt5Accounts, setMt5Accounts] = useState([]);
  
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
  const [transferFromAccount, setTransferFromAccount] = useState(null);
  const [transferToAccount, setTransferToAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [showFromAccountDropdown, setShowFromAccountDropdown] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showTransferAccountDropdown, setShowTransferAccountDropdown] = useState(false);
  const [showTransferFromDropdown, setShowTransferFromDropdown] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showCryptoDepositModal, setShowCryptoDepositModal] = useState(false);
  
  // Estados para el modal de retiro mejorado
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState(null);
  const [showWithdrawMethodDropdown, setShowWithdrawMethodDropdown] = useState(false);
  const [showAddMethodForm, setShowAddMethodForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  // Estados para agregar método desde modal
  const [newMethodAlias, setNewMethodAlias] = useState('');
  const [newMethodAddress, setNewMethodAddress] = useState('');
  const [newMethodNetwork, setNewMethodNetwork] = useState('tron_trc20');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [addressError, setAddressError] = useState('');
  const dropdownRef = useRef(null);
  const transferDropdownRef = useRef(null);
  const transferFromDropdownRef = useRef(null);
  const withdrawMethodDropdownRef = useRef(null);
  const networkDropdownRef = useRef(null);

  // Estados para historial de transacciones
  const [transactions, setTransactions] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Estados para mensajes de error y éxito
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para 2FA
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pending2FAOperation, setPending2FAOperation] = useState(null);
  const [twoFactorData, setTwoFactorData] = useState(null);
  
  // Use minimum loading time of 2 seconds - DISABLED to prevent stuck loading
  const showLoader = false; // Disabled to prevent stuck loading on refresh
  
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

  // Cargar transacciones iniciales y datos del broker
  useEffect(() => {
    const loadInitialData = async () => {
      // setInitialLoading(true); // Disabled to prevent stuck loading
      try {
        // Verificar que currentUser esté disponible antes de cargar datos
        if (currentUser && currentUser.id) {
          await Promise.all([
            loadTransactions(),
            loadBrokerBalance(),
            loadMT5Accounts(),
            loadPaymentMethods()
          ]);
        }
      } catch (error) {
        console.error('Error loading initial wallet data:', error);
      } finally {
        // setInitialLoading(false); // Disabled to prevent stuck loading
      }
    };
    
    // Solo cargar si currentUser está disponible y tiene ID
    if (currentUser && currentUser.id) {
      loadInitialData();
    }
    
    // Hacer supabase disponible globalmente para pruebas
    if (typeof window !== 'undefined') {
      window.supabase = supabase;
    }
  }, [currentUser, currentUser?.id]);

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
      if (transferFromDropdownRef.current && !transferFromDropdownRef.current.contains(event.target)) {
        setShowTransferFromDropdown(false);
      }
      if (withdrawMethodDropdownRef.current && !withdrawMethodDropdownRef.current.contains(event.target)) {
        setShowWithdrawMethodDropdown(false);
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

  // Función para cargar el balance del broker desde Supabase
  const loadBrokerBalance = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('broker_balance')
        .eq('id', currentUser.id)
        .single();
      
      if (!error) {
        setBrokerBalance(data?.broker_balance || 0);
      }
    } catch (error) {
      console.error('Error loading broker balance:', error);
      setBrokerBalance(0);
    }
  };

  // Función para actualizar el balance del broker
  const updateBrokerBalance = async (newBalance) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ broker_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);
      
      if (!error) {
        setBrokerBalance(newBalance);
      }
    } catch (error) {
      console.error('Error updating broker balance:', error);
    }
  };

  // Cargar cuentas MT5 del usuario
  const loadMT5Accounts = async () => {
    if (!currentUser) return;
    
    try {
      // Primero intentar con broker_accounts
      const { data, error } = await supabase
        .from('broker_accounts')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'active');
      
      // Normalizar cuentas para asegurar que tengan account_number
      const normalizeAccounts = (accounts) => {
        return accounts.map(acc => ({
          ...acc,
          account_number: acc.account_number || acc.login || acc.accountNumber || acc.id,
          account_name: acc.account_name || acc.name || `Account ${acc.login || acc.id}`
        }));
      };

      if (!error && data && data.length > 0) {
        setMt5Accounts(normalizeAccounts(data));
      } else {
        // Si no hay cuentas en broker_accounts, usar trading_accounts
        const accounts = getAllAccounts();
        setMt5Accounts(normalizeAccounts(accounts));

        // Si estamos en transferir, preseleccionar cuenta con balance
        if (activeTab === 'transferir') {
          const accountsWithBalance = accounts.filter(acc => (acc.balance || 0) > 0);
          if (accountsWithBalance.length > 0) {
            setTransferFromAccount(normalizeAccounts([accountsWithBalance[0]])[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading MT5 accounts:', error);
      // Fallback a getAllAccounts
      const accounts = getAllAccounts();
      setMt5Accounts(normalizeAccounts(accounts));
    }
  };
  
  // Cargar métodos de pago del usuario
  const loadPaymentMethods = async () => {
    if (!currentUser) return;
    
    try {
      const userId = currentUser.id || currentUser.uid;
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (!error) {
        setPaymentMethods(data || []);
        // Auto-seleccionar el primer método si existe y no hay uno seleccionado
        if (data && data.length > 0 && !selectedWithdrawMethod) {
          setSelectedWithdrawMethod(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
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
        
        // Agregar depósitos (ahora van al balance general)
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
              account: dep.account_id === 'general' ? t('common.generalBalance') : dep.account_name,
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
  };
  
  // Función para manejar selección de método de retiro
  const handleSelectWithdrawMethod = (method) => {
    setSelectedWithdrawMethod(method);
    setShowWithdrawMethodDropdown(false);
    setShowAddMethodForm(false); // Ocultar formulario de agregar método si está abierto
  };
  
  // Validar dirección crypto
  const validateCryptoAddress = (address, network) => {
    const networkValidations = {
      'tron_trc20': /^T[A-Za-z1-9]{33}$/,
      'ethereum_erc20': /^0x[a-fA-F0-9]{40}$/
    };
    return networkValidations[network]?.test(address) || false;
  };
  
  // Agregar nuevo método de retiro desde el modal
  const handleAddWithdrawMethod = async () => {
    if (!newMethodAlias || !newMethodAddress || !newMethodNetwork) {
      toast.error(t('settings:paymentMethods.errors.completeAllCryptoFields'));
      return;
    }
    
    if (!validateCryptoAddress(newMethodAddress, newMethodNetwork)) {
      const errorMessages = {
        'tron_trc20': t('settings:paymentMethods.errors.tronAddressFormat'),
        'ethereum_erc20': t('settings:paymentMethods.errors.ethereumAddressFormat')
      };
      toast.error(errorMessages[newMethodNetwork]);
      return;
    }
    
    // Validar duplicados
    const isDuplicate = paymentMethods.some(method => 
      method.type === 'crypto' && 
      method.address === newMethodAddress && 
      method.network === newMethodNetwork
    );
    
    if (isDuplicate) {
      toast.error(t('settings:paymentMethods.errors.duplicateWallet'));
      return;
    }
    
    const newMethod = {
      type: 'crypto',
      alias: newMethodAlias,
      address: newMethodAddress,
      network: newMethodNetwork
    };
    
    try {
      const userId = currentUser.id || currentUser.uid;
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          ...newMethod,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (!error && data) {
        toast.success(t('settings:paymentMethods.methodAddedSuccess'));
        await loadPaymentMethods(); // Recargar lista
        setSelectedWithdrawMethod(data); // Seleccionar el nuevo método
        setShowAddMethodForm(false);
        // Limpiar formulario
        setNewMethodAlias('');
        setNewMethodAddress('');
        setNewMethodNetwork('tron_trc20');
        setAddressError('');
      } else {
        console.error('Error adding payment method:', error);
        toast.error(error?.message || t('settings:paymentMethods.errors.loadingMethods'));
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error(t('settings:paymentMethods.errors.loadingMethods'));
    }
  };

  // Manejar selección de moneda
  const handleSelectCoin = (coin) => {
    setSelectedCoin(coin);
    goToStep(3);
    setError('');
  };

  // Manejar selección de cuenta para transferencia
  const handleSelectTransferAccount = (account) => {
    setTransferToAccount(account);
    setShowTransferAccountDropdown(false);
  };

  // Manejar selección de cuenta origen para transferencia MT5-to-MT5
  const handleSelectTransferFromAccount = (account) => {
    setTransferFromAccount(account);
    setShowTransferFromDropdown(false);
    // Reset destination account if it's the same as source
    if (transferToAccount && account && transferToAccount.id === account.id) {
      setTransferToAccount(null);
    }
  };

  // Procesar operación
  const handleProcessOperation = async () => {
    // Para depósitos, no necesitamos cuenta seleccionada porque va directo a la wallet
    // Para transferencias y retiros, sí necesitamos cuenta seleccionada
    if ((activeTab === 'transferir' || activeTab === 'retirar') && !selectedAccount) {
      toast.error(t('common.errors.selectAccount'));
      return;
    }
    
    if (!currentUser) {
      toast.error(t('common.errors.notAuthenticated'));
      return;
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error(t('common.errors.invalidAmount'));
      return;
    }

    // Validar monto mínimo para depósitos
    if (activeTab === 'depositar' && parseFloat(amount) < 50) {
      toast.error(t('deposit.errors.minAmount'));
      return;
    }

    // Validar fondos suficientes según el tipo de operación
    if (activeTab === 'retirar' && parseFloat(amount) > brokerBalance) {
      toast.error(t('common.errors.insufficientBalance'));
      return;
    }
    // Para transferencias, validar contra el balance general
    if (activeTab === 'transferir' && parseFloat(amount) > brokerBalance) {
      toast.error(t('common.errors.insufficientBalance'));
      return;
    }

    // Solo validar método de pago para depósitos (los retiros usan el método pre-configurado)
    if (activeTab === 'depositar' && !selectedMethod) {
      toast.error(t('common.errors.selectMethod'));
      return;
    }

    if (activeTab === 'transferir' && !transferToAccount) {
      toast.error(t('transfer.errors.selectAccount'));
      return;
    }

    if (!acceptTerms) {
      toast.error(t('common.errors.acceptTerms'));
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
        // Primero verificar si tiene 2FA configurado
        const twoFAStatus = await twoFactorService.get2FAStatus(currentUser?.id);
        
        if (!twoFAStatus.enabled) {
          // Si NO tiene 2FA, mostrar notificación roja y detener
          toast.error(t('withdraw.errors.twoFactorRequired'), {
            duration: 6000,
            style: {
              background: '#ef4444',
              color: 'white',
            },
            icon: '🔒'
          });
          setIsLoading(false);
          return;
        }
        
        // Preparar datos de 2FA con los métodos disponibles
        const methods = [];
        if (twoFAStatus.secret) methods.push('totp'); // Tiene autenticación por app
        if (twoFAStatus.enabled) methods.push('email'); // Email siempre disponible si 2FA está activo
        
        const userData2FA = {
          userId: currentUser?.id,
          email: currentUser?.email,
          name: currentUser?.displayName || userData?.nombre || 'Usuario',
          secret: twoFAStatus.secret, // IMPORTANTE: Pasar el secret como en Settings
          methods: methods
        };
        
        // Guardar la operación pendiente y los datos de 2FA
        setPending2FAOperation({
          type: 'withdraw',
          amount: amountNum,
          method: selectedWithdrawMethod
        });
        setTwoFactorData(userData2FA);
        setShow2FAModal(true);
        setIsLoading(false);
        return; // Detener aquí, continuará después de verificar 2FA
        
        // Crear solicitud de retiro desde el balance general usando el método seleccionado
        const withdrawalData = {
          account_id: 'general', // Retiro solo desde balance general
          account_name: t('common.generalBalance'),
          amount: amountNum,
          withdrawal_type: 'crypto', // Solo crypto por ahora
          // Incluir datos del usuario
          user_email: currentUser?.email,
          user_name: currentUser?.displayName || userData?.nombre || t('common:user')
        };

        // Incluir los datos del método de retiro seleccionado
        withdrawalData.crypto_currency = 'USDT';
        withdrawalData.wallet_address = selectedWithdrawMethod.address;
        withdrawalData.network = selectedWithdrawMethod.network === 'tron_trc20' ? 'tron' : 'ethereum';
        withdrawalData.method_alias = selectedWithdrawMethod.alias;

        result = await transactionService.createWithdrawalRequest(withdrawalData);
        
        if (!result.success) {
          throw new Error(result.error || t('withdraw.errors.processingError'));
        }

        // NO actualizar el balance aquí - los retiros están pendientes de aprobación
        // El balance solo se actualiza cuando el admin aprueba el retiro
        // const newBalance = brokerBalance - amountNum;
        // await updateBrokerBalance(newBalance);
      } else if (activeTab === 'transferir') {
        if (!transferToAccount) {
          toast.error(t('transfer.errors.selectAccount'));
          return;
        }
        
        // Verificar tipo de transferencia: MT5→MT5, MT5→Wallet, o Wallet→MT5
        if (transferFromAccount && transferFromAccount.account_number && transferToAccount.id === 'general-wallet') {
          // MT5-to-Wallet Transfer (NUEVO)
          console.log('[Wallet] MT5-to-Wallet Transfer:', {
            sourceLogin: transferFromAccount.account_number,
            currentWalletBalance: brokerBalance,
            amount: amountNum
          });

          // Validar balance suficiente en cuenta MT5 origen
          const sourceBalance = transferFromAccount.balance || 0;
          if (amountNum > sourceBalance) {
            toast.error(t('common.errors.insufficientBalance'));
            return;
          }

          // Llamar al endpoint MT5-to-Wallet
          const mt5Result = await transferMT5ToWallet(
            transferFromAccount.account_number,
            brokerBalance,
            amountNum
          );

          if (mt5Result.success) {
            console.log('[Wallet] MT5-to-Wallet transfer successful:', mt5Result.data);

            // Actualizar el balance del broker (sumar el monto)
            const newBalance = brokerBalance + amountNum;
            await updateBrokerBalance(newBalance);

            // Crear registro de transferencia en la base de datos
            result = await transactionService.createTransferRequest({
              from_account_id: transferFromAccount.id,
              from_account_name: transferFromAccount.account_name,
              to_account_id: 'general',
              to_account_name: t('common.generalBalance'),
              amount: amountNum,
              transfer_type: 'mt5_to_wallet'
            });

            toast.success(
              `Transferencia MT5 → Wallet exitosa\n` +
              `De: ${transferFromAccount.account_name}\n` +
              `A: ${t('common.generalBalance')}\n` +
              `Monto: $${amountNum.toFixed(2)}\n` +
              `Nuevo balance wallet: $${newBalance.toFixed(2)}`,
              {
                duration: 6000,
                style: { background: '#10b981', color: 'white' },
                icon: '💰'
              }
            );

            // Notificar transferencia
            notifyTransfer(amountNum, transferFromAccount.account_name, t('common.generalBalance'));

            // 📧 Enviar email de transferencia completada
            try {
              await emailServiceProxy.sendTransferCompletedEmail({
                email: currentUser.email,
                name: userData?.full_name || currentUser.displayName || currentUser.email.split('@')[0],
                transferType: 'mt5_to_wallet',
                amount: amountNum.toFixed(2),
                fromAccount: transferFromAccount.account_name,
                toAccount: t('common.generalBalance'),
                newBalanceFrom: mt5Result.data?.transfer_details?.source_new_balance?.toFixed(2),
                newBalanceTo: newBalance.toFixed(2)
              });
              console.log('[Wallet] Transfer email sent successfully');
            } catch (emailError) {
              console.error('[Wallet] Error sending transfer email:', emailError);
              // No fallar la transferencia si el email falla
            }

          } else {
            console.error('[Wallet] MT5-to-Wallet transfer failed:', mt5Result.error);
            toast.error(mt5Result.error || 'Error en la transferencia MT5 → Wallet');
            return;
          }

        } else if (transferFromAccount && transferFromAccount.account_number && transferToAccount.account_number) {
          // MT5-to-MT5 Transfer
          if (transferFromAccount.id === transferToAccount.id) {
            toast.error(t('transfer.errors.sameAccount'));
            return;
          }

          // Validar balance suficiente en cuenta origen
          const sourceBalance = transferFromAccount.balance || 0;
          if (amountNum > sourceBalance) {
            toast.error(t('common.errors.insufficientBalance'));
            return;
          }

          console.log('[Wallet] MT5-to-MT5 Transfer:', {
            sourceLogin: transferFromAccount.account_number,
            destinationLogin: transferToAccount.account_number,
            amount: amountNum
          });

          // Llamar al endpoint MT5-to-MT5
          const mt5Result = await transferMT5ToMT5(
            transferFromAccount.account_number,
            transferToAccount.account_number,
            amountNum
          );

          if (mt5Result.success) {
            console.log('[Wallet] MT5-to-MT5 transfer successful:', mt5Result.data);

            // Crear registro de transferencia en la base de datos
            result = await transactionService.createTransferRequest({
              from_account_id: transferFromAccount.id,
              from_account_name: transferFromAccount.account_name,
              to_account_id: transferToAccount.id,
              to_account_name: transferToAccount.account_name,
              amount: amountNum,
              transfer_type: 'mt5_to_mt5'
            });

            toast.success(
              `Transferencia MT5-to-MT5 exitosa\n` +
              `De: ${transferFromAccount.account_name}\n` +
              `A: ${transferToAccount.account_name}\n` +
              `Monto: $${amountNum.toFixed(2)}`,
              {
                duration: 6000,
                style: { background: '#10b981', color: 'white' },
                icon: '🔄'
              }
            );

            // Notificar transferencia
            notifyTransfer(amountNum, transferFromAccount.account_name, transferToAccount.account_name);

            // 📧 Enviar email de transferencia completada
            try {
              await emailServiceProxy.sendTransferCompletedEmail({
                email: currentUser.email,
                name: userData?.full_name || currentUser.displayName || currentUser.email.split('@')[0],
                transferType: 'mt5_to_mt5',
                amount: amountNum.toFixed(2),
                fromAccount: transferFromAccount.account_name,
                toAccount: transferToAccount.account_name,
                newBalanceFrom: mt5Result.data?.transfer_details?.source_new_balance?.toFixed(2),
                newBalanceTo: mt5Result.data?.transfer_details?.destination_new_balance?.toFixed(2)
              });
              console.log('[Wallet] Transfer email sent successfully');
            } catch (emailError) {
              console.error('[Wallet] Error sending transfer email:', emailError);
              // No fallar la transferencia si el email falla
            }

          } else {
            console.error('[Wallet] MT5-to-MT5 transfer failed:', mt5Result.error);
            toast.error(mt5Result.error || 'Error en la transferencia MT5-to-MT5');
            return;
          }

        } else {
          // Wallet-to-MT5 Transfer (existing logic)
          result = await transactionService.createTransferRequest({
            from_account_id: 'general',
            from_account_name: t('common.generalBalance'),
            to_account_id: transferToAccount.id,
            to_account_name: transferToAccount.account_name,
            amount: amountNum
          });
          
          if (result.success) {
            // Actualizar el balance del broker (restar el monto)
            const newBalance = brokerBalance - amountNum;
            await updateBrokerBalance(newBalance);
            
            if (transferToAccount.account_number) {
              try {
                console.log('[Wallet] Calling transferWalletToMT5 with:', {
                  walletBalance: brokerBalance,
                  destinationLogin: transferToAccount.account_number,
                  amount: amountNum
                });
                
                const mt5Result = await transferWalletToMT5(
                  brokerBalance,
                  transferToAccount.account_number,
                  amountNum
                );
                
                console.log('[Wallet] MT5 Transfer Response:', mt5Result);
                
                if (mt5Result.success) {
                  console.log('[Wallet] MT5 transfer successful:', mt5Result.data);
                  
                  const details = mt5Result.data?.transfer_details;
                  if (details) {
                    toast.success(
                      `Transferencia exitosa a MT5\n` +
                      `Nuevo balance MT5: $${details.destination_new_balance?.toFixed(2) || amountNum}`,
                      {
                        duration: 5000,
                        style: { background: '#10b981', color: 'white' },
                        icon: '✅'
                      }
                    );
                  } else {
                    toast.success('Transferencia completada exitosamente en MT5', {
                      duration: 4000,
                      style: { background: '#10b981', color: 'white' },
                      icon: '✅'
                    });
                  }

                  // 📧 Enviar email de transferencia completada
                  try {
                    await emailServiceProxy.sendTransferCompletedEmail({
                      email: currentUser.email,
                      name: userData?.full_name || currentUser.displayName || currentUser.email.split('@')[0],
                      transferType: 'wallet_to_mt5',
                      amount: amountNum.toFixed(2),
                      fromAccount: t('common.generalBalance'),
                      toAccount: transferToAccount.account_name,
                      newBalanceFrom: newBalance.toFixed(2),
                      newBalanceTo: details?.new_mt5_balance?.toFixed(2) || details?.destination_new_balance?.toFixed(2)
                    });
                    console.log('[Wallet] Transfer email sent successfully');
                  } catch (emailError) {
                    console.error('[Wallet] Error sending transfer email:', emailError);
                    // No fallar la transferencia si el email falla
                  }

                } else {
                  console.error('[Wallet] Failed to transfer to MT5:', mt5Result.error);
                  toast.error(
                    mt5Result.error || t('transfer.mt5UpdateWarning') || 
                    'La transferencia se registró pero el balance en MT5 podría tardar en actualizarse', 
                    {
                      duration: 5000,
                      icon: '⚠️'
                    }
                  );
                }
              } catch (mt5Error) {
                console.error('[Wallet] Error transferring to MT5:', mt5Error);
                // No fallar la transferencia si MT5 falla, solo notificar
                toast.error(t('transfer.mt5UpdateWarning') || 'La transferencia se registró pero el balance en MT5 podría tardar en actualizarse', {
                  duration: 5000,
                  icon: '⚠️'
                });
              }
            } else {
              console.warn('[Wallet] No account_number found for MT5 account:', transferToAccount);
            }
          } else {
            console.warn('[Wallet] No account_number found for MT5 account:', transferToAccount);
          }
        }
        
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
            { email: currentUser.email, name: currentUser.displayName || t('common:user') },
            { amount: depositAmount, accountName: selectedAccount.account_name, currency: 'USD', method: selectedMethod }
          );
          console.log('[Wallet] Deposit confirmation email sent');
        } catch (emailError) {
          console.error('[Wallet] Error sending deposit email:', emailError);
        }
      } else if (activeTab === 'retirar') {
        const withdrawAmount = parseFloat(amount);
        setSuccess(t('withdraw.success', { amount }));
        notifyWithdrawal(withdrawAmount, t('common.generalBalance'));
        
        // Send withdrawal confirmation email  
        try {
          await emailServiceProxy.sendWithdrawalConfirmation(
            { email: currentUser.email, name: currentUser.displayName || t('common:user') },
            { amount: withdrawAmount, accountName: t('common.generalBalance'), currency: 'USD', method: selectedMethod }
          );
          console.log('[Wallet] Withdrawal confirmation email sent');
        } catch (emailError) {
          console.error('[Wallet] Error sending withdrawal email:', emailError);
        }
      }
      // Nota: Las transferencias ya muestran su propio toast específico según el tipo

      // Limpiar formulario
      resetForm();
      
      // Recargar cuentas
      await loadAccounts();
      
      // Recargar transacciones
      await loadTransactions();

    } catch (error) {
      console.error('Error processing operation:', error);
      const errorMessage = t('common.errors.processingError');
      // Error ya mostrado via notifyError
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
    setTransferFromAccount(null);
    setTransferToAccount(null);
    setAmount('');
    setWalletAddress('');
    setAcceptTerms(false);
  };

  // Manejar verificación exitosa de 2FA para retiros
  const handle2FAVerificationSuccess = async () => {
    setShow2FAModal(false);
    setTwoFactorData(null);
    
    if (!pending2FAOperation || pending2FAOperation.type !== 'withdraw') {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const amountNum = pending2FAOperation.amount;
      const selectedWithdrawMethod = pending2FAOperation.method;
      
      // Crear solicitud de retiro después de verificar 2FA
      const withdrawalData = {
        account_id: 'general',
        account_name: t('common.generalBalance'),
        amount: amountNum,
        withdrawal_type: 'crypto',
        user_email: currentUser?.email,
        user_name: currentUser?.displayName || userData?.nombre || t('common:user'),
        crypto_currency: 'USDT',
        wallet_address: selectedWithdrawMethod.address,
        network: selectedWithdrawMethod.network === 'tron_trc20' ? 'tron' : 'ethereum',
        method_alias: selectedWithdrawMethod.alias
      };

      const result = await transactionService.createWithdrawalRequest(withdrawalData);
      
      if (!result.success) {
        throw new Error(result.error || t('withdraw.errors.processingError'));
      }

      // Mostrar notificación de éxito estilo sistema
      const withdrawAmount = amountNum;
      toast.success(
        t('withdraw.pendingSuccess', { 
          amount: withdrawAmount,
          days: '1-3'
        }),
        {
          duration: 6000,
          style: {
            background: '#10b981',
            color: 'white',
          },
          icon: '✅'
        }
      );
      notifyWithdrawal(withdrawAmount, t('common.generalBalance'));
      
      // Enviar email de confirmación
      try {
        await emailServiceProxy.sendWithdrawalConfirmation(
          { email: currentUser.email, name: currentUser.displayName || t('common:user') },
          { amount: withdrawAmount, accountName: t('common.generalBalance'), currency: 'USD', method: selectedWithdrawMethod }
        );
        console.log('[Wallet] Withdrawal confirmation email sent');
      } catch (emailError) {
        console.error('[Wallet] Error sending withdrawal email:', emailError);
      }

      // Limpiar y recargar
      resetForm();
      setPending2FAOperation(null);
      await loadAccounts();
      await loadTransactions();
      
    } catch (error) {
      console.error('Error processing withdrawal after 2FA:', error);
      toast.error(error.message || t('withdraw.errors.processingError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar confirmación de depósito crypto
  const handleCryptoDepositConfirmed = async (depositData) => {
    try {
      // Crear solicitud de depósito al balance general del broker (nuevo flujo)
      const result = await transactionService.createDepositRequest({
        account_id: 'general', // Balance general, no cuenta MT5
        account_name: t('common.generalBalance'),
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

      // Actualizar balance del broker (sumar el monto)
      const newBalance = brokerBalance + parseFloat(amount);
      await updateBrokerBalance(newBalance);

      // Notificar al usuario
      const depositAmount = parseFloat(amount);
      toast.success(t('deposit.pending', { amount }));
      notifyDeposit(depositAmount, t('common.generalBalance'));

      // Cerrar modal y resetear
      setShowCryptoDepositModal(false);
      resetForm();
      
      // Recargar cuentas y transacciones
      await loadAccounts();
      await loadTransactions();
      await loadBrokerBalance();
      await loadBrokerBalance();
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
    { id: 'USDT_TRC20', name: 'USDT (TRC-20)', network: 'Tron', min: 50, confirmations: 20 },
    { id: 'USDT_ERC20', name: 'USDT (ERC-20)', network: 'Ethereum', min: 50, confirmations: 12 }
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
    // Filtrar solo cuentas MT5 reales (no demo) con balance > 0
    const realMT5AccountsWithBalance = mt5Accounts.filter(acc => {
      const accountTypeValue = (acc.account_type || acc.accountType || acc.type || '').toString().toLowerCase();
      const groupValue = (acc.group_name || acc.group || '').toString().toLowerCase();

      const isRealAccount = accountTypeValue.includes('real') ||
                           groupValue.includes('real') ||
                           (!accountTypeValue.includes('demo') && !groupValue.includes('demo'));

      const hasBalance = (acc.balance || 0) > 0;
      return isRealAccount && hasBalance;
    });
    
    // Determinar si mostrar opción MT5-to-MT5 (mínimo 2 cuentas reales con balance)
    const showMT5ToMT5Option = realMT5AccountsWithBalance.length >= 2;
    
    // Determinar origen y balance
    const sourceBalance = transferFromAccount 
      ? (transferFromAccount.balance || 0)
      : brokerBalance;
    const sourceName = transferFromAccount
      ? `${transferFromAccount.account_name || 'Account'} (${transferFromAccount.account_number || transferFromAccount.login || 'N/A'})`
      : t('common.generalBalance');
    
    // Cuentas con balance para origen
    const accountsWithBalance = mt5Accounts.filter(acc => (acc.balance || 0) > 0);

    // Cuentas disponibles para destino (solo reales, excluir origen)
    const availableDestinationAccounts = mt5Accounts.filter(acc => {
      // Verificar si es cuenta real de múltiples formas
      const accountTypeValue = (acc.account_type || acc.accountType || acc.type || '').toString().toLowerCase();
      const groupValue = (acc.group_name || acc.group || '').toString().toLowerCase();

      // Es cuenta real si:
      // 1. account_type contiene 'real'
      // 2. group contiene 'real'
      // 3. NO es demo
      const isRealAccount = accountTypeValue.includes('real') ||
                           groupValue.includes('real') ||
                           (!accountTypeValue.includes('demo') && !groupValue.includes('demo'));

      const isNotSource = !transferFromAccount || acc.id !== transferFromAccount.id;
      return isRealAccount && isNotSource;
    });
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paso 1: Origen (Balance General) y Destino */}
        <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 1 ? 'border-[#06b6d4]' : 'border-[#334155]'}`}>
          <h3 className="text-lg font-semibold mb-2 text-white">{t('common.steps.step1')}</h3>
          <p className="text-[#9ca3af] mb-4 text-sm">{t('transfer.selectDestination')}</p>
          
          {/* Selector de origen - Balance General o MT5 (si hay múltiples cuentas MT5) */}
          {showMT5ToMT5Option ? (
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2">Origen</div>
              <div className="relative" ref={transferFromDropdownRef}>
                <button 
                  onClick={() => setShowTransferFromDropdown(!showTransferFromDropdown)}
                  className="w-full p-4 text-left rounded-lg border-2 border-[#4b5563] bg-[#1e1e1e] hover:bg-[#374151] transition-colors font-medium text-[#9ca3af] hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <ArrowUp className="w-6 h-6 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-white">{sourceName}</div>
                      <div className="text-sm text-cyan-300">
                        ${sourceBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </div>
                    </div>
                  </div>
                </button>

                {showTransferFromDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-[#232323] border border-[#334155] rounded-lg shadow-xl z-50">
                    <div className="p-2 max-h-60 overflow-y-auto">
                      {/* Balance General */}
                      <button
                        onClick={() => handleSelectTransferFromAccount(null)}
                        className="w-full p-3 text-left rounded-lg hover:bg-[#374151] transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-white">{t('common.generalBalance')}</div>
                            <div className="text-xs text-[#9ca3af]">Balance principal</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-white">${brokerBalance.toLocaleString()}</div>
                            <div className="text-xs text-[#9ca3af]">USD</div>
                          </div>
                        </div>
                      </button>
                      
                      {/* Cuentas MT5 con balance */}
                      {realMT5AccountsWithBalance.map((account) => (
                        <button
                          key={account.id}
                          onClick={() => handleSelectTransferFromAccount(account)}
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
            </div>
          ) : (
            /* Mostrar origen fijo: Balance General cuando no hay múltiples MT5 */
            <div className="mb-4 p-4 bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 border border-cyan-500/30 rounded-lg">
              <div className="text-xs text-cyan-400 mb-1">Origen</div>
              <div className="font-semibold text-white">{sourceName}</div>
              <div className="text-sm text-cyan-300 mt-1">
                ${sourceBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </div>
            </div>
          )}
          
          <div className="relative" ref={transferDropdownRef}>
            <div className="text-xs text-gray-400 mb-2">Destino</div>
            <button
              onClick={() => setShowTransferAccountDropdown(!showTransferAccountDropdown)}
              className="w-full p-4 text-left rounded-lg border-2 border-[#4b5563] bg-[#1e1e1e] hover:bg-[#374151] transition-colors font-medium text-[#9ca3af] hover:text-white"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-white" />
                <span>
                  {transferToAccount
                    ? (transferToAccount.id === 'general-wallet'
                        ? t('common.generalBalance')
                        : `${transferToAccount.account_name || 'Account'} (${transferToAccount.account_number || transferToAccount.login || 'N/A'})`)
                    : 'Seleccionar destino'}
                </span>
              </div>
            </button>

            {showTransferAccountDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#232323] border border-[#334155] rounded-lg shadow-xl z-50">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {/* Si el origen es una cuenta MT5, mostrar Saldo General como opción de destino */}
                  {transferFromAccount && transferFromAccount.account_number && (
                    <button
                      onClick={() => handleSelectTransferAccount({ id: 'general-wallet', account_name: t('common.generalBalance'), balance: brokerBalance })}
                      className="w-full p-3 text-left rounded-lg hover:bg-[#374151] transition-colors border-b border-[#334155] mb-2"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-white">{t('common.generalBalance')}</div>
                          <div className="text-xs text-[#9ca3af]">Balance principal</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">${brokerBalance.toLocaleString()}</div>
                          <div className="text-xs text-[#9ca3af]">USD</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Mostrar cuentas MT5 como destino (excluir cuenta origen) */}
                  {availableDestinationAccounts.map((account) => (
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
                  <ArrowUp className="w-6 h-6 text-cyan-400" />
                  <div>
                    <div className="font-medium text-white">{t('transfer.fromAccount')}</div>
                    <div className="text-sm text-[#9ca3af]">{sourceName}</div>
                    <div className="text-xs text-cyan-300">${sourceBalance.toLocaleString()} USD</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowDown className="w-6 h-6 text-emerald-400" />
                  <div>
                    <div className="font-medium text-white">{t('transfer.toAccount')}</div>
                    <div className="text-sm text-[#9ca3af]">
                      {transferToAccount.id === 'general-wallet'
                        ? t('common.generalBalance')
                        : `${transferToAccount.account_name} (MT5)`
                      }
                    </div>
                    <div className="text-xs text-emerald-300">Balance actual: ${(transferToAccount.balance || 0).toLocaleString()} USD</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-lg">
                <p className="text-[#22d3ee] mb-2 text-sm font-medium">💡 {t('common.important')}:</p>
                <p className="text-[#9ca3af] text-xs leading-relaxed">
                  {transferFromAccount && transferFromAccount.account_number && transferToAccount.id === 'general-wallet'
                    ? 'Transferencia desde su cuenta MT5 hacia su wallet principal. Los fondos estarán disponibles inmediatamente.'
                    : (transferFromAccount && transferFromAccount.account_number
                        ? 'Transferencia entre cuentas MT5. Los fondos se transferirán inmediatamente.'
                        : `Transferencia desde su wallet principal hacia su cuenta MT5. ${t('transfer.instant')}`)
                  }
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

    // Modal de retiro mejorado con selector de métodos
    if (activeTab === 'retirar') {
      return (
        <div className="max-w-2xl mx-auto px-4 sm:px-0">
          <div className="bg-[#232323] rounded-xl border-2 border-[#06b6d4] p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">{t('withdraw.title')}</h3>
            <p className="text-[#9ca3af] mb-4 sm:mb-6 text-xs sm:text-sm">{t('withdraw.enterAmount')}</p>
            
            <div className="space-y-6">
              {/* Selector de Método de Retiro */}
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                  {t('withdraw.withdrawalMethod')}
                </label>
                <div className="relative" ref={withdrawMethodDropdownRef}>
                  <button
                    onClick={() => setShowWithdrawMethodDropdown(!showWithdrawMethodDropdown)}
                    className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#4b5563] rounded-lg text-white placeholder-[#6b7280] focus:border-[#06b6d4] focus:outline-none flex items-center justify-between"
                  >
                    <span>
                      {selectedWithdrawMethod ? 
                        `${selectedWithdrawMethod.alias} (${selectedWithdrawMethod.network === 'tron_trc20' ? 'TRC-20' : 'ERC-20'})` : 
                        t('withdraw.selectMethod')
                      }
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showWithdrawMethodDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#232323] border border-[#334155] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        {/* Métodos existentes */}
                        {paymentMethods.map((method) => (
                          <button
                            key={method.id}
                            onClick={() => handleSelectWithdrawMethod(method)}
                            className="w-full p-3 text-left rounded-lg hover:bg-[#374151] transition-colors mb-1"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-white">{method.alias}</div>
                                <div className="text-xs text-[#9ca3af]">
                                  {method.network === 'tron_trc20' ? 'USDT (TRC-20)' : 'USDT (ERC-20)'} • 
                                  {method.address?.substring(0, 6)}...{method.address?.substring(method.address.length - 4)}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                        
                        {/* Botón para agregar nuevo método */}
                        <button
                          onClick={() => {
                            setShowAddMethodForm(true);
                            setShowWithdrawMethodDropdown(false);
                          }}
                          className="w-full p-3 text-left rounded-lg hover:bg-[#374151] transition-colors border-t border-[#4b5563] mt-2 pt-3"
                        >
                          <div className="flex items-center gap-2 text-cyan-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="font-medium">{t('withdraw.addNewMethod')}</span>
                          </div>
                          <div className="text-xs text-[#9ca3af] mt-1 ml-7">
                            {t('withdraw.addMethodDescription')}
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Formulario para agregar nuevo método */}
              {showAddMethodForm && (
                <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#4b5563]">
                  <h4 className="text-white font-medium mb-4">{t('withdraw.newMethodTitle')}</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-[#9ca3af] mb-1">{t('settings:paymentMethods.alias')}</label>
                      <input
                        type="text"
                        value={newMethodAlias}
                        onChange={(e) => setNewMethodAlias(e.target.value)}
                        placeholder={t('settings:paymentMethods.aliasPlaceholder')}
                        className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#4b5563] rounded-lg text-white text-sm focus:border-[#06b6d4] focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[#9ca3af] mb-1">{t('settings:paymentMethods.network')}</label>
                      <div className="relative" ref={networkDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                          className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#4b5563] rounded-lg text-white text-sm focus:border-[#06b6d4] focus:outline-none flex items-center justify-between"
                        >
                          <span>
                            {newMethodNetwork === 'tron_trc20' 
                              ? t('settings:paymentMethods.networks.tetherTron')
                              : t('settings:paymentMethods.networks.tetherEthereum')}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {showNetworkDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-[#232323] border border-[#334155] rounded-lg shadow-xl z-50">
                            <button
                              type="button"
                              onClick={() => {
                                setNewMethodNetwork('tron_trc20');
                                setShowNetworkDropdown(false);
                                // Limpiar error si la dirección actual no es válida para la nueva red
                                if (newMethodAddress && !validateCryptoAddress(newMethodAddress, 'tron_trc20')) {
                                  setNewMethodAddress('');
                                  setAddressError('');
                                }
                              }}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                newMethodNetwork === 'tron_trc20' 
                                  ? 'bg-[#374151] text-white' 
                                  : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                              }`}
                            >
                              {t('settings:paymentMethods.networks.tetherTron')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewMethodNetwork('ethereum_erc20');
                                setShowNetworkDropdown(false);
                                // Limpiar error si la dirección actual no es válida para la nueva red
                                if (newMethodAddress && !validateCryptoAddress(newMethodAddress, 'ethereum_erc20')) {
                                  setNewMethodAddress('');
                                  setAddressError('');
                                }
                              }}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                newMethodNetwork === 'ethereum_erc20' 
                                  ? 'bg-[#374151] text-white' 
                                  : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                              }`}
                            >
                              {t('settings:paymentMethods.networks.tetherEthereum')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[#9ca3af] mb-1">{t('settings:paymentMethods.cryptoAddress')}</label>
                      <input
                        type="text"
                        value={newMethodAddress}
                        onChange={(e) => {
                          setNewMethodAddress(e.target.value);
                          if (e.target.value && !validateCryptoAddress(e.target.value, newMethodNetwork)) {
                            const errorMessages = {
                              'tron_trc20': t('settings:paymentMethods.errors.tronAddressFormat'),
                              'ethereum_erc20': t('settings:paymentMethods.errors.ethereumAddressFormat')
                            };
                            setAddressError(errorMessages[newMethodNetwork]);
                          } else {
                            setAddressError('');
                          }
                        }}
                        placeholder={newMethodNetwork === 'tron_trc20' ? 'TJk2UJsS9x...' : '0x742d35Cc6...'}
                        className={`w-full px-3 py-2 bg-[#2a2a2a] border rounded-lg text-white text-sm focus:outline-none ${
                          addressError ? 'border-red-500 focus:border-red-500' : 'border-[#4b5563] focus:border-[#06b6d4]'
                        }`}
                      />
                      {addressError && (
                        <p className="text-red-400 text-xs mt-1">{addressError}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleAddWithdrawMethod}
                        disabled={!newMethodAlias || !newMethodAddress || !!addressError}
                        className="px-4 py-2 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('settings:paymentMethods.add')}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddMethodForm(false);
                          setNewMethodAlias('');
                          setNewMethodAddress('');
                          setAddressError('');
                        }}
                        className="px-4 py-2 bg-[#4b5563] hover:bg-[#6b7280] text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {t('settings:paymentMethods.cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Campo de Monto */}
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                  {t('common.amount')} (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#4b5563] rounded-lg text-white placeholder-[#6b7280] focus:border-[#06b6d4] focus:outline-none"
                />
                <p className="text-xs text-[#9ca3af] mt-2">
                  {t('common.availableBalance')}: ${brokerBalance.toLocaleString()} USD ({t('common.generalBalance')})
                </p>
              </div>
              
              {/* Información importante */}
              <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#334155]">
                <p className="text-[#22d3ee] mb-2 text-sm font-medium">{t('common.important')}:</p>
                <p className="text-[#9ca3af] text-xs leading-relaxed">
                  {t('withdraw.processingTime')}
                </p>
              </div>
              
              {/* Checkbox de confirmación */}
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mr-3 w-4 h-4 text-[#06b6d4] bg-[#1e1e1e] border-[#4b5563] rounded focus:ring-[#06b6d4] focus:ring-2"
                />
                <label htmlFor="terms" className="text-[#9ca3af] text-sm">
                  {t('common:messages.confirmData')}
                </label>
              </div>
              
              {/* Botón de envío */}
              <button
                onClick={handleProcessOperation}
                disabled={isLoading || !acceptTerms || !amount || !selectedWithdrawMethod}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isLoading || !acceptTerms || !amount || !selectedWithdrawMethod
                    ? 'bg-[#4b5563] text-[#9ca3af] cursor-not-allowed'
                    : 'bg-[#06b6d4] hover:bg-[#0891b2] text-white'
                }`}
              >
                {isLoading ? t('common.processing') : t('tabs.withdraw')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Para depósitos, mantener el flujo original con los pasos
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
        {/* Paso 1: Seleccionar método */}
        <div className={`bg-[#232323] rounded-xl border-2 p-4 sm:p-6 ${currentStep === 1 ? 'border-[#06b6d4]' : 'border-[#334155]'}`}>
          <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">{t('common.steps.step1')}</h3>
          <p className="text-[#9ca3af] mb-4 sm:mb-6 text-xs sm:text-sm">{t('common.selectMethod')}</p>
          
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
        <div className={`bg-[#232323] rounded-xl border-2 p-4 sm:p-6 ${currentStep === 2 ? 'border-[#06b6d4]' : 'border-[#334155]'} ${currentStep < 2 ? 'opacity-60' : ''}`}>
          <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">{t('common.steps.step2')}</h3>
          <p className="text-[#9ca3af] mb-4 sm:mb-6 text-xs sm:text-sm">
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
        <div className={`bg-[#232323] rounded-xl border-2 p-4 sm:p-6 ${currentStep === 3 ? 'border-[#06b6d4]' : 'border-[#334155]'} ${currentStep < 3 ? 'opacity-60' : ''} md:col-span-2 xl:col-span-1`}>
          <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">{t('common.steps.step3')}</h3>
          <p className="text-[#9ca3af] mb-4 sm:mb-6 text-xs sm:text-sm">{t('common.completeOperation')}</p>
          
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
                  placeholder="50.00"
                  min="50"
                  className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#4b5563] rounded-lg text-white placeholder-[#6b7280] focus:border-[#06b6d4] focus:outline-none"
                />
                <p className="text-xs text-[#22d3ee] mt-1">
                  {t('deposit.minAmount', { amount: '$50 USD' })}
                </p>
              </div>

              <div className="bg-[#1e1e1e] p-4 rounded-lg mb-6 border border-[#334155]">
                <p className="text-[#22d3ee] mb-2 text-sm font-medium">{t('common.important')}:</p>
                <p className="text-[#9ca3af] text-xs leading-relaxed">
                  {t('deposit.importantNote')}
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
                {isLoading ? t('common.processing') : t('tabs.deposit')}
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
                        <div>
                          {transaction.date.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
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
                        <div>
                          {transaction.date.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
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

  // Show loader during initial loading - DISABLED to prevent stuck loading
  // if (showLoader) {
  //   return <WalletLayoutLoader />;
  // }

  return (
    <div className="flex flex-col p-4 text-white min-h-screen">
      {/* Header unificado con tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
        </div>
        
        {/* Card Unificada con Balance, Historial y Botones */}
        <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-2xl border border-[#333] p-6 shadow-xl">
          <div className="flex flex-col items-center text-center mb-6">
            {/* Balance Total Prominente */}
            <div className="mb-2">
              <div className="text-lg text-gray-400 mb-1">{t('common.generalBalance')}</div>
              <div className="text-4xl font-bold text-white mb-1">${brokerBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-sm text-cyan-400">USD</div>
            </div>
          </div>
          
          {/* Botones de Acción - Mejorado para móvil */}
          <div className="flex flex-col items-center justify-center gap-4 w-full px-4 sm:px-0">
            {/* Botones Principales - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setActiveTab('depositar');
                  resetForm();
                }}
                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 w-full sm:w-auto ${
                  activeTab === 'depositar'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-[#374151] text-gray-300 hover:bg-[#4b5563] hover:text-white'
                }`}
              >
                <ArrowDown className="w-5 h-5" />
                <span className="text-sm sm:text-base">{t('tabs.deposit')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('retirar');
                  resetForm();
                }}
                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 w-full sm:w-auto ${
                  activeTab === 'retirar'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-[#374151] text-gray-300 hover:bg-[#4b5563] hover:text-white'
                }`}
              >
                <ArrowUp className="w-5 h-5" />
                <span className="text-sm sm:text-base">{t('tabs.withdraw')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('transferir');
                  resetForm();
                }}
                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 w-full sm:w-auto ${
                  activeTab === 'transferir'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-[#374151] text-gray-300 hover:bg-[#4b5563] hover:text-white'
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                <span className="text-sm sm:text-base">{t('tabs.transfer')}</span>
              </button>
            </div>
            
            {/* Botón Historial - Responsive */}
            <button
              onClick={() => setShowHistorialModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-xl text-gray-300 hover:text-white transition-all transform hover:scale-105 w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm sm:text-base">{t('tabs.history')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector y contenedor de balance removidos según solicitud del usuario */}

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

      {/* Los mensajes de estado ahora usan toast */}

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
      
      {/* Modal de verificación 2FA para retiros */}
      <TwoFactorWithdrawModal
        isOpen={show2FAModal}
        onClose={() => {
          setShow2FAModal(false);
          setPending2FAOperation(null);
          setTwoFactorData(null);
        }}
        onSuccess={handle2FAVerificationSuccess}
        userMethods={twoFactorData}
        withdrawAmount={pending2FAOperation?.amount}
      />
    </div>
  );
};

export default Wallet; 