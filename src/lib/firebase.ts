
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqjiZNGw_CLzHFVGPcqWygSi7Z8_TxYzk",
  authDomain: "ai-app-bb63d.firebaseapp.com",
  projectId: "ai-app-bb63d",
  storageBucket: "ai-app-bb63d.appspot.com",
  messagingSenderId: "511120628966",
  // appId is not strictly necessary for basic client-side Auth and Firestore.
  // If you encounter issues or use other Firebase services like Analytics, 
  // you might need to add it from your Firebase project settings.
  // appId: "1:511120628966:web:YOUR_APP_ID_HASH_HERE" 
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
