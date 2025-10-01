/**
 * MT5 Metrics Service
 * Handles fetching real-time metrics and statistics from MT5 accounts
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import { getSession } from '../supabase/config';

// Create axios instance with base configuration
const baseURL = import.meta.env.DEV 
  ? '' // Use Vite proxy in development
  : (import.meta.env.VITE_BROKER_API_URL || 'https://apekapital.com:444');

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
      }
    } catch (error) {
      logger.error('[MT5 Metrics] Error getting session for request', error);
    }
    return config;
  },
  (error) => {
    logger.error('[MT5 Metrics] Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
mt5Api.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('[MT5 Metrics] Response error', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

/**
 * Get real-time account metrics
 */
export const getAccountMetrics = async (accountLogin) => {
  try {
    logger.info('[MT5 Metrics] Fetching account metrics', { accountLogin });
    
    const response = await mt5Api.get(`/api/v1/accounts/${accountLogin}/metrics`);
    
    logger.info('[MT5 Metrics] Metrics fetched successfully', {
      balance: response.data.balance,
      equity: response.data.equity,
      drawdown: response.data.current_drawdown
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 Metrics] Error fetching metrics', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error fetching metrics'
    };
  }
};

/**
 * Get detailed account statistics
 */
export const getAccountStatistics = async (accountLogin) => {
  try {
    logger.info('[MT5 Metrics] Fetching account statistics', { accountLogin });
    
    const response = await mt5Api.get(`/api/v1/accounts/${accountLogin}/statistics`);
    
    logger.info('[MT5 Metrics] Statistics fetched successfully', {
      totalTrades: response.data.total_trades,
      winRate: response.data.win_rate,
      riskReward: response.data.risk_reward_ratio
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 Metrics] Error fetching statistics', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error fetching statistics'
    };
  }
};

/**
 * Get instruments distribution
 */
export const getInstrumentsDistribution = async (accountLogin) => {
  try {
    logger.info('[MT5 Metrics] Fetching instruments distribution', { accountLogin });
    
    const response = await mt5Api.get(`/api/v1/accounts/${accountLogin}/instruments-distribution`);
    
    logger.info('[MT5 Metrics] Instruments distribution fetched', {
      totalInstruments: response.data.total_instruments,
      totalTrades: response.data.total_trades
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 Metrics] Error fetching instruments distribution', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error fetching instruments'
    };
  }
};

/**
 * Get account performance by period
 */
export const getAccountPerformance = async (accountLogin, period = 'monthly', year = 2025) => {
  try {
    logger.info('[MT5 Metrics] Fetching account performance', { 
      accountLogin, 
      period, 
      year 
    });
    
    const response = await mt5Api.get(`/api/v1/accounts/${accountLogin}/performance`, {
      params: { period, year }
    });
    
    logger.info('[MT5 Metrics] Performance fetched successfully', {
      period: response.data.period,
      year: response.data.year,
      dataPoints: response.data.data.length
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 Metrics] Error fetching performance', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error fetching performance'
    };
  }
};

/**
 * Get account history
 */
export const getAccountHistory = async (accountLogin, fromDate = null, toDate = null) => {
  try {
    logger.info('[MT5 Metrics] Fetching account history', { 
      accountLogin,
      fromDate,
      toDate
    });
    
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    
    const response = await mt5Api.get(`/api/v1/accounts/${accountLogin}/history`, { params });
    
    logger.info('[MT5 Metrics] History fetched successfully', {
      totalOperations: response.data.total_operations
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    logger.error('[MT5 Metrics] Error fetching history', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error fetching history'
    };
  }
};

/**
 * Fetch all metrics for an account
 */
export const fetchAllAccountMetrics = async (accountLogin) => {
  try {
    logger.info('[MT5 Metrics] Fetching all metrics for account', { accountLogin });
    
    // Fetch all data in parallel for better performance
    const [metrics, statistics, instruments, performance, history] = await Promise.all([
      getAccountMetrics(accountLogin),
      getAccountStatistics(accountLogin),
      getInstrumentsDistribution(accountLogin),
      getAccountPerformance(accountLogin, 'monthly', new Date().getFullYear()),
      getAccountHistory(accountLogin)
    ]);
    
    // Check if all requests were successful
    if (!metrics.success || !statistics.success || !instruments.success || !performance.success || !history.success) {
      throw new Error('Failed to fetch some metrics');
    }
    
    return {
      success: true,
      data: {
        metrics: metrics.data,
        statistics: statistics.data,
        instruments: instruments.data,
        performance: performance.data,
        history: history.data
      }
    };
  } catch (error) {
    logger.error('[MT5 Metrics] Error fetching all metrics', error);
    
    return {
      success: false,
      error: error.message || 'Error fetching all metrics'
    };
  }
};

export default {
  getAccountMetrics,
  getAccountStatistics,
  getInstrumentsDistribution,
  getAccountPerformance,
  getAccountHistory,
  fetchAllAccountMetrics
};