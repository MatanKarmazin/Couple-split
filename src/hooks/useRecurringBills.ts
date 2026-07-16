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
    let cancelled = false;
    setRecurringBills([]);
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenToRecurringBills(householdId, (items) => {
      if (cancelled) return;
      setRecurringBills(items.filter((bill) => bill.householdId === householdId));
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [householdId]);

  const activeRecurringBills = useMemo(
    () => recurringBills.filter((bill) => !bill.deletedAt && bill.householdId === householdId),
    [householdId, recurringBills]
  );

  useEffect(() => {
    if (!householdId || !appUser || members.length === 0 || loading) return;
    const safeBills = activeRecurringBills.filter((bill) => bill.householdId === householdId);
    void materializeDueRecurringExpenses(householdId, appUser.uid, members, safeBills);
  }, [activeRecurringBills, appUser, householdId, loading, members]);

  return { recurringBills, activeRecurringBills, loading };
}
