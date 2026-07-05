import { describe, expect, it } from "vitest";
import { calculateBalances, getBalanceStatus } from "@/lib/balances";
import type { Expense, Settlement } from "@/types";

const expense: Expense = {
  id: "e1",
  householdId: "h1",
  description: "Dinner",
  amountMinor: 10000,
  currency: "ILS",
  category: "Food",
  paidByUid: "a",
  splitType: "equal",
  participants: ["a", "b"],
  shares: { a: 5000, b: 5000 },
  date: "2026-07-05",
  createdByUid: "a"
};

describe("balance calculation", () => {
  it("calculates balances from expenses", () => {
    expect(calculateBalances([expense], [])).toEqual({ a: 5000, b: -5000 });
  });

  it("reduces balances with settlements", () => {
    const settlement: Settlement = {
      id: "s1",
      householdId: "h1",
      fromUid: "b",
      toUid: "a",
      amountMinor: 3000,
      currency: "ILS",
      date: "2026-07-05",
      createdByUid: "b"
    };

    expect(calculateBalances([expense], [settlement])).toEqual({ a: 2000, b: -2000 });
  });

  it("detects settled-up state", () => {
    const settlement: Settlement = {
      id: "s1",
      householdId: "h1",
      fromUid: "b",
      toUid: "a",
      amountMinor: 5000,
      currency: "ILS",
      date: "2026-07-05",
      createdByUid: "b"
    };

    const balances = calculateBalances([expense], [settlement]);
    expect(getBalanceStatus(balances.a)).toBe("settled");
    expect(balances).toEqual({ a: 0, b: 0 });
  });
});
