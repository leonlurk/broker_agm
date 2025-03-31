import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, getCurrentUser, isBrokerUser } from '../firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isBroker, setIsBroker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if user is a broker user
        const brokerStatus = await isBrokerUser(user.uid);
        setIsBroker(brokerStatus);
      } else {
        setIsBroker(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isBrokerUser: isBroker,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};