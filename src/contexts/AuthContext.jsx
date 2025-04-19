import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange } from '../firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isBroker, setIsBroker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthContext] Setting up onAuthStateChange listener...");
    const unsubscribe = onAuthStateChange(async (user) => {
      console.log("[AuthContext] onAuthStateChange callback received user:", user ? user.uid : null);
      setCurrentUser(user);
      setIsBroker(false);
      setUserData(null);
      
      if (user) {
        console.log(`[AuthContext] User ${user.uid} passed initial auth check. Fetching Firestore data...`);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const fetchedData = userDocSnap.data();
            console.log(`[AuthContext] Firestore data fetched for ${user.uid}:`, fetchedData);
            setUserData(fetchedData);
            if (fetchedData.user_type === 'broker') {
              console.log(`[AuthContext] User ${user.uid} confirmed as broker type.`);
              setIsBroker(true);
            } else {
              console.warn(`[AuthContext] User ${user.uid} is authenticated but Firestore data type is NOT 'broker' (type: ${fetchedData.user_type}). Forcing sign out.`);
              await auth.signOut();
              setCurrentUser(null);
              setIsBroker(false);
              setUserData(null);
            }
          } else {
            console.error(`[AuthContext] Firestore document missing for authenticated user ${user.uid}. This should have been caught by onAuthStateChange in auth.js. Forcing sign out.`);
            await auth.signOut();
            setCurrentUser(null);
          }
        } catch (error) {
          console.error(`[AuthContext] Error fetching Firestore user data for ${user.uid}:`, error);
          console.warn(`[AuthContext] Signing out user ${user.uid} due to Firestore fetch error.`);
          await auth.signOut();
          setCurrentUser(null);
        }
      } else {
        console.log("[AuthContext] No authenticated user after onAuthStateChange callback.");
      }
      
      console.log("[AuthContext] Setting loading to false.");
      setLoading(false);
    });

    return () => {
      console.log("[AuthContext] Unsubscribing from onAuthStateChange.");
      unsubscribe();
    }
  }, []);

  const value = {
    currentUser,
    userData,
    isAuthenticated: !!currentUser && isBroker,
    isBrokerUser: isBroker,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};