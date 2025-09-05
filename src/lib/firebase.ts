
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCN1zAZsbo6_HDcFNVRvXekmY_JdTF4M3U",
  authDomain: "ai-app-bb63d.firebaseapp.com",
  databaseURL: "https://ai-app-bb63d-default-rtdb.firebaseio.com",
  projectId: "ai-app-bb63d",
  storageBucket: "ai-app-bb63d.firebasestorage.app",
  messagingSenderId: "511120628966",
  appId: "1:511120628966:web:d4a1504e1252f74bcfaf27",
  measurementId: "G-8QVLZG13R3"
};


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (getApps().length) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

export { app, auth, db, storage };
