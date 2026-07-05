"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { upsertUserProfile } from "@/lib/firebase/auth";
import { listenToUser } from "@/lib/firebase/firestore";
import type { AppUser } from "@/types";

type AuthContextValue = {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAppUser(null);
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await upsertUserProfile(user);
      const unsubscribe = listenToUser(user.uid, (profile) => {
        setAppUser(profile);
        setLoading(false);
      });

      return unsubscribe;
    });
  }, []);

  const value = useMemo(() => ({ firebaseUser, appUser, loading }), [firebaseUser, appUser, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function useRequireAuth() {
  const authState = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authState.loading && !authState.firebaseUser) router.replace("/login");
  }, [authState.firebaseUser, authState.loading, router]);

  return authState;
}
