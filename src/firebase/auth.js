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
  import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
  
  // Register a new user
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
      
      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username,
        email,
        display_name: username,
        created_time: serverTimestamp(),
      });
      
      return { user };
    } catch (error) {
      return { error };
    }
  };
  
  // Sign in existing user
  export const loginUser = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user };
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
  
  // Set up auth state listener
  export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback);
  };