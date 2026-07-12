export type CurrencyCode = "ILS";

export type Category =
  | "Food"
  | "Groceries"
  | "Rent"
  | "Utilities"
  | "Transport"
  | "Entertainment"
  | "Travel"
  | "Shopping"
  | "Health"
  | "Other";

export type SplitType = "equal" | "one_person" | "amounts" | "percentage";

export type MemberRole = "owner" | "member";
export type MemberStatus = "active" | "left" | "removed";

export type FirestoreDate =
  | Date
  | string
  | number
  | { seconds: number; nanoseconds?: number }
  | { toDate: () => Date }
  | null
  | undefined;

export type AppUser = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  defaultHouseholdId?: string;
  householdIds?: string[];
};

export type Household = {
  id: string;
  name: string;
  createdByUid: string;
  memberIds: string[];
  inviteCode: string;
  defaultCurrency: CurrencyCode;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
};

export type HouseholdMember = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  role: MemberRole;
  status?: MemberStatus;
  joinedAt?: FirestoreDate;
  leftAt?: FirestoreDate;
  removedByUid?: string;
};

export type Expense = {
  id: string;
  householdId: string;
  description: string;
  amountMinor: number;
  currency: CurrencyCode;
  category: Category;
  paidByUid: string;
  splitType: SplitType;
  participants: string[];
  shares: Record<string, number>;
  date: FirestoreDate;
  notes?: string;
  recurringBillId?: string;
  recurringOccurrenceKey?: string;
  createdByUid: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  deletedAt?: FirestoreDate;
};

export type Settlement = {
  id: string;
  householdId: string;
  fromUid: string;
  toUid: string;
  amountMinor: number;
  currency: CurrencyCode;
  date: FirestoreDate;
  note?: string;
  createdByUid: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  deletedAt?: FirestoreDate;
};

export type RecurringBill = {
  id: string;
  householdId: string;
  description: string;
  amountMinor: number;
  currency: CurrencyCode;
  category: Category;
  paidByUid: string;
  dayOfMonth: number;
  startMonth: string;
  frequencyMonths?: 1 | 2;
  active: boolean;
  notes?: string;
  createdByUid: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  deletedAt?: FirestoreDate;
};

export type BalanceMap = Record<string, number>;
