"use client";

import { useEffect, useMemo, useState } from "react";
import { listenToHousehold, listenToHouseholds, listenToMembers, switchHousehold } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import type { Household, HouseholdMember } from "@/types";

export function useHousehold() {
  const { appUser } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const householdId = appUser?.defaultHouseholdId;
  const householdIds = useMemo(() => {
    const ids = appUser?.householdIds ?? [];
    return ids.length ? ids : householdId ? [householdId] : [];
  }, [appUser?.householdIds, householdId]);

  useEffect(() => {
    if (!appUser) {
      setHouseholds([]);
      return;
    }

    return listenToHouseholds(householdIds, setHouseholds);
  }, [appUser, householdIds]);

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

  useEffect(() => {
    if (!appUser || loading || household) return;
    const fallback = households.find((item) => item.id !== householdId);
    if (fallback) {
      void switchHousehold(appUser.uid, fallback.id);
    }
  }, [appUser, household, householdId, households, loading]);

  const activeMembers = useMemo(() => {
    const activeIds = new Set(household?.memberIds ?? []);
    const orderedMembers = members.filter((member) => activeIds.has(member.uid) && member.status !== "left" && member.status !== "removed");
    if (!appUser?.uid) return orderedMembers;

    return [...orderedMembers].sort((a, b) => {
      if (a.uid === appUser.uid) return -1;
      if (b.uid === appUser.uid) return 1;
      return 0;
    });
  }, [appUser?.uid, household?.memberIds, members]);

  const partner = useMemo(
    () => activeMembers.find((member) => member.uid !== appUser?.uid) ?? null,
    [activeMembers, appUser?.uid]
  );

  return { household, households, members, activeMembers, partner, loading };
}
