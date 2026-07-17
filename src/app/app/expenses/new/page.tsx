"use client";

import { CalendarClock, ReceiptText } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { InstallmentPlansPanel } from "@/components/installment-plans-panel";
import { RecurringBillsPanel } from "@/components/recurring-bills-panel";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage } from "@/hooks/useLanguage";
import { saveExpense } from "@/lib/firebase/firestore";
import type { ExpenseFormValues } from "@/lib/validators";
import { useToast } from "@/components/ui/toast";

export default function NewExpensePage() {
  return (
    <Suspense fallback={null}>
      <NewExpenseContent />
    </Suspense>
  );
}

function NewExpenseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { appUser } = useAuth();
  const { household, activeMembers } = useHousehold();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const mode = searchParams.get("mode") === "recurring" ? "recurring" : "expense";

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
      <SectionHeader
        title={mode === "recurring" ? t("recurring.add") : t("expenses.addTitle")}
        subtitle={mode === "recurring" ? t("recurring.subtitle") : t("expenses.addSubtitle")}
      />
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-muted p-1">
        <Button
          variant={mode === "expense" ? "primary" : "ghost"}
          className="w-full whitespace-normal text-center"
          onClick={() => router.replace("/app/expenses/new")}
        >
          <ReceiptText className="h-4 w-4 shrink-0" />
          {t("quick.addExpense")}
        </Button>
        <Button
          variant={mode === "recurring" ? "primary" : "ghost"}
          className="w-full whitespace-normal text-center"
          onClick={() => router.replace("/app/expenses/new?mode=recurring")}
        >
          <CalendarClock className="h-4 w-4 shrink-0" />
          {t("quick.addRecurring")}
        </Button>
      </div>
      {mode === "recurring" ? (
        <RecurringBillsPanel showHeader={false} />
      ) : (
        <>
          <Card>
            <ExpenseForm members={activeMembers} onSubmit={submit} submitting={submitting} />
          </Card>
          <InstallmentPlansPanel />
        </>
      )}
    </div>
  );
}
