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
    watch,
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
      participants: initialExpense?.participants ?? members.map((member) => member.uid),
      notes: initialExpense?.notes ?? ""
    }
  });

  const participants = watch("participants");
  const splitType = watch("splitType");

  useEffect(() => {
    if (!watch("paidByUid") && members[0]) setValue("paidByUid", members[0].uid);
  }, [members, setValue, watch]);

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
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
      <Field label="Split type" error={errors.splitType?.message} hint="Exact, percentage, and shares are scaffolded for a later release.">
        <Select {...register("splitType")} onChange={(event) => setValue("splitType", event.target.value as ExpenseFormValues["splitType"])}>
          <option value="equal">Equal split</option>
          <option value="exact" disabled>Exact amounts - coming soon</option>
          <option value="percentage" disabled>Percentages - coming soon</option>
          <option value="shares" disabled>Shares - coming soon</option>
        </Select>
      </Field>
      {splitType !== "equal" ? (
        <p className="rounded-md bg-honey/15 p-3 text-sm font-semibold text-ink">Only equal split is enabled in this MVP.</p>
      ) : null}
      <div className="grid gap-2">
        <p className="text-sm font-medium text-ink">Participants</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {members.map((member) => (
            <label key={member.uid} className="flex items-center gap-3 rounded-md border border-sage/15 bg-white p-3 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                value={member.uid}
                checked={participants?.includes(member.uid) ?? false}
                onChange={(event) => {
                  const next = new Set(participants ?? []);
                  if (event.target.checked) next.add(member.uid);
                  else next.delete(member.uid);
                  setValue("participants", Array.from(next), { shouldValidate: true });
                }}
              />
              {member.displayName}
            </label>
          ))}
        </div>
        {errors.participants?.message ? <span className="text-xs font-semibold text-coral">{errors.participants.message}</span> : null}
      </div>
      <Field label="Notes" error={errors.notes?.message}>
        <Textarea placeholder="Optional note" {...register("notes")} />
      </Field>
      <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save expense"}</Button>
    </form>
  );
}
