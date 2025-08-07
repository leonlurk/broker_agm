import axios from 'axios';
import { AuthAdapter } from './database.adapter'; // Importamos el adapter para obtener el token

// La URL base de tu nuevo backend de Node.js desplegado en el VPS
// Esto debería estar en un archivo .env en tu proyecto de React
// const API_BASE_URL = process.env.REACT_APP_LOGIC_API_URL || 'https://logic-api.yourdomain.com/api';
const API_BASE_URL = ''; // Temporalmente deshabilitado para que el front-end se renderice

// Creamos una instancia de Axios para nuestro servicio de lógica
const logicApiClient = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor para añadir automáticamente el token de autenticación de Firebase
// a cada petición que se haga al backend de lógica.
logicApiClient.interceptors.request.use(
  async (config) => {
    const user = await AuthAdapter.getCurrentUser();
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
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

// Aquí se añadirían otras funciones como unfollowMaster, updateCopyConfig, etc.
