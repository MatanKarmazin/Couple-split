"use client";

import { useEffect, useMemo, useState } from "react";
import { listenToHousehold, listenToMembers } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import type { Household, HouseholdMember } from "@/types";

export function useHousehold() {
  const { appUser } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const householdId = appUser?.defaultHouseholdId;

  useEffect(() => {
    setHousehold(null);
    setMembers([]);
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribeHousehold = listenToHousehold(householdId, (value) => {
      setHousehold(value);
      setLoading(false);
    });
    const unsubscribeMembers = listenToMembers(householdId, setMembers);

    return () => {
      unsubscribeHousehold();
      unsubscribeMembers();
    };
  }, [householdId]);

  const partner = useMemo(
    () => members.find((member) => member.uid !== appUser?.uid) ?? null,
    [members, appUser?.uid]
  );

  return { household, members, partner, loading };
}
