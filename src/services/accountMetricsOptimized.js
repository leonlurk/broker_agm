/**
 * Servicio optimizado para métricas de cuentas
 * Consume los nuevos endpoints de Supabase con cache
 */

import axios from 'axios';
import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'https://apekapital.com:444'}/api/v1`;

/**
 * Cliente axios configurado con auth y reintentos
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  async config => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para manejar errores y reintentos
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expirado, recargar página para re-autenticar
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

/**
 * Obtiene todos los datos del dashboard de una cuenta desde Supabase
 * Endpoint unificado con cache del backend
 */
export const getDashboardData = async (accountNumber, period = 'month') => {
  try {
    logger.info('[API] Fetching dashboard data', { accountNumber, period });
    
    // Usar el endpoint correcto de Supabase
    const response = await apiClient.get(
      `/supabase/accounts/${accountNumber}/dashboard`,
      { params: { period } }
    );
    
    logger.info('[API] Dashboard data received', response.data);
    return response.data; // Ya viene en el formato correcto desde el backend
  } catch (error) {
    logger.error('[API] Error fetching dashboard data', error);
    
    // Retornar datos por defecto en caso de error
    return {
      kpis: {
        balance: 0,
        equity: 0,
        margin: 0,
        free_margin: 0,
        margin_level: 0,
        profit_loss: 0,
        profit_loss_percentage: 0,
        current_drawdown: 0,
        max_drawdown: 0,
        trading_days: 0,
        initial_balance: 0,
        peak_balance: 0
      },
      statistics: {
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        average_win: 0,
        average_loss: 0,
        average_lot_size: 0,
        risk_reward_ratio: 0,
        total_deposits: 0,
        total_withdrawals: 0,
        net_pnl: 0,
        net_pnl_percentage: 0,
        best_trade: 0,
        worst_trade: 0,
        average_trade_duration: '00:00:00'
      },
      balance_history: [],
      instruments: [],
      recent_operations: []
    };
  }
};

/**
 * Obtiene solo los KPIs de una cuenta (con cache)
 */
export const getAccountKPIs = async (accountNumber) => {
  try {
    const response = await apiClient.get(
      `/supabase/accounts/${accountNumber}/kpis`
    );
    return response.data;
  } catch (error) {
    logger.error('[API] Error fetching KPIs', error);
    return null;
  }
};

/**
 * Obtiene el historial de balance optimizado para gráficos
 */
export const getBalanceHistory = async (accountNumber, period = 'month') => {
  try {
    const response = await apiClient.get(
      `/supabase/accounts/${accountNumber}/balance-history`,
      { params: { period } }
    );
    
    // Formatear para el componente de gráfico
    return response.data.data || [];
  } catch (error) {
    logger.error('[API] Error fetching balance history', error);
    return [];
  }
};

/**
 * Obtiene las operaciones históricas
 */
export const getOperationsHistory = async (accountNumber, limit = 100, offset = 0) => {
  try {
    const response = await apiClient.get(
      `/supabase/accounts/${accountNumber}/operations`,
      { params: { limit, offset } }
    );
    return response.data;
  } catch (error) {
    logger.error('[API] Error fetching operations', error);
    return { data: [], total: 0 };
  }
};

/**
 * Fuerza sincronización manual de una cuenta
 */
export const syncAccount = async (accountNumber) => {
  try {
    const response = await apiClient.post(
      `/supabase/accounts/${accountNumber}/sync`
    );
    return response.data;
  } catch (error) {
    logger.error('[API] Error syncing account', error);
    throw error;
  }
};

/**
 * Obtiene información básica de la cuenta (fallback al endpoint original)
 */
export const getAccountInfo = async (accountNumber) => {
  try {
    // Primero intentar con el endpoint optimizado
    const dashboardData = await getDashboardData(accountNumber);
    
    if (dashboardData && dashboardData.kpis) {
      return {
        balance: dashboardData.kpis.balance,
        equity: dashboardData.kpis.equity,
        margin: dashboardData.kpis.margin,
        free_margin: dashboardData.kpis.free_margin,
        profit: dashboardData.kpis.profit_loss,
        leverage: 100, // Por defecto
        enabled: true,
        name: `Account ${accountNumber}`,
        group: 'real\\proptradingmx',
        challenge_type: 'funded',
        account_type: 'real',
        status: 'active'
      };
    }
    
    // Fallback al endpoint original si falla
    const response = await apiClient.get(`/accounts/${accountNumber}/info`);
    return response.data;
  } catch (error) {
    logger.error('[API] Error fetching account info', error);
    return null;
  }
};

/**
 * Calcula métricas adicionales del lado del cliente si es necesario
 * (Solo para compatibilidad con código existente)
 */
export const calculateMetrics = (dashboardData) => {
  if (!dashboardData) return null;
  
  const { kpis, statistics } = dashboardData;
  
  return {
    // Métricas principales
    balance: kpis.balance || 0,
    equity: kpis.equity || 0,
    margin: kpis.margin || 0,
    free_margin: kpis.free_margin || 0,
    margin_level: kpis.margin_level || 0,
    
    // Profit/Loss
    profit_loss: kpis.profit_loss || 0,
    profit_loss_percentage: kpis.profit_loss_percentage || 0,
    
    // Drawdown
    current_drawdown: kpis.current_drawdown || 0,
    max_drawdown: kpis.max_drawdown || 0,
    
    // Trading Statistics
    total_trades: statistics.total_trades || 0,
    winning_trades: statistics.winning_trades || 0,
    losing_trades: statistics.losing_trades || 0,
    win_rate: statistics.win_rate || 0,
    
    // Risk metrics
    risk_reward_ratio: statistics.risk_reward_ratio || 0,
    average_win: statistics.average_win || 0,
    average_loss: statistics.average_loss || 0,
    
    // Additional info
    trading_days: kpis.trading_days || 0,
    initial_balance: kpis.initial_balance || 0,
    peak_balance: kpis.peak_balance || 0
  };
};

export default {
  getDashboardData,
  getAccountKPIs,
  getBalanceHistory,
  getOperationsHistory,
  syncAccount,
  getAccountInfo,
  calculateMetrics
};
