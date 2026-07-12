"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage, type LanguageMode } from "@/hooks/useLanguage";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { signOutUser } from "@/lib/firebase/auth";

export default function SettingsPage() {
  const { appUser } = useAuth();
  const { household, members } = useHousehold();
  const { mode, setMode } = useTheme();
  const { mode: languageMode, setMode: setLanguageMode, t } = useLanguage();

  return (
    <div className="grid gap-5">
      <SectionHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <Card className="grid gap-3">
        <h2 className="text-base font-bold text-text">{t("common.household")}</h2>
        <Info label={t("onboarding.name")} value={household?.name ?? t("common.notSet")} />
        <Info label={t("common.currency")} value={household?.defaultCurrency ?? "ILS"} />
        <Info label={t("common.members")} value={members.map((member) => member.displayName).join(", ") || t("settings.onlyYou")} />
        <Link href="/app/invite"><Button variant="secondary">{t("settings.viewInvite")}</Button></Link>
      </Card>
      <Card className="grid gap-3">
        <h2 className="text-base font-bold text-text">{t("settings.appearance")}</h2>
        <label className="grid gap-1.5 text-sm font-medium text-text">
          <span>{t("settings.theme")}</span>
          <Select value={mode} onChange={(event) => setMode(event.target.value as ThemeMode)}>
            <option value="system">{t("common.system")}</option>
            <option value="light">{t("common.light")}</option>
            <option value="dark">{t("common.dark")}</option>
          </Select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-text">
          <span>{t("settings.language")}</span>
          <Select value={languageMode} onChange={(event) => setLanguageMode(event.target.value as LanguageMode)}>
            <option value="system">{t("common.system")}</option>
            <option value="en">{t("common.english")}</option>
            <option value="he">{t("common.hebrew")}</option>
          </Select>
        </label>
      </Card>
      <Card className="grid gap-3">
        <h2 className="text-base font-bold text-text">{t("settings.account")}</h2>
        <Info label={t("settings.signedInAs")} value={appUser ? `${appUser.displayName} · ${appUser.email}` : t("common.loading")} />
        <Button variant="danger" onClick={() => void signOutUser()}>{t("nav.signOut")}</Button>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-muted p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
