"use client";

import { useEffect, useMemo, useState } from "react";
import { listenToRecurringBills, materializeDueRecurringExpenses } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import type { HouseholdMember, RecurringBill } from "@/types";

export function useRecurringBills(householdId?: string, members: HouseholdMember[] = []) {
  const { appUser } = useAuth();
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRecurringBills([]);
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    return listenToRecurringBills(householdId, (items) => {
      setRecurringBills(items);
      setLoading(false);
    });
  }, [householdId]);

  const activeRecurringBills = useMemo(
    () => recurringBills.filter((bill) => !bill.deletedAt),
    [recurringBills]
  );

  useEffect(() => {
    if (!householdId || !appUser || members.length === 0 || loading) return;
    void materializeDueRecurringExpenses(householdId, appUser.uid, members, activeRecurringBills);
  }, [activeRecurringBills, appUser, householdId, loading, members]);

  return { recurringBills, activeRecurringBills, loading };
}
