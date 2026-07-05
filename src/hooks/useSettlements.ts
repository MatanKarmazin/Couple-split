"use client";

import { useEffect, useState } from "react";
import { listenToSettlements } from "@/lib/firebase/firestore";
import type { Settlement } from "@/types";

export function useSettlements(householdId?: string) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSettlements([]);
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    return listenToSettlements(householdId, (items) => {
      setSettlements(items);
      setLoading(false);
    });
  }, [householdId]);

  return { settlements, loading };
}
