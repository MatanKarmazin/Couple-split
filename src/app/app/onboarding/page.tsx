"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
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
      showToast({ title: "Household created" });
      router.replace("/app/invite");
    } catch (error) {
      showToast({ title: "Could not create household", message: error instanceof Error ? error.message : "Try again.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function join(values: JoinHouseholdFormValues) {
    if (!appUser) return;
    setBusy(true);
    try {
      await joinHousehold(appUser, values.inviteCode);
      showToast({ title: "You joined the household" });
      router.replace("/app");
    } catch (error) {
      showToast({ title: "Could not join", message: error instanceof Error ? error.message : "Check the code and try again.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <SectionHeader title="Set up your shared space" subtitle="Create a household, or join one with an invite code." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-bold text-ink">Create household</h2>
          <form className="mt-4 grid gap-4" onSubmit={createForm.handleSubmit(create)}>
            <Field label="Household name" error={createForm.formState.errors.name?.message}>
              <Input {...createForm.register("name")} />
            </Field>
            <Button type="submit" disabled={busy}>Create</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-base font-bold text-ink">Join household</h2>
          <form className="mt-4 grid gap-4" onSubmit={joinForm.handleSubmit(join)}>
            <Field label="Invite code" error={joinForm.formState.errors.inviteCode?.message}>
              <Input placeholder="ABCD123" {...joinForm.register("inviteCode")} />
            </Field>
            <Button type="submit" variant="secondary" disabled={busy}>Join</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
