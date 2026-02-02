import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
       GoogleAuth.initialize();
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log("Starting Native Google Sign-In...");
        const googleUser = await GoogleAuth.signIn();
        console.log("Google Sign-In Success:", JSON.stringify(googleUser));
        
        const idToken = googleUser.authentication?.idToken;
        if (!idToken) {
             throw new Error("No ID token received from Google");
        }

        const credential = GoogleAuthProvider.credential(idToken);
        console.log("Signing in with Credential...");
        await signInWithCredential(auth, credential);
        console.log("Firebase Sign-In Complete");
      } catch (error) {
        console.error("Native Google Sign-In failed", error);
        alert(`Login Failed: ${error.message || JSON.stringify(error)}`);
      }
    } else {
      await signInWithPopup(auth, googleProvider);
    }
  };
  const logout = async () => {
    await signOut(auth);
    if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
