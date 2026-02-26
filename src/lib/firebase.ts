import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function readFirebaseConfig(): FirebaseWebConfig {
  return {
    apiKey: "AIzaSyAODQJBkOwFGYUZok3T5FR1j8-alvd3AAQ",
    authDomain: "dexavision-5579d.firebaseapp.com",
    projectId: "dexavision-5579d",
    storageBucket: "dexavision-5579d.firebasestorage.app",
    messagingSenderId: "398918164586",
    appId: "1:398918164586:web:45169f6c8b7888dc03ea13",
    // apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    // authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    // storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    // messagingSenderId:
    //   process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    // appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
}

export function isFirebaseConfigured(): boolean {
  const cfg = readFirebaseConfig();
  return Object.values(cfg).every(Boolean);
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase no está configurado. Define NEXT_PUBLIC_FIREBASE_* en tu .env.local",
    );
  }
  return getApps().length ? getApp() : initializeApp(readFirebaseConfig());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
