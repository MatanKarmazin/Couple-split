import { describe, expect, it } from "vitest";
import { calculateEqualShares, formatMoney, parseMoneyToMinor } from "@/lib/money";

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
});
