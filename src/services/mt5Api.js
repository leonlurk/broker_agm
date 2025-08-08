/**
 * MT5 API Service
 * Handles communication with the MT5 backend API for account creation and management
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import { getSession } from '../supabase/config';

// Create axios instance with base configuration
// In development, use the Vite proxy to avoid CORS and SSL issues
const baseURL = import.meta.env.DEV 
  ? '' // Use Vite proxy in development
  : (import.meta.env.VITE_BROKER_API_URL || 'https://62.171.177.212:8443');

const mt5Api = axios.create({
  baseURL: baseURL,
  timeout: 30000,
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
    return 'demo\\forex-hedge-usd-01';
  }
  
  // For real accounts, map based on accountTypeSelection
  switch (accountTypeSelection?.toLowerCase()) {
    case 'standard':
      return 'real\\real';
    case 'zero spread':
    case 'premium':
      return 'real\\A-Book';
    case 'market direct':
      return 'real\\MarketDirect';
    case 'institucional':
    case 'vip':
      return 'real\\Institucional';
    default:
      return 'real\\real'; // Default to standard real account
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
      leverage: parseInt(accountData.leverage) || 100,
      account_type: accountData.accountType?.toLowerCase() === 'demo' ? 'demo' : 'real',
      // Set initial deposit - only add deposit if specifically provided
      ...(accountData.initialBalance && { deposit: parseFloat(accountData.initialBalance) })
    };

    logger.info('[MT5 API] Request data', requestData);

    // Make API call to create account
    const response = await mt5Api.post('/api/v1/accounts/create', requestData);

    logger.info('[MT5 API] Account created successfully', {
      login: response.data.login,
      group: response.data.group
    });

    return {
      success: true,
      data: {
        login: response.data.account_login, // Backend retorna account_login
        password: response.data.account_password, // Backend retorna account_password
        investor_password: response.data.account_investor_password, // Backend retorna account_investor_password
        server: response.data.server || 'AGM-Server',
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
 * Update MT5 account balance (for deposits/withdrawals)
 */
export const updateMT5Balance = async (login, amount, type = 'deposit') => {
  try {
    logger.info('[MT5 API] Updating account balance', { login, amount, type });

    const endpoint = type === 'deposit' ? '/api/v1/accounts/deposit' : '/api/v1/accounts/withdraw';
    
    const response = await mt5Api.post(endpoint, {
      login: login,
      amount: amount
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 API] Error updating balance', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error updating balance'
    };
  }
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
  updateMT5Balance,
  checkMT5Health
};