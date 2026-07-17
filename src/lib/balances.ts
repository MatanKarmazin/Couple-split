import type { BalanceMap, Expense, Settlement } from "@/types";

export function calculateBalances(expenses: Expense[], settlements: Settlement[]): BalanceMap {
  const balances: BalanceMap = {};

  const add = (uid: string, amountMinor: number) => {
    balances[uid] = (balances[uid] ?? 0) + amountMinor;
  };

  for (const expense of expenses.filter((item) => !item.deletedAt)) {
    add(expense.paidByUid, expense.householdAmountMinor ?? expense.amountMinor);
    for (const [uid, shareMinor] of Object.entries(expense.householdShares ?? expense.shares)) {
      add(uid, -shareMinor);
    }
  }

  for (const settlement of settlements.filter((item) => !item.deletedAt)) {
    const amountMinor = settlement.householdAmountMinor ?? settlement.amountMinor;
    add(settlement.fromUid, amountMinor);
    add(settlement.toUid, -amountMinor);
  }

  return balances;
}

export function getBalanceStatus(balanceMinor: number) {
  if (balanceMinor > 0) return "owed" as const;
  if (balanceMinor < 0) return "owe" as const;
  return "settled" as const;
}

export function totalSpendingForMonth(expenses: Expense[], month: Date) {
  return expenses
    .filter((expense) => {
      if (expense.deletedAt) return false;
      const date = toDate(expense.date);
      return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
    })
    .reduce((sum, expense) => sum + (expense.householdAmountMinor ?? expense.amountMinor), 0);
}

function toDate(value: Expense["date"]) {
  if (value && typeof value === "object" && "toDate" in value) return value.toDate();
  if (value && typeof value === "object" && "seconds" in value) return new Date(value.seconds * 1000);
  return value ? new Date(value as string | number | Date) : new Date();
}
