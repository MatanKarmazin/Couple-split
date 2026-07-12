"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Card, SectionHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage } from "@/hooks/useLanguage";
import { saveExpense } from "@/lib/firebase/firestore";
import type { ExpenseFormValues } from "@/lib/validators";
import { useToast } from "@/components/ui/toast";

export default function NewExpensePage() {
  const router = useRouter();
  const { appUser } = useAuth();
  const { household, members } = useHousehold();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function submit(values: ExpenseFormValues) {
    if (!appUser || !household) return;
    setSubmitting(true);
    try {
      await saveExpense(household.id, appUser.uid, values);
      showToast({ title: t("expenses.added") });
      router.push("/app/expenses");
    } catch (error) {
      showToast({ title: t("expenses.couldNotSave"), message: error instanceof Error ? error.message : t("common.tryAgain"), tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <SectionHeader title={t("expenses.addTitle")} subtitle={t("expenses.addSubtitle")} />
      <Card>
        <ExpenseForm members={members} onSubmit={submit} submitting={submitting} />
      </Card>
    </div>
  );
}
