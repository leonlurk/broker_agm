import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";

// Collection name for broker users
const BROKER_USERS_COLLECTION = "users_broker";

// Register a new broker user
export const registerUser = async (username, email, password) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with the username
    await updateProfile(user, {
      displayName: username
    });
    
    // Send email verification
    await sendEmailVerification(user);
    
    // Store additional user data in Firestore in the broker collection
    await setDoc(doc(db, BROKER_USERS_COLLECTION, user.uid), {
      uid: user.uid,
      username,
      email,
      display_name: username,
      created_time: serverTimestamp(),
      user_type: "broker",
    });
    
    return { user };
  } catch (error) {
    return { error };
  }
};

// Sign in existing user with verification for broker users only
export const loginUser = async (email, password) => {
  try {
    // First sign in to get the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if this user exists in the broker users collection
    const brokerUserDoc = await getDoc(doc(db, BROKER_USERS_COLLECTION, user.uid));
    
    if (!brokerUserDoc.exists()) {
      // If user doesn't exist in broker collection, sign them out and return error
      await signOut(auth);
      return { 
        error: { 
          message: "Esta cuenta no está registrada en el sistema de broker. Por favor regístrese primero." 
        } 
      };
    }
    
    return { user };
  } catch (error) {
    return { error };
  }
};

// Sign out user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { error };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { error };
  }
};

// Verify code function (simulated, as Firebase handles this directly via email links)
export const verifyCode = async (code) => {
  // In a real implementation, this would validate a verification code
  // For Firebase, email verification happens through a link sent to email
  console.log("Verification code:", code);
  return { success: true };
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Check if current user is a broker user
export const isBrokerUser = async (userId) => {
  if (!userId) return false;
  
  try {
    const docRef = doc(db, BROKER_USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking broker user:", error);
    return false;
  }
};

// Set up auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Check if user is in broker collection
        const isBroker = await isBrokerUser(user.uid);
        
        if (!isBroker) {
          // If not a broker user, sign out
          await signOut(auth);
          callback(null);
          return;
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      }
    }
    
    callback(user);
  });
};