import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== "undefined") {
    // This code only runs on the client
    const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG;
    if (!firebaseConfigString) {
        throw new Error("Firebase config not found in environment variables");
    }
    
    const firebaseConfig = JSON.parse(firebaseConfigString);

    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}

export { app, auth, db, storage };
