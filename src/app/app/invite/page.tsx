"use client";

import { Copy, Share2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage } from "@/hooks/useLanguage";
import { ensureInviteCode } from "@/lib/firebase/firestore";
import { useToast } from "@/components/ui/toast";

export default function InvitePage() {
  const { appUser } = useAuth();
  const { household, partner } = useHousehold();
  const { t } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    if (!household || !appUser) return;
    void ensureInviteCode(household, appUser);
  }, [household, appUser]);

  async function copyCode() {
    if (!household) return;
    await navigator.clipboard.writeText(household.inviteCode);
    showToast({ title: t("invite.codeCopied") });
  }

  async function shareCode() {
    if (!household) return;
    const text = t("invite.shareText", { name: household.name, code: household.inviteCode });
    if (navigator.share) {
      await navigator.share({ title: t("invite.shareTitle"), text });
      return;
    }

    await navigator.clipboard.writeText(text);
    showToast({ title: t("invite.inviteCopied") });
  }

  return (
    <div className="grid gap-5">
      <SectionHeader title={t("invite.title")} subtitle={partner ? t("invite.subtitleJoined", { name: partner.displayName }) : t("invite.subtitleWaiting")} />
      <Card className="grid gap-4">
        <div>
          <p className="text-sm font-semibold text-text-muted">{t("common.household")}</p>
          <p className="text-xl font-bold text-text">{household?.name ?? t("common.loading")}</p>
        </div>
        <div className="rounded-lg bg-surface-muted p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("invite.code")}</p>
          <p className="mt-2 text-4xl font-bold text-text">{household?.inviteCode ?? "------"}</p>
          <p className="mt-3 text-sm font-semibold text-text-muted">
            {partner ? t("invite.connected") : t("invite.waiting")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={copyCode} disabled={!household}>
            <Copy className="h-4 w-4" />
            {t("invite.copy")}
          </Button>
          <Button variant="secondary" onClick={shareCode} disabled={!household}>
            <Share2 className="h-4 w-4" />
            {t("invite.share")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
