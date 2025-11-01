/**
 * Auth Error Handler
 * Maneja errores de autenticación de Supabase de forma elegante
 */

import { logger } from './logger';

/**
 * Limpia tokens inválidos del localStorage
 */
export const clearInvalidTokens = () => {
  try {
    logger.warn('[Auth] Clearing invalid tokens from localStorage');

    // Limpiar tokens de Supabase
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('supabase') || key.includes('agm-broker-auth')) {
        localStorage.removeItem(key);
        logger.info(`[Auth] Removed invalid token: ${key}`);
      }
    });

    // Limpiar sessionStorage también
    sessionStorage.clear();

    logger.info('[Auth] Invalid tokens cleared successfully');
    return true;
  } catch (error) {
    logger.error('[Auth] Error clearing invalid tokens:', error);
    return false;
  }
};

/**
 * Maneja errores específicos de refresh token
 */
export const handleAuthError = (error) => {
  logger.error('[Auth] Auth error detected:', error);

  // Detectar errores de refresh token
  const isRefreshTokenError =
    error?.message?.includes('Invalid Refresh Token') ||
    error?.message?.includes('Refresh Token Not Found') ||
    error?.message?.includes('refresh_token') ||
    error?.status === 400;

  if (isRefreshTokenError) {
    logger.warn('[Auth] Invalid refresh token detected, cleaning up...');
    clearInvalidTokens();

    // Redirigir al login solo si no estamos ya en la página de login
    if (!window.location.pathname.includes('/login')) {
      logger.info('[Auth] Redirecting to login...');
      window.location.href = '/login';
    }

    return true; // Error manejado
  }

  return false; // Error no manejado
};

/**
 * Wrapper para manejar errores de sesión de Supabase
 */
export const safeGetSession = async (supabase) => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      const handled = handleAuthError(error);
      if (handled) {
        return { data: null, error: null }; // Error manejado, retornar null
      }
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    handleAuthError(error);
    return { data: null, error };
  }
};

/**
 * Agregar listener global para errores de autenticación
 */
export const setupAuthErrorListener = (supabase) => {
  logger.info('[Auth] Setting up global auth error listener');

  // Escuchar cambios de estado de autenticación
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logger.info(`[Auth] Auth state changed: ${event}`, {
      hasSession: !!session,
      event
    });

    // Manejar eventos específicos
    if (event === 'TOKEN_REFRESHED') {
      logger.info('[Auth] Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
      logger.info('[Auth] User signed out, clearing tokens');
      clearInvalidTokens();
    } else if (event === 'USER_UPDATED') {
      logger.info('[Auth] User updated');
    }
  });

  // Listener para errores no capturados
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Invalid Refresh Token')) {
      event.preventDefault(); // Prevenir que se muestre en consola
      handleAuthError(event.reason);
    }
  });

  return subscription;
};

export default {
  clearInvalidTokens,
  handleAuthError,
  safeGetSession,
  setupAuthErrorListener
};
