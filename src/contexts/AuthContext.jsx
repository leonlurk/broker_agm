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
      setUserData(data);
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
    const unsubscribe = AuthAdapter.onAuthStateChange(async (user) => {
      logger.auth("onAuthStateChange callback received", { userPresent: !!user });
      setCurrentUser(user);
      setUserData(null);
      
      if (user) {
        logger.auth("User is authenticated and exists in users collection. Fetching data...");
        try {
          const userId = user.uid || user.id;
          const { data, error } = await DatabaseAdapter.users.getById(userId);
          
          if (data && !error) {
            logger.auth("User data fetched successfully");
            setUserData(data);
          } else {
            logger.error("User document unexpectedly missing for authenticated user. Forcing sign out.");
            await AuthAdapter.logoutUser();
            setCurrentUser(null);
          }
        } catch (error) {
          logger.error("Error fetching user data", error);
          logger.warn("Signing out user due to data fetch error.");
          await AuthAdapter.logoutUser();
          setCurrentUser(null);
        }
      } else {
        logger.auth("No authenticated user after onAuthStateChange callback.");
      }
      
      logger.auth("Setting loading to false.");
      setLoading(false);
    });

    return () => {
      logger.auth("Unsubscribing from onAuthStateChange.");
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