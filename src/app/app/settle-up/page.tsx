"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { CurrencySelect } from "@/components/currency-select";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage } from "@/hooks/useLanguage";
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
  const { household, activeMembers, partner } = useHousehold();
  const { t } = useLanguage();
  const { activeExpenses } = useExpenses(household?.id);
  const { activeSettlements } = useSettlements(household?.id);
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const balances = calculateBalances(activeExpenses, activeSettlements);
  const myBalance = appUser ? balances[appUser.uid] ?? 0 : 0;
  const householdCurrency = household?.defaultCurrency ?? "ILS";

  const defaults = useMemo(() => {
    const currentUid = appUser?.uid ?? "";
    const partnerUid = partner?.uid ?? "";
    return {
      fromUid: myBalance < 0 ? currentUid : partnerUid,
      toUid: myBalance < 0 ? partnerUid : currentUid,
      amount: myBalance === 0 ? "" : minorToInput(Math.abs(myBalance)),
      currency: householdCurrency,
      date: inputDate(new Date()),
      note: ""
    };
  }, [appUser?.uid, householdCurrency, myBalance, partner?.uid]);

  const form = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementSchema),
    values: defaults
  });

  async function submit(values: SettlementFormValues) {
    if (!appUser || !household) return;
    setSubmitting(true);
    try {
      await createSettlement(household.id, appUser.uid, values);
      showToast({ title: t("settle.recorded") });
      router.push("/app");
    } catch (error) {
      showToast({ title: t("settle.couldNotRecord"), message: error instanceof Error ? error.message : t("common.tryAgain"), tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <SectionHeader title={t("settle.title")} subtitle={t("settle.subtitle")} />
      <BalanceCard balanceMinor={myBalance} currency={householdCurrency} />
      <Card>
        <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("settle.from")} error={form.formState.errors.fromUid?.message}>
              <Select {...form.register("fromUid")}>
                {activeMembers.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
              </Select>
            </Field>
            <Field label={t("settle.to")} error={form.formState.errors.toUid?.message}>
              <Select {...form.register("toUid")}>
                {activeMembers.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("common.amount")} error={form.formState.errors.amount?.message}>
              <Input inputMode="decimal" {...form.register("amount")} />
            </Field>
            <CurrencySelect
              label={t("common.currency")}
              value={form.watch("currency") ?? householdCurrency}
              onChange={(currency) => form.setValue("currency", currency, { shouldValidate: true })}
              error={form.formState.errors.currency?.message}
            />
            <Field label={t("common.date")} error={form.formState.errors.date?.message}>
              <Input type="date" {...form.register("date")} />
            </Field>
          </div>
          <Field label={t("settle.note")} error={form.formState.errors.note?.message}>
            <Textarea placeholder={t("common.optionalNote")} {...form.register("note")} />
          </Field>
          <Button type="submit" disabled={submitting || activeMembers.length < 2}>{submitting ? t("common.saving") : t("settle.record")}</Button>
        </form>
      </Card>
    </div>
  );
}
