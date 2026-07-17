"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage, type LanguageMode } from "@/hooks/useLanguage";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { signOutUser } from "@/lib/firebase/auth";
import { createHousehold, joinHousehold, leaveHousehold, makeHouseholdOwner, removeHouseholdMember, switchHousehold } from "@/lib/firebase/firestore";
import { householdSchema, joinHouseholdSchema, type HouseholdFormValues, type JoinHouseholdFormValues } from "@/lib/validators";
import type { HouseholdMember } from "@/types";

export default function SettingsPage() {
  const { appUser } = useAuth();
  const { household, households, members, activeMembers } = useHousehold();
  const { mode, setMode } = useTheme();
  const { mode: languageMode, setMode: setLanguageMode, t } = useLanguage();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<HouseholdMember | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const currentMember = activeMembers.find((member) => member.uid === appUser?.uid);
  const isOwner = currentMember?.role === "owner";
  const isSoloHousehold = activeMembers.length <= 1;
  const createForm = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdSchema),
    defaultValues: { name: "" }
  });
  const joinForm = useForm<JoinHouseholdFormValues>({
    resolver: zodResolver(joinHouseholdSchema)
  });
  const formerMembers = useMemo(
    () => members.filter((member) => !activeMembers.some((activeMember) => activeMember.uid === member.uid)),
    [activeMembers, members]
  );

  async function create(values: HouseholdFormValues) {
    if (!appUser) return;
    setBusy(true);
    try {
      await createHousehold(appUser, values.name);
      createForm.reset({ name: "" });
      showToast({ title: t("settings.householdCreated") });
    } catch (error) {
      showToast({ title: t("onboarding.couldNotCreate"), message: error instanceof Error ? error.message : t("common.tryAgain"), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function join(values: JoinHouseholdFormValues) {
    if (!appUser) return;
    setBusy(true);
    try {
      await joinHousehold(appUser, values.inviteCode);
      joinForm.reset({ inviteCode: "" });
      showToast({ title: t("onboarding.joined") });
    } catch (error) {
      showToast({ title: t("onboarding.couldNotJoin"), message: error instanceof Error ? error.message : t("onboarding.checkCode"), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function removeMember() {
    if (!appUser || !household || !memberToRemove) return;
    setBusy(true);
    try {
      await removeHouseholdMember(household.id, memberToRemove.uid, appUser.uid);
      showToast({ title: t("settings.memberRemoved") });
      setMemberToRemove(null);
    } catch (error) {
      showToast({ title: t("settings.couldNotRemove"), message: error instanceof Error ? error.message : t("common.tryAgain"), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function makeOwner(member: HouseholdMember) {
    if (!household) return;
    setBusy(true);
    try {
      await makeHouseholdOwner(household.id, member.uid);
      showToast({ title: t("settings.ownerUpdated") });
    } catch (error) {
      showToast({ title: t("settings.couldNotUpdateOwner"), message: error instanceof Error ? error.message : t("common.tryAgain"), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!appUser || !household) return;
    setBusy(true);
    try {
      const result = await leaveHousehold(appUser, household.id);
      showToast({ title: result === "deleted" ? t("settings.householdDeleted") : t("settings.leftHousehold") });
      setConfirmLeave(false);
    } catch (error) {
      showToast({ title: t("settings.couldNotLeave"), message: error instanceof Error ? error.message : t("common.tryAgain"), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <SectionHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <Card className="grid gap-3">
        <h2 className="text-base font-bold text-text">{t("settings.households")}</h2>
        <Info label={t("onboarding.name")} value={household?.name ?? t("common.notSet")} />
        <Info label={t("common.currency")} value={household?.defaultCurrency ?? "ILS"} />
        {households.length ? (
          <label className="grid gap-1.5 text-sm font-medium text-text">
            <span>{t("settings.switchHousehold")}</span>
            <Select value={household?.id ?? ""} onChange={(event) => appUser ? void switchHousehold(appUser.uid, event.target.value) : undefined}>
              {households.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </label>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <form className="grid gap-3 rounded-md bg-surface-muted p-3" onSubmit={createForm.handleSubmit(create)}>
            <h3 className="text-sm font-bold text-text">{t("settings.createHousehold")}</h3>
            <Field label={t("onboarding.name")} error={createForm.formState.errors.name?.message}>
              <Input placeholder={t("settings.tripPlaceholder")} {...createForm.register("name")} />
            </Field>
            <Button type="submit" disabled={busy}>{t("onboarding.create")}</Button>
          </form>
          <form className="grid gap-3 rounded-md bg-surface-muted p-3" onSubmit={joinForm.handleSubmit(join)}>
            <h3 className="text-sm font-bold text-text">{t("settings.joinAnother")}</h3>
            <Field label={t("onboarding.inviteCode")} error={joinForm.formState.errors.inviteCode?.message}>
              <Input placeholder="ABCD123" {...joinForm.register("inviteCode")} />
            </Field>
            <Button type="submit" variant="secondary" disabled={busy}>{t("onboarding.join")}</Button>
          </form>
        </div>
      </Card>
      <Card className="grid gap-3">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h2 className="min-w-0 break-words text-base font-bold text-text">{t("common.members")}</h2>
          <Button variant="secondary" className="whitespace-normal text-center" onClick={() => navigator.clipboard.writeText(household?.inviteCode ?? "")}>{t("invite.copy")}</Button>
        </div>
        <Info label={t("invite.code")} value={household?.inviteCode ?? t("common.notSet")} />
        <div className="grid gap-2">
          {activeMembers.map((member) => (
            <div key={member.uid} className="grid min-w-0 gap-3 rounded-md bg-surface-muted p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-text">{member.displayName}</p>
                <p className="break-words text-xs text-text-muted">{member.email} - {member.role}</p>
              </div>
              {isOwner && member.uid !== appUser?.uid ? (
                <div className="flex min-w-0 flex-wrap gap-2 sm:justify-end">
                  {member.role !== "owner" ? (
                    <Button variant="secondary" className="whitespace-normal text-center" onClick={() => void makeOwner(member)} disabled={busy}>{t("settings.makeOwner")}</Button>
                  ) : null}
                  <Button variant="danger" className="whitespace-normal text-center" onClick={() => setMemberToRemove(member)} disabled={busy}>{t("settings.removeMember")}</Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {formerMembers.length ? (
          <div className="grid gap-2">
            <h3 className="text-sm font-bold text-text-muted">{t("settings.formerMembers")}</h3>
            {formerMembers.map((member) => (
              <div key={member.uid} className="min-w-0 break-words rounded-md bg-surface-muted p-3 text-sm text-text-muted">
                {member.displayName} - {member.status ?? t("common.none")}
              </div>
            ))}
          </div>
        ) : null}
        <Button variant="danger" onClick={() => setConfirmLeave(true)} disabled={busy || !household}>{t("settings.leaveHousehold")}</Button>
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
      <ConfirmDialog
        open={Boolean(memberToRemove)}
        title={t("settings.removeMemberTitle")}
        message={t("settings.removeMemberMessage", { name: memberToRemove?.displayName ?? t("common.someone") })}
        confirmLabel={t("settings.removeMember")}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={() => void removeMember()}
      />
      <ConfirmDialog
        open={confirmLeave}
        title={isSoloHousehold ? t("settings.deleteHouseholdTitle") : t("settings.leaveHouseholdTitle")}
        message={isSoloHousehold ? t("settings.deleteHouseholdMessage") : t("settings.leaveHouseholdMessage")}
        confirmLabel={isSoloHousehold ? t("common.delete") : t("settings.leaveHousehold")}
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => void leave()}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-md bg-surface-muted p-3">
      <p className="break-words text-xs font-bold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
