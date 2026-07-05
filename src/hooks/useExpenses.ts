"use client";

import { useEffect, useMemo, useState } from "react";
import { listenToExpenses } from "@/lib/firebase/firestore";
import type { Expense } from "@/types";

export function useExpenses(householdId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setExpenses([]);
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    return listenToExpenses(householdId, (items) => {
      setExpenses(items);
      setLoading(false);
    });
  }, [householdId]);

  const activeExpenses = useMemo(() => expenses.filter((expense) => !expense.deletedAt), [expenses]);
  return { expenses, activeExpenses, loading };
}
