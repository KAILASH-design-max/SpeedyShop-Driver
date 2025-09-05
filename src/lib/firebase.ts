
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// The build system provides the configuration as a single JSON string.
// We parse it here to initialize Firebase.
const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// We only want to initialize firebase on the client-side
if (typeof window !== 'undefined' && !getApps().length) {
  if (!firebaseConfigString) {
    throw new Error("Firebase configuration environment variable is not set. Please check your project setup.");
  }
  const firebaseConfig = JSON.parse(firebaseConfigString);
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

// @ts-ignore - This is safe because the code above ensures initialization on the client.
export { app, auth, db, storage };
