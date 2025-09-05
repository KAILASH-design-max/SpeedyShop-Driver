
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initializeFirebase() {
    const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
    if (!firebaseConfigString) {
        throw new Error("Firebase configuration environment variable is not set. Please check your project setup.");
    }
    const firebaseConfig = JSON.parse(firebaseConfigString);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}

if (typeof window !== 'undefined' && !getApps().length) {
    initializeFirebase();
} else if (typeof window !== 'undefined') {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}


export { app, auth, db, storage };
