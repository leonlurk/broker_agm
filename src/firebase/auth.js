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
export const registerUser = async (username, email, password, refId = null) => {
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
    
    // Prepare base user data
    const userData = {
        uid: user.uid,
        username,
        email,
        display_name: username,
        created_time: serverTimestamp(),
        user_type: "broker",
        referralCount: 0,
    };

    // If there is a referrer ID, add referredBy field
    if (refId) {
        userData.referredBy = refId; 
    }

    // Store the new user's data in Firestore
    await setDoc(doc(db, BROKER_USERS_COLLECTION, user.uid), userData);
    
    // La lógica de incremento se moverá a una Cloud Function
    
    return { user };
  } catch (error) {
    // Handle Auth errors (e.g., email already in use)
    console.error("Registration main error:", error);
    return { error };
  }
};

// Sign in existing user with email or username, verifying they are a broker user
export const loginUser = async (identifier, password) => {
  let emailToUse = identifier;
  const isEmailFormat = /\S+@\S+\.\S+/.test(identifier);

  try {
    // If identifier is not an email, assume it's a username and find the email
    if (!isEmailFormat) {
      const usersRef = collection(db, BROKER_USERS_COLLECTION);
      const q = query(usersRef, where("username", "==", identifier));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { error: { message: "Usuario no encontrado." } };
      }
      
      if (querySnapshot.size > 1) {
        // This shouldn't happen if usernames are unique, but handle it just in case
        console.warn(`Multiple users found with username: ${identifier}`);
        return { error: { message: "Error: Múltiples usuarios encontrados con ese nombre de usuario." } };
      }
      
      // Get the email from the found user document
      const userDoc = querySnapshot.docs[0].data();
      emailToUse = userDoc.email;
      if (!emailToUse) {
           console.error(`User document for username ${identifier} is missing email field.`);
           return { error: { message: "Error interno: No se pudo encontrar el email del usuario." } };
      }
    }

    // Proceed with sign-in using the determined email
    const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
    const user = userCredential.user;
    
    // IMPORTANT: Verify the logged-in user (by UID) exists in the broker collection
    const brokerUserDoc = await getDoc(doc(db, BROKER_USERS_COLLECTION, user.uid));
    
    if (!brokerUserDoc.exists()) {
      // If user authenticated but isn't in our broker list, sign out & deny access
      await signOut(auth);
      return { 
        error: { 
          message: "Autenticación exitosa pero la cuenta no pertenece al sistema de broker." 
        } 
      };
    }
    
    // User is authenticated and verified as a broker user
    return { user };

  } catch (error) {
    // Handle Firebase Auth errors (wrong password, user not found by email, etc.)
    console.error("Login process error:", error);
    let friendlyMessage = "Error al iniciar sesión. Verifique sus credenciales.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        friendlyMessage = "Email/Usuario o contraseña incorrectos.";
    } else if (error.message) {
        // Use specific error messages if available and reasonable
        // friendlyMessage = error.message; 
    }
    return { error: { message: friendlyMessage } };
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