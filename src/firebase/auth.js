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

// Unified collection name
const USERS_COLLECTION = "users";

// Register a new broker user into the unified 'users' collection
export const registerUser = async (username, email, password, refId = null) => {
  console.log(`[registerUser] Attempting registration for email: ${email}, username: ${username}, refId: ${refId}`);
  try {
    console.log(`[registerUser] Calling createUserWithEmailAndPassword for ${email}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`[registerUser] Auth user created successfully: UID=${user.uid}`);
    
    console.log(`[registerUser] Updating profile for UID=${user.uid} with displayName=${username}...`);
    await updateProfile(user, {
      displayName: username
    });
    console.log(`[registerUser] Profile updated.`);
    
    console.log(`[registerUser] Sending verification email to ${email}...`);
    await sendEmailVerification(user);
    console.log(`[registerUser] Verification email sent.`);
    
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
    console.log(`[registerUser] Preparing to write to Firestore (${USERS_COLLECTION}/${user.uid}):`, JSON.stringify(userData, null, 2));
    await setDoc(doc(db, USERS_COLLECTION, user.uid), userData);
    console.log(`[registerUser] Firestore document written successfully for UID=${user.uid} in ${USERS_COLLECTION}.`);
    
    return { user };
  } catch (error) {
    console.error("[registerUser] Main registration error:", error);
    return { error };
  }
};

// Sign in existing user (email or username), verifying they are a broker user in the 'users' collection
export const loginUser = async (identifier, password) => {
  console.log(`[loginUser] Attempting login with identifier: ${identifier}`);
  let emailToUse = identifier;
  const isEmailFormat = /\S+@\S+\.\S+/.test(identifier);

  try {
    if (!isEmailFormat) {
      console.log(`[loginUser] Identifier '${identifier}' is not email format. Querying ${USERS_COLLECTION} for username...`);
      // Use the unified USERS_COLLECTION
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("username", "==", identifier));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log(`[loginUser] No user found in ${USERS_COLLECTION} with username: ${identifier}`);
        return { error: { message: "Usuario no encontrado." } };
      }
      
      if (querySnapshot.size > 1) {
        console.warn(`[loginUser] Multiple users found with username: ${identifier}`);
        return { error: { message: "Error: Múltiples usuarios encontrados con ese nombre de usuario." } };
      }
      
      const userDoc = querySnapshot.docs[0].data();
      emailToUse = userDoc.email;
      console.log(`[loginUser] Found email '${emailToUse}' for username '${identifier}'.`);
      if (!emailToUse) {
           console.error(`[loginUser] User document for username ${identifier} is missing email field.`);
           return { error: { message: "Error interno: No se pudo encontrar el email del usuario." } };
      }
    } else {
      console.log(`[loginUser] Identifier '${identifier}' is email format. Proceeding directly.`);
    }

    console.log(`[loginUser] Calling signInWithEmailAndPassword with email: ${emailToUse}...`);
    const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
    const user = userCredential.user;
    console.log(`[loginUser] Auth successful: UID=${user.uid}`);
    
    // Use the unified USERS_COLLECTION for verification
    console.log(`[loginUser] Verifying user type in Firestore (${USERS_COLLECTION}/${user.uid})...`);
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      console.warn(`[loginUser] Firestore document DOES NOT EXIST in ${USERS_COLLECTION} for authenticated user UID=${user.uid}. Signing out.`);
      await signOut(auth);
      return { error: { message: "Autenticación fallida: Datos de usuario no encontrados en el sistema correcto." } };
    }

    const firestoreUserData = userDocSnap.data();
    console.log(`[loginUser] Firestore document found for UID=${user.uid}. User type: ${firestoreUserData.user_type}`);
    if (firestoreUserData.user_type !== 'broker') {
      console.warn(`[loginUser] User UID=${user.uid} is NOT type 'broker' (type: ${firestoreUserData.user_type}). Signing out.`);
       await signOut(auth);
       return { error: { message: "Esta cuenta no es de tipo broker." } };
    }
    
    console.log(`[loginUser] User UID=${user.uid} verified as broker. Login successful.`);
    return { user };

  } catch (error) {
    console.error("[loginUser] Login process error:", error);
    let friendlyMessage = "Error al iniciar sesión. Verifique sus credenciales.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        friendlyMessage = "Email/Usuario o contraseña incorrectos.";
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

// Check if current user is a broker user in the 'users' collection
export const isBrokerUser = async (userId) => {
  console.log(`[isBrokerUser] Checking if UID=${userId} is a broker user...`);
  if (!userId) {
    console.log(`[isBrokerUser] No userId provided.`);
    return false;
  }
  
  try {
    // Use the unified USERS_COLLECTION
    const docRef = doc(db, USERS_COLLECTION, userId);
    console.log(`[isBrokerUser] Reading Firestore document: ${USERS_COLLECTION}/${userId}...`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const isBrokerType = data.user_type === 'broker';
      console.log(`[isBrokerUser] Document found for UID=${userId}. Data:`, data, `Is broker type: ${isBrokerType}`);
      return isBrokerType;
    } else {
      console.log(`[isBrokerUser] Document NOT found in ${USERS_COLLECTION} for UID=${userId}.`);
      return false;
    }
  } catch (error) {
    console.error(`[isBrokerUser] Error reading Firestore for UID=${userId}:`, error);
    throw error; 
  }
};

// Set up auth state listener, verifying against the 'users' collection
export const onAuthStateChange = (callback) => {
  console.log("[onAuthStateChange] Setting up listener...");
  return onAuthStateChanged(auth, async (user) => {
    console.log("[onAuthStateChange] Listener triggered. Auth user:", user ? `UID=${user.uid}, Email=${user.email}` : null);
    if (user) {
      try {
        console.log(`[onAuthStateChange] User authenticated (UID=${user.uid}). Checking broker status via isBrokerUser...`);
        const isBroker = await isBrokerUser(user.uid); // isBrokerUser now checks 'users' collection
        console.log(`[onAuthStateChange] isBrokerUser check returned: ${isBroker} for UID=${user.uid}`);
        
        if (!isBroker) {
          console.warn(`[onAuthStateChange] User UID=${user.uid} is NOT a verified broker user (based on check in ${USERS_COLLECTION}). Signing out...`);
          await signOut(auth);
          console.log(`[onAuthStateChange] Sign out complete for non-broker UID=${user.uid}. Calling callback with null.`);
          callback(null);
          return;
        }
        console.log(`[onAuthStateChange] User UID=${user.uid} IS a verified broker user. Calling callback with user object.`);
        callback(user);
      } catch (error) {
        console.error(`[onAuthStateChange] Error during broker verification for UID=${user.uid}:`, error);
        console.warn(`[onAuthStateChange] Signing out user UID=${user.uid} due to verification error.`);
        await signOut(auth);
        callback(null);
      }
    } else {
      console.log("[onAuthStateChange] No authenticated user. Calling callback with null.");
      callback(null);
    }
  });
};