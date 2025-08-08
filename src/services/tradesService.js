import axios from 'axios';
import { AuthAdapter } from './database.adapter'; // Importamos el adapter para obtener el token

// La URL base de tu nuevo backend de Node.js desplegado en el VPS
const API_BASE_URL = import.meta.env.VITE_LOGIC_API_URL || 'http://localhost/api';

// Creamos una instancia de Axios para nuestro servicio de lógica
const logicApiClient = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor para añadir automáticamente el token de autenticación
logicApiClient.interceptors.request.use(
  async (config) => {
    try {
      if (AuthAdapter.isSupabase()) {
        // For Supabase, get the session which contains the access_token
        const { supabase } = await import('../supabase/config');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      } else {
        // For Firebase
        const user = await AuthAdapter.getCurrentUser();
        if (user && user.getIdToken) {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Obtiene el historial de trades del usuario.
 * @param {object} filters - Filtros para el historial (page, limit, symbol, type, status, start_date, end_date).
 * @returns {Promise<object>} El historial de trades con paginación y resumen.
 */
export const getTradeHistory = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Agregar filtros a los parámetros
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await logicApiClient.get(`/trades/history?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener el historial de trades' };
  }
};

/**
 * Obtiene las estadísticas de trading del usuario.
 * @param {string} period - Período para las estadísticas (7d, 30d, 90d, 1y, all).
 * @returns {Promise<object>} Las estadísticas de trading detalladas.
 */
export const getTradingStats = async (period = '30d') => {
  try {
    const response = await logicApiClient.get(`/trades/stats?period=${period}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener estadísticas de trading' };
  }
};

/**
 * Obtiene un trade específico por ID.
 * @param {string} tradeId - El ID del trade.
 * @returns {Promise<object>} Los detalles del trade.
 */
export const getTradeById = async (tradeId) => {
  try {
    const response = await logicApiClient.get(`/trades/${tradeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener el trade' };
  }
};

/**
 * Obtiene las operaciones abiertas del usuario.
 * @returns {Promise<Array<object>>} Lista de trades abiertos.
 */
export const getOpenTrades = async () => {
  try {
    const response = await getTradeHistory({ status: 'open', limit: 100 });
    return response.trades || [];
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener trades abiertos' };
  }
};

/**
 * Obtiene las operaciones cerradas del usuario.
 * @param {object} filters - Filtros adicionales.
 * @returns {Promise<object>} Historial de trades cerrados.
 */
export const getClosedTrades = async (filters = {}) => {
  try {
    const response = await getTradeHistory({ ...filters, status: 'closed' });
    return response;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener trades cerrados' };
  }
};

/**
 * Obtiene el resumen de trading del usuario.
 * @returns {Promise<object>} Resumen de estadísticas de trading.
 */
export const getTradingSummary = async () => {
  try {
    const stats = await getTradingStats('30d');
    return stats.summary || {};
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener resumen de trading' };
  }
};

/**
 * Obtiene la curva de equity del usuario.
 * @param {string} period - Período para la curva.
 * @returns {Promise<Array<object>>} Datos de la curva de equity.
 */
export const getEquityCurve = async (period = '30d') => {
  try {
    const stats = await getTradingStats(period);
    return stats.equity_curve || [];
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener curva de equity' };
  }
};