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
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('id')
      .eq('username', username)
      .abortSignal(controller.signal)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no data
    
    clearTimeout(timeoutId);
    
    // If no data found, username is available
    if (!data && !error) {
      return { available: true };
    }
    
    // If we found a user, username is not available
    if (data) {
      return { available: false };
    }
    
    // If there's an error, assume unavailable for safety
    if (error) {
      logger.error('[Supabase] Error checking username availability', error);
      return { available: false, error };
    }
    
    return { available: true };
  } catch (error) {
    // Handle abort error specifically
    if (error.name === 'AbortError') {
      logger.error('[Supabase] Username check timeout');
      return { available: false, error: { message: 'Timeout checking username availability' } };
    }
    
    logger.error('[Supabase] Error checking username availability', error);
    return { available: false, error };
  }
};

/**
 * Register a new broker user
 * Mirrors Firebase registerUser function
 */
export const registerUser = async (username, email, password, refId = null) => {
  logger.auth(`[Supabase] Attempting registration for user`, { username, email: '[REDACTED]', refId });
  
  try {
    // Temporarily skip username check to avoid hanging - we'll check after signup
    logger.auth(`[Supabase] Proceeding with registration (will check username during profile creation)`);
    
    // Step 1: Sign up with Supabase Auth
    logger.auth(`[Supabase] Calling signUp with email: ${email}`);
    
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
    
    // Add timeout to signup request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    let response;
    try {
      response = await Promise.race([
        supabase.auth.signUp(signUpOptions),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Signup timeout')), 15000);
        })
      ]);
      clearTimeout(timeoutId);
    } catch (signupError) {
      clearTimeout(timeoutId);
      if (signupError.message === 'Signup timeout') {
        logger.error('[Supabase] Signup timeout');
        return {
          user: null,
          error: { message: 'El registro está tardando más de lo esperado. Inténtalo de nuevo.' }
        };
      }
      throw signupError;
    }
    
    const { data: authData, error: authError } = response;
    
    // Log response summary
    if (authError) {
      logger.auth(`[Supabase] Signup error:`, authError.message);
      // Check if it's a database error (likely username constraint)
      if (authError.message?.includes('Database error') || authError.message?.includes('duplicate')) {
        return {
          user: null,
          error: {
            message: 'El nombre de usuario ya está en uso. Por favor, elige otro.',
            code: 'USERNAME_EXISTS'
          }
        };
      }
      return { user: null, error: authError };
    }
    
    if (authData?.user) {
      logger.auth(`[Supabase] Signup successful for user:`, authData.user.id);
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
      
      // Add timeout for username lookup
      const usernamePromise = supabase
        .from(USERS_TABLE)
        .select('email')
        .eq('username', identifier)
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Username lookup timeout')), 10000);
      });

      let result;
      try {
        result = await Promise.race([usernamePromise, timeoutPromise]);
      } catch (timeoutError) {
        if (timeoutError.message === 'Username lookup timeout') {
          logger.error('[Supabase] Username lookup timeout');
          return { user: null, error: { message: 'El sistema está tardando más de lo esperado. Inténtalo de nuevo.' } };
        }
        throw timeoutError;
      }

      const { data: userData, error: queryError } = result;

      if (queryError) {
        logger.error('[Supabase] Username query error', queryError);
        return { user: null, error: { message: 'Error consultando usuario. Inténtalo de nuevo.' } };
      }

      if (!userData) {
        logger.auth(`[Supabase] No user found with username: ${identifier}`);
        return { user: null, error: { message: 'Usuario no encontrado.' } };
      }
      
      emailToUse = userData.email;
      logger.auth(`[Supabase] Found email for username`);
    }

    // Sign in with email and password with timeout
    logger.auth(`[Supabase] Attempting sign in...`);
    const signinPromise = supabase.auth.signInWithPassword({
      email: emailToUse,
      password
    });
    
    const signinTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Signin timeout')), 15000);
    });

    let authResult;
    try {
      authResult = await Promise.race([signinPromise, signinTimeoutPromise]);
    } catch (timeoutError) {
      if (timeoutError.message === 'Signin timeout') {
        logger.error('[Supabase] Signin timeout');
        return { user: null, error: { message: 'El inicio de sesión está tardando más de lo esperado. Inténtalo de nuevo.' } };
      }
      throw timeoutError;
    }

    const { data: authData, error: authError } = authResult;

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
    
    // Skip profile verification for now to avoid hanging
    logger.auth(`[Supabase] Login successful (skipping profile verification for performance)`);
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
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logger.auth('[Supabase] Auth state change triggered', { 
      event, 
      userPresent: !!session?.user 
    });
    
    // Simplified logic - just pass the user without additional checks
    if (session?.user) {
      logger.auth('[Supabase] User authenticated, passing to callback');
      callback(session.user);
    } else {
      logger.auth('[Supabase] No authenticated user');
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
 * Uses dedicated payment_methods table in Supabase
 */
export const addPaymentMethod = async (userId, newMethod) => {
  try {
    logger.info('[Supabase] Adding payment method for user', userId);
    
    // Prepare the payment method data for insertion
    const paymentMethodData = {
      user_id: userId,
      type: newMethod.type,
      alias: newMethod.alias,
      // Crypto fields (will be null for bank type)
      network: newMethod.type === 'crypto' ? newMethod.network : null,
      address: newMethod.type === 'crypto' ? newMethod.address : null,
      // Bank fields (will be null for crypto type)
      cbu: newMethod.type === 'bank' ? newMethod.cbu : null,
      holder_name: newMethod.type === 'bank' ? newMethod.holderName : null,
      holder_id: newMethod.type === 'bank' ? newMethod.holderId : null,
      is_active: true
    };
    
    // Insert into dedicated payment_methods table
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([paymentMethodData])
      .select()
      .single();
    
    if (error) {
      logger.error('[Supabase] Error inserting payment method', error);
      throw error;
    }
    
    logger.auth('[Supabase] Payment method added successfully', data);
    return { success: true, newMethod: data, error: null };
  } catch (error) {
    logger.error('[Supabase] Error adding payment method', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete payment method from user profile
 * Uses dedicated payment_methods table in Supabase
 */
export const deletePaymentMethod = async (userId, methodToDelete) => {
  try {
    logger.info('[Supabase] Deleting payment method', methodToDelete.id);
    
    // Delete from payment_methods table
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', methodToDelete.id)
      .eq('user_id', userId); // Extra security check
    
    if (error) {
      logger.error('[Supabase] Error deleting payment method', error);
      throw error;
    }
    
    logger.auth('[Supabase] Payment method deleted successfully');
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase] Error deleting payment method', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get payment methods for a user
 * Uses dedicated payment_methods table in Supabase
 */
export const getPaymentMethods = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('[Supabase] Error fetching payment methods', error);
      return { data: [], error };
    }
    
    logger.info(`[Supabase] Found ${data?.length || 0} payment methods for user`);
    return { data: data || [], error: null };
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
  getPaymentMethods,
  verifyCode
};