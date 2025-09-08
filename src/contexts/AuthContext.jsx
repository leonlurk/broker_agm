import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const previousUserRef = useRef(null);

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
      
      // Check if user actually changed (not just token refresh)
      const previousUser = previousUserRef.current;
      const userChanged = (!previousUser && user) || 
                         (previousUser && !user) || 
                         (previousUser?.id !== user?.id) ||
                         (previousUser?.email !== user?.email);
      
      if (!userChanged && previousUser && user) {
        logger.auth("User hasn't changed (token refresh), keeping existing userData");
        setCurrentUser(user); // Update user object but keep userData
        previousUserRef.current = user; // Update ref
        return;
      }
      
      logger.auth("User changed, reloading userData");
      setCurrentUser(user);
      previousUserRef.current = user; // Update ref
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
            // Con "Confirm email" activado, si hay error obteniendo perfil pero el usuario 
            // está autenticado, significa que el email YA está verificado
            logger.warn("Error fetching user profile, but user is authenticated - email must be verified", error);
            
            setUserData({ 
              id: userId, 
              email: user.email,
              username: user.email?.split('@')[0] || 'user',
              created_at: new Date().toISOString(),
              kyc_status: 'not_submitted',
              kyc_verified: false,
              email_verified: true  // Si está autenticado con "Confirm email" activado, está verificado
            });
          } else {
            // Si no hay perfil pero el usuario está autenticado, crear datos mínimos
            // Con "Confirm email" activado, solo usuarios verificados pueden autenticarse
            logger.warn("User profile not found, but user is authenticated - creating minimal verified data");
            
            setUserData({ 
              id: userId, 
              email: user.email,
              username: user.email?.split('@')[0] || 'user',
              created_at: new Date().toISOString(),
              kyc_status: 'not_submitted',
              kyc_verified: false,
              email_verified: true  // Si está autenticado con "Confirm email" activado, está verificado
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