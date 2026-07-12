"use client";

import { Chrome, HeartHandshake } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/hooks/useLanguage";

export function LoginPanel() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();

  async function handleLogin() {
    try {
      await signInWithGoogle();
      router.replace("/app");
    } catch (error) {
      showToast({
        title: t("login.failed"),
        message: error instanceof Error ? error.message : t("common.tryAgain"),
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
            <p className="text-sm font-semibold text-primary">{t("login.kicker")}</p>
            <h1 className="text-3xl font-bold text-text">{t("login.title")}</h1>
          </div>
        </div>
        <Card className="p-6">
          <p className="text-sm leading-6 text-text-muted">
            {t("login.body")}
          </p>
          <Button className="mt-6 w-full" onClick={handleLogin}>
            <Chrome className="h-4 w-4" />
            {t("login.google")}
          </Button>
        </Card>
      </div>
    </main>
  );
}
