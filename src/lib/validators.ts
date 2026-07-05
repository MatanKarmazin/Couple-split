import { z } from "zod";
import { parseMoneyToMinor } from "@/lib/money";
import type { Category, SplitType } from "@/types";

export const categories = [
  "Food",
  "Groceries",
  "Rent",
  "Utilities",
  "Transport",
  "Entertainment",
  "Travel",
  "Shopping",
  "Health",
  "Other"
] as const satisfies readonly Category[];

export const splitTypes = ["equal", "exact", "percentage", "shares"] as const satisfies readonly SplitType[];

export const householdSchema = z.object({
  name: z.string().trim().min(2, "Name should be at least 2 characters.").max(48)
});

export const joinHouseholdSchema = z.object({
  inviteCode: z.string().trim().min(4, "Enter the invite code.").max(16).transform((value) => value.toUpperCase())
});

export const expenseSchema = z.object({
  description: z.string().trim().min(2, "Add a short description.").max(80),
  amount: z.string().trim().refine((value) => {
    try {
      return parseMoneyToMinor(value) > 0;
    } catch {
      return false;
    }
  }, "Enter a valid positive amount."),
  date: z.string().min(1, "Choose a date."),
  category: z.enum(categories),
  paidByUid: z.string().min(1, "Choose who paid."),
  splitType: z.enum(splitTypes),
  participants: z.array(z.string()).min(1, "Choose at least one participant."),
  notes: z.string().max(240).optional()
});

export const settlementSchema = z.object({
  fromUid: z.string().min(1, "Choose who paid."),
  toUid: z.string().min(1, "Choose who received."),
  amount: z.string().trim().refine((value) => {
    try {
      return parseMoneyToMinor(value) > 0;
    } catch {
      return false;
    }
  }, "Enter a valid positive amount."),
  date: z.string().min(1, "Choose a date."),
  note: z.string().max(180).optional()
}).refine((data) => data.fromUid !== data.toUid, {
  message: "Choose two different people.",
  path: ["toUid"]
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type HouseholdFormValues = z.infer<typeof householdSchema>;
export type JoinHouseholdFormValues = z.infer<typeof joinHouseholdSchema>;
export type SettlementFormValues = z.infer<typeof settlementSchema>;
