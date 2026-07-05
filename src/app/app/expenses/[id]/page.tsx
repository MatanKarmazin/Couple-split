"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { formatDate } from "@/lib/dates";
import { softDeleteExpense, saveExpense } from "@/lib/firebase/firestore";
import { formatMoney } from "@/lib/money";
import type { ExpenseFormValues } from "@/lib/validators";
import { useToast } from "@/components/ui/toast";

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { appUser } = useAuth();
  const { household, members } = useHousehold();
  const { activeExpenses } = useExpenses(household?.id);
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const expense = useMemo(() => activeExpenses.find((item) => item.id === id), [activeExpenses, id]);

  async function update(values: ExpenseFormValues) {
    if (!appUser || !household || !expense) return;
    setSubmitting(true);
    try {
      await saveExpense(household.id, appUser.uid, values, expense.id);
      showToast({ title: "Expense updated" });
      setEditing(false);
    } catch (error) {
      showToast({ title: "Could not update", message: error instanceof Error ? error.message : "Try again.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!household || !expense) return;
    await softDeleteExpense(household.id, expense.id);
    showToast({ title: "Expense deleted" });
    router.push("/app/expenses");
  }

  if (!expense) {
    return <Card className="text-sm text-ink/60">Expense not found or still loading.</Card>;
  }

  const payer = members.find((member) => member.uid === expense.paidByUid)?.displayName ?? "Someone";

  return (
    <div className="grid gap-5">
      <SectionHeader
        title={expense.description}
        subtitle={`${expense.category} · ${formatDate(expense.date)}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing((value) => !value)}><Pencil className="h-4 w-4" />Edit</Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}><Trash2 className="h-4 w-4" />Delete</Button>
          </div>
        }
      />
      {editing ? (
        <Card>
          <ExpenseForm members={members} initialExpense={expense} onSubmit={update} submitting={submitting} />
        </Card>
      ) : (
        <Card className="grid gap-4">
          <div>
            <p className="text-sm font-semibold text-ink/60">Amount</p>
            <p className="mt-1 text-3xl font-bold text-ink">{formatMoney(expense.amountMinor)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Paid by" value={payer} />
            <Info label="Split type" value="Equal" />
            <Info label="Participants" value={expense.participants.map((uid) => members.find((member) => member.uid === uid)?.displayName ?? uid).join(", ")} />
            <Info label="Notes" value={expense.notes || "None"} />
          </div>
        </Card>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this expense?"
        message="This will soft delete the expense and remove it from balance calculations."
        confirmLabel="Delete"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void remove()}
      />
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
