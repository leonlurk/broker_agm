import axios from 'axios';
import { AuthAdapter } from './database.adapter'; // Importamos el adapter para obtener el token

// La URL base de tu nuevo backend de Node.js desplegado en el VPS
// Esto debería estar en un archivo .env en tu proyecto de React
const API_BASE_URL = import.meta.env.VITE_LOGIC_API_URL || 'http://localhost/api';
// Ahora conectado a tu backend Copy-PAMM enterprise que corre en localhost

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
          console.log('Using Supabase token:', session.access_token.substring(0, 20) + '...');
        } else {
          console.warn('No Supabase session found');
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
 * Permite al usuario actual seguir a un Master Trader.
 * @param {string} masterUserId - El ID de Firebase del usuario master.
 * @param {string} followerMt5AccountId - El ID de la cuenta MT5 del usuario que va a seguir.
 * @param {number} [riskRatio=1.0] - El ratio de riesgo para la copia.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const followMaster = async (masterUserId, followerMt5AccountId, riskRatio = 1.0) => {
  try {
    const response = await logicApiClient.post('/copy/follow', {
      masterUserId,
      followerMt5AccountId,
      riskRatio
    });
    return response.data;
  } catch (error) {
    // Lanza el error para que el componente que llama pueda manejarlo
    throw error.response?.data || { error: 'Error de red o del servidor' };
  }
};

/**
 * Obtiene la lista de todos los Master Traders disponibles para copiar.
 * @returns {Promise<Array<object>>} La lista de traders.
 */
export const getMasterTraders = async () => {
  try {
    const response = await logicApiClient.get('/copy/masters');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener los traders' };
  }
};

/**
 * Permite al usuario actual dejar de seguir a un Master Trader.
 * @param {string} masterUserId - El ID de Firebase del usuario master.
 * @param {string} followerMt5AccountId - El ID de la cuenta MT5 del seguidor.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const unfollowMaster = async (masterUserId, followerMt5AccountId) => {
  try {
    const response = await logicApiClient.post('/copy/unfollow', {
      masterUserId,
      followerMt5AccountId,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al dejar de seguir al trader' };
  }
};

/**
 * Actualiza la configuración de copia para un seguidor.
 * @param {string} masterUserId - El ID de Firebase del usuario master.
 * @param {string} followerMt5AccountId - El ID de la cuenta MT5 del seguidor.
 * @param {number} riskRatio - El nuevo ratio de riesgo.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const updateCopyConfig = async (masterUserId, followerMt5AccountId, riskRatio) => {
  try {
    const response = await logicApiClient.put('/copy/config', {
      masterUserId,
      followerMt5AccountId,
      riskRatio,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al actualizar la configuración' };
  }
};

/**
 * Obtiene las suscripciones de copia activas para el usuario actual.
 * @returns {Promise<Array<object>>} La lista de suscripciones.
 */
export const getMySubscriptions = async () => {
  try {
    // El ID de usuario se obtiene del token en el backend
    const response = await logicApiClient.get('/copy/subscriptions');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener las suscripciones' };
  }
};

/**
 * Obtiene la lista de seguidores para el gestor (usuario actual).
 * @returns {Promise<Array<object>>} La lista de seguidores.
 */
export const getFollowers = async () => {
  try {
    // El backend identifica al gestor a través del token de autenticación.
    const response = await logicApiClient.get('/copy/followers');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener los seguidores' };
  }
};

/**
 * Obtiene el portfolio consolidado del inversor (usuario actual).
 * @returns {Promise<object>} El portfolio con estadísticas.
 */
export const getInvestorPortfolio = async () => {
  try {
    const response = await logicApiClient.get('/copy/portfolio');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener el portfolio' };
  }
};

/**
 * Obtiene las estadísticas como trader/gestor (usuario actual).
 * @returns {Promise<object>} Las estadísticas del trader.
 */
export const getTraderStats = async () => {
  try {
    const response = await logicApiClient.get('/copy/trader-stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener estadísticas del trader' };
  }
};

/**
 * Obtiene estadísticas generales de copy trading del usuario.
 * @returns {Promise<object>} Las estadísticas de copy trading.
 */
export const getCopyStats = async () => {
  try {
    const response = await logicApiClient.get('/copy/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener estadísticas de copy trading' };
  }
};
