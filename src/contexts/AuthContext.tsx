import {
  GoogleAuthProvider,
  User,
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  firebaseConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const firebaseConfigured = useMemo(() => isFirebaseConfigured(), []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsub();
  }, [firebaseConfigured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseConfigured,
      async getIdToken() {
        if (!firebaseConfigured) return null;
        const current = getFirebaseAuth().currentUser;
        if (!current) return null;
        return await getIdToken(current);
      },
      async signInWithEmailPassword(email: string, password: string) {
        if (!firebaseConfigured) {
          throw new Error(
            "Firebase no está configurado. Revisa tus variables NEXT_PUBLIC_FIREBASE_*.",
          );
        }
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      async signInWithGoogle() {
        if (!firebaseConfigured) {
          throw new Error(
            "Firebase no está configurado. Revisa tus variables NEXT_PUBLIC_FIREBASE_*.",
          );
        }
        const provider = new GoogleAuthProvider();
        await signInWithPopup(getFirebaseAuth(), provider);
      },
      async signOut() {
        if (!firebaseConfigured) return;
        await firebaseSignOut(getFirebaseAuth());
      },
    }),
    [firebaseConfigured, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider />");
  return ctx;
}
