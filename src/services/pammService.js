import axios from 'axios';
import { AuthAdapter } from './database.adapter'; // Importamos el adapter para obtener el token

// La URL base para PAMM - usa MT5Manager como proxy
// MT5Manager en producción hace proxy interno a Copy-PAMM (localhost:8080)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined in environment variables. Please check your .env file.');
}

// MT5Manager redirige automáticamente las peticiones /api/v1/* al backend Copy-PAMM

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
      console.error('Error getting auth token:', error);
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
 * Obtiene los detalles completos de un fondo PAMM como manager.
 * @param {string} fundId - El ID del fondo PAMM.
 * @returns {Promise<object>} Los detalles completos del fondo.
 */
export const getManagerFundDetails = async (fundId) => {
  try {
    const response = await logicApiClient.get(`/api/v1/pamm/manager/fund/${fundId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener detalles del fondo' };
  }
};

/**
 * Obtener actividades de un fondo
 */
export const getFundActivities = async (fundId, limit = 10) => {
  try {
    const response = await logicApiClient.get(`/api/v1/pamm/fund/${fundId}/activities`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener actividades' };
  }
};

/**
 * Obtener mensajes de un fondo
 */
export const getFundMessages = async (fundId, limit = 50, recipientId = null) => {
  try {
    const params = { limit };
    if (recipientId) {
      params.recipient_id = recipientId;
    }
    const response = await logicApiClient.get(`/api/v1/pamm/fund/${fundId}/messages`, {
      params
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener mensajes' };
  }
};

/**
 * Enviar mensaje
 */
export const sendMessage = async (fundId, message, parentMessageId = null, recipientId = null) => {
  try {
    const payload = {
      fundId,
      message,
      parentMessageId
    };
    if (recipientId) {
      payload.recipientId = recipientId;
    }
    const response = await logicApiClient.post('/api/v1/pamm/messages', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al enviar mensaje' };
  }
};

/**
 * Marcar mensajes como leídos
 */
export const markMessagesAsRead = async (fundId) => {
  try {
    const response = await logicApiClient.put(`/api/v1/pamm/fund/${fundId}/messages/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al marcar mensajes' };
  }
};

/**
 * Obtener contador de mensajes no leídos por chat
 */
export const getUnreadCount = async (fundId) => {
  try {
    const response = await logicApiClient.get(`/api/v1/pamm/fund/${fundId}/messages/unread`);
    return response.data;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Solicitar retiro de inversión PAMM
 */
export const requestWithdrawal = async (investmentId, amount, withdrawalType, reason, paymentMethod, paymentDetails) => {
  try {
    const response = await logicApiClient.post('/api/v1/pamm/withdrawals/request', {
      investmentId,
      amount,
      withdrawalType,
      reason,
      paymentMethod,
      paymentDetails
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al solicitar retiro' };
  }
};

/**
 * Obtener mis solicitudes de retiro
 */
export const getMyWithdrawals = async (status = null, limit = 50) => {
  try {
    const params = { limit };
    if (status) params.status = status;
    const response = await logicApiClient.get('/api/v1/pamm/withdrawals/my', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener retiros' };
  }
};

/**
 * Obtener solicitudes de retiro del fondo (manager)
 */
export const getFundWithdrawals = async (fundId, status = null, limit = 50) => {
  try {
    const params = { limit };
    if (status) params.status = status;
    const response = await logicApiClient.get(`/api/v1/pamm/fund/${fundId}/withdrawals`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener retiros del fondo' };
  }
};

/**
 * Actualizar estado de solicitud de retiro (aprobar/rechazar)
 */
export const updateWithdrawalStatus = async (withdrawalId, status, managerNotes = null) => {
  try {
    const response = await logicApiClient.put(`/api/v1/pamm/withdrawals/${withdrawalId}/status`, {
      status,
      managerNotes
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al actualizar estado de retiro' };
  }
};

/**
 * Procesar retiro aprobado
 */
export const processWithdrawal = async (withdrawalId) => {
  try {
    const response = await logicApiClient.post(`/api/v1/pamm/withdrawals/${withdrawalId}/process`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al procesar retiro' };
  }
};

/**
 * Obtener reglas del fondo
 */
export const getFundRules = async (fundId) => {
  try {
    const response = await logicApiClient.get(`/api/v1/pamm/fund/${fundId}/rules`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener reglas del fondo' };
  }
};

/**
 * Actualizar reglas del fondo (manager)
 */
export const updateFundRules = async (fundId, rules) => {
  try {
    const response = await logicApiClient.put(`/api/v1/pamm/fund/${fundId}/rules`, rules);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al actualizar reglas del fondo' };
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
    throw error.response?.data || { error: 'Error al unirse al fondo' };
    console.error('[pammService] joinPammFund error:', error.response?.data || error.message);
    const errorData = error.response?.data || { error: 'Error al unirse al fondo PAMM' };

    // Extract error message - handle both string and object errors
    let errorMessage = 'Error al unirse al fondo PAMM';
    if (typeof errorData.error === 'string') {
      errorMessage = errorData.error;
    } else if (typeof errorData.message === 'string') {
      errorMessage = errorData.message;
    } else if (errorData.error && typeof errorData.error.message === 'string') {
      errorMessage = errorData.error.message;
    } else if (errorData.error && typeof errorData.error === 'object') {
      errorMessage = JSON.stringify(errorData.error);
    }

    // Return error object instead of throwing to allow modal to handle it
    return { success: false, error: errorMessage };
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