import axios from 'axios';
import { logger } from '../utils/logger';
import { getApiConfig } from './config';

// API Configuration
const API_CONFIG = getApiConfig();
const BROKER_API_BASE = `${API_CONFIG.baseUrl}/api/v1`;

// Create axios instance for broker API
const brokerApi = axios.create({
  baseURL: BROKER_API_BASE,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for authentication and logging
brokerApi.interceptors.request.use(
  async (config) => {
    // Add Supabase Bearer token to requests (Firebase disabled)
    try {
      const { supabase } = await import('../supabase/config');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        logger.info('Added Supabase token to request', { hasToken: !!token });
      } else {
        logger.warn('No Supabase session token found for API request');
      }
    } catch (error) {
      logger.error('Error adding Supabase token to request', error);
    }

    logger.info('Broker API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasAuth: !!config.headers.Authorization
    });
    return config;
  },
  (error) => {
    logger.error('Broker API Request Error', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
brokerApi.interceptors.response.use(
  (response) => {
    logger.info('Broker API Response', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase()
    });
    return response;
  },
  (error) => {
    logger.error('Broker API Response Error', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.response?.data?.message || error.message
    });
    return Promise.reject(error);
  }
);

/**
 * Create a new real broker account using MT5Manager API
 * @param {Object} accountData - Account creation data
 * @returns {Promise<Object>} Created account details
 */
export const createBrokerAccount = async (accountData) => {
  logger.info('Creating broker account', { accountData });
  
  try {
    // Validate required fields
    const requiredFields = ['name', 'email', 'country'];
    const missingFields = requiredFields.filter(field => !accountData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Prepare account data for API
    const apiData = {
      name: accountData.name,
      email: accountData.email,
      phone: accountData.phone || '',
      country: accountData.country,
      account_type: accountData.accountType || 'standard', // 'standard', 'premium', 'vip'
      leverage: parseInt(accountData.leverage) || 100,
      initial_deposit: parseFloat(accountData.initialDeposit) || 0,
      currency: accountData.currency || 'USD',
      group: accountData.group, // Optional - API will use default based on account_type
      client_id: accountData.client_id, // Optional - for tracking
      notes: accountData.notes || `Account created via frontend - ${new Date().toISOString()}`
    };

    // Remove undefined/null values
    Object.keys(apiData).forEach(key => {
      if (apiData[key] === undefined || apiData[key] === null || apiData[key] === '') {
        delete apiData[key];
      }
    });

    logger.info('Sending account creation request to MT5 API', { 
      apiData,
      baseURL: brokerApi.defaults.baseURL,
      endpoint: '/accounts/create'
    });

    logger.info('Making POST request to:', `${brokerApi.defaults.baseURL}/accounts/create`);

    const response = await brokerApi.post('/accounts/create', apiData);

    logger.info('MT5 API Response received:', {
      status: response.status,
      data: response.data
    });

    if (response.data && response.data.success) {
      const accountResult = {
        success: true,
        account: {
          id: response.data.account_login?.toString(),
          accountNumber: response.data.account_login,
          accountName: accountData.name,
          accountType: 'Real', // Always Real for broker accounts
          accountTypeSelection: accountData.accountTypeSelection || 'Standard',
          leverage: response.data.leverage,
          balance: response.data.balance || 0,
          equity: response.data.balance || 0,
          margin: 0,
          freeMargin: response.data.balance || 0,
          marginLevel: 0,
          currency: 'USD',
          server: 'AGM-Server',
          platform: 'MetaTrader 5',
          status: 'Active',
          group: response.data.group,
          
          // Real MT5 credentials
          password: response.data.account_password,
          investorPassword: response.data.investor_password,
          
          // Metadata
          createdAt: response.data.created_at || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          
          // Additional broker-specific fields
          brokerAccountType: response.data.account_type,
          canTrade: true,
          isReal: true,
          isBroker: true
        }
      };

      logger.info('Broker account created successfully', {
        accountLogin: response.data.account_login,
        accountType: response.data.account_type,
        balance: response.data.balance
      });

      return accountResult;
    } else {
      throw new Error(response.data?.message || 'Account creation failed');
    }
  } catch (error) {
    logger.error('Error creating broker account', error);
    
    // Handle different error types
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      if (status === 400) {
        throw new Error(`Invalid data: ${message}`);
      } else if (status === 409) {
        throw new Error(`Account already exists: ${message}`);
      } else if (status === 500) {
        throw new Error(`Server error: ${message}`);
      } else {
        throw new Error(`API error (${status}): ${message}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Unable to connect to broker API');
    } else {
      throw new Error(error.message || 'Unknown error creating broker account');
    }
  }
};

/**
 * Get broker account details
 * @param {string|number} accountLogin - Account login/ID
 * @returns {Promise<Object>} Account details
 */
export const getBrokerAccountDetails = async (accountLogin) => {
  logger.info('Getting broker account details', { accountLogin });

  try {
    const response = await brokerApi.get(`/accounts/${accountLogin}/info`);
    
    if (response.data) {
      return {
        success: true,
        account: {
          ...response.data,
          isReal: true,
          isBroker: true,
          accountType: 'Real'
        }
      };
    } else {
      throw new Error('No account data received');
    }
  } catch (error) {
    logger.error('Error getting broker account details', error);
    
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Account not found'
      };
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Failed to get account details');
  }
};

/**
 * Get all broker accounts for a user
 * @param {string} userId - User ID (Firebase UID)
 * @returns {Promise<Object>} List of broker accounts
 */
export const getUserBrokerAccounts = async (userId) => {
  logger.info('Getting user broker accounts', { userId });

  try {
    const response = await brokerApi.get(`/accounts/user/${userId}`);
    
    if (response.data && response.data.accounts) {
      const accounts = response.data.accounts.map(account => ({
        id: account.login?.toString() || account.id,
        accountNumber: account.login,
        accountName: account.name || `Account ${account.login}`,
        accountType: 'Real',
        accountTypeSelection: account.account_type || 'Standard',
        leverage: account.leverage || 100,
        balance: account.balance || 0,
        equity: account.equity || account.balance || 0,
        margin: account.margin || 0,
        freeMargin: account.free_margin || account.balance || 0,
        marginLevel: account.margin_level || 0,
        currency: account.currency || 'USD',
        server: 'AGM-Server',
        platform: 'MetaTrader 5',
        status: account.status === 'active' ? 'Active' : 'Inactive',
        group: account.group,
        createdAt: account.created_at,
        updatedAt: new Date().toISOString(),
        
        // Broker-specific fields
        isReal: true,
        isBroker: true,
        canTrade: account.can_trade !== false,
        brokerAccountType: account.account_type
      }));

      return {
        success: true,
        accounts
      };
    } else {
      return {
        success: true,
        accounts: []
      };
    }
  } catch (error) {
    logger.error('Error getting user broker accounts', error);
    
    if (error.response?.status === 404) {
      return {
        success: true,
        accounts: []
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get broker accounts'
    };
  }
};

/**
 * Make a deposit to broker account
 * @param {string|number} accountLogin - Account login
 * @param {number} amount - Deposit amount
 * @param {string} reference - Payment reference
 * @param {string} method - Payment method
 * @returns {Promise<Object>} Transaction result
 */
export const depositToBrokerAccount = async (accountLogin, amount, reference, method = 'manual') => {
  logger.info('Making deposit to broker account', { accountLogin, amount, reference, method });

  try {
    if (!amount || amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    const response = await brokerApi.post(`/accounts/${accountLogin}/deposit`, {
      amount: parseFloat(amount),
      reference: reference || `DEP-${Date.now()}`,
      method,
      notes: `Deposit via frontend - ${new Date().toISOString()}`
    });

    if (response.data) {
      logger.info('Deposit successful', {
        accountLogin,
        amount,
        newBalance: response.data.new_balance,
        transactionId: response.data.transaction_id
      });

      return {
        success: true,
        transaction: response.data
      };
    } else {
      throw new Error('No transaction data received');
    }
  } catch (error) {
    logger.error('Error making deposit', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to make deposit');
  }
};

/**
 * Make a withdrawal from broker account
 * @param {string|number} accountLogin - Account login
 * @param {number} amount - Withdrawal amount
 * @param {string} reference - Payment reference
 * @param {string} method - Payment method
 * @returns {Promise<Object>} Transaction result
 */
export const withdrawFromBrokerAccount = async (accountLogin, amount, reference, method = 'manual') => {
  logger.info('Making withdrawal from broker account', { accountLogin, amount, reference, method });

  try {
    if (!amount || amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    const response = await brokerApi.post(`/accounts/${accountLogin}/withdraw`, {
      amount: parseFloat(amount),
      reference: reference || `WTH-${Date.now()}`,
      method,
      notes: `Withdrawal via frontend - ${new Date().toISOString()}`
    });

    if (response.data) {
      logger.info('Withdrawal successful', {
        accountLogin,
        amount,
        newBalance: response.data.new_balance,
        transactionId: response.data.transaction_id
      });

      return {
        success: true,
        transaction: response.data
      };
    } else {
      throw new Error('No transaction data received');
    }
  } catch (error) {
    logger.error('Error making withdrawal', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to make withdrawal');
  }
};

/**
 * Update account leverage
 * @param {string|number} accountLogin - Account login
 * @param {number} leverage - New leverage value
 * @returns {Promise<Object>} Update result
 */
export const updateAccountLeverage = async (accountLogin, leverage) => {
  logger.info('Updating account leverage', { accountLogin, leverage });

  try {
    const response = await brokerApi.put(`/accounts/${accountLogin}/leverage`, {
      leverage: parseInt(leverage)
    });

    if (response.data) {
      return {
        success: true,
        result: response.data
      };
    } else {
      throw new Error('No response data received');
    }
  } catch (error) {
    logger.error('Error updating account leverage', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to update leverage');
  }
};

/**
 * Delete/close broker account
 * @param {string|number} accountLogin - Account login
 * @returns {Promise<Object>} Deletion result
 */
export const deleteBrokerAccount = async (accountLogin) => {
  logger.info('Deleting broker account', { accountLogin });

  try {
    const response = await brokerApi.delete(`/accounts/${accountLogin}`);

    return {
      success: true,
      message: response.data?.message || 'Account deleted successfully'
    };
  } catch (error) {
    logger.error('Error deleting broker account', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to delete account');
  }
};

/**
 * Check if broker API is available
 * @returns {Promise<boolean>} API availability status
 */
export const checkBrokerApiStatus = async () => {
  try {
    // Temporarily bypass health check due to CORS issues
    // TODO: Fix CORS configuration in backend
    logger.info('Bypassing health check - assuming API is available');
    return true;
    
    // Original health check code (commented out until CORS is fixed)
    /*
    let response;
    try {
      response = await brokerApi.get('/health', { timeout: 5000 });
    } catch (healthError) {
      logger.info('Health endpoint not available, trying alternative check');
      response = await brokerApi.get('/accounts/status', { timeout: 5000 });
    }
    return response.status === 200;
    */
  } catch (error) {
    logger.warn('Broker API not available', error);
    return false;
  }
};

// Export brokerApi instance for direct use
export { brokerApi };

export default {
  createBrokerAccount,
  getBrokerAccountDetails,
  getUserBrokerAccounts,
  depositToBrokerAccount,
  withdrawFromBrokerAccount,
  updateAccountLeverage,
  deleteBrokerAccount,
  checkBrokerApiStatus
};
