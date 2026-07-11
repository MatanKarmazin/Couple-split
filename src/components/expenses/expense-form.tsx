"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { categories, expenseSchema, type ExpenseFormValues } from "@/lib/validators";
import { inputDate } from "@/lib/dates";
import {
  calculateAmountShares,
  calculateEqualShares,
  calculateOnePersonShares,
  calculatePercentageShares,
  formatMoney,
  minorToInput,
  parseMoneyToMinor
} from "@/lib/money";
import type { Expense, HouseholdMember } from "@/types";

export function ExpenseForm({
  members,
  initialExpense,
  onSubmit,
  submitting
}: {
  members: HouseholdMember[];
  initialExpense?: Expense;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: initialExpense?.description ?? "",
      amount: initialExpense ? minorToInput(initialExpense.amountMinor) : "",
      date: inputDate(initialExpense?.date),
      category: initialExpense?.category ?? "Food",
      paidByUid: initialExpense?.paidByUid ?? members[0]?.uid ?? "",
      splitType: initialExpense?.splitType ?? "equal",
      participants: members.map((member) => member.uid),
      owedByUid: owedByDefault(initialExpense, members),
      shareAmounts: amountDefaults(initialExpense, members),
      sharePercentages: percentageDefaults(initialExpense, members),
      notes: initialExpense?.notes ?? ""
    }
  });

  const splitType = watch("splitType");
  const amount = watch("amount");
  const paidByUid = watch("paidByUid");
  const owedByUid = watch("owedByUid");
  const shareAmounts = watch("shareAmounts");
  const sharePercentages = watch("sharePercentages");
  const splitPreview = useMemo(
    () =>
      buildSplitPreview({
        amount,
        splitType,
        paidByUid,
        owedByUid,
        shareAmounts,
        sharePercentages,
        members
      }),
    [amount, members, owedByUid, paidByUid, shareAmounts, sharePercentages, splitType]
  );

  useEffect(() => {
    const memberUids = members.map((member) => member.uid);
    const paidByUid = getValues("paidByUid");

    setValue("participants", memberUids, { shouldValidate: true });
    if (!paidByUid || !memberUids.includes(paidByUid)) {
      setValue("paidByUid", members[0]?.uid ?? "", { shouldValidate: true });
    }
    if (!getValues("owedByUid") && members[0]) {
      setValue("owedByUid", members[0].uid, { shouldValidate: true });
    }
  }, [members, getValues, setValue]);

  async function submit(values: ExpenseFormValues) {
    await onSubmit({
      ...values,
      participants: members.map((member) => member.uid)
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(submit)}>
      <Field label="Description" error={errors.description?.message}>
        <Input placeholder="Dinner, groceries, rent..." {...register("description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount" error={errors.amount?.message}>
          <Input inputMode="decimal" placeholder="123.45" {...register("amount")} />
        </Field>
        <Field label="Date" error={errors.date?.message}>
          <Input type="date" {...register("date")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" error={errors.category?.message}>
          <Select {...register("category")}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
        </Field>
        <Field label="Paid by" error={errors.paidByUid?.message}>
          <Select {...register("paidByUid")}>
            {members.map((member) => (
              <option key={member.uid} value={member.uid}>{member.displayName}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Split" error={errors.splitType?.message}>
        <Select {...register("splitType")}>
          <option value="equal">Equal split</option>
          <option value="one_person">One person owes all</option>
          <option value="amounts">Custom amounts</option>
          <option value="percentage">Custom percentage</option>
        </Select>
      </Field>
      {splitType === "one_person" ? (
        <Field label="Owed by" error={errors.owedByUid?.message}>
          <Select {...register("owedByUid")}>
            {members.map((member) => (
              <option key={member.uid} value={member.uid}>{member.displayName}</option>
            ))}
          </Select>
        </Field>
      ) : null}
      {splitType === "amounts" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {members.map((member) => (
            <Field key={member.uid} label={`${member.displayName} share`}>
              <Input inputMode="decimal" placeholder="0.00" {...register(`shareAmounts.${member.uid}`)} />
            </Field>
          ))}
        </div>
      ) : null}
      {splitType === "percentage" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {members.map((member, index) => {
            return (
              <Field key={member.uid} label={`${member.displayName} percent`}>
                <Input
                  inputMode="decimal"
                  placeholder={index === 0 ? "50" : "50"}
                  {...register(`sharePercentages.${member.uid}`)}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setValue(`sharePercentages.${member.uid}`, event.target.value, { shouldValidate: true });
                    if (members.length === 2 && Number.isFinite(value) && value >= 0 && value <= 100) {
                      setValue(`sharePercentages.${members[index === 0 ? 1 : 0].uid}`, String(100 - value), { shouldValidate: true });
                    }
                  }}
                />
              </Field>
            );
          })}
        </div>
      ) : null}
      <Field label="Notes" error={errors.notes?.message}>
        <Textarea placeholder="Optional note" {...register("notes")} />
      </Field>
      <div className="rounded-lg bg-surface-muted p-4">
        <p className="text-sm font-bold text-text">Split preview</p>
        {splitPreview ? (
          <div className="mt-2 grid gap-2 text-sm text-text-muted">
            <p>
              {splitPreview.payerName} pays {formatMoney(splitPreview.amountMinor)}.
            </p>
            <div className="grid gap-1">
              {splitPreview.shares.map((share) => (
                <div key={share.uid} className="flex items-center justify-between gap-3 rounded-md bg-surface/70 px-3 py-2">
                  <span className="font-semibold text-text">{share.name}</span>
                  <span>{formatMoney(share.amountMinor)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-text-muted">Enter an amount and split details to preview who owes what.</p>
        )}
      </div>
      <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save expense"}</Button>
    </form>
  );
}

function buildSplitPreview({
  amount,
  splitType,
  paidByUid,
  owedByUid,
  shareAmounts,
  sharePercentages,
  members
}: {
  amount: string;
  splitType: ExpenseFormValues["splitType"];
  paidByUid: string;
  owedByUid?: string;
  shareAmounts?: Record<string, string>;
  sharePercentages?: Record<string, string>;
  members: HouseholdMember[];
}) {
  const participants = members.map((member) => member.uid);
  if (!participants.length || !paidByUid) return null;

  try {
    const amountMinor = parseMoneyToMinor(amount);
    const shares =
      splitType === "one_person"
        ? calculateOnePersonShares(amountMinor, participants, owedByUid ?? "")
        : splitType === "amounts"
          ? calculateAmountShares(amountMinor, participants, shareAmounts)
          : splitType === "percentage"
            ? calculatePercentageShares(amountMinor, participants, sharePercentages)
            : calculateEqualShares(amountMinor, participants);
    const payerName = members.find((member) => member.uid === paidByUid)?.displayName ?? "Someone";

    return {
      amountMinor,
      payerName,
      shares: members.map((member) => ({
        uid: member.uid,
        name: member.displayName,
        amountMinor: shares[member.uid] ?? 0
      }))
    };
  } catch {
    return null;
  }
}

function owedByDefault(expense: Expense | undefined, members: HouseholdMember[]) {
  if (expense?.splitType === "one_person") {
    return Object.entries(expense.shares).find(([, share]) => share === expense.amountMinor)?.[0] ?? members[0]?.uid ?? "";
  }

  return members[0]?.uid ?? "";
}

function amountDefaults(expense: Expense | undefined, members: HouseholdMember[]) {
  return members.reduce<Record<string, string>>((values, member) => {
    values[member.uid] = expense ? minorToInput(expense.shares[member.uid] ?? 0) : "";
    return values;
  }, {});
}

function percentageDefaults(expense: Expense | undefined, members: HouseholdMember[]) {
  return members.reduce<Record<string, string>>((values, member) => {
    const share = expense?.shares[member.uid] ?? 0;
    values[member.uid] = expense?.amountMinor ? String(Math.round((share / expense.amountMinor) * 100)) : "50";
    return values;
  }, {});
}
