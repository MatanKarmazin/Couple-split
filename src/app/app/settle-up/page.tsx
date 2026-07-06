"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { useSettlements } from "@/hooks/useSettlements";
import { calculateBalances } from "@/lib/balances";
import { inputDate } from "@/lib/dates";
import { createSettlement } from "@/lib/firebase/firestore";
import { minorToInput } from "@/lib/money";
import { settlementSchema, type SettlementFormValues } from "@/lib/validators";
import { useToast } from "@/components/ui/toast";

export default function SettleUpPage() {
  const router = useRouter();
  const { appUser } = useAuth();
  const { household, members, partner } = useHousehold();
  const { activeExpenses } = useExpenses(household?.id);
  const { activeSettlements } = useSettlements(household?.id);
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const balances = calculateBalances(activeExpenses, activeSettlements);
  const myBalance = appUser ? balances[appUser.uid] ?? 0 : 0;

  const defaults = useMemo(() => {
    const currentUid = appUser?.uid ?? "";
    const partnerUid = partner?.uid ?? "";
    return {
      fromUid: myBalance < 0 ? currentUid : partnerUid,
      toUid: myBalance < 0 ? partnerUid : currentUid,
      amount: myBalance === 0 ? "" : minorToInput(Math.abs(myBalance)),
      date: inputDate(new Date()),
      note: ""
    };
  }, [appUser?.uid, myBalance, partner?.uid]);

  const form = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementSchema),
    values: defaults
  });

  async function submit(values: SettlementFormValues) {
    if (!appUser || !household) return;
    setSubmitting(true);
    try {
      await createSettlement(household.id, appUser.uid, values);
      showToast({ title: "Settlement recorded" });
      router.push("/app");
    } catch (error) {
      showToast({ title: "Could not record settlement", message: error instanceof Error ? error.message : "Try again.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <SectionHeader title="Settle up" subtitle="Record a payment without changing old expenses." />
      <BalanceCard balanceMinor={myBalance} />
      <Card>
        <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" error={form.formState.errors.fromUid?.message}>
              <Select {...form.register("fromUid")}>
                {members.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
              </Select>
            </Field>
            <Field label="To" error={form.formState.errors.toUid?.message}>
              <Select {...form.register("toUid")}>
                {members.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount" error={form.formState.errors.amount?.message}>
              <Input inputMode="decimal" {...form.register("amount")} />
            </Field>
            <Field label="Date" error={form.formState.errors.date?.message}>
              <Input type="date" {...form.register("date")} />
            </Field>
          </div>
          <Field label="Note" error={form.formState.errors.note?.message}>
            <Textarea placeholder="Optional note" {...form.register("note")} />
          </Field>
          <Button type="submit" disabled={submitting || members.length < 2}>{submitting ? "Saving..." : "Record settlement"}</Button>
        </form>
      </Card>
    </div>
  );
}
