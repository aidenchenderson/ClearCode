import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

function mapFirebaseUser(u: FirebaseUser | null): AuthUser | null {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email ?? null,
    name: u.displayName ?? null,
    picture: u.photoURL ?? null,
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const auth = getAuthInstance();
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(mapFirebaseUser(firebaseUser));
        setIsLoading(false);
      });
      return () => unsubscribe();
    } catch {
      setIsLoading(false);
    }
  }, []);

  const login = async () => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    const auth = getAuthInstance();
    await firebaseSignOut(auth);
  };

  /** Get Firebase ID token for API calls. Pass true to force refresh (e.g. after 401). */
  const getAccessToken = async (forceRefresh = false): Promise<string | undefined> => {
    const auth = getAuthInstance();
    const u = auth.currentUser;
    if (!u) return undefined;
    return u.getIdToken(forceRefresh);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    getAccessToken,
  };
};
