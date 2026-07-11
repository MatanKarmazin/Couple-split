"use client";

import { Chrome, HeartHandshake } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { useToast } from "@/components/ui/toast";

export function LoginPanel() {
  const router = useRouter();
  const { showToast } = useToast();

  async function handleLogin() {
    try {
      await signInWithGoogle();
      router.replace("/app");
    } catch (error) {
      showToast({
        title: "Sign in failed",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-white dark:text-background">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">CoupleSplit</p>
            <h1 className="text-3xl font-bold text-text">Shared money, calmer evenings.</h1>
          </div>
        </div>
        <Card className="p-6">
          <p className="text-sm leading-6 text-text-muted">
            Sign in to keep a private household ledger for shared expenses, balances, and settle-up payments.
          </p>
          <Button className="mt-6 w-full" onClick={handleLogin}>
            <Chrome className="h-4 w-4" />
            Continue with Google
          </Button>
        </Card>
      </div>
    </main>
  );
}
