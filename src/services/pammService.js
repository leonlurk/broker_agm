import axios from 'axios';
import { auth } from '../firebase/config'; // Importamos auth para obtener el token

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
    const user = auth.currentUser;
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
 * Obtiene la lista de todos los fondos PAMM disponibles.
 * @returns {Promise<Array<object>>} La lista de fondos PAMM.
 */
export const getPammFunds = async () => {
  try {
    const response = await logicApiClient.get('/pamm/funds');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener los fondos PAMM' };
  }
};

/**
 * Permite al usuario actual unirse a un fondo PAMM.
 * @param {string} pammId - El ID del fondo PAMM.
 * @param {string} investorMt5AccountId - El ID de la cuenta MT5 del inversor.
 * @param {number} amount - La cantidad a invertir.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const joinPamm = async (pammId, investorMt5AccountId, amount) => {
  try {
    const response = await logicApiClient.post('/pamm/join', {
      pammId,
      investorMt5AccountId,
      amount
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al unirse al fondo PAMM' };
  }
};

/**
 * Permite al usuario actual retirar su inversión de un fondo PAMM.
 * @param {string} pammId - El ID del fondo PAMM.
 * @param {string} investorMt5AccountId - El ID de la cuenta MT5 del inversor.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const leavePamm = async (pammId, investorMt5AccountId) => {
  try {
    const response = await logicApiClient.post('/pamm/leave', {
      pammId,
      investorMt5AccountId,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al salir del fondo PAMM' };
  }
};

/**
 * Obtiene las inversiones en PAMM activas para el usuario actual.
 * @returns {Promise<Array<object>>} La lista de inversiones.
 */
export const getMyPammInvestments = async () => {
  try {
    const response = await logicApiClient.get('/pamm/investments');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener las inversiones PAMM' };
  }
}; 