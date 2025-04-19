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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthContext] Setting up onAuthStateChange listener...");
    const unsubscribe = onAuthStateChange(async (user) => {
      console.log("[AuthContext] onAuthStateChange callback received user:", user ? user.uid : null);
      setCurrentUser(user);
      setUserData(null);
      
      if (user) {
        console.log(`[AuthContext] User ${user.uid} is authenticated and exists in users collection. Fetching Firestore data...`);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const fetchedData = userDocSnap.data();
            console.log(`[AuthContext] Firestore data fetched for ${user.uid}:`, fetchedData);
            setUserData(fetchedData);
          } else {
            console.error(`[AuthContext] Firestore document unexpectedly missing for authenticated user ${user.uid}. Forcing sign out.`);
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
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};