// Supabase Authentication Service
// This mirrors the Firebase auth.js functionality for Supabase

import { supabase } from './config';
import { logger } from '../utils/logger';

// Unified collection/table name - Using existing 'profiles' table
const USERS_TABLE = 'profiles';

/**
 * Check if username is available
 */
export const checkUsernameAvailable = async (username) => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('id')
      .eq('username', username)
      .single();
    
    // If we get PGRST116 error (no rows), username is available
    if (error && error.code === 'PGRST116') {
      return { available: true };
    }
    
    // If we found a user or got another error
    if (data || error) {
      return { available: false };
    }
    
    return { available: true };
  } catch (error) {
    logger.error('[Supabase] Error checking username availability', error);
    return { available: false, error };
  }
};

/**
 * Register a new broker user
 * Mirrors Firebase registerUser function
 */
export const registerUser = async (username, email, password, refId = null) => {
  logger.auth(`[Supabase] Attempting registration for user`, { username, email: '[EMAIL_PROVIDED]', refId });
  
  
  try {
    // First check if username is available
    logger.auth(`[Supabase] Checking username availability for: ${username}`);
    const { available } = await checkUsernameAvailable(username);
    
    if (!available) {
      logger.auth(`[Supabase] Username "${username}" is already taken`);
      return { 
        user: null, 
        error: { 
          message: 'El nombre de usuario ya está en uso. Por favor, elige otro.',
          code: 'USERNAME_EXISTS'
        } 
      };
    }
    
    logger.auth(`[Supabase] Username "${username}" is available, proceeding with registration`);
    // Step 1: Sign up with Supabase Auth
    logger.auth(`[Supabase] Calling signUp with email: ${email}`);
    
    let authData, authError;
    try {
      // Try with additional options for better error debugging
      const signUpOptions = {
        email,
        password,
        options: {
          data: {
            username: username,
            full_name: username // Use full_name which the trigger expects
          }
        }
      };
      
      logger.auth(`[Supabase] Signup metadata:`, signUpOptions.options.data);
      
      const response = await supabase.auth.signUp(signUpOptions);
      authData = response.data;
      authError = response.error;
      
      // Log response summary
      if (response.error) {
        logger.auth(`[Supabase] Signup error:`, response.error.message);
      } else if (response.data?.user) {
        logger.auth(`[Supabase] Signup successful for user:`, response.data.user.id);
      }
    } catch (signupException) {
      logger.error(`[Supabase] SignUp exception:`, signupException.message);
      throw signupException;
    }
    
    // Log result
    if (authError) {
      logger.auth(`[Supabase] Signup failed:`, authError.message);
    } else if (authData?.user) {
      logger.auth(`[Supabase] Auth user created successfully:`, authData.user.id);
    }

    if (authError) {
      // Check if it's a database error (likely username constraint)
      if (authError.message?.includes('Database error')) {
        logger.error('[Supabase] Database error - likely username already exists');
        return {
          user: null,
          error: {
            message: 'El nombre de usuario ya está en uso. Por favor, elige otro.',
            code: 'USERNAME_EXISTS'
          }
        };
      }
      throw authError;
    }
    
    const user = authData.user;
    logger.auth(`[Supabase] Auth user created successfully`, { uid: user.id });
    
    // Step 2: Update user profile in database (profile already created by trigger)
    // The profiles table is auto-populated by Supabase trigger
    // We just need to update it with additional fields
    const userData = {
      username,
      full_name: username, // Use full_name instead of display_name
      phone: null,
      country: null,
      metadata: {
        user_type: 'broker',
        referral_count: 0,
        referred_by: refId,
        display_name: username
      }
    };

    // Update the auto-created profile instead of inserting
    const { error: dbError } = await supabase
      .from(USERS_TABLE)
      .update(userData)
      .eq('id', user.id);

    if (dbError) {
      logger.error('[Supabase] Error updating user profile', dbError);
      // Note: We don't delete the auth user since profile was auto-created
      // The user can still login and update their profile later
      throw dbError;
    }

    logger.auth(`[Supabase] User profile updated successfully`);
    
    return { user, error: null };
  } catch (error) {
    logger.error('[Supabase] Registration error', error);
    return { user: null, error };
  }
};

/**
 * Sign in existing user (email or username)
 * Mirrors Firebase loginUser function
 */
export const loginUser = async (identifier, password) => {
  logger.auth(`[Supabase] Attempting login with identifier type: ${/\S+@\S+\.\S+/.test(identifier) ? 'email' : 'username'}`);
  
  let emailToUse = identifier;
  const isEmailFormat = /\S+@\S+\.\S+/.test(identifier);

  try {
    // If username provided, lookup email first
    if (!isEmailFormat) {
      logger.auth(`[Supabase] Querying ${USERS_TABLE} for username...`);
      
      const { data: users, error: queryError } = await supabase
        .from(USERS_TABLE)
        .select('email')
        .eq('username', identifier);

      if (queryError) throw queryError;

      if (!users || users.length === 0) {
        logger.auth(`[Supabase] No user found with username: ${identifier}`);
        return { user: null, error: { message: 'Usuario no encontrado.' } };
      }
      
      if (users.length > 1) {
        logger.warn(`[Supabase] Multiple users found with same username`);
        return { user: null, error: { message: 'Error: Múltiples usuarios encontrados con ese nombre de usuario.' } };
      }
      
      emailToUse = users[0].email;
      logger.auth(`[Supabase] Found email for username`);
    }

    // Sign in with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password
    });

    if (authError) {
      logger.error('[Supabase] Authentication error', authError);
      let friendlyMessage = 'Error al iniciar sesión. Verifique sus credenciales.';
      
      if (authError.message.includes('Invalid login credentials')) {
        friendlyMessage = 'Email/Usuario o contraseña incorrectos.';
      }
      
      return { user: null, error: { message: friendlyMessage } };
    }

    const user = authData.user;
    logger.auth(`[Supabase] Authentication successful`);
    
    // Verify user exists in our users table
    const { data: userProfile, error: profileError } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      logger.warn(`[Supabase] User profile not found. Signing out.`);
      await supabase.auth.signOut();
      return { user: null, error: { message: 'Autenticación fallida: Datos de usuario no encontrados en el sistema.' } };
    }

    logger.auth(`[Supabase] User profile verified. Login successful.`);
    return { user, error: null };

  } catch (error) {
    logger.error('[Supabase] Login process error', error);
    return { user: null, error: { message: 'Error al iniciar sesión. Verifique sus credenciales.' } };
  }
};

/**
 * Sign out user
 * Mirrors Firebase logoutUser function
 */
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    logger.auth('[Supabase] User signed out successfully');
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase] Logout error', error);
    return { success: false, error };
  }
};

/**
 * Reset password
 * Mirrors Firebase resetPassword function
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) throw error;
    
    logger.auth('[Supabase] Password reset email sent');
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase] Password reset error', error);
    return { success: false, error };
  }
};

/**
 * Send password reset email
 * Mirrors Firebase sendPasswordReset function
 */
export const sendPasswordReset = async (email) => {
  return resetPassword(email);
};

/**
 * Update user password (after reset)
 */
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    logger.auth('[Supabase] Password updated successfully');
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase] Password update error', error);
    return { success: false, error };
  }
};

/**
 * Verify email update
 * Mirrors Firebase verifyEmailUpdate function
 */
export const verifyEmailUpdate = async (user, newEmail) => {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    });
    
    if (error) throw error;
    
    logger.auth('[Supabase] Email update verification sent');
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase] Email update error', error);
    return { success: false, error: error.message };
  }
};

/**
 * Re-authenticate user
 * Mirrors Firebase reauthenticateUser function
 */
export const reauthenticateUser = async (user, password) => {
  try {
    // In Supabase, we re-authenticate by signing in again
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password
    });
    
    if (error) throw error;
    
    logger.auth('[Supabase] User re-authenticated successfully');
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase] Re-authentication error', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current user
 * Mirrors Firebase getCurrentUser function
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    logger.error('[Supabase] Error getting current user', error);
    return null;
  }
  
  if (user) {
    logger.auth('[Supabase] Current user retrieved');
  }
  
  return user;
};

/**
 * Check if user exists in the profiles table
 * Mirrors Firebase isBrokerUser function
 */
export const isBrokerUser = async (userId) => {
  logger.auth(`[Supabase] Checking if user exists in ${USERS_TABLE}...`);
  
  if (!userId) {
    logger.auth(`[Supabase] No userId provided for existence check`);
    return false;
  }
  
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('id, role, status')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    // Check if user exists and is active
    const exists = !!data && data.status === 'active';
    logger.auth(`[Supabase] User ${exists ? 'found and active' : 'NOT found or inactive'}`);
    return exists;
  } catch (error) {
    logger.error(`[Supabase] Error checking user existence`, error);
    throw error;
  }
};

/**
 * Set up auth state listener
 * Mirrors Firebase onAuthStateChange function
 */
export const onAuthStateChange = (callback) => {
  logger.auth('[Supabase] Setting up auth state listener...');
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    logger.auth('[Supabase] Auth state change triggered', { 
      event, 
      userPresent: !!session?.user 
    });
    
    if (session?.user) {
      try {
        // Check if user exists in our users table
        const userExists = await isBrokerUser(session.user.id);
        
        if (!userExists) {
          logger.warn(`[Supabase] User authenticated but NO profile found. Signing out...`);
          await supabase.auth.signOut();
          callback(null);
        } else {
          callback(session.user);
        }
      } catch (error) {
        logger.error('[Supabase] Error in auth state change handler', error);
        await supabase.auth.signOut();
        callback(null);
      }
    } else {
      logger.auth('[Supabase] No authenticated user after state change');
      callback(null);
    }
  });
  
  // Return unsubscribe function
  return () => {
    logger.auth('[Supabase] Unsubscribing from auth state changes');
    subscription.unsubscribe();
  };
};

/**
 * Add payment method to user profile
 * Mirrors Firebase addPaymentMethod function
 */
export const addPaymentMethod = async (userId, newMethod) => {
  try {
    // First get current metadata
    const { data: userData, error: fetchError } = await supabase
      .from(USERS_TABLE)
      .select('metadata')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const currentMetadata = userData.metadata || {};
    const currentMethods = currentMetadata.payment_methods || [];
    const methodWithId = { ...newMethod, id: `pm_${Date.now()}` };
    const updatedMethods = [...currentMethods, methodWithId];
    
    // Update metadata with new payment methods
    const { error: updateError } = await supabase
      .from(USERS_TABLE)
      .update({ 
        metadata: {
          ...currentMetadata,
          payment_methods: updatedMethods
        }
      })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    logger.auth('[Supabase] Payment method added successfully');
    return { success: true, newMethod: methodWithId, error: null };
  } catch (error) {
    logger.error('[Supabase] Error adding payment method', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete payment method from user profile
 * Mirrors Firebase deletePaymentMethod function
 */
export const deletePaymentMethod = async (userId, methodToDelete) => {
  try {
    // First get current metadata
    const { data: userData, error: fetchError } = await supabase
      .from(USERS_TABLE)
      .select('metadata')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const currentMetadata = userData.metadata || {};
    const currentMethods = currentMetadata.payment_methods || [];
    const updatedMethods = currentMethods.filter(method => method.id !== methodToDelete.id);
    
    // Update metadata with filtered payment methods
    const { error: updateError } = await supabase
      .from(USERS_TABLE)
      .update({ 
        metadata: {
          ...currentMetadata,
          payment_methods: updatedMethods
        }
      })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    logger.auth('[Supabase] Payment method deleted successfully');
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase] Error deleting payment method', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify verification code (placeholder)
 * Note: Supabase handles email verification differently
 */
export const verifyCode = async (code) => {
  logger.auth('[Supabase] Verification code processed', { codeProvided: !!code });
  // In Supabase, email verification is handled via magic links
  // This function is kept for compatibility
  return { success: true };
};

// Export all functions for compatibility
export default {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  sendPasswordReset,
  updatePassword,
  verifyEmailUpdate,
  reauthenticateUser,
  getCurrentUser,
  isBrokerUser,
  onAuthStateChange,
  addPaymentMethod,
  deletePaymentMethod,
  verifyCode
};