"use client";

import { useEffect, useMemo, useState } from "react";
import { listenToExpenses, listenToRecurringBills } from "@/lib/firebase/firestore";
import type { Expense, RecurringBill } from "@/types";

export function useExpenses(householdId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setExpenses([]);
    setRecurringBills([]);
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribeExpenses = listenToExpenses(householdId, (items) => {
      if (cancelled) return;
      setExpenses(items.filter((expense) => expense.householdId === householdId));
      setLoading(false);
    });
    const unsubscribeRecurringBills = listenToRecurringBills(householdId, (items) => {
      if (cancelled) return;
      setRecurringBills(items.filter((bill) => bill.householdId === householdId));
    });

    return () => {
      cancelled = true;
      unsubscribeExpenses();
      unsubscribeRecurringBills();
    };
  }, [householdId]);

  const recurringBillIds = useMemo(() => new Set(recurringBills.map((bill) => bill.id)), [recurringBills]);
  const activeExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        if (expense.deletedAt || expense.householdId !== householdId) return false;
        return !expense.recurringBillId || recurringBillIds.has(expense.recurringBillId);
      }),
    [expenses, householdId, recurringBillIds]
  );
  return { expenses, activeExpenses, loading };
}
