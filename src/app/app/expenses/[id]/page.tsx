"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDateLocale } from "@/lib/dates";
import { softDeleteExpense, saveExpense } from "@/lib/firebase/firestore";
import { categoryLabel, splitTypeLabel } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { safeAppReturnTo } from "@/lib/navigation";
import type { ExpenseFormValues } from "@/lib/validators";
import { useToast } from "@/components/ui/toast";

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { appUser } = useAuth();
  const { household, members, activeMembers } = useHousehold();
  const { language, locale, t } = useLanguage();
  const { activeExpenses } = useExpenses(household?.id);
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const expense = useMemo(() => activeExpenses.find((item) => item.id === id), [activeExpenses, id]);
  const returnTo = safeAppReturnTo(searchParams.get("returnTo"), "/app/expenses", `/app/expenses/${id}`);

  async function update(values: ExpenseFormValues) {
    if (!appUser || !household || !expense) return;
    setSubmitting(true);
    try {
      await saveExpense(household.id, appUser.uid, values, expense.id);
      showToast({ title: t("expenses.updated") });
      setEditing(false);
    } catch (error) {
      showToast({ title: t("expenses.couldNotUpdate"), message: error instanceof Error ? error.message : t("common.tryAgain"), tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!household || !expense) return;
    await softDeleteExpense(household.id, expense.id);
    showToast({ title: t("expenses.deleted") });
    router.push(returnTo);
  }

  if (!expense) {
    return <Card className="text-sm text-text-muted">{t("expenses.notFound")}</Card>;
  }

  const payer = members.find((member) => member.uid === expense.paidByUid)?.displayName ?? t("common.someone");
  const currency = expense.currency ?? "ILS";
  const householdCurrency = expense.householdCurrency ?? currency;
  const showConverted = currency !== householdCurrency && typeof expense.householdAmountMinor === "number";
  const shareSummary = expense.participants
    .map((uid) => {
      const member = members.find((item) => item.uid === uid);
      const shareMinor = (showConverted ? expense.householdShares?.[uid] : expense.shares[uid]) ?? 0;
      return `${member?.displayName ?? uid}: ${formatMoney(shareMinor, showConverted ? householdCurrency : currency, locale)}`;
    })
    .join(", ");

  return (
    <div className="grid gap-5">
      <SectionHeader
        title={expense.description}
        subtitle={`${categoryLabel(language, expense.category)} · ${formatDateLocale(expense.date, locale)}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing((value) => !value)}><Pencil className="h-4 w-4" />{t("common.edit")}</Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}><Trash2 className="h-4 w-4" />{t("common.delete")}</Button>
          </div>
        }
      />
      {editing ? (
        <Card>
          <ExpenseForm members={activeMembers} initialExpense={expense} onSubmit={update} submitting={submitting} />
        </Card>
      ) : (
        <Card className="grid gap-4">
          <div>
            <p className="text-sm font-semibold text-text-muted">{t("common.amount")}</p>
            <p className="mt-1 text-3xl font-bold text-text">{formatMoney(expense.amountMinor, currency, locale)}</p>
            {showConverted ? <p className="mt-1 text-sm font-semibold text-text-muted">{formatMoney(expense.householdAmountMinor ?? 0, householdCurrency, locale)}</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label={t("expenses.paidBy")} value={payer} />
            <Info label={t("expenses.splitType")} value={splitTypeLabel(language, expense.splitType)} />
            <Info label={t("expenses.shares")} value={shareSummary} />
            <Info label={t("common.notes")} value={expense.notes || t("common.none")} />
          </div>
        </Card>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title={t("expenses.deleteTitle")}
        message={t("expenses.deleteMessage")}
        confirmLabel={t("common.delete")}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void remove()}
      />
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
