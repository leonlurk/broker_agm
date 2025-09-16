/**
 * Database Adapter Layer
 * This adapter allows switching between Firebase and Supabase
 * based on environment configuration, enabling gradual migration
 */

import { logger } from '../utils/logger';

// Import both Firebase and Supabase implementations
import * as supabaseAuth from '../supabase/auth';
import { supabase, supabaseDb } from '../supabase/config';
import * as supabaseStorage from '../supabase/storage';

// Get the database provider from environment
const DATABASE_PROVIDER = import.meta.env.VITE_DATABASE_PROVIDER || 'firebase';

logger.info(`[Database Adapter] Using provider: ${DATABASE_PROVIDER}`);

/**
 * AUTH ADAPTER
 * Provides unified interface for authentication
 */
export const AuthAdapter = {
  // Get the current provider
  getProvider: () => DATABASE_PROVIDER,

  // Check if using Firebase
  isFirebase: () => DATABASE_PROVIDER === 'firebase',

  // Check if using Supabase
  isSupabase: () => DATABASE_PROVIDER === 'supabase',

  // Register user
  registerUser: async (username, email, password, refId = null, additionalData = {}) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.registerUser(username, email, password, refId, additionalData);
    }
    return firebaseAuth.registerUser(username, email, password, refId, additionalData);
  },

  // Login user
  loginUser: async (identifier, password) => {
    // Force Supabase for login regardless of provider selection
    // The project requirement is to avoid Firebase for login
    return supabaseAuth.loginUser(identifier, password);
  },

  // Logout user
  logoutUser: async () => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.logoutUser();
    }
    return firebaseAuth.logoutUser();
  },

  // Reset password
  resetPassword: async (email) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.resetPassword(email);
    }
    return firebaseAuth.resetPassword(email);
  },

  // Send password reset
  sendPasswordReset: async (email) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.sendPasswordReset(email);
    }
    return firebaseAuth.sendPasswordReset(email);
  },

  // Verify email update
  verifyEmailUpdate: async (user, newEmail) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.verifyEmailUpdate(user, newEmail);
    }
    return firebaseAuth.verifyEmailUpdate(user, newEmail);
  },

  // Re-authenticate user
  reauthenticateUser: async (user, password) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.reauthenticateUser(user, password);
    }
    return firebaseAuth.reauthenticateUser(user, password);
  },

  // Get current user
  getCurrentUser: async () => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.getCurrentUser();
    }
    return firebaseAuth.getCurrentUser();
  },

  // Check if user is broker
  isBrokerUser: async (userId) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.isBrokerUser(userId);
    }
    return firebaseAuth.isBrokerUser(userId);
  },

  // Auth state change listener
  onAuthStateChange: (callback) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.onAuthStateChange(callback);
    }
    return firebaseAuth.onAuthStateChange(callback);
  },

  // Add payment method
  addPaymentMethod: async (userId, newMethod) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.addPaymentMethod(userId, newMethod);
    }
    return firebaseAuth.addPaymentMethod(userId, newMethod);
  },

  // Delete payment method
  deletePaymentMethod: async (userId, methodToDelete) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.deletePaymentMethod(userId, methodToDelete);
    }
    return firebaseAuth.deletePaymentMethod(userId, methodToDelete);
  },

  // Verify code
  verifyCode: async (code) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseAuth.verifyCode(code);
    }
    return firebaseAuth.verifyCode(code);
  },

  // Verify current password
  verifyPassword: async (email, password) => {
    if (DATABASE_PROVIDER === 'supabase') {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Firebase implementation
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
      try {
        const auth = getAuth();
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Update password
  updatePassword: async (email, newPassword) => {
    if (DATABASE_PROVIDER === 'supabase') {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return { success: true, user: data.user };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Firebase implementation
      const { getAuth, updatePassword: firebaseUpdatePassword } = await import('firebase/auth');
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          return { success: false, error: 'No hay usuario autenticado' };
        }
        
        await firebaseUpdatePassword(user, newPassword);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }
};

/**
 * DATABASE ADAPTER
 * Provides unified interface for database operations
 */
export const DatabaseAdapter = {
  // Get provider
  getProvider: () => DATABASE_PROVIDER,

  // User operations
  users: {
    // Get user by ID
    getById: async (userId) => {
      if (DATABASE_PROVIDER === 'supabase') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          logger.error('[DB Adapter] Error getting user', error);
          return { data: null, error };
        }
        
        // Log KYC fields specifically
        logger.info('[DB Adapter] User data retrieved:', {
          userId,
          hasData: !!data,
          kyc_status: data?.kyc_status,
          kyc_verified: data?.kyc_verified,
          email: data?.email
        });
        
        return { data, error: null };
      } else {
        // Firebase implementation
        const { doc, getDoc } = await import('firebase/firestore');
        try {
          const docRef = doc(firebaseDb, 'users', userId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            return { data: { id: userId, ...docSnap.data() }, error: null };
          }
          return { data: null, error: { message: 'User not found' } };
        } catch (error) {
          return { data: null, error };
        }
      }
    },

    // Get user by email
    getByEmail: async (email) => {
      if (DATABASE_PROVIDER === 'supabase') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();
        
        if (error) {
          logger.error('[DB Adapter] Error getting user by email', error);
          return { data: null, error };
        }
        
        return { data, error: null };
      } else {
        // Firebase implementation
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        try {
          const q = query(collection(firebaseDb, 'users'), where('email', '==', email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { data: { id: doc.id, ...doc.data() }, error: null };
          }
          return { data: null, error: { message: 'User not found' } };
        } catch (error) {
          return { data: null, error };
        }
      }
    },

    // Create user
    create: async (userData) => {
      if (DATABASE_PROVIDER === 'supabase') {
        const { data, error } = await supabase
          .from('profiles')
          .insert([userData])
          .select()
          .single();
        return { data, error };
      } else {
        // Firebase implementation
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        try {
          const userWithTimestamp = {
            ...userData,
            created_time: serverTimestamp()
          };
          await setDoc(doc(firebaseDb, 'users', userData.uid || userData.id), userWithTimestamp);
          return { data: userWithTimestamp, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    },

    // Update user
    update: async (userId, updates) => {
      if (DATABASE_PROVIDER === 'supabase') {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();
        return { data, error };
      } else {
        // Firebase implementation
        const { doc, updateDoc } = await import('firebase/firestore');
        try {
          const docRef = doc(firebaseDb, 'users', userId);
          await updateDoc(docRef, updates);
          return { data: updates, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    },

    // Query users
    query: async (filters = {}) => {
      if (DATABASE_PROVIDER === 'supabase') {
        let query = supabase.from('profiles').select('*'); // Using existing profiles table
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        
        const { data, error } = await query;
        return { data, error };
      } else {
        // Firebase implementation
        const { collection, query: fbQuery, where, getDocs } = await import('firebase/firestore');
        try {
          let q = collection(firebaseDb, 'users');
          
          // Apply filters
          const constraints = Object.entries(filters).map(([key, value]) => 
            where(key, '==', value)
          );
          
          if (constraints.length > 0) {
            q = fbQuery(q, ...constraints);
          }
          
          const querySnapshot = await getDocs(q);
          const data = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    }
  },

  // Trading accounts operations
  tradingAccounts: {
    // Get all accounts for user
    getByUserId: async (userId) => {
      if (DATABASE_PROVIDER === 'supabase') {
        const { data, error } = await supabase
          .from('broker_accounts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        // Map broker_accounts fields to expected frontend format
        const mappedData = data?.map(account => ({
          id: account.id,
          user_id: account.user_id,
          account_number: account.login?.toString() || account.account_number,
          account_name: account.name || `Account ${account.login}`,
          // Convert database account_type values back to frontend format
          // Database has: 'demo', 'standard', 'premium'
          // Frontend expects: 'DEMO' or 'Real'
          account_type: account.account_type === 'demo' ? 'DEMO' : 'Real',
          account_type_selection: account.group_name || 'Market Direct',
          leverage: account.leverage?.toString() || '100',
          balance: account.balance || 0,
          equity: account.equity || account.balance || 0,
          margin: account.margin || 0,
          free_margin: account.free_margin || account.balance || 0,
          // MT5 Credentials
          mt5_password: account.mt5_password || null,
          mt5_investor_password: account.mt5_investor_password || null,
          created_at: account.created_at,
          updated_at: account.updated_at,
          status: account.status || 'active'
        })) || [];
        
        return { data: mappedData, error };
      } else {
        // Firebase implementation
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        try {
          const q = query(collection(firebaseDb, 'trading_accounts'), where('userId', '==', userId));
          const querySnapshot = await getDocs(q);
          const data = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    },

    // Create account
    create: async (accountData) => {
      if (DATABASE_PROVIDER === 'supabase') {
        // Map frontend fields to broker_accounts table structure
        const mappedData = {
          user_id: accountData.user_id,
          // Map account_name to name (the actual column in broker_accounts)
          name: accountData.account_name || accountData.name,
          // Map account_number to both login and account_number
          login: accountData.account_number || accountData.login,
          account_number: accountData.account_number || accountData.login,
          // Map account type - convert frontend values to valid database values
          // Frontend sends 'Real' or 'DEMO', database expects 'standard', 'premium', or 'demo'
          account_type: (accountData.account_type || '').toLowerCase() === 'demo' 
            ? 'demo' 
            : (accountData.account_type_selection || '').toLowerCase() === 'premium' 
              ? 'premium' 
              : 'standard',
          // Map group_name instead of non-existent account_type_selection
          group_name: accountData.account_type_selection || accountData.group_name || 'Market Direct',
          leverage: parseInt(accountData.leverage) || 100,
          balance: parseFloat(accountData.balance) || 0,
          equity: parseFloat(accountData.equity || accountData.balance) || 0,
          margin: parseFloat(accountData.margin) || 0,
          free_margin: parseFloat(accountData.free_margin || accountData.balance) || 0,
          // Additional fields that might be needed
          email: accountData.email,
          status: 'active',
          currency: accountData.currency || 'USD'
        };
        
        // Remove undefined/null fields
        Object.keys(mappedData).forEach(key => {
          if (mappedData[key] === undefined || mappedData[key] === null) {
            delete mappedData[key];
          }
        });
        
        const { data, error } = await supabase
          .from('broker_accounts')
          .insert([mappedData])
          .select()
          .single();
        
        // If successful, map back to frontend expected format
        if (data && !error) {
          const formattedData = {
            ...data,
            account_name: data.name,
            account_number: data.login?.toString() || data.account_number,
            account_type_selection: data.group_name
          };
          return { data: formattedData, error };
        }
        
        return { data, error };
      } else {
        // Firebase implementation
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        try {
          const dataWithTimestamp = {
            ...accountData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          const docRef = await addDoc(collection(firebaseDb, 'trading_accounts'), dataWithTimestamp);
          return { data: { id: docRef.id, ...dataWithTimestamp }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    },

    // Update account
    update: async (accountId, updates) => {
      if (DATABASE_PROVIDER === 'supabase') {
        const { data, error } = await supabase
          .from('broker_accounts')
          .update(updates)
          .eq('id', accountId)
          .select()
          .single();
        return { data, error };
      } else {
        // Firebase implementation
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        try {
          const docRef = doc(firebaseDb, 'trading_accounts', accountId);
          const updatesWithTimestamp = {
            ...updates,
            updatedAt: serverTimestamp()
          };
          await updateDoc(docRef, updatesWithTimestamp);
          return { data: updatesWithTimestamp, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    }
  },

  // Transactions operations
  transactions: {
    // Create transaction
    create: async (transactionData) => {
      if (DATABASE_PROVIDER === 'supabase') {
        const { data, error } = await supabase
          .from('transactions')
          .insert([transactionData])
          .select()
          .single();
        return { data, error };
      } else {
        // Firebase implementation
        const { collection, addDoc, Timestamp } = await import('firebase/firestore');
        try {
          const dataWithTimestamp = {
            ...transactionData,
            createdAt: Timestamp.now()
          };
          const docRef = await addDoc(collection(firebaseDb, 'transactions'), dataWithTimestamp);
          return { data: { id: docRef.id, ...dataWithTimestamp }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    },

    // Get transactions for user
    getByUserId: async (userId, limit = 50) => {
      if (DATABASE_PROVIDER === 'supabase') {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        return { data, error };
      } else {
        // Firebase implementation
        const { collection, query, where, orderBy, limit: fbLimit, getDocs } = await import('firebase/firestore');
        try {
          const q = query(
            collection(firebaseDb, 'transactions'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            fbLimit(limit)
          );
          const querySnapshot = await getDocs(q);
          const data = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    }
  }
};

/**
 * STORAGE ADAPTER
 * Provides unified interface for storage operations
 */
export const StorageAdapter = {
  // Get provider
  getProvider: () => DATABASE_PROVIDER,

  // Upload profile picture
  uploadProfilePicture: async (userId, file, fileName = null) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseStorage.uploadProfilePicture(userId, file, fileName);
    } else {
      // Firebase implementation
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      try {
        const timestamp = Date.now();
        const finalFileName = fileName || `${timestamp}_${file.name}`;
        const storageRef = ref(firebaseStorage, `profile_pictures/${userId}/${finalFileName}`);
        
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        return {
          success: true,
          path: snapshot.ref.fullPath,
          url,
          error: null
        };
      } catch (error) {
        logger.error('[Storage Adapter] Firebase upload error', error);
        return {
          success: false,
          path: null,
          url: null,
          error: error.message
        };
      }
    }
  },

  // Delete profile picture
  deleteProfilePicture: async (userId, fileName) => {
    if (DATABASE_PROVIDER === 'supabase') {
      return supabaseStorage.deleteProfilePicture(userId, fileName);
    } else {
      // Firebase implementation
      const { ref, deleteObject } = await import('firebase/storage');
      try {
        const storageRef = ref(firebaseStorage, `profile_pictures/${userId}/${fileName}`);
        await deleteObject(storageRef);
        return { success: true, error: null };
      } catch (error) {
        logger.error('[Storage Adapter] Firebase delete error', error);
        return { success: false, error: error.message };
      }
    }
  },

  // Get download URL
  getDownloadURL: async (path) => {
    if (DATABASE_PROVIDER === 'supabase') {
      const { data: { publicUrl } } = supabase.storage
        .from(supabaseStorage.PROFILE_PICTURES_BUCKET)
        .getPublicUrl(path);
      return { url: publicUrl, error: null };
    } else {
      // Firebase implementation
      const { ref, getDownloadURL } = await import('firebase/storage');
      try {
        const storageRef = ref(firebaseStorage, path);
        const url = await getDownloadURL(storageRef);
        return { url, error: null };
      } catch (error) {
        return { url: null, error: error.message };
      }
    }
  }
};

// Export the provider for debugging
export const getDatabaseProvider = () => DATABASE_PROVIDER;

// Export everything as default
export default {
  AuthAdapter,
  DatabaseAdapter,
  StorageAdapter,
  getDatabaseProvider
};
