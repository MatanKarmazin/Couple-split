export type CurrencyCode = string;

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
  householdCurrency?: CurrencyCode;
  householdAmountMinor?: number;
  category: Category;
  paidByUid: string;
  splitType: SplitType;
  participants: string[];
  shares: Record<string, number>;
  householdShares?: Record<string, number>;
  exchangeRate?: ExchangeRateInfo;
  date: FirestoreDate;
  notes?: string;
  recurringBillId?: string;
  recurringOccurrenceKey?: string;
  installmentPlanId?: string;
  installmentIndex?: number;
  installmentCount?: number;
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
  householdCurrency?: CurrencyCode;
  householdAmountMinor?: number;
  exchangeRate?: ExchangeRateInfo;
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

export type InstallmentPlan = {
  id: string;
  householdId: string;
  description: string;
  totalAmountMinor: number;
  currency: CurrencyCode;
  householdCurrency?: CurrencyCode;
  householdTotalAmountMinor?: number;
  category: Category;
  paidByUid: string;
  splitType: SplitType;
  participants: string[];
  shares: Record<string, number>;
  householdShares?: Record<string, number>;
  exchangeRate?: ExchangeRateInfo;
  firstPaymentDate: FirestoreDate;
  installmentCount: number;
  active: boolean;
  notes?: string;
  createdByUid: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  deletedAt?: FirestoreDate;
};

export type ExchangeRateInfo = {
  sourceCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rate: number;
  provider: string;
  rateDate: string;
};

export type BalanceMap = Record<string, number>;
