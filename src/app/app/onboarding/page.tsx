"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { createHousehold, joinHousehold } from "@/lib/firebase/firestore";
import {
  householdSchema,
  joinHouseholdSchema,
  type HouseholdFormValues,
  type JoinHouseholdFormValues
} from "@/lib/validators";
import { useToast } from "@/components/ui/toast";

export default function OnboardingPage() {
  const { appUser } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const createForm = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdSchema),
    defaultValues: { name: "Our household" }
  });
  const joinForm = useForm<JoinHouseholdFormValues>({
    resolver: zodResolver(joinHouseholdSchema)
  });

  async function create(values: HouseholdFormValues) {
    if (!appUser) return;
    setBusy(true);
    try {
      await createHousehold(appUser, values.name);
      showToast({ title: t("onboarding.created") });
      router.replace("/app/invite");
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
      showToast({ title: t("onboarding.joined") });
      router.replace("/app");
    } catch (error) {
      showToast({ title: t("onboarding.couldNotJoin"), message: error instanceof Error ? error.message : t("onboarding.checkCode"), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <SectionHeader title={t("onboarding.title")} subtitle={t("onboarding.subtitle")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-bold text-text">{t("onboarding.createTitle")}</h2>
          <form className="mt-4 grid gap-4" onSubmit={createForm.handleSubmit(create)}>
            <Field label={t("onboarding.name")} error={createForm.formState.errors.name?.message}>
              <Input {...createForm.register("name")} />
            </Field>
            <Button type="submit" disabled={busy}>{t("onboarding.create")}</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-base font-bold text-text">{t("onboarding.joinTitle")}</h2>
          <form className="mt-4 grid gap-4" onSubmit={joinForm.handleSubmit(join)}>
            <Field label={t("onboarding.inviteCode")} error={joinForm.formState.errors.inviteCode?.message}>
              <Input placeholder="ABCD123" {...joinForm.register("inviteCode")} />
            </Field>
            <Button type="submit" variant="secondary" disabled={busy}>{t("onboarding.join")}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
