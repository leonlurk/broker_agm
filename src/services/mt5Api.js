/**
 * MT5 API Service
 * Handles communication with the MT5 backend API for account creation and management
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import { getSession } from '../supabase/config';

// Create axios instance with base configuration
// Use the API URL for MT5 operations (port 444)
const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is not defined in environment variables. Please check your .env file.');
}

const mt5Api = axios.create({
  baseURL: baseURL,
  timeout: 60000, // Aumentado a 60 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include authentication
mt5Api.interceptors.request.use(
  async (config) => {
    try {
      const session = await getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      } else if (import.meta.env.DEV) {
        // In development mode, create a fake JWT token for testing
        logger.warn('[MT5 API] Using development JWT token');
        const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImRlbW8tdXNlci1pZCIsImVtYWlsIjoiZGVtb0BleGFtcGxlLmNvbSIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.fake_signature';
        config.headers.Authorization = `Bearer ${fakeToken}`;
      }
    } catch (error) {
      logger.error('[MT5 API] Error getting session for request', error);
      if (import.meta.env.DEV) {
        // Fallback to demo token in development
        const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImRlbW8tdXNlci1pZCIsImVtYWlsIjoiZGVtb0BleGFtcGxlLmNvbSIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.fake_signature';
        config.headers.Authorization = `Bearer ${fakeToken}`;
      }
    }
    return config;
  },
  (error) => {
    logger.error('[MT5 API] Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
mt5Api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('self-signed certificate')) {
      // For development with self-signed certificates
      logger.warn('[MT5 API] SSL certificate warning (development mode)');
    }
    
    logger.error('[MT5 API] Response error', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

/**
 * Map frontend account types to MT5 groups
 */
const mapAccountTypeToGroup = (accountType, accountTypeSelection) => {
  // Map based on account type and selection
  if (accountType === 'DEMO') {
    // For demo accounts, map based on accountTypeSelection
    switch (accountTypeSelection?.toLowerCase()) {
      case 'institucional':
      case 'zero spread': // Legacy support
        return 'demo\\Institucional';
      case 'market direct':
      case 'standard': // Legacy support
        return 'demo\\MarketDirect';
      default:
        return 'demo\\MarketDirect'; // Default to MarketDirect for demo
    }
  }
  
  // For real accounts, map based on accountTypeSelection  
  switch (accountTypeSelection?.toLowerCase()) {
    case 'institucional':
    case 'zero spread': // Legacy support
    case 'vip':
      return 'real\\Institucional';
    case 'market direct':
    case 'standard': // Legacy support
      return 'real\\MarketDirect';
    default:
      return 'real\\MarketDirect'; // Default to MarketDirect for real
  }
};

/**
 * Create MT5 trading account
 */
export const createMT5Account = async (userId, accountData) => {
  try {
    logger.info('[MT5 API] Creating MT5 account', { 
      userId, 
      accountType: accountData.accountType,
      accountTypeSelection: accountData.accountTypeSelection 
    });

    // Map account type to MT5 group
    const group = mapAccountTypeToGroup(accountData.accountType, accountData.accountTypeSelection);
    
    // Prepare request data
    const requestData = {
      name: accountData.accountName,
      email: accountData.email || '',
      group: group,
      // Extract leverage number from format "1:100" -> 100
      leverage: parseInt(accountData.leverage?.split(':')[1]) || parseInt(accountData.leverage) || 100,
      account_type: accountData.accountType?.toLowerCase() === 'demo' ? 'demo' : 'real',
      // Set initial deposit - only add deposit if specifically provided
      ...(accountData.initialBalance && { deposit: parseFloat(accountData.initialBalance) })
    };

    logger.info('[MT5 API] Request data', requestData);

    // Make API call to create account
    const response = await mt5Api.post('/api/v1/accounts/create', requestData);

    logger.info('[MT5 API] Account created successfully', {
      login: response.data.account_login,
      group: response.data.group
    });

    return {
      success: true,
      data: {
        login: response.data.account_login, // Backend retorna account_login
        password: response.data.account_password, // Backend retorna account_password
        investor_password: response.data.account_investor_password, // Backend retorna account_investor_password
        server: response.data.server || 'AlphaGlobalMarket-Live',
        group: response.data.group,
        leverage: response.data.leverage,
        balance: response.data.balance
      }
    };
  } catch (error) {
    logger.error('[MT5 API] Error creating account', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error creating MT5 account'
    };
  }
};

/**
 * Get MT5 account details
 */
export const getMT5AccountDetails = async (login) => {
  try {
    logger.info('[MT5 API] Getting account details', { login });

    const response = await mt5Api.get(`/api/v1/accounts/${login}`);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 API] Error getting account details', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error getting account details'
    };
  }
};

/**
 * Get trading dashboard data (aggregated user data)
 */
export const getTradingDashboard = async () => {
  try {
    logger.info('[MT5 API] Getting trading dashboard');

    const response = await mt5Api.get('/api/v1/trading/dashboard');

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 API] Error getting trading dashboard', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error getting dashboard data'
    };
  }
};

/**
 * Get account statistics (trading performance)
 */
export const getAccountStatistics = async (accountLogin) => {
  try {
    logger.info('[MT5 API] Getting account statistics', { accountLogin });

    const response = await mt5Api.get(`/api/v1/trading/accounts/${accountLogin}/statistics`);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 API] Error getting account statistics', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error getting account statistics'
    };
  }
};

/**
 * Detect trading strategies for account
 */
export const detectTradingStrategies = async (accountLogin = null) => {
  try {
    logger.info('[MT5 API] Detecting trading strategies', { accountLogin });

    const url = accountLogin 
      ? `/api/v1/trading/detect_strategies?account_login=${accountLogin}`
      : '/api/v1/trading/detect_strategies';
    
    const response = await mt5Api.get(url);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 API] Error detecting trading strategies', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error detecting strategies'
    };
  }
};

/**
 * Transfer from Wallet to MT5 account
 */
export const transferWalletToMT5 = async (walletBalance, destinationLogin, amount) => {
  try {
    // Validate inputs
    const loginInt = parseInt(destinationLogin);
    const amountFloat = parseFloat(amount);
    const walletBalanceFloat = parseFloat(walletBalance);
    
    if (isNaN(loginInt) || loginInt <= 0) {
      logger.error('[MT5 API] Invalid login number:', destinationLogin);
      return {
        success: false,
        error: 'Invalid MT5 login number'
      };
    }
    
    if (isNaN(amountFloat) || amountFloat <= 0) {
      logger.error('[MT5 API] Invalid amount:', amount);
      return {
        success: false,
        error: 'Invalid transfer amount'
      };
    }
    
    logger.info('[MT5 API] Wallet to MT5 transfer', { 
      walletBalance: walletBalanceFloat,
      destinationLogin: loginInt, 
      amount: amountFloat
    });

    // Use new transfer endpoint
    const endpoint = '/api/v1/transfers/wallet-to-mt5';
    
    const requestBody = {
      wallet_balance: walletBalanceFloat,
      destination_login: loginInt,
      amount: amountFloat
    };
    
    logger.info('[MT5 API] Request details:', {
      url: `${baseURL}${endpoint}`,
      method: 'POST',
      data: requestBody
    });
    
    const response = await mt5Api.post(endpoint, requestBody);

    logger.info('[MT5 API] Transfer response:', {
      status: response.status,
      data: response.data
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 API] Error in wallet to MT5 transfer', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error transferring to MT5'
    };
  }
};

/**
 * Transfer between MT5 accounts
 */
export const transferMT5ToMT5 = async (sourceLogin, destinationLogin, amount) => {
  try {
    const sourceLoginInt = parseInt(sourceLogin);
    const destLoginInt = parseInt(destinationLogin);
    const amountFloat = parseFloat(amount);
    
    logger.info('[MT5 API] MT5 to MT5 transfer', { 
      sourceLogin: sourceLoginInt,
      destinationLogin: destLoginInt, 
      amount: amountFloat
    });

    const endpoint = '/api/v1/transfers/mt5-to-mt5';
    
    const requestBody = {
      source_login: sourceLoginInt,
      destination_login: destLoginInt,
      amount: amountFloat
    };
    
    const response = await mt5Api.post(endpoint, requestBody);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 API] Error in MT5 to MT5 transfer', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message
    };
  }
};

/**
 * Transfer from MT5 to Wallet
 */
export const transferMT5ToWallet = async (sourceLogin, currentWalletBalance, amount) => {
  try {
    const loginInt = parseInt(sourceLogin);
    const amountFloat = parseFloat(amount);
    const walletBalanceFloat = parseFloat(currentWalletBalance);
    
    logger.info('[MT5 API] MT5 to Wallet transfer', { 
      sourceLogin: loginInt,
      currentWalletBalance: walletBalanceFloat,
      amount: amountFloat
    });

    const endpoint = '/api/v1/transfers/mt5-to-wallet';
    
    const requestBody = {
      source_login: loginInt,
      current_wallet_balance: walletBalanceFloat,
      amount: amountFloat
    };
    
    const response = await mt5Api.post(endpoint, requestBody);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 API] Error in MT5 to wallet transfer', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message
    };
  }
};

/**
 * Legacy update balance function (kept for backwards compatibility)
 */
export const updateMT5Balance = async (login, amount, type = 'deposit') => {
  logger.warn('[MT5 API] Using deprecated updateMT5Balance, please use transfer functions instead');
  
  // Redirect to new transfer function
  if (type === 'deposit') {
    // For deposits, we need wallet balance which we don't have here
    // Return error suggesting to use new function
    return {
      success: false,
      error: 'Please use transferWalletToMT5 function instead'
    };
  }
  
  return {
    success: false,
    error: 'Deprecated function - use transfer functions instead'
  };
};

/**
 * Check MT5 server health
 */
export const checkMT5Health = async () => {
  try {
    const response = await mt5Api.get('/health');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 API] Health check failed', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  createMT5Account,
  getMT5AccountDetails,
  updateMT5Balance, // Deprecated
  checkMT5Health,
  transferWalletToMT5,
  transferMT5ToMT5,
  transferMT5ToWallet
};