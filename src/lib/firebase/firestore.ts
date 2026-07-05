import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { calculateEqualShares, parseMoneyToMinor } from "@/lib/money";
import { generateInviteCode } from "@/lib/utils";
import type { AppUser, Expense, Household, HouseholdMember, Settlement } from "@/types";
import type { ExpenseFormValues, SettlementFormValues } from "@/lib/validators";

function withId<T>(id: string, data: Record<string, unknown>) {
  return { id, ...data } as T;
}

export function listenToUser(uid: string, callback: (user: AppUser | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as AppUser) : null);
  });
}

export function listenToHousehold(householdId: string, callback: (household: Household | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "households", householdId), (snapshot) => {
    callback(snapshot.exists() ? withId<Household>(snapshot.id, snapshot.data()) : null);
  });
}

export function listenToMembers(householdId: string, callback: (members: HouseholdMember[]) => void): Unsubscribe {
  return onSnapshot(collection(db, "households", householdId, "members"), (snapshot) => {
    callback(snapshot.docs.map((member) => member.data() as HouseholdMember));
  });
}

export function listenToExpenses(householdId: string, callback: (expenses: Expense[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "households", householdId, "expenses"), orderBy("date", "desc")),
    (snapshot) => callback(snapshot.docs.map((item) => withId<Expense>(item.id, item.data())))
  );
}

export function listenToSettlements(householdId: string, callback: (settlements: Settlement[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "households", householdId, "settlements"), orderBy("date", "desc")),
    (snapshot) => callback(snapshot.docs.map((item) => withId<Settlement>(item.id, item.data())))
  );
}

export async function createHousehold(user: AppUser, name: string) {
  const inviteCode = generateInviteCode();
  const householdRef = doc(collection(db, "households"));
  const member: HouseholdMember = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL ?? null,
    role: "owner"
  };

  await setDoc(householdRef, {
    name,
    createdByUid: user.uid,
    memberIds: [user.uid],
    inviteCode,
    defaultCurrency: "ILS",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await setDoc(doc(db, "households", householdRef.id, "members", user.uid), {
    ...member,
    joinedAt: serverTimestamp()
  });
  await setDoc(doc(db, "inviteCodes", inviteCode), {
    householdId: householdRef.id,
    createdByUid: user.uid,
    createdAt: serverTimestamp()
  });
  await updateDoc(doc(db, "users", user.uid), {
    defaultHouseholdId: householdRef.id,
    updatedAt: serverTimestamp()
  });

  return householdRef.id;
}

export async function ensureInviteCode(household: Household, user: AppUser) {
  if (household.createdByUid !== user.uid) return;

  const inviteRef = doc(db, "inviteCodes", household.inviteCode);
  const inviteSnapshot = await getDoc(inviteRef);
  if (inviteSnapshot.exists()) return;

  await setDoc(inviteRef, {
    householdId: household.id,
    createdByUid: user.uid,
    createdAt: serverTimestamp()
  });
}

export async function joinHousehold(user: AppUser, inviteCode: string) {
  const inviteSnapshot = await getDoc(doc(db, "inviteCodes", inviteCode));
  if (!inviteSnapshot.exists()) throw new Error("No household found for that invite code.");

  const { householdId } = inviteSnapshot.data() as { householdId: string };
  await setDoc(doc(db, "inviteCodes", inviteCode, "joins", user.uid), {
    uid: user.uid,
    householdId,
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, "households", householdId), {
    memberIds: arrayUnion(user.uid),
    updatedAt: serverTimestamp()
  });
  await setDoc(doc(db, "households", householdId, "members", user.uid), {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL ?? null,
    role: "member",
    joinedAt: serverTimestamp()
  });
  await updateDoc(doc(db, "users", user.uid), {
    defaultHouseholdId: householdId,
    updatedAt: serverTimestamp()
  });

  return householdId;
}

export async function saveExpense(
  householdId: string,
  userUid: string,
  values: ExpenseFormValues,
  expenseId?: string
) {
  const amountMinor = parseMoneyToMinor(values.amount);
  const shares = calculateEqualShares(amountMinor, values.participants);
  const payload = {
    householdId,
    description: values.description,
    amountMinor,
    currency: "ILS",
    category: values.category,
    paidByUid: values.paidByUid,
    splitType: "equal",
    participants: values.participants,
    shares,
    date: values.date,
    notes: values.notes ?? "",
    updatedAt: serverTimestamp()
  };

  if (expenseId) {
    await updateDoc(doc(db, "households", householdId, "expenses", expenseId), payload);
    return expenseId;
  }

  const expenseRef = await addDoc(collection(db, "households", householdId, "expenses"), {
    ...payload,
    createdByUid: userUid,
    createdAt: serverTimestamp()
  });
  return expenseRef.id;
}

export async function softDeleteExpense(householdId: string, expenseId: string) {
  await updateDoc(doc(db, "households", householdId, "expenses", expenseId), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function createSettlement(householdId: string, userUid: string, values: SettlementFormValues) {
  const settlementRef = await addDoc(collection(db, "households", householdId, "settlements"), {
    householdId,
    fromUid: values.fromUid,
    toUid: values.toUid,
    amountMinor: parseMoneyToMinor(values.amount),
    currency: "ILS",
    date: values.date,
    note: values.note ?? "",
    createdByUid: userUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return settlementRef.id;
}
