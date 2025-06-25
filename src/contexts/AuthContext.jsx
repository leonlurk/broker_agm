import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange } from '../firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { logger } from '../utils/logger';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logger.auth("Setting up onAuthStateChange listener...");
    const unsubscribe = onAuthStateChange(async (user) => {
      logger.auth("onAuthStateChange callback received", { userPresent: !!user });
      setCurrentUser(user);
      setUserData(null);
      
      if (user) {
        logger.auth("User is authenticated and exists in users collection. Fetching Firestore data...");
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const fetchedData = userDocSnap.data();
            logger.auth("Firestore data fetched successfully");
            setUserData(fetchedData);
          } else {
            logger.error("Firestore document unexpectedly missing for authenticated user. Forcing sign out.");
            await auth.signOut();
            setCurrentUser(null);
          }
        } catch (error) {
          logger.error("Error fetching Firestore user data", error);
          logger.warn("Signing out user due to Firestore fetch error.");
          await auth.signOut();
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
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};