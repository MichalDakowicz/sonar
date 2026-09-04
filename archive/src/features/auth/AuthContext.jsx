import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth, googleProvider, db } from "../../lib/firebase";
import { ref, get, set, update } from "firebase/database";
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Check if user has a profile
          const profileRef = ref(db, `users/${currentUser.uid}/profile`);
          const snapshot = await get(profileRef);
          
          if (!snapshot.exists()) {
            // Generate random username
            let isUnique = false;
            let generatedUsername = "";
            let attempts = 0;

            while (!isUnique && attempts < 5) {
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                generatedUsername = `user${randomSuffix}`;
                const usernameRef = ref(db, `usernames/${generatedUsername}`);
                const usernameSnapshot = await get(usernameRef);
                if (!usernameSnapshot.exists()) {
                    isUnique = true;
                }
                attempts++;
            }

            if (isUnique) {
                const newProfile = {
                    username: generatedUsername,
                    displayName: currentUser.displayName || "New User",
                    pfp: currentUser.photoURL || ""
                };
                
                // Save profile, reserve username, and add to search index
                const updates = {};
                updates[`users/${currentUser.uid}/profile`] = newProfile;
                updates[`usernames/${generatedUsername}`] = currentUser.uid;
                updates[`userSearchIndex/${currentUser.uid}`] = newProfile;

                await update(ref(db), updates);
            }
          }
        } catch (error) {
          console.error("Error creating user profile:", error);
        }
      }
      
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
