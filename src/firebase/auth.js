import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  verifyBeforeUpdateEmail,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { logger } from "../utils/logger";

// Unified collection name
const USERS_COLLECTION = "users";

// Register a new broker user into the unified 'users' collection
export const registerUser = async (username, email, password, refId = null) => {
  logger.auth(`Attempting registration for user`, { username, email: email ? '[EMAIL_PROVIDED]' : null, refId });
  try {
    logger.auth(`Calling createUserWithEmailAndPassword...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    logger.auth(`Auth user created successfully`, { uid: '[UID_REDACTED]' });
    
    logger.auth(`Updating profile...`);
    await updateProfile(user, {
      displayName: username
    });
    logger.auth(`Profile updated successfully`);
    
    logger.auth(`Sending verification email...`);
    await sendEmailVerification(user);
    logger.auth(`Verification email sent successfully`);
    
    const userData = {
        uid: user.uid,
        username,
        email,
        display_name: username,
        created_time: serverTimestamp(),
        user_type: "broker", // Mark as broker user
        referralCount: 0,
    };

    if (refId) {
        userData.referredBy = refId; 
    }

    // Use the unified USERS_COLLECTION
    logger.auth(`Writing to Firestore collection: ${USERS_COLLECTION}`);
    await setDoc(doc(db, USERS_COLLECTION, user.uid), userData);
    logger.auth(`Firestore document written successfully`);
    
    return { user };
  } catch (error) {
    logger.error("Registration error", error);
    return { error };
  }
};

// Sign in existing user (email or username), verifying they exist in the 'users' collection
export const loginUser = async (identifier, password) => {
  logger.auth(`Attempting login with identifier type: ${/\S+@\S+\.\S+/.test(identifier) ? 'email' : 'username'}`);
  let emailToUse = identifier;
  const isEmailFormat = /\S+@\S+\.\S+/.test(identifier);

  try {
    if (!isEmailFormat) {
      logger.auth(`Querying ${USERS_COLLECTION} for username...`);
      // Use the unified USERS_COLLECTION
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("username", "==", identifier));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        logger.auth(`No user found in ${USERS_COLLECTION} with provided username`);
        return { error: { message: "Usuario no encontrado." } };
      }
      
      if (querySnapshot.size > 1) {
        logger.warn(`Multiple users found with same username`);
        return { error: { message: "Error: Múltiples usuarios encontrados con ese nombre de usuario." } };
      }
      
      const userDoc = querySnapshot.docs[0].data();
      emailToUse = userDoc.email;
      logger.auth(`Found email for username`);
      if (!emailToUse) {
           logger.error(`User document missing email field`);
           return { error: { message: "Error interno: No se pudo encontrar el email del usuario." } };
      }
    } else {
      logger.auth(`Identifier is email format, proceeding directly`);
    }

    logger.auth(`Calling signInWithEmailAndPassword...`);
    const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
    const user = userCredential.user;
    logger.auth(`Authentication successful`);
    
    // Verification step: Check if user document exists in the 'users' collection
    logger.auth(`Verifying user existence in Firestore...`);
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      // If user authenticated but their document is MISSING in 'users', sign out & deny
      logger.warn(`Firestore document DOES NOT EXIST for authenticated user. Signing out.`);
      await signOut(auth);
      return { error: { message: "Autenticación fallida: Datos de usuario no encontrados en el sistema." } };
    }
    
    // Document exists, user is valid for this system
    logger.auth(`Firestore document found. Login successful.`);
    return { user };

  } catch (error) {
    logger.error("Login process error", error);
    let friendlyMessage = "Error al iniciar sesión. Verifique sus credenciales.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        friendlyMessage = "Email o contraseña incorrectos.";
    } else if (error.message) {
        // friendlyMessage = error.message;
    }
    return { error: { message: friendlyMessage } };
  }
};

// Sign out user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    logger.auth("User signed out successfully");
    return { success: true };
  } catch (error) {
    logger.error("Logout error", error);
    return { error };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    logger.auth("Password reset email sent");
    return { success: true };
  } catch (error) {
    logger.error("Password reset error", error);
    return { error };
  }
};

// Verify code function (simulated, as Firebase handles this directly via email links)
export const verifyCode = async (code) => {
  // In a real implementation, this would validate a verification code
  // For Firebase, email verification happens through a link sent to email
  logger.auth("Verification code processed", { codeProvided: !!code });
  return { success: true };
};

// Get current user
export const getCurrentUser = () => {
  const user = auth.currentUser;
  if (user) {
    logger.auth("Current user retrieved");
  }
  return user;
};

// Check if user exists in the 'users' collection
export const isBrokerUser = async (userId) => {
  logger.auth(`Checking if user exists in ${USERS_COLLECTION}...`);
  if (!userId) {
    logger.auth(`No userId provided for existence check`);
    return false;
  }
  
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    logger.auth(`Reading Firestore document from ${USERS_COLLECTION}...`);
    const docSnap = await getDoc(docRef);
    const exists = docSnap.exists();
    logger.auth(`Document ${exists ? 'found' : 'NOT found'}`);
    return exists; 
  } catch (error) {
    logger.error(`Error reading Firestore for user existence check`, error);
    throw error; 
  }
};

// Set up auth state listener, verifying user exists in the 'users' collection
export const onAuthStateChange = (callback) => {
  logger.auth("Setting up auth state listener...");
  return onAuthStateChanged(auth, async (user) => {
    logger.auth("Auth state change triggered", { userPresent: !!user });
    if (user) {
      try {
        // Use the modified check: does the user document exist in 'users'?
        logger.auth(`User authenticated. Checking user existence in ${USERS_COLLECTION}...`);
        const userExists = await isBrokerUser(user.uid);
        logger.auth(`User existence check result: ${userExists}`);
        
        if (!userExists) {
          // If user authenticated but no document in 'users', sign out
          logger.warn(`User authenticated but NO document found in ${USERS_COLLECTION}. Signing out...`);
          await signOut(auth);
          callback(null);
        } else {
          callback(user);
        }
      } catch (error) {
        logger.error("Error in auth state change handler", error);
        await signOut(auth);
        callback(null);
      }
    } else {
      logger.auth("No authenticated user after state change");
      callback(null);
    }
  });
};

export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent successfully.");
    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: error.message };
  }
};

export const verifyEmailUpdate = async (user, newEmail) => {
  try {
    await verifyBeforeUpdateEmail(user, newEmail);
    console.log("Verification email sent to new address.");
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    // ... existing code ...
  } catch (error) {
    // ... existing code ...
  }
};

export const reauthenticateUser = async (user, password) => {
  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    console.log("User re-authenticated successfully.");
    return { success: true };
  } catch (error) {
    console.error("Error re-authenticating user:", error);
    return { success: false, error: error.message };
  }
};

export const addPaymentMethod = async (userId, newMethod) => {
  const userDocRef = doc(db, "users", userId);
  try {
    const methodWithId = { ...newMethod, id: `pm_${Date.now()}` };
    await updateDoc(userDocRef, {
      paymentMethods: arrayUnion(methodWithId)
    });
    console.log("Método de pago agregado exitosamente");
    return { success: true, newMethod: methodWithId };
  } catch (error) {
    console.error("Error al agregar método de pago:", error);
    return { success: false, error: error.message };
  }
};

export const deletePaymentMethod = async (userId, methodToDelete) => {
    const userDocRef = doc(db, "users", userId);
    try {
        await updateDoc(userDocRef, {
            paymentMethods: arrayRemove(methodToDelete)
        });
        console.log("Método de pago eliminado exitosamente");
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar método de pago:", error);
        return { success: false, error: error.message };
    }
};