"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { useRecurringBills } from "@/hooks/useRecurringBills";
import { formatDate } from "@/lib/dates";
import { saveRecurringBill, softDeleteRecurringBill, toggleRecurringBill } from "@/lib/firebase/firestore";
import { formatMoney, minorToInput } from "@/lib/money";
import { categories, recurringBillSchema, type RecurringBillFormValues } from "@/lib/validators";
import type { HouseholdMember, RecurringBill } from "@/types";
import { useToast } from "@/components/ui/toast";

export function RecurringBillsPanel() {
  const { appUser } = useAuth();
  const { household, members } = useHousehold();
  const { activeRecurringBills } = useRecurringBills(household?.id, members);
  const { showToast } = useToast();
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [confirmBill, setConfirmBill] = useState<RecurringBill | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const defaultValues = useMemo<RecurringBillFormValues>(() => ({
    description: editingBill?.description ?? "",
    amount: editingBill ? minorToInput(editingBill.amountMinor) : "",
    category: editingBill?.category ?? "Rent",
    paidByUid: editingBill?.paidByUid ?? members[0]?.uid ?? "",
    dayOfMonth: editingBill?.dayOfMonth ?? new Date().getDate(),
    startMonth: editingBill?.startMonth ?? currentMonth(),
    active: editingBill?.active ?? true,
    notes: editingBill?.notes ?? ""
  }), [editingBill, members]);

  const form = useForm<RecurringBillFormValues>({
    resolver: zodResolver(recurringBillSchema),
    values: defaultValues
  });

  useEffect(() => {
    const paidByUid = form.getValues("paidByUid");
    if ((!paidByUid || !members.some((member) => member.uid === paidByUid)) && members[0]) {
      form.setValue("paidByUid", members[0].uid, { shouldValidate: true });
    }
  }, [form, members]);

  async function submit(values: RecurringBillFormValues) {
    if (!appUser || !household) return;

    setSubmitting(true);
    try {
      await saveRecurringBill(household.id, appUser.uid, values, editingBill?.id);
      showToast({ title: editingBill ? "Recurring bill updated" : "Recurring bill added" });
      setEditingBill(null);
      form.reset(emptyValues(members[0]?.uid));
    } catch (error) {
      showToast({ title: "Could not save recurring bill", message: error instanceof Error ? error.message : "Try again.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleBill(bill: RecurringBill) {
    if (!household) return;
    await toggleRecurringBill(household.id, bill.id, !bill.active);
    showToast({ title: bill.active ? "Recurring bill paused" : "Recurring bill resumed" });
  }

  async function removeBill() {
    if (!household || !confirmBill) return;
    await softDeleteRecurringBill(household.id, confirmBill.id);
    showToast({ title: "Recurring bill deleted" });
    setConfirmBill(null);
    if (editingBill?.id === confirmBill.id) setEditingBill(null);
  }

  return (
    <section className="grid gap-4">
      <SectionHeader title="Recurring bills" subtitle="Due bills are created as normal expenses." />
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-ink">{editingBill ? "Edit recurring bill" : "Add recurring bill"}</h2>
              {editingBill ? <Button variant="ghost" onClick={() => setEditingBill(null)}>Cancel</Button> : null}
            </div>
            <Field label="Description" error={form.formState.errors.description?.message}>
              <Input placeholder="Rent, internet, parking..." {...form.register("description")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount" error={form.formState.errors.amount?.message}>
                <Input inputMode="decimal" placeholder="4500.00" {...form.register("amount")} />
              </Field>
              <Field label="Category" error={form.formState.errors.category?.message}>
                <Select {...form.register("category")}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Paid by" error={form.formState.errors.paidByUid?.message}>
                <Select {...form.register("paidByUid")}>
                  {members.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
                </Select>
              </Field>
              <Field label="Day of month" error={form.formState.errors.dayOfMonth?.message}>
                <Input type="number" min={1} max={31} {...form.register("dayOfMonth")} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start month" error={form.formState.errors.startMonth?.message}>
                <Input type="month" {...form.register("startMonth")} />
              </Field>
              <label className="flex min-h-11 items-center gap-3 rounded-md border border-sage/15 bg-white px-3 text-sm font-semibold text-ink">
                <input type="checkbox" {...form.register("active")} />
                Active
              </label>
            </div>
            <Field label="Notes" error={form.formState.errors.notes?.message}>
              <Textarea placeholder="Optional note" {...form.register("notes")} />
            </Field>
            <Button type="submit" disabled={submitting || members.length < 2}>
              <Plus className="h-4 w-4" />
              {submitting ? "Saving..." : editingBill ? "Save changes" : "Add recurring bill"}
            </Button>
          </form>
        </Card>

        <section className="grid content-start gap-3">
          {activeRecurringBills.length ? activeRecurringBills.map((bill) => (
            <RecurringBillCard
              key={bill.id}
              bill={bill}
              members={members}
              onEdit={setEditingBill}
              onToggle={toggleBill}
              onDelete={setConfirmBill}
            />
          )) : (
            <Card className="grid place-items-center gap-2 py-8 text-center text-sm text-ink/60">
              <CalendarClock className="h-8 w-8 text-sage" />
              No recurring bills yet.
            </Card>
          )}
        </section>
      </div>
      <ConfirmDialog
        open={Boolean(confirmBill)}
        title="Delete recurring bill?"
        message="Future expenses will stop being created. Existing expenses stay in your ledger."
        confirmLabel="Delete"
        onCancel={() => setConfirmBill(null)}
        onConfirm={() => void removeBill()}
      />
    </section>
  );
}

export function RecurringBillsSummary() {
  const { household, members } = useHousehold();
  const { activeRecurringBills } = useRecurringBills(household?.id, members);
  const visibleBills = activeRecurringBills.slice(0, 3);

  return (
    <section className="grid gap-3">
      <SectionHeader title="Recurring bills" />
      {visibleBills.length ? visibleBills.map((bill) => {
        const payer = members.find((member) => member.uid === bill.paidByUid)?.displayName ?? "Someone";
        return (
          <Card key={bill.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-bold text-ink">{bill.description}</p>
                  <Badge>{bill.active ? "Active" : "Paused"}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink/55">Paid by {payer} - next {formatDate(nextDueDate(bill))}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-ink">{formatMoney(bill.amountMinor)}</p>
            </div>
          </Card>
        );
      }) : (
        <Card className="text-sm text-ink/60">No recurring bills yet.</Card>
      )}
    </section>
  );
}

function RecurringBillCard({
  bill,
  members,
  onEdit,
  onToggle,
  onDelete
}: {
  bill: RecurringBill;
  members: HouseholdMember[];
  onEdit: (bill: RecurringBill) => void;
  onToggle: (bill: RecurringBill) => void;
  onDelete: (bill: RecurringBill) => void;
}) {
  const payer = members.find((member) => member.uid === bill.paidByUid)?.displayName ?? "Someone";

  return (
    <Card className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-bold text-ink">{bill.description}</h2>
            <Badge>{bill.active ? "Active" : "Paused"}</Badge>
          </div>
          <p className="mt-1 text-xs text-ink/55">Paid by {payer} - next {formatDate(nextDueDate(bill))}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-ink">{formatMoney(bill.amountMinor)}</p>
          <p className="mt-1 text-xs text-ink/55">{bill.category}</p>
        </div>
      </div>
      {bill.notes ? <p className="text-sm text-ink/60">{bill.notes}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onEdit(bill)}><Pencil className="h-4 w-4" />Edit</Button>
        <Button variant="secondary" onClick={() => void onToggle(bill)}><Power className="h-4 w-4" />{bill.active ? "Pause" : "Resume"}</Button>
        <Button variant="danger" onClick={() => onDelete(bill)}><Trash2 className="h-4 w-4" />Delete</Button>
      </div>
    </Card>
  );
}

function emptyValues(paidByUid = ""): RecurringBillFormValues {
  return {
    description: "",
    amount: "",
    category: "Rent",
    paidByUid,
    dayOfMonth: new Date().getDate(),
    startMonth: currentMonth(),
    active: true,
    notes: ""
  };
}

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function nextDueDate(bill: RecurringBill) {
  const today = new Date();
  const [startYear, startMonth] = bill.startMonth.split("-").map(Number);
  const startDate = dueDate(startYear, startMonth - 1, bill.dayOfMonth);
  let next = dueDate(today.getFullYear(), today.getMonth(), bill.dayOfMonth);

  if (next < today) {
    next = dueDate(today.getFullYear(), today.getMonth() + 1, bill.dayOfMonth);
  }

  return startDate > next ? startDate : next;
}

function dueDate(year: number, monthIndex: number, dayOfMonth: number) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(dayOfMonth, lastDay));
}
