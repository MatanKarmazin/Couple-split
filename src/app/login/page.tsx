"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginPanel } from "@/components/auth/login-panel";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && firebaseUser) router.replace("/app");
  }, [firebaseUser, loading, router]);

  return <LoginPanel />;
}
