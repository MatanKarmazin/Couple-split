"use client";

import { Copy } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { ensureInviteCode } from "@/lib/firebase/firestore";
import { useToast } from "@/components/ui/toast";

export default function InvitePage() {
  const { appUser } = useAuth();
  const { household, partner } = useHousehold();
  const { showToast } = useToast();

  useEffect(() => {
    if (!household || !appUser) return;
    void ensureInviteCode(household, appUser);
  }, [household, appUser]);

  async function copyCode() {
    if (!household) return;
    await navigator.clipboard.writeText(household.inviteCode);
    showToast({ title: "Invite code copied" });
  }

  return (
    <div className="grid gap-5">
      <SectionHeader title="Invite code" subtitle={partner ? `${partner.displayName} has joined.` : "Share this code with your partner."} />
      <Card className="grid gap-4">
        <p className="text-sm font-semibold text-ink/60">Household</p>
        <p className="text-xl font-bold text-ink">{household?.name ?? "Loading..."}</p>
        <div className="rounded-lg bg-mist p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Code</p>
          <p className="mt-2 text-4xl font-bold text-ink">{household?.inviteCode ?? "------"}</p>
        </div>
        <Button onClick={copyCode} disabled={!household}>
          <Copy className="h-4 w-4" />
          Copy code
        </Button>
      </Card>
    </div>
  );
}
