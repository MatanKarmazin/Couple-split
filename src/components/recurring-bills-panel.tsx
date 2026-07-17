"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CurrencySelect } from "@/components/currency-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage } from "@/hooks/useLanguage";
import { useRecurringBills } from "@/hooks/useRecurringBills";
import { formatDateLocale } from "@/lib/dates";
import { saveRecurringBill, softDeleteRecurringBill, toggleRecurringBill } from "@/lib/firebase/firestore";
import { categoryLabel } from "@/lib/i18n";
import { formatMoney, minorToInput } from "@/lib/money";
import { categories, recurringBillSchema, type RecurringBillFormValues } from "@/lib/validators";
import type { HouseholdMember, RecurringBill } from "@/types";
import { useToast } from "@/components/ui/toast";

export function RecurringBillsPanel({ showHeader = true }: { showHeader?: boolean }) {
  const { appUser } = useAuth();
  const { household, activeMembers } = useHousehold();
  const { language, locale, t } = useLanguage();
  const { activeRecurringBills } = useRecurringBills(household?.id, activeMembers);
  const { showToast } = useToast();
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [confirmBill, setConfirmBill] = useState<RecurringBill | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const defaultValues = useMemo<RecurringBillFormValues>(() => ({
    description: editingBill?.description ?? "",
    amount: editingBill ? minorToInput(editingBill.amountMinor) : "",
    currency: editingBill?.currency ?? "ILS",
    category: editingBill?.category ?? "Rent",
    paidByUid: editingBill?.paidByUid ?? activeMembers[0]?.uid ?? "",
    dayOfMonth: editingBill?.dayOfMonth ?? new Date().getDate(),
    startMonth: editingBill?.startMonth ?? currentMonth(),
    frequencyMonths: editingBill?.frequencyMonths ?? 1,
    active: editingBill?.active ?? true,
    notes: editingBill?.notes ?? ""
  }), [activeMembers, editingBill]);

  const form = useForm<RecurringBillFormValues>({
    resolver: zodResolver(recurringBillSchema),
    values: defaultValues
  });

  useEffect(() => {
    const paidByUid = form.getValues("paidByUid");
    if ((!paidByUid || !activeMembers.some((member) => member.uid === paidByUid)) && activeMembers[0]) {
      form.setValue("paidByUid", activeMembers[0].uid, { shouldValidate: true });
    }
  }, [activeMembers, form]);

  async function submit(values: RecurringBillFormValues) {
    if (!appUser || !household) return;

    setSubmitting(true);
    try {
      await saveRecurringBill(household.id, appUser.uid, values, editingBill?.id);
      showToast({ title: editingBill ? t("recurring.updated") : t("recurring.added") });
      setEditingBill(null);
      form.reset(emptyValues(activeMembers[0]?.uid));
    } catch (error) {
      showToast({ title: t("recurring.couldNotSave"), message: error instanceof Error ? error.message : t("common.tryAgain"), tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleBill(bill: RecurringBill) {
    if (!household) return;
    await toggleRecurringBill(household.id, bill.id, !bill.active);
    showToast({ title: bill.active ? t("recurring.paused") : t("recurring.resumed") });
  }

  async function removeBill() {
    if (!household || !confirmBill) return;
    await softDeleteRecurringBill(household.id, confirmBill.id);
    showToast({ title: t("recurring.deleted") });
    setConfirmBill(null);
    if (editingBill?.id === confirmBill.id) setEditingBill(null);
  }

  return (
    <section id="recurring" className="scroll-mt-6 grid gap-4">
      {showHeader ? <SectionHeader title={t("recurring.title")} subtitle={t("recurring.subtitle")} /> : null}
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="min-w-0 overflow-hidden">
          <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <h2 className="min-w-0 break-words text-base font-bold text-text">{editingBill ? t("recurring.edit") : t("recurring.add")}</h2>
              {editingBill ? <Button variant="ghost" onClick={() => setEditingBill(null)}>{t("common.cancel")}</Button> : null}
            </div>
            <Field label={t("expenses.description")} error={form.formState.errors.description?.message}>
              <Input placeholder={t("recurring.descriptionPlaceholder")} {...form.register("description")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("common.amount")} error={form.formState.errors.amount?.message}>
                <Input inputMode="decimal" placeholder="4500.00" {...form.register("amount")} />
              </Field>
              <CurrencySelect
                label={t("common.currency")}
                value={form.watch("currency") ?? "ILS"}
                onChange={(currency) => form.setValue("currency", currency, { shouldValidate: true })}
                error={form.formState.errors.currency?.message}
              />
              <Field label={t("common.category")} error={form.formState.errors.category?.message}>
                <Select {...form.register("category")}>
                  {categories.map((category) => <option key={category} value={category}>{categoryLabel(language, category)}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("recurring.paidBy")} error={form.formState.errors.paidByUid?.message}>
                <Select {...form.register("paidByUid")}>
                  {activeMembers.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
                </Select>
              </Field>
              <Field label={t("recurring.dayOfMonth")} error={form.formState.errors.dayOfMonth?.message}>
                <Input type="number" min={1} max={31} {...form.register("dayOfMonth")} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("recurring.startMonth")} error={form.formState.errors.startMonth?.message}>
                <Input type="month" {...form.register("startMonth")} />
              </Field>
              <Field label={t("recurring.repeats")} error={form.formState.errors.frequencyMonths?.message}>
                <Select {...form.register("frequencyMonths")}>
                  <option value={1}>{t("recurring.monthly")}</option>
                  <option value={2}>{t("recurring.everyTwoMonths")}</option>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-text">
                <input type="checkbox" {...form.register("active")} />
                {t("recurring.active")}
              </label>
            </div>
            <Field label={t("common.notes")} error={form.formState.errors.notes?.message}>
              <Textarea placeholder={t("common.optionalNote")} {...form.register("notes")} />
            </Field>
            <Button type="submit" disabled={submitting || activeMembers.length < 2}>
              <Plus className="h-4 w-4" />
              {submitting ? t("common.saving") : editingBill ? t("common.saveChanges") : t("recurring.add")}
            </Button>
          </form>
        </Card>

        <section className="grid min-w-0 content-start gap-3">
          {activeRecurringBills.length ? activeRecurringBills.map((bill) => (
            <RecurringBillCard
              key={bill.id}
              bill={bill}
              members={activeMembers}
              language={language}
              locale={locale}
              onEdit={setEditingBill}
              onToggle={toggleBill}
              onDelete={setConfirmBill}
            />
          )) : (
            <Card className="grid place-items-center gap-2 py-8 text-center text-sm text-text-muted">
              <CalendarClock className="h-8 w-8 text-primary" />
              {t("recurring.empty")}
            </Card>
          )}
        </section>
      </div>
      <ConfirmDialog
        open={Boolean(confirmBill)}
        title={t("recurring.deleteTitle")}
        message={t("recurring.deleteMessage")}
        confirmLabel={t("common.delete")}
        onCancel={() => setConfirmBill(null)}
        onConfirm={() => void removeBill()}
      />
    </section>
  );
}

export function RecurringBillsSummary() {
  const { household, activeMembers } = useHousehold();
  const { activeRecurringBills } = useRecurringBills(household?.id, activeMembers);
  const { locale, t } = useLanguage();
  const visibleBills = activeRecurringBills.slice(0, 3);

  return (
    <section className="grid gap-3">
      <SectionHeader title={t("recurring.title")} />
      {visibleBills.length ? visibleBills.map((bill) => {
        const payer = activeMembers.find((member) => member.uid === bill.paidByUid)?.displayName ?? t("common.someone");
        return (
          <Card key={bill.id} className="min-w-0 overflow-hidden p-3">
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="min-w-0 break-words text-sm font-bold text-text">{bill.description}</p>
                  <Badge className="shrink-0">{bill.active ? t("recurring.activeBadge") : t("recurring.pausedBadge")}</Badge>
                </div>
                <p className="mt-1 break-words text-xs text-text-muted">
                  {t("recurring.nextLine", { payer, frequency: frequencyLabel(bill, t), date: formatDateLocale(nextDueDate(bill), locale) })}
                </p>
              </div>
              <p className="break-words text-sm font-bold text-text sm:text-right">{formatMoney(bill.amountMinor, bill.currency ?? "ILS", locale)}</p>
            </div>
          </Card>
        );
      }) : (
        <Card className="text-sm text-text-muted">{t("recurring.empty")}</Card>
      )}
    </section>
  );
}

function RecurringBillCard({
  bill,
  members,
  language,
  locale,
  onEdit,
  onToggle,
  onDelete
}: {
  bill: RecurringBill;
  members: HouseholdMember[];
  language: "en" | "he";
  locale: string;
  onEdit: (bill: RecurringBill) => void;
  onToggle: (bill: RecurringBill) => void;
  onDelete: (bill: RecurringBill) => void;
}) {
  const { t } = useLanguage();
  const payer = members.find((member) => member.uid === bill.paidByUid)?.displayName ?? t("common.someone");

  return (
    <Card className="grid min-w-0 gap-3 overflow-hidden">
      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="min-w-0 break-words text-sm font-bold text-text">{bill.description}</h2>
            <Badge className="shrink-0">{bill.active ? t("recurring.activeBadge") : t("recurring.pausedBadge")}</Badge>
          </div>
          <p className="mt-1 break-words text-xs text-text-muted">
            {t("recurring.nextLine", { payer, frequency: frequencyLabel(bill, t), date: formatDateLocale(nextDueDate(bill), locale) })}
          </p>
        </div>
        <div className="min-w-0 sm:text-right">
          <p className="break-words text-sm font-bold text-text">{formatMoney(bill.amountMinor, bill.currency ?? "ILS", locale)}</p>
          <p className="mt-1 break-words text-xs text-text-muted">{categoryLabel(language, bill.category)}</p>
        </div>
      </div>
      {bill.notes ? <p className="break-words text-sm text-text-muted">{bill.notes}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onEdit(bill)}><Pencil className="h-4 w-4" />{t("common.edit")}</Button>
        <Button variant="secondary" onClick={() => void onToggle(bill)}><Power className="h-4 w-4" />{bill.active ? t("recurring.pause") : t("recurring.resume")}</Button>
        <Button variant="danger" onClick={() => onDelete(bill)}><Trash2 className="h-4 w-4" />{t("common.delete")}</Button>
      </div>
    </Card>
  );
}

function emptyValues(paidByUid = ""): RecurringBillFormValues {
  return {
    description: "",
    amount: "",
    currency: "ILS",
    category: "Rent",
    paidByUid,
    dayOfMonth: new Date().getDate(),
    startMonth: currentMonth(),
    frequencyMonths: 1,
    active: true,
    notes: ""
  };
}

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function nextDueDate(bill: RecurringBill) {
  const today = startOfDay(new Date());
  const [startYear, startMonth] = bill.startMonth.split("-").map(Number);
  let next = dueDate(startYear, startMonth - 1, bill.dayOfMonth);
  const increment = bill.frequencyMonths === 2 ? 2 : 1;

  while (next < today) {
    next = dueDate(next.getFullYear(), next.getMonth() + increment, bill.dayOfMonth);
  }

  return next;
}

function dueDate(year: number, monthIndex: number, dayOfMonth: number) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(dayOfMonth, lastDay));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function frequencyLabel(bill: RecurringBill, t: ReturnType<typeof useLanguage>["t"]) {
  return bill.frequencyMonths === 2 ? t("recurring.everyTwoMonths") : t("recurring.monthly");
}
