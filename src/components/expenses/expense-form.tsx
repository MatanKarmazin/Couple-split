"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { categories, expenseSchema, type ExpenseFormValues } from "@/lib/validators";
import { inputDate } from "@/lib/dates";
import { minorToInput } from "@/lib/money";
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
      <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save expense"}</Button>
    </form>
  );
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
