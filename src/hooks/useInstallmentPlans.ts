"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listenToInstallmentPlans, materializeDueInstallmentExpenses } from "@/lib/firebase/firestore";
import type { HouseholdMember, InstallmentPlan } from "@/types";

export function useInstallmentPlans(householdId?: string, members: HouseholdMember[] = []) {
  const { appUser, loading } = useAuth();
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setInstallmentPlans([]);
    if (!householdId) {
      setPlansLoading(false);
      return;
    }

    setPlansLoading(true);
    const unsubscribe = listenToInstallmentPlans(householdId, (items) => {
      if (cancelled) return;
      setInstallmentPlans(items.filter((plan) => plan.householdId === householdId));
      setPlansLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [householdId]);

  const activeInstallmentPlans = useMemo(
    () => installmentPlans.filter((plan) => !plan.deletedAt && plan.householdId === householdId),
    [householdId, installmentPlans]
  );

  useEffect(() => {
    if (loading || !appUser || !householdId || !members.length) return;
    const safePlans = activeInstallmentPlans.filter((plan) => plan.householdId === householdId);
    void materializeDueInstallmentExpenses(householdId, appUser.uid, members, safePlans);
  }, [activeInstallmentPlans, appUser, householdId, loading, members]);

  return { installmentPlans, activeInstallmentPlans, loading: plansLoading };
}
