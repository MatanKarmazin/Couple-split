import { describe, expect, it } from "vitest";
import {
  calculateAmountShares,
  calculateEqualShares,
  calculateOnePersonShares,
  calculatePercentageShares,
  formatMoney,
  parseMoneyToMinor
} from "@/lib/money";

describe("money utilities", () => {
  it("parses ILS amounts into minor units", () => {
    expect(parseMoneyToMinor("₪123.45")).toBe(12345);
    expect(parseMoneyToMinor("10")).toBe(1000);
  });

  it("formats minor units as ILS", () => {
    expect(formatMoney(12345)).toContain("123.45");
  });

  it("splits equally and preserves every agorot", () => {
    expect(calculateEqualShares(10001, ["a", "b"])).toEqual({ a: 5001, b: 5000 });
  });

  it("assigns a full expense to one person", () => {
    expect(calculateOnePersonShares(10000, ["a", "b"], "b")).toEqual({ a: 0, b: 10000 });
  });

  it("uses custom amount shares", () => {
    expect(calculateAmountShares(10000, ["a", "b"], { a: "70", b: "30" })).toEqual({ a: 7000, b: 3000 });
  });

  it("uses percentage shares", () => {
    expect(calculatePercentageShares(10000, ["a", "b"], { a: "60", b: "40" })).toEqual({ a: 6000, b: 4000 });
  });
});
