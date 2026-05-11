import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB3rY8ScMp23Y77iDNI60xMCjHvr3pQ2LE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "the-chewth.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "the-chewth",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "the-chewth.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "373967148429",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:373967148429:web:025be6952c4e0a8773d9c4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-69CZRZYXGZ",
};

export const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

export const firebaseApp = firebaseReady ? initializeApp(firebaseConfig) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;

export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.setCustomParameters({ prompt: "select_account" });
