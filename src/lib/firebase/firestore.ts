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
import {
  calculateAmountShares,
  calculateEqualShares,
  calculateOnePersonShares,
  calculatePercentageShares,
  parseMoneyToMinor
} from "@/lib/money";
import { generateInviteCode } from "@/lib/utils";
import type { AppUser, Expense, Household, HouseholdMember, RecurringBill, Settlement } from "@/types";
import type { ExpenseFormValues, RecurringBillFormValues, SettlementFormValues } from "@/lib/validators";

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

export function listenToRecurringBills(householdId: string, callback: (bills: RecurringBill[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "households", householdId, "recurringBills"), orderBy("description", "asc")),
    (snapshot) => callback(snapshot.docs.map((item) => withId<RecurringBill>(item.id, item.data())))
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
  const shares = calculateExpenseShares(amountMinor, values);
  const payload = {
    householdId,
    description: values.description,
    amountMinor,
    currency: "ILS",
    category: values.category,
    paidByUid: values.paidByUid,
    splitType: values.splitType,
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

function calculateExpenseShares(amountMinor: number, values: ExpenseFormValues) {
  if (values.splitType === "one_person") {
    return calculateOnePersonShares(amountMinor, values.participants, values.owedByUid ?? "");
  }

  if (values.splitType === "amounts") {
    return calculateAmountShares(amountMinor, values.participants, values.shareAmounts);
  }

  if (values.splitType === "percentage") {
    return calculatePercentageShares(amountMinor, values.participants, values.sharePercentages);
  }

  return calculateEqualShares(amountMinor, values.participants);
}

export async function softDeleteExpense(householdId: string, expenseId: string) {
  await updateDoc(doc(db, "households", householdId, "expenses", expenseId), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function saveRecurringBill(
  householdId: string,
  userUid: string,
  values: RecurringBillFormValues,
  billId?: string
) {
  const payload = {
    householdId,
    description: values.description,
    amountMinor: parseMoneyToMinor(values.amount),
    currency: "ILS",
    category: values.category,
    paidByUid: values.paidByUid,
    dayOfMonth: values.dayOfMonth,
    startMonth: values.startMonth,
    frequencyMonths: values.frequencyMonths,
    active: values.active,
    notes: values.notes ?? "",
    updatedAt: serverTimestamp()
  };

  if (billId) {
    await updateDoc(doc(db, "households", householdId, "recurringBills", billId), payload);
    return billId;
  }

  const billRef = await addDoc(collection(db, "households", householdId, "recurringBills"), {
    ...payload,
    createdByUid: userUid,
    createdAt: serverTimestamp()
  });
  return billRef.id;
}

export async function softDeleteRecurringBill(householdId: string, billId: string) {
  await updateDoc(doc(db, "households", householdId, "recurringBills", billId), {
    active: false,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function toggleRecurringBill(householdId: string, billId: string, active: boolean) {
  await updateDoc(doc(db, "households", householdId, "recurringBills", billId), {
    active,
    updatedAt: serverTimestamp()
  });
}

export async function materializeDueRecurringExpenses(
  householdId: string,
  userUid: string,
  members: HouseholdMember[],
  bills: RecurringBill[],
  today = new Date()
) {
  const memberUids = members.map((member) => member.uid);
  if (!memberUids.length) return;

  for (const bill of bills.filter((item) => item.active && !item.deletedAt)) {
    if (!memberUids.includes(bill.paidByUid)) continue;

    for (const month of dueMonths(bill.startMonth, today, bill.frequencyMonths ?? 1)) {
      const date = dueDateForMonth(month, bill.dayOfMonth);
      if (date > today) continue;

      const recurringOccurrenceKey = `${bill.id}_${month}`;
      const expenseRef = doc(db, "households", householdId, "expenses", recurringOccurrenceKey);
      const existingExpense = await getDoc(expenseRef);
      if (existingExpense.exists()) continue;

      const shares = calculateEqualShares(bill.amountMinor, memberUids);
      await setDoc(expenseRef, {
        householdId,
        description: bill.description,
        amountMinor: bill.amountMinor,
        currency: "ILS",
        category: bill.category,
        paidByUid: bill.paidByUid,
        splitType: "equal",
        participants: memberUids,
        shares,
        date: formatInputDate(date),
        notes: bill.notes ?? "",
        recurringBillId: bill.id,
        recurringOccurrenceKey,
        createdByUid: userUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }
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

export async function softDeleteSettlement(householdId: string, settlementId: string) {
  await updateDoc(doc(db, "households", householdId, "settlements", settlementId), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

function dueMonths(startMonth: string, today: Date, frequencyMonths: number) {
  const [startYear, startMonthNumber] = startMonth.split("-").map(Number);
  if (!startYear || !startMonthNumber) return [];

  const months: string[] = [];
  const cursor = new Date(startYear, startMonthNumber - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 1);
  const increment = frequencyMonths === 2 ? 2 : 1;

  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + increment);
  }

  return months;
}

function dueDateForMonth(month: string, dayOfMonth: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return new Date(year, monthNumber - 1, Math.min(dayOfMonth, lastDay));
}

function formatInputDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
