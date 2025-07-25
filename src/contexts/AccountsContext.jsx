import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserTradingAccounts } from '../services/tradingAccounts';

// Tipos de operaciones de billetera
export const WALLET_OPERATIONS = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',  
  TRANSFER: 'transfer',
  VIEW: 'view'
};

// Categorías de cuentas
export const ACCOUNT_CATEGORIES = {
  REAL: 'Cuentas Reales',
  DEMO: 'Cuentas Demo', 
  COPYTRADING: 'Copytrading',
  PAMM: 'Pamm'
};

const AccountsContext = createContext();

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
};

export const AccountsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Estados principales
  const [accounts, setAccounts] = useState({
    [ACCOUNT_CATEGORIES.REAL]: [],
    [ACCOUNT_CATEGORIES.DEMO]: [],
    [ACCOUNT_CATEGORIES.COPYTRADING]: [],
    [ACCOUNT_CATEGORIES.PAMM]: []
  });
  
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeCategory, setActiveCategory] = useState(ACCOUNT_CATEGORIES.REAL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados de navegación
  const [currentOperation, setCurrentOperation] = useState(null);
  const [operationData, setOperationData] = useState(null);

  // Cargar cuentas desde Firebase
  const loadAccounts = async () => {
    if (!currentUser) {
      console.log('Debug AccountsContext - No current user');
      return;
    }
    
    console.log('Debug AccountsContext - Loading accounts for user:', currentUser.uid);
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getUserTradingAccounts(currentUser.uid);
      console.log('Debug AccountsContext - getUserTradingAccounts result:', result);
      
      if (result.success) {
        // Organizar cuentas por categoría
        const organizedAccounts = {
          [ACCOUNT_CATEGORIES.REAL]: result.accounts.filter(acc => acc.accountType === 'Real'),
          [ACCOUNT_CATEGORIES.DEMO]: result.accounts.filter(acc => acc.accountType === 'DEMO'),
          [ACCOUNT_CATEGORIES.COPYTRADING]: [], // Se llenarán con datos reales después
          [ACCOUNT_CATEGORIES.PAMM]: [] // Se llenarán con datos reales después
        };
        
        console.log('Debug AccountsContext - Organized accounts:', organizedAccounts);
        setAccounts(organizedAccounts);
        
        // Seleccionar automáticamente la primera cuenta si no hay ninguna seleccionada
        if (!selectedAccount && result.accounts.length > 0) {
          console.log('Debug AccountsContext - Auto-selecting first account:', result.accounts[0]);
          setSelectedAccount(result.accounts[0]);
        }
      } else {
        console.log('Debug AccountsContext - Error loading accounts:', result.error);
        setError(result.error || 'Error al cargar cuentas');
      }
    } catch (err) {
      console.error('Debug AccountsContext - Exception loading accounts:', err);
      setError('Error inesperado al cargar cuentas');
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para cargar cuentas cuando cambia el usuario
  useEffect(() => {
    loadAccounts();
  }, [currentUser]);

  // Función para iniciar una operación de billetera
  const startWalletOperation = (operation, account = null, data = null) => {
    setCurrentOperation(operation);
    setOperationData(data);
    
    // Si se proporciona una cuenta específica, seleccionarla
    if (account) {
      setSelectedAccount(account);
    }
    
    return {
      operation,
      account: account || selectedAccount,
      data
    };
  };

  // Función para finalizar operación
  const finishWalletOperation = () => {
    setCurrentOperation(null);
    setOperationData(null);
  };

  // Función para cambiar cuenta seleccionada
  const selectAccount = (account) => {
    setSelectedAccount(account);
    // Persistir en localStorage para mantener selección
    if (account) {
      localStorage.setItem('selectedAccountId', account.id);
    }
  };

  // Función para obtener todas las cuentas como array plano
  const getAllAccounts = () => {
    return Object.values(accounts).flat();
  };

  // Función para obtener cuentas por categoría
  const getAccountsByCategory = (category) => {
    return accounts[category] || [];
  };

  // Función para obtener balance total
  const getTotalBalance = () => {
    return getAllAccounts().reduce((total, account) => total + (account.balance || 0), 0);
  };

  // Función para buscar cuenta por ID
  const findAccountById = (accountId) => {
    return getAllAccounts().find(account => account.id === accountId);
  };

  // Función para actualizar una cuenta específica
  const updateAccount = (accountId, updates) => {
    setAccounts(prev => {
      const newAccounts = { ...prev };
      
      Object.keys(newAccounts).forEach(category => {
        const accountIndex = newAccounts[category].findIndex(acc => acc.id === accountId);
        if (accountIndex !== -1) {
          newAccounts[category][accountIndex] = {
            ...newAccounts[category][accountIndex],
            ...updates
          };
        }
      });
      
      return newAccounts;
    });

    // Actualizar cuenta seleccionada si es la misma
    if (selectedAccount && selectedAccount.id === accountId) {
      setSelectedAccount(prev => ({ ...prev, ...updates }));
    }
  };

  // Restaurar cuenta seleccionada desde localStorage
  useEffect(() => {
    const savedAccountId = localStorage.getItem('selectedAccountId');
    if (savedAccountId && !selectedAccount) {
      const account = findAccountById(savedAccountId);
      if (account) {
        setSelectedAccount(account);
      }
    }
  }, [accounts]);

  const value = {
    // Estados
    accounts,
    selectedAccount,
    activeCategory,
    isLoading,
    error,
    currentOperation,
    operationData,
    
    // Acciones
    setAccounts,
    selectAccount,
    setActiveCategory,
    loadAccounts,
    refreshAccounts: loadAccounts,
    startWalletOperation,
    finishWalletOperation,
    updateAccount,
    
    // Helpers
    getAllAccounts,
    getAccountsByCategory,
    getTotalBalance,
    findAccountById,
    
    // Constantes
    WALLET_OPERATIONS,
    ACCOUNT_CATEGORIES
  };

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
}; 