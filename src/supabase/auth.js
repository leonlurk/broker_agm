// Supabase Authentication Service
// This mirrors the Firebase auth.js functionality for Supabase

import { supabase } from './config';
import { logger } from '../utils/logger';

// Unified collection/table name
const USERS_TABLE = 'users';

/**
 * Register a new broker user
 * Mirrors Firebase registerUser function
 */
export const registerUser = async (username, email, password, refId = null) => {
  logger.auth(`[Supabase] Attempting registration for user`, { username, email: '[EMAIL_PROVIDED]', refId });
  
  // Debug: Direct API test
  try {
    const testUrl = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`;
    logger.auth(`[Supabase] Debug - Testing direct API health check at: ${testUrl}`);
    
    const healthResponse = await fetch(testUrl, {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    logger.auth(`[Supabase] Debug - Health check response:`, {
      status: healthResponse.status,
      statusText: healthResponse.statusText,
      ok: healthResponse.ok
    });
  } catch (fetchError) {
    logger.error(`[Supabase] Debug - Direct API test failed:`, {
      message: fetchError.message,
      type: fetchError.constructor.name
    });
  }
  
  try {
    // Debug: Log what we're about to send
    logger.auth(`[Supabase] Debug - Request details:`, {
      email: email,
      passwordLength: password?.length,
      supabaseClientExists: !!supabase,
      authClientExists: !!supabase.auth,
      signUpMethodExists: typeof supabase.auth.signUp
    });

    // Debug: Test if we can reach Supabase at all
    logger.auth(`[Supabase] Debug - Testing basic connection...`);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      logger.auth(`[Supabase] Debug - Session check:`, { 
        hasSession: !!sessionData?.session,
        sessionError: sessionError?.message || 'none'
      });
    } catch (connError) {
      logger.error(`[Supabase] Debug - Connection test failed:`, connError);
    }
    
    // Debug: Log the exact Supabase URL and key being used
    logger.auth(`[Supabase] Debug - Configuration:`, {
      url: import.meta.env.VITE_SUPABASE_URL,
      keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 30) + '...',
      keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length,
      provider: import.meta.env.VITE_DATABASE_PROVIDER
    });
    
    // Step 1: Sign up with Supabase Auth (simplified for debugging)
    logger.auth(`[Supabase] Debug - Calling signUp with email: ${email}`);
    
    let authData, authError;
    try {
      // Try with additional options for better error debugging
      const signUpOptions = {
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: username,
            display_name: username
          }
        }
      };
      
      logger.auth(`[Supabase] Debug - Signup options:`, {
        email,
        hasPassword: !!password,
        passwordLength: password?.length,
        optionsProvided: true,
        redirectTo: window.location.origin
      });
      
      const response = await supabase.auth.signUp(signUpOptions);
      authData = response.data;
      authError = response.error;
      
      // Additional debug for response
      logger.auth(`[Supabase] Debug - Raw response received:`, {
        hasData: !!response.data,
        hasError: !!response.error,
        dataKeys: response.data ? Object.keys(response.data) : [],
        errorType: response.error ? response.error.constructor.name : 'none'
      });
    } catch (signupException) {
      logger.error(`[Supabase] Debug - SignUp threw exception:`, {
        message: signupException.message,
        stack: signupException.stack,
        name: signupException.name,
        fullError: JSON.stringify(signupException, null, 2)
      });
      throw signupException;
    }
    
    logger.auth(`[Supabase] Debug - Signup response:`, { 
      hasData: !!authData,
      hasUser: !!authData?.user,
      userId: authData?.user?.id,
      hasError: !!authError,
      errorMessage: authError?.message,
      errorStatus: authError?.status,
      errorCode: authError?.code
    });

    if (authError) throw authError;
    
    const user = authData.user;
    logger.auth(`[Supabase] Auth user created successfully`, { uid: user.id });
    
    // Step 2: Create user profile in database
    const userData = {
      id: user.id, // In Supabase, we use 'id' instead of 'uid'
      username,
      email,
      display_name: username,
      created_time: new Date().toISOString(),
      user_type: 'broker',
      referral_count: 0,
      referred_by: refId
    };

    const { error: dbError } = await supabase
      .from(USERS_TABLE)
      .insert([userData]);

    if (dbError) {
      logger.error('[Supabase] Error creating user profile', dbError);
      // Rollback: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(user.id);
      throw dbError;
    }

    logger.auth(`[Supabase] User profile created successfully`);
    
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
 * Check if user exists in the users table
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
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    const exists = !!data;
    logger.auth(`[Supabase] User ${exists ? 'found' : 'NOT found'}`);
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
    // First get current payment methods
    const { data: userData, error: fetchError } = await supabase
      .from(USERS_TABLE)
      .select('payment_methods')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const currentMethods = userData.payment_methods || [];
    const methodWithId = { ...newMethod, id: `pm_${Date.now()}` };
    const updatedMethods = [...currentMethods, methodWithId];
    
    // Update with new array
    const { error: updateError } = await supabase
      .from(USERS_TABLE)
      .update({ payment_methods: updatedMethods })
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
    // First get current payment methods
    const { data: userData, error: fetchError } = await supabase
      .from(USERS_TABLE)
      .select('payment_methods')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const currentMethods = userData.payment_methods || [];
    const updatedMethods = currentMethods.filter(method => method.id !== methodToDelete.id);
    
    // Update with filtered array
    const { error: updateError } = await supabase
      .from(USERS_TABLE)
      .update({ payment_methods: updatedMethods })
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