import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_pZ1OBdxoXNkrG5owGg-DLVwjTikRkE8",
  authDomain: "sonar-tracker.firebaseapp.com",
  databaseURL: "https://sonar-tracker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sonar-tracker",
  storageBucket: "sonar-tracker.firebasestorage.app",
  messagingSenderId: "997107035921",
  appId: "1:997107035921:web:212c139eb4835b8463a6b0",
  measurementId: "G-J3Q9R6VT2K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
export default app;
