import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, isBrokerUser } from '../firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

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
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      setIsBroker(false);
      setUserData(null);
      
      if (user) {
        try {
          const userDocRef = doc(db, 'users_broker', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
            setIsBroker(true);
          } else {
            console.warn("User logged in but not found in broker collection, signing out might have failed.");
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          setCurrentUser(null);
        }
      } 
      
      setLoading(false);
    });

    return unsubscribe;
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