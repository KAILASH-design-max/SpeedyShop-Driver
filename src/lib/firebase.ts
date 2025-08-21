
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase on the client side
const app = typeof window !== 'undefined' ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null;

const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const storage = app ? getStorage(app) : null;

// Throw an error if the services are used on the server where they are not available.
if (typeof window === 'undefined') {
  if (auth || db || storage) {
    // This is a safeguard, but the logic above should prevent this.
  }
} else {
  if (!auth || !db || !storage) {
    // If we are on the client and these are null, something is wrong with initialization.
    console.error("Firebase services could not be initialized on the client.");
  }
}

// Export the initialized services. Ensure components handle the possibility of them being null,
// although the client-side check should prevent issues in the browser.
export { app, auth, db, storage };
