import type { CurrencyCode } from "@/types";

export function parseMoneyToMinor(input: string): number {
  const normalized = input.trim().replace(/[₪,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    throw new Error("Enter a valid amount with up to 2 decimals.");
  }

  const [whole, decimal = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}

export function formatMoney(amountMinor: number, currency: CurrencyCode = "ILS") {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountMinor / 100);
}

export function minorToInput(amountMinor: number) {
  return (amountMinor / 100).toFixed(2);
}

export function calculateEqualShares(amountMinor: number, participants: string[]) {
  if (participants.length === 0) {
    throw new Error("Choose at least one participant.");
  }

  const base = Math.floor(amountMinor / participants.length);
  let remainder = amountMinor % participants.length;

  return participants.reduce<Record<string, number>>((shares, uid) => {
    shares[uid] = base + (remainder > 0 ? 1 : 0);
    remainder -= 1;
    return shares;
  }, {});
}

export function assertSharesTotal(amountMinor: number, shares: Record<string, number>) {
  const total = Object.values(shares).reduce((sum, value) => sum + value, 0);
  if (total !== amountMinor) {
    throw new Error("Split shares must equal the total amount.");
  }
}
