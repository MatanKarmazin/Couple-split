"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { signOutUser } from "@/lib/firebase/auth";

export default function SettingsPage() {
  const { appUser } = useAuth();
  const { household, members } = useHousehold();

  return (
    <div className="grid gap-5">
      <SectionHeader title="Settings" subtitle="Household and account details." />
      <Card className="grid gap-3">
        <h2 className="text-base font-bold text-ink">Household</h2>
        <Info label="Name" value={household?.name ?? "Not set"} />
        <Info label="Currency" value={household?.defaultCurrency ?? "ILS"} />
        <Info label="Members" value={members.map((member) => member.displayName).join(", ") || "Only you for now"} />
        <Link href="/app/invite"><Button variant="secondary">View invite code</Button></Link>
      </Card>
      <Card className="grid gap-3">
        <h2 className="text-base font-bold text-ink">Account</h2>
        <Info label="Signed in as" value={appUser ? `${appUser.displayName} · ${appUser.email}` : "Loading"} />
        <Button variant="danger" onClick={() => void signOutUser()}>Sign out</Button>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-mist p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-sage">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
