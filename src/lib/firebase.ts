
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// This placeholder will be replaced by the webpack DefinePlugin at build time.
// Declaring it here prevents TypeScript errors.
declare const __FIREBASE_WEBAPP_CONFIG__: string;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== "undefined" && !getApps().length) {
    const firebaseConfigString = __FIREBASE_WEBAPP_CONFIG__;
    if (!firebaseConfigString) {
        throw new Error("Firebase config not found. Build process may have failed.");
    }
    
    const firebaseConfig = JSON.parse(firebaseConfigString);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} else if (typeof window !== "undefined") {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}

// @ts-ignore - This is safe because the code above ensures initialization on the client.
export { app, auth, db, storage };
