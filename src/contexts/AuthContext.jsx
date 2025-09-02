import { createContext, useContext, useState, useEffect } from 'react';
import { AuthAdapter, DatabaseAdapter } from '../services/database.adapter';
import { logger } from '../utils/logger';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (user) => {
    if (!user) {
      setUserData(null);
      return;
    }
    const userId = user.uid || user.id;
    const { data, error } = await DatabaseAdapter.users.getById(userId);
    if (data && !error) {
      // Log KYC status for debugging
      logger.info("[AUTH] fetchUserData - KYC status:", {
        kyc_status: data.kyc_status || 'not_submitted',
        kyc_verified: data.kyc_verified || false
      });
      
      // También cargar los métodos de pago desde la tabla dedicada
      if (AuthAdapter.isSupabase()) {
        try {
          const { getPaymentMethods } = await import('../supabase/auth');
          const { data: paymentMethods } = await getPaymentMethods(userId);
          data.paymentMethods = paymentMethods || [];
        } catch (error) {
          logger.error("[AUTH] Error loading payment methods", error);
          data.paymentMethods = [];
        }
      }
      
      // Ensure KYC fields are always present
      data.kyc_status = data.kyc_status || 'not_submitted';
      data.kyc_verified = data.kyc_verified || false;
      
      setUserData(data);
    } else {
      // Set minimal data with KYC fields
      logger.warn("[AUTH] fetchUserData - Using minimal data");
      setUserData({
        id: userId,
        email: user.email,
        username: user.email?.split('@')[0] || 'user',
        created_at: new Date().toISOString(),
        kyc_status: 'not_submitted',
        kyc_verified: false
      });
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      logger.info("[AUTH] Refreshing user data...");
      await fetchUserData(currentUser);
      logger.info("[AUTH] User data refreshed.");
    }
  };

  useEffect(() => {
    logger.auth("Setting up onAuthStateChange listener...");
    
    // Add a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        logger.warn("Auth check timeout - forcing loading to false");
        setLoading(false);
      }
    }, 5000); // 5 second timeout
    
    const unsubscribe = AuthAdapter.onAuthStateChange(async (user) => {
      logger.auth("onAuthStateChange callback received", { userPresent: !!user });
      setCurrentUser(user);
      setUserData(null);
      
      if (user) {
        logger.auth("User is authenticated. Fetching data...");
        try {
          const userId = user.uid || user.id;
          const { data, error } = await DatabaseAdapter.users.getById(userId);
          
          if (data && !error) {
            logger.auth("User data fetched successfully");
            // Log KYC status for debugging
            logger.info("[AUTH] User KYC status:", {
              kyc_status: data.kyc_status || 'not_submitted',
              kyc_verified: data.kyc_verified || false
            });
            
            // También cargar los métodos de pago desde la tabla dedicada
            if (AuthAdapter.isSupabase()) {
              try {
                const { getPaymentMethods } = await import('../supabase/auth');
                const { data: paymentMethods } = await getPaymentMethods(userId);
                data.paymentMethods = paymentMethods || [];
              } catch (error) {
                logger.error("[AUTH] Error loading payment methods", error);
                data.paymentMethods = [];
              }
            }
            
            // Ensure KYC fields are always present
            data.kyc_status = data.kyc_status || 'not_submitted';
            data.kyc_verified = data.kyc_verified || false;
            
            setUserData(data);
          } else if (error) {
            // Don't sign out on error, just use minimal data
            logger.warn("Error fetching user profile, using minimal data", error);
            setUserData({ 
              id: userId, 
              email: user.email,
              username: user.email?.split('@')[0] || 'user',
              created_at: new Date().toISOString(),
              kyc_status: 'not_submitted',  // Always include KYC status
              kyc_verified: false
            });
          } else {
            // User not in database yet, create minimal data
            logger.warn("User profile not found, creating minimal data");
            setUserData({ 
              id: userId, 
              email: user.email,
              username: user.email?.split('@')[0] || 'user',
              created_at: new Date().toISOString(),
              kyc_status: 'not_submitted',  // Always include KYC status
              kyc_verified: false
            });
          }
        } catch (error) {
          logger.error("Error fetching user data", error);
          // Don't sign out, just use minimal data
          const userId = user.uid || user.id;
          setUserData({ 
            id: userId, 
            email: user.email,
            username: user.email?.split('@')[0] || 'user',
            created_at: new Date().toISOString()
          });
        }
      } else {
        logger.auth("No authenticated user after onAuthStateChange callback.");
      }
      
      logger.auth("Setting loading to false.");
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    return () => {
      logger.auth("Unsubscribing from onAuthStateChange.");
      clearTimeout(loadingTimeout);
      unsubscribe();
    }
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    refreshUserData,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};