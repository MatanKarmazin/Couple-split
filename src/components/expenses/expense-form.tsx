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
    formState: { errors }
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: initialExpense?.description ?? "",
      amount: initialExpense ? minorToInput(initialExpense.amountMinor) : "",
      date: inputDate(initialExpense?.date),
      category: initialExpense?.category ?? "Food",
      paidByUid: initialExpense?.paidByUid ?? members[0]?.uid ?? "",
      splitType: "equal",
      participants: members.map((member) => member.uid),
      notes: initialExpense?.notes ?? ""
    }
  });

  useEffect(() => {
    const memberUids = members.map((member) => member.uid);
    const paidByUid = getValues("paidByUid");

    setValue("participants", memberUids, { shouldValidate: true });
    setValue("splitType", "equal", { shouldValidate: true });
    if (!paidByUid || !memberUids.includes(paidByUid)) {
      setValue("paidByUid", members[0]?.uid ?? "", { shouldValidate: true });
    }
  }, [members, getValues, setValue]);

  async function submit(values: ExpenseFormValues) {
    await onSubmit({
      ...values,
      splitType: "equal",
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
      <Field label="Notes" error={errors.notes?.message}>
        <Textarea placeholder="Optional note" {...register("notes")} />
      </Field>
      <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save expense"}</Button>
    </form>
  );
}
