import axios from 'axios';
import { AuthAdapter } from './database.adapter'; // Importamos el adapter para obtener el token

// La URL base para PAMM - usa el dominio público con SSL
// MT5Manager en producción hace proxy interno a Copy-PAMM (localhost:8080)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apekapital.com:444';
// Conectado a MT5Manager producción que hace proxy hacia Copy-PAMM API interna

// Creamos una instancia de Axios para nuestro servicio de lógica
const logicApiClient = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor para añadir automáticamente el token de autenticación
// a cada petición que se haga al backend de lógica.
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
 * Obtiene la lista de todos los fondos PAMM disponibles.
 * @returns {Promise<Array<object>>} La lista de fondos PAMM.
 */
export const getPammFunds = async () => {
  try {
    const response = await logicApiClient.get('/api/v1/pamm/funds');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener los fondos PAMM' };
  }
};

/**
 * Obtiene los detalles de un fondo PAMM específico.
 * @param {string} fundId - El ID del fondo PAMM.
 * @returns {Promise<object>} Los detalles del fondo PAMM.
 */
export const getFundDetails = async (fundId) => {
  try {
    const response = await logicApiClient.get(`/api/v1/pamm/funds/${fundId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener los detalles del fondo' };
  }
};

/**
 * Obtiene las inversiones PAMM del usuario actual.
 * @returns {Promise<Array<object>>} La lista de inversiones PAMM.
 */
export const getMyPammInvestments = async () => {
  try {
    const response = await logicApiClient.get('/api/v1/pamm/investments');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener mis inversiones PAMM' };
  }
};

/**
 * Obtiene los fondos PAMM donde el usuario es inversor con resumen del portfolio.
 * @returns {Promise<object>} El portfolio de fondos PAMM del usuario.
 */
export const getMyFunds = async () => {
  try {
    const response = await logicApiClient.get('/api/v1/pamm/my-funds');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener mis fondos PAMM' };
  }
};

/**
 * Obtiene las estadísticas como manager PAMM.
 * @returns {Promise<object>} Las estadísticas del manager PAMM.
 */
export const getManagerStats = async () => {
  try {
    const response = await logicApiClient.get('/api/v1/pamm/manager-stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener estadísticas del manager' };
  }
};

/**
 * Permite al usuario unirse a un fondo PAMM.
 * @param {string} fundId - El ID del fondo PAMM.
 * @param {string} mt5AccountId - El ID de la cuenta MT5 del inversor.
 * @param {number} investedAmount - El monto a invertir.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const joinPammFund = async (fundId, mt5AccountId, investedAmount) => {
  try {
    const response = await logicApiClient.post('/api/v1/pamm/join', {
      fund_id: fundId,
      investor_mt5_account_id: mt5AccountId,
      invested_amount: investedAmount
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al unirse al fondo PAMM' };
  }
};

/**
 * Permite al usuario salir de un fondo PAMM.
 * @param {string} fundId - El ID del fondo PAMM.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const leavePammFund = async (fundId) => {
  try {
    const response = await logicApiClient.post('/api/v1/pamm/leave', {
      fund_id: fundId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al salir del fondo PAMM' };
  }
};

/**
 * Crea un nuevo fondo PAMM (para managers).
 * @param {object} fundData - Los datos del fondo PAMM.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const createPammFund = async (fundData) => {
  try {
    const response = await logicApiClient.post('/api/v1/pamm/create', fundData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al crear el fondo PAMM' };
  }
};

// Mantener compatibilidad con nombres antiguos
export const joinPamm = joinPammFund;
export const leavePamm = leavePammFund; 