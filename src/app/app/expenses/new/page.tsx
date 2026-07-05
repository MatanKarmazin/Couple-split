"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Card, SectionHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { saveExpense } from "@/lib/firebase/firestore";
import type { ExpenseFormValues } from "@/lib/validators";
import { useToast } from "@/components/ui/toast";

export default function NewExpensePage() {
  const router = useRouter();
  const { appUser } = useAuth();
  const { household, members } = useHousehold();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function submit(values: ExpenseFormValues) {
    if (!appUser || !household) return;
    setSubmitting(true);
    try {
      await saveExpense(household.id, appUser.uid, values);
      showToast({ title: "Expense added" });
      router.push("/app/expenses");
    } catch (error) {
      showToast({ title: "Could not save expense", message: error instanceof Error ? error.message : "Try again.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <SectionHeader title="Add expense" subtitle="Equal split is enabled for this MVP." />
      <Card>
        <ExpenseForm members={members} onSubmit={submit} submitting={submitting} />
      </Card>
    </div>
  );
}
