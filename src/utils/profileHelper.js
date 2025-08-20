/**
 * Helper para crear perfil después del registro
 * Solución para cuando no se tienen permisos de owner en Supabase
 */

import { supabase } from '../supabase/config';
import { logger } from './logger';

/**
 * Crea el perfil del usuario después del registro
 * @param {Object} user - Usuario de Supabase Auth
 * @param {string} username - Username deseado
 * @param {string} fullName - Nombre completo
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function createUserProfile(user, username, fullName) {
  try {
    if (!user || !user.id) {
      throw new Error('User object is required');
    }

    logger.info('[Profile Helper] Creating profile for user:', user.email);

    // Llamar a la función RPC en Supabase
    const { data, error } = await supabase.rpc('create_user_profile_after_signup', {
      user_id: user.id,
      user_email: user.email,
      user_username: username || null,
      user_full_name: fullName || null
    });

    if (error) {
      logger.error('[Profile Helper] Error creating profile:', error);
      
      // Intentar método alternativo
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          username: username || user.id,
          full_name: fullName || username || user.email.split('@')[0],
          role: 'user',
          kyc_status: 'not_started',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        logger.error('[Profile Helper] Alternative method also failed:', insertError);
        return {
          success: false,
          message: 'Profile creation failed'
        };
      }

      logger.info('[Profile Helper] Profile created using alternative method');
      return {
        success: true,
        message: 'Profile created successfully'
      };
    }

    logger.info('[Profile Helper] Profile created successfully:', data);
    return data || { success: true, message: 'Profile created' };

  } catch (error) {
    logger.error('[Profile Helper] Exception creating profile:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Verifica si el usuario tiene perfil
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>}
 */
export async function userHasProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    return !error && data !== null;
  } catch (error) {
    logger.error('[Profile Helper] Error checking profile:', error);
    return false;
  }
}

/**
 * Procesa perfiles faltantes (para ejecutar periódicamente)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function processMissingProfiles() {
  try {
    const { data, error } = await supabase.rpc('create_missing_profiles');

    if (error) {
      logger.error('[Profile Helper] Error processing missing profiles:', error);
      return {
        success: false,
        message: error.message
      };
    }

    logger.info('[Profile Helper] Missing profiles processed:', data);
    return data || { success: true };

  } catch (error) {
    logger.error('[Profile Helper] Exception processing profiles:', error);
    return {
      success: false,
      message: error.message
    };
  }
}