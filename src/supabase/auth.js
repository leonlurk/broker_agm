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
export const registerUser = async (username, email, password, refId = null, additionalData = {}) => {
  logger.auth(`[Supabase] Attempting registration for user`, { username, email: '[REDACTED]', refId });
  
  try {
    // Temporarily skip username check to avoid hanging - we'll check after signup
    logger.auth(`[Supabase] Proceeding with registration (will check username during profile creation)`);
    
    // Generate verification token for email confirmation
    const verificationToken = crypto.randomUUID();
    logger.auth(`[Supabase] Generated verification token for email confirmation`);
    
    // Step 1: Sign up with Supabase Auth
    logger.auth(`[Supabase] Calling signUp with email: ${email}`);
    
    const signUpOptions = {
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: username, // Use full_name which the trigger expects
          verification_token: verificationToken,
          email_verified: false
        },
        emailRedirectTo: `${window.location.origin}/verify-email?token=${verificationToken}`,
        // Importante: NO auto-confirmar el email
        shouldAutoConfirm: false
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
    
    // NOTA: No intentamos auto-confirmar el email con admin API porque:
    // 1. Requiere permisos de service_role que el cliente no tiene (error 403)
    // 2. Supabase maneja la verificación automáticamente con el token
    // 3. El usuario recibe el email de verificación de Supabase
    
    // El código anterior causaba error 403 "User not allowed"
    // Se comentó para evitar logs de error innecesarios
    
    // Step 2: Create profile manually (trigger doesn't work for collaborators)
    // First try to create profile using RPC function
    try {
      logger.auth('[Supabase] Creating user profile...');
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile_after_signup', {
        user_id: user.id,
        user_email: email,
        user_username: username,
        user_full_name: username,
        user_verification_token: verificationToken,
        user_email_verified: false
      });
      
      if (rpcError) {
        logger.warn('[Supabase] RPC profile creation failed:', rpcError);
        
        // Fallback: Direct insert with verification token and additional profile data
        const userData = {
          id: user.id,
          email: email,
          username: username || user.id,
          full_name: username || email.split('@')[0],
          // Include additional profile fields from Register component
          nombre: additionalData.nombre || null,
          apellido: additionalData.apellido || null,
          pais: additionalData.pais || null,
          phonecode: additionalData.phonecode || null,
          phonenumber: additionalData.phonenumber || null,
          role: 'user',
          kyc_status: 'not_started',
          status: 'active',
          phone: null,
          country: null,
          email_verified: false,
          verification_token: verificationToken,  // IMPORTANTE: Guardar el token
          verification_sent_at: new Date().toISOString(),
          metadata: {
            user_type: 'broker',
            referral_count: 0,
            referred_by: refId,
            display_name: username
          }
        };
        
        const { error: insertError } = await supabase
          .from(USERS_TABLE)
          .insert(userData);
        
        if (insertError && insertError.code !== '23505') { // 23505 is duplicate key
          logger.error('[Supabase] Direct profile insert failed:', insertError);
          // Try update as last resort
          const { error: updateError } = await supabase
            .from(USERS_TABLE)
            .update(userData)
            .eq('id', user.id);
          
          if (updateError) {
            logger.error('[Supabase] Profile update also failed:', updateError);
          } else {
            logger.auth('[Supabase] Profile updated successfully');
          }
        } else {
          logger.auth('[Supabase] Profile created via direct insert');
        }
      } else {
        logger.auth('[Supabase] Profile created via RPC:', rpcResult);
        
        // Update profile with verification token AND additional profile data
        const profileUpdates = {
          verification_token: verificationToken,
          email_verified: false,
          verification_sent_at: new Date().toISOString(),
          // Include additional profile fields from Register component
          ...(additionalData.nombre && { nombre: additionalData.nombre }),
          ...(additionalData.apellido && { apellido: additionalData.apellido }),
          ...(additionalData.pais && { pais: additionalData.pais }),
          ...(additionalData.phonecode && { phonecode: additionalData.phonecode }),
          ...(additionalData.phonenumber && { phonenumber: additionalData.phonenumber })
        };
        
        const { error: profileUpdateError } = await supabase
          .from(USERS_TABLE)
          .update(profileUpdates)
          .eq('id', user.id);
          
        if (profileUpdateError) {
          logger.warn('[Supabase] Could not update profile data:', profileUpdateError);
        } else {
          logger.auth('[Supabase] Profile data and verification token saved successfully');
        }
      }
    } catch (profileError) {
      logger.error('[Supabase] Exception creating profile:', profileError);
      // Continue anyway - user is created
      // The user can still login and update their profile later
      // Note: Don't throw error here, user registration was successful
    }

    logger.auth(`[Supabase] User profile updated successfully`);
    
    // Step 3: Send verification email using Brevo
    try {
      logger.auth('[Supabase] Sending verification email via Brevo');
      const emailServiceProxy = (await import('../services/emailServiceProxy')).default;
      
      await emailServiceProxy.sendVerificationEmail(
        { email: email, name: username },
        verificationToken
      );
      
      logger.auth('[Supabase] Verification email sent successfully');
    } catch (emailError) {
      logger.error('[Supabase] Error sending verification email:', emailError);
      // Don't fail registration if email fails - user can request resend
    }
    
    // Return user with verification status
    return { 
      user: {
        ...user,
        email_verified: false,
        verification_token: verificationToken,
        needs_email_verification: true
      }, 
      error: null 
    };
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
        friendlyMessage = 'Email o contraseña incorrectos.';
      } else if (authError.message.includes('Email not confirmed')) {
        // ✅ PRESERVE the original error message for email verification
        friendlyMessage = authError.message;
      }
      
      return { user: null, error: { message: friendlyMessage } };
    }

    const user = authData.user;
    logger.auth(`[Supabase] Authentication successful`);
    
    // Check if email is verified in our custom field
    // Only check for users that have the email_verified field (new users)
    try {
      const { data: profile } = await supabase
        .from(USERS_TABLE)
        .select('email_verified, created_at')
        .eq('id', user.id)
        .single();
      
      // Check email verification status but allow login for all users
      // We'll track verification status in the user object
      if (profile) {
        // Add email_verified status to the user object
        user.email_verified = profile.email_verified !== false; // true if null or true, false if false
        
        // Check if this is a new user (created after we implemented email verification)
        const createdDate = new Date(profile.created_at);
        const verificationStartDate = new Date('2025-08-28'); // Today's date when we implemented this
        
        if (profile.email_verified === false && createdDate >= verificationStartDate) {
          // This is a new unverified user
          user.email_verified = false;
          logger.auth(`[Supabase] New user email not verified, allowing limited access`);
        } else if (profile.email_verified === false && createdDate < verificationStartDate) {
          // Old user with email_verified = false, treat as verified
          user.email_verified = true;
          logger.warn(`[Supabase] Legacy user with unverified email, treating as verified:`, user.id);
        }
      } else {
        // If no profile, assume verified (for safety)
        user.email_verified = true;
      }
    } catch (profileError) {
      logger.warn('[Supabase] Could not check email verification status:', profileError);
      // Continue login if we can't check (to avoid blocking users)
    }
    
    logger.auth(`[Supabase] Login successful`);
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
    logger.auth('[Supabase] Starting logout process');
    
    // Try local signout first (doesn't require special permissions)
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      // Log the error but don't throw - we still want to clear local data
      logger.warn('[Supabase] Logout warning:', error);
    }
    
    // Clear any cached data regardless of signOut result
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-ukngiipxprielwdfuvln-auth-token');
    sessionStorage.clear();
    
    logger.auth('[Supabase] User signed out successfully');
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase] Logout error', error);
    
    // Force clear session even on error
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      logger.error('[Supabase] Force clear storage error', e);
    }
    
    // Return success even if there was an error
    // The important thing is clearing local state
    return { success: true, error: null };
  }
};

/**
 * Reset password
 * Mirrors Firebase resetPassword function
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-reset`
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

/**
 * Verify email with token
 * Custom implementation for email verification with Brevo
 */
export const verifyEmailWithToken = async (token) => {
  try {
    logger.auth('[Supabase] Verifying email with token:', token);
    
    // Find user with this token (don't use .single() to avoid 406 error)
    const { data: profiles, error: findError } = await supabase
      .from(USERS_TABLE)
      .select('id, email, username, email_verified')
      .eq('verification_token', token);
    
    if (findError) {
      logger.error('[Supabase] Error finding user with token:', findError);
      return { 
        success: false, 
        error: 'Token de verificación inválido o expirado' 
      };
    }
    
    if (!profiles || profiles.length === 0) {
      logger.error('[Supabase] No user found with token:', token);
      
      // For debugging, let's also try to use the existing verify_user_email RPC function
      // which might handle token mismatches better
      try {
        logger.info('[Supabase] Trying existing verify_user_email RPC as fallback');
        const { data: rpcResult, error: rpcError } = await supabase.rpc('verify_user_email', {
          token: token
        });
        
        if (!rpcError && rpcResult && rpcResult.success) {
          logger.auth('[Supabase] Email verified via RPC fallback for user:', rpcResult.user_id);
          return { 
            success: true, 
            user: {
              id: rpcResult.user_id,
              email: rpcResult.email
            },
            message: 'Email verificado exitosamente'
          };
        }
      } catch (rpcException) {
        logger.warn('[Supabase] RPC fallback also failed:', rpcException.message);
      }
      
      return { 
        success: false, 
        error: 'Token de verificación no encontrado. Es posible que haya expirado o ya se haya usado.' 
      };
    }
    
    const profile = profiles[0]; // Get the first (should be only) result
    
    // Check if already verified
    if (profile.email_verified === true) {
      logger.auth('[Supabase] Email already verified for user:', profile.id);
      return { 
        success: true, 
        user: profile,
        message: 'Email ya verificado anteriormente' 
      };
    }
    
    // Use RPC instead of direct UPDATE to avoid CORS/RLS issues
    const { data: updateResult, error: updateError } = await supabase.rpc('verify_user_email', {
      token: token
    });
    
    let finalError = updateError; // Use a mutable variable for error tracking
    
    // If RPC fails, fallback to direct update
    if (updateError) {
      logger.warn('[Supabase] RPC verify_user_email failed, trying direct update:', updateError.message);
      const { error: directUpdateError } = await supabase
        .from(USERS_TABLE)
        .update({
          email_verified: true,
          verification_token: null,
          verified_at: new Date().toISOString()
        })
        .eq('id', profile.id);
      
      if (directUpdateError) {
        logger.error('[Supabase] Both RPC and direct update failed:', directUpdateError);
        finalError = directUpdateError; // Keep the direct update error for downstream handling
      } else {
        logger.auth('[Supabase] Direct update succeeded as fallback');
        finalError = null; // Clear error since direct update succeeded
      }
    } else if (updateResult && !updateResult.success) {
      logger.error('[Supabase] RPC returned error:', updateResult.error);
      return {
        success: false,
        error: updateResult.error
      };
    } else {
      logger.auth('[Supabase] RPC verify_user_email succeeded');
    }
    
    if (finalError) {
      logger.error('[Supabase] Error updating verification status:', finalError);
      return { 
        success: false, 
        error: 'Error al actualizar el estado de verificación' 
      };
    }
    
    // Ahora también actualizar auth.users usando nuestra función RPC simple
    try {
      const { data: authResult, error: authError } = await supabase.rpc('confirm_email_in_auth_users', {
        user_email: profile.email
      });
      
      if (authError) {
        logger.warn('[Supabase] Could not confirm email in auth.users:', authError.message);
      } else if (authResult && authResult.success) {
        logger.auth('[Supabase] Email confirmed in both profiles and auth.users');
      } else {
        logger.warn('[Supabase] Auth confirmation failed:', authResult?.message);
      }
    } catch (authError) {
      logger.warn('[Supabase] Exception confirming email in auth.users:', authError.message);
    }
    
    logger.auth('[Supabase] Email verified successfully for user:', profile.id);
    return { 
      success: true, 
      user: profile 
    };
  } catch (error) {
    logger.error('[Supabase] Exception in verifyEmailWithToken:', error);
    return { 
      success: false, 
      error: 'Error inesperado al verificar email' 
    };
  }
};

// Rate limiting storage for email verification resends
const resendRateLimits = new Map();

/**
 * Resend verification email - Now uses backend API with rate limiting
 */
export const resendVerificationEmail = async (email) => {
  try {
    // Check rate limiting (1 resend every 60 seconds)
    const now = Date.now();
    const lastResend = resendRateLimits.get(email);
    
    if (lastResend) {
      const timeSinceLastResend = now - lastResend;
      const waitTime = 60000; // 60 seconds
      
      if (timeSinceLastResend < waitTime) {
        const remainingSeconds = Math.ceil((waitTime - timeSinceLastResend) / 1000);
        logger.warn(`[Supabase] Rate limit hit for email: ${email}. Wait ${remainingSeconds} seconds`);
        return { 
          success: false, 
          error: `Por favor espera ${remainingSeconds} segundos antes de reenviar el email`,
          rateLimited: true,
          remainingSeconds
        };
      }
    }
    
    logger.auth('[Supabase] Resending verification email via backend API:', email);
    
    // Get user data to generate new verification token
    // Usar la tabla profiles en lugar de users
    const { data: userData, error: userError } = await supabase
      .from(USERS_TABLE) // Usar la constante USERS_TABLE que es 'profiles'
      .select('id, username, email')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      logger.error('[Supabase] User not found for email:', email);
      return { 
        success: false, 
        error: 'Usuario no encontrado' 
      };
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomUUID();
    
    // Use RPC to update verification token to avoid CORS/RLS issues
    const { data: rpcResult, error: rpcError } = await supabase.rpc('request_email_verification', {
      user_email: email
    });
    
    let finalToken = verificationToken;
    
    if (rpcError) {
      logger.warn('[Supabase] RPC request_email_verification failed, trying direct update:', rpcError.message);
      
      // Fallback to direct update
      const { error: updateError } = await supabase
        .from(USERS_TABLE)
        .update({ 
          verification_token: verificationToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);
      
      if (updateError) {
        logger.error('[Supabase] Error updating verification token:', updateError);
        return { 
          success: false, 
          error: 'Error al actualizar token de verificación' 
        };
      }
      
      logger.auth('[Supabase] Direct update succeeded as fallback');
    } else if (rpcResult && rpcResult.success) {
      // Use the token from RPC result if available
      finalToken = rpcResult.token || verificationToken;
      logger.auth('[Supabase] RPC request_email_verification succeeded');
    } else {
      logger.error('[Supabase] RPC returned error:', rpcResult?.error);
      return { 
        success: false, 
        error: rpcResult?.error || 'Error al generar token de verificación' 
      };
    }
    
    // Use the same endpoint as registration (through emailServiceProxy)
    const API_URL = import.meta.env.VITE_CRYPTO_API_URL || 'https://whapy.apekapital.com:446/api';
    const verificationUrl = `${window.location.origin}/verify-email?token=${finalToken}`;
    
    const response = await fetch(`${API_URL}/email/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email: userData.email,
        userName: userData.username || userData.email.split('@')[0],
        verificationToken: verificationToken,
        verificationUrl: verificationUrl
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      // Update rate limit timestamp on successful send
      resendRateLimits.set(email, now);
      
      // Clean up old entries after 5 minutes
      setTimeout(() => {
        const fiveMinutesAgo = Date.now() - 300000;
        for (const [key, value] of resendRateLimits.entries()) {
          if (value < fiveMinutesAgo) {
            resendRateLimits.delete(key);
          }
        }
      }, 300000);
      
      logger.auth('[Supabase] Verification email resent successfully via backend');
      return { success: true };
    } else {
      logger.error('[Supabase] Backend error resending verification:', result.message);
      return { 
        success: false, 
        error: result.message || 'Error al reenviar email de verificación' 
      };
    }
  } catch (error) {
    logger.error('[Supabase] Error resending verification email:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
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
  verifyCode,
  verifyEmailWithToken,
  resendVerificationEmail
};