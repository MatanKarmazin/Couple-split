"use client";

import { useEffect, useMemo, useState } from "react";
import { listenToSettlements } from "@/lib/firebase/firestore";
import type { Settlement } from "@/types";

export function useSettlements(householdId?: string) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setSettlements([]);
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenToSettlements(householdId, (items) => {
      if (cancelled) return;
      setSettlements(items.filter((settlement) => settlement.householdId === householdId));
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [householdId]);

  const activeSettlements = useMemo(
    () => settlements.filter((settlement) => !settlement.deletedAt && settlement.householdId === householdId),
    [householdId, settlements]
  );
  return { settlements, activeSettlements, loading };
}
