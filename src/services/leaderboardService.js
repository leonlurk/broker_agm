/**
 * Leaderboard Service
 * Servicio para obtener datos del ranking de traders en competencias demo
 */

import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';

/**
 * Obtiene el leaderboard de traders demo
 * @param {string} period - Periodo: 'week', 'month', 'all'
 * @param {number} limit - Número de traders a retornar (máximo 100)
 * @returns {Promise<Object>} Datos del leaderboard
 */
export const getLeaderboardData = async (period = 'month', limit = 10) => {
  try {
    logger.info('[Leaderboard Service] Fetching leaderboard data', { period, limit });
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      throw new Error('VITE_API_BASE_URL is not defined in environment variables');
    }
    
    // Obtener token de autenticación
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logger.error('[Leaderboard Service] Error getting session', sessionError);
      throw new Error('Authentication error');
    }
    
    if (!session?.access_token) {
      logger.warn('[Leaderboard Service] No active session');
      throw new Error('No active session. Please login.');
    }
    
    // Hacer request al backend
    const url = `${baseUrl}/api/v1/leaderboard/demo-competition?period=${period}&limit=${limit}`;
    logger.info('[Leaderboard Service] Requesting:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      logger.error('[Leaderboard Service] API error', { 
        status: response.status, 
        error: errorData 
      });
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    logger.info('[Leaderboard Service] Leaderboard data fetched successfully', {
      participants: data.total_participants,
      entries: data.leaderboard?.length || 0
    });
    
    return {
      success: true,
      data: data
    };
    
  } catch (error) {
    logger.error('[Leaderboard Service] Error fetching leaderboard', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch leaderboard data'
    };
  }
};

/**
 * Obtiene la posición de una cuenta específica en el leaderboard
 * @param {string} accountNumber - Número de cuenta MT5
 * @param {string} period - Periodo: 'week', 'month', 'all'
 * @returns {Promise<Object>} Posición y datos de la cuenta
 */
export const getAccountLeaderboardPosition = async (accountNumber, period = 'month') => {
  try {
    logger.info('[Leaderboard Service] Fetching account position', { accountNumber, period });
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      throw new Error('VITE_API_BASE_URL is not defined in environment variables');
    }
    
    // Obtener token de autenticación
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication error');
    }
    
    // Hacer request al backend
    const url = `${baseUrl}/api/v1/leaderboard/demo-competition/account/${accountNumber}?period=${period}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    logger.info('[Leaderboard Service] Account position fetched successfully', {
      rank: data.account?.rank,
      percentile: data.percentile
    });
    
    return {
      success: true,
      data: data
    };
    
  } catch (error) {
    logger.error('[Leaderboard Service] Error fetching account position', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch account position'
    };
  }
};

/**
 * Formatea el nombre del trader para mostrar (anonimizado)
 * @param {string} traderName - Nombre del trader
 * @param {string} accountNumber - Número de cuenta
 * @returns {string} Nombre formateado
 */
export const formatTraderName = (traderName, accountNumber) => {
  if (!traderName || traderName.startsWith('Trader_')) {
    return `Trader_${accountNumber.slice(-4)}`;
  }
  return traderName;
};

/**
 * Formatea el país para mostrar emoji de bandera
 * @param {string} countryCode - Código de país (ISO 2 letras)
 * @returns {string} Emoji de bandera
 */
export const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) {
    return '🌍'; // Emoji de mundo por defecto
  }
  
  // Convertir código de país a emoji de bandera
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

/**
 * Formatea el PnL para mostrar con color
 * @param {number} pnl - PnL en USD
 * @returns {Object} Objeto con valor formateado y clase CSS
 */
export const formatPnL = (pnl) => {
  const isPositive = pnl >= 0;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(pnl));
  
  return {
    value: `${isPositive ? '+' : '-'}${formatted}`,
    className: isPositive ? 'text-green-400' : 'text-red-400',
    isPositive
  };
};

/**
 * Formatea el porcentaje de PnL
 * @param {number} percentage - Porcentaje
 * @returns {Object} Objeto con valor formateado y clase CSS
 */
export const formatPnLPercentage = (percentage) => {
  const isPositive = percentage >= 0;
  const formatted = `${isPositive ? '+' : ''}${percentage.toFixed(2)}%`;
  
  return {
    value: formatted,
    className: isPositive ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30',
    isPositive
  };
};

/**
 * Obtiene el emoji de medalla según el ranking
 * @param {number} rank - Posición en el ranking
 * @returns {string} Emoji de medalla
 */
export const getMedalEmoji = (rank) => {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
};

/**
 * Formatea la fecha de última actualización
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export const formatLastUpdated = (isoDate) => {
  if (!isoDate) return 'N/A';
  
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Prepara los datos del balance history para el gráfico
 * @param {Array} balanceHistory - Array de snapshots de balance
 * @returns {Array} Datos formateados para Recharts
 */
export const formatBalanceHistoryForChart = (balanceHistory) => {
  if (!balanceHistory || balanceHistory.length === 0) {
    return [];
  }
  
  return balanceHistory.map(snapshot => ({
    timestamp: snapshot.timestamp,
    value: snapshot.equity || snapshot.balance || 0,
    balance: snapshot.balance || 0,
    equity: snapshot.equity || 0,
    // Formatear fecha para el eje X
    name: new Date(snapshot.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));
};

/**
 * Calcula estadísticas agregadas del leaderboard
 * @param {Array} leaderboard - Array de entradas del leaderboard
 * @returns {Object} Estadísticas agregadas
 */
export const calculateLeaderboardStats = (leaderboard) => {
  if (!leaderboard || leaderboard.length === 0) {
    return {
      totalParticipants: 0,
      averagePnL: 0,
      totalTrades: 0,
      averageWinRate: 0,
      topPnL: 0,
      bottomPnL: 0
    };
  }
  
  const totalPnL = leaderboard.reduce((sum, entry) => sum + entry.pnl, 0);
  const totalTrades = leaderboard.reduce((sum, entry) => sum + entry.total_trades, 0);
  const totalWinRate = leaderboard.reduce((sum, entry) => sum + entry.win_rate, 0);
  
  return {
    totalParticipants: leaderboard.length,
    averagePnL: totalPnL / leaderboard.length,
    totalTrades: totalTrades,
    averageWinRate: totalWinRate / leaderboard.length,
    topPnL: leaderboard[0]?.pnl || 0,
    bottomPnL: leaderboard[leaderboard.length - 1]?.pnl || 0
  };
};

export default {
  getLeaderboardData,
  getAccountLeaderboardPosition,
  formatTraderName,
  getCountryFlag,
  formatPnL,
  formatPnLPercentage,
  getMedalEmoji,
  formatLastUpdated,
  formatBalanceHistoryForChart,
  calculateLeaderboardStats
};
