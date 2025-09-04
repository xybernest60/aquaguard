// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "aquaguard-dashboard-jxli8",
  appId: "1:344349159900:web:4a5468e993672bda941f19",
  storageBucket: "aquaguard-dashboard-jxli8.firebasestorage.app",
  apiKey: "AIzaSyAbO_3_Pepfuz_ecU7nC1rAhm6Ik9yVF9g",
  authDomain: "aquaguard-dashboard-jxli8.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "344349159900",
  databaseURL: "https://aquaguard-dashboard-jxli8-default-rtdb.firebaseio.com"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);
const storage = getStorage(app);

export { app, database, storage };
