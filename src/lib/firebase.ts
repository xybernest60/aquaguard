// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAOZzINEElOX59LsL5wUqhipaM31V5JY_Q",
  authDomain: "aquaguard-89393.firebaseapp.com",
  databaseURL: "https://aquaguard-89393-default-rtdb.firebaseio.com",
  projectId: "aquaguard-89393",
  storageBucket: "aquaguard-89393.appspot.com",
  messagingSenderId: "773519327910",
  appId: "1:773519327910:web:9c8d5d4f1a2b3c4d5e6f7a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
