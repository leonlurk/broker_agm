import axios from 'axios';
import { AuthAdapter } from './database.adapter'; // Importamos el adapter para obtener el token

// La URL base para Copy Trading - usa MT5Manager como proxy
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
 * @param {object} params - Parámetros para seguir al master
 * @param {string} params.master_user_id - El ID del usuario master
 * @param {string} params.master_mt5_account_id - El ID de la cuenta MT5 del master
 * @param {string} params.follower_mt5_account_id - El ID de la cuenta MT5 del seguidor
 * @param {number} [params.risk_ratio=1.0] - El ratio de riesgo para la copia
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const followMaster = async ({ master_user_id, master_mt5_account_id, follower_mt5_account_id, risk_ratio = 1.0 }) => {
  try {
    const response = await logicApiClient.post('/api/v1/copy/follow', {
      master_user_id,
      master_mt5_account_id,
      follower_mt5_account_id,
      risk_ratio
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
    const response = await logicApiClient.get('/api/v1/copy/masters');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener los traders' };
  }
};

/**
 * Permite al usuario actual dejar de seguir a un Master Trader.
 * @param {string} masterUserId - El ID de Firebase del usuario master.
 * @returns {Promise<object>} La respuesta del servidor.
 */
export const unfollowMaster = async (masterUserId) => {
  try {
    const response = await logicApiClient.post('/api/v1/copy/unfollow', {
      master_user_id: masterUserId
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
    const response = await logicApiClient.put('/api/v1/copy/config', {
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
    const response = await logicApiClient.get('/api/v1/copy/subscriptions');
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
    const response = await logicApiClient.get('/api/v1/copy/followers');
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
    const response = await logicApiClient.get('/api/v1/copy/portfolio');
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
    const response = await logicApiClient.get('/api/v1/copy/trader-stats');
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
    const response = await logicApiClient.get('/api/v1/copy/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Error al obtener estadísticas de copy trading' };
  }
};

/**
 * Configura al usuario como master trader.
 * @param {object} masterData - Datos de configuración del master trader
 * @returns {Promise<object>} Respuesta del servidor
 */
export const configureMaster = async (masterData) => {
  try {
    const payload = {
      master_mt5_account: masterData.cuentaMT5Seleccionada,
      strategy_name: masterData.nombreEstrategia,
      description: masterData.descripcionEstrategia,
      commission_rate: masterData.comisionSolicitada,
      max_risk: masterData.riesgoMaximo,
      max_drawdown: masterData.drawdownMaximo,
      markets: masterData.mercadosOperados,
      trading_hours: masterData.horariosOperacion,
      min_capital: masterData.capitalMinimo,
      max_followers: masterData.maximoSeguidores,
      experience_level: masterData.experienciaRequerida
    };

    console.log('[configureMaster] Sending payload to backend:', payload);
    console.log('[configureMaster] Full form data received:', masterData);

    const response = await logicApiClient.post('/api/v1/copy/configure-master', payload);

    console.log('[configureMaster] Backend response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[configureMaster] Error:', error);
    console.error('[configureMaster] Error response:', error.response?.data);
    throw error.response?.data || { error: 'Error al configurar como master trader' };
  }
};

/**
 * Envía un comentario y calificación para un trader.
 * @param {object} commentData - Datos del comentario
 * @param {string} commentData.trader_id - ID del trader a comentar
 * @param {number} commentData.rating - Calificación (1-5)
 * @param {string} commentData.comment - Texto del comentario
 * @returns {Promise<object>} El comentario creado
 */
export const submitTraderComment = async ({ trader_id, rating, comment }) => {
  try {
    console.log('[submitTraderComment] Starting...', { trader_id, rating, comment });
    const { supabase } = await import('../supabase/config');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('[submitTraderComment] User authenticated:', user.id);

    // Verificar si el usuario ya tiene un comentario para este trader
    const { data: existing, error: checkError } = await supabase
      .from('trader_comments')
      .select('id')
      .eq('user_id', user.id)
      .eq('trader_id', trader_id)
      .maybeSingle();

    console.log('[submitTraderComment] Check existing result:', { existing, checkError });

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[submitTraderComment] Error checking existing:', checkError);
      throw checkError;
    }

    let result;
    if (existing) {
      // Actualizar comentario existente
      console.log('[submitTraderComment] Updating existing comment:', existing.id);
      const { data, error } = await supabase
        .from('trader_comments')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      console.log('[submitTraderComment] Update result:', { data, error });
      if (error) throw error;
      result = data;
    } else {
      // Crear nuevo comentario
      console.log('[submitTraderComment] Creating new comment');
      const { data, error } = await supabase
        .from('trader_comments')
        .insert({
          user_id: user.id,
          trader_id,
          rating,
          comment
        })
        .select()
        .single();

      console.log('[submitTraderComment] Insert result:', { data, error });
      if (error) throw error;
      result = data;
    }

    console.log('[submitTraderComment] Success! Returning:', result);
    return result;
  } catch (error) {
    console.error('[submitTraderComment] Error:', error);
    throw error;
  }
};

/**
 * Obtiene los comentarios de un trader.
 * @param {string} trader_id - ID del trader
 * @returns {Promise<Array>} Lista de comentarios con información del usuario
 */
export const getTraderComments = async (trader_id) => {
  try {
    const { supabase } = await import('../supabase/config');

    const { data, error } = await supabase
      .from('trader_comments_with_users')
      .select('*')
      .eq('trader_id', trader_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};
