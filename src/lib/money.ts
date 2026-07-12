import type { CurrencyCode } from "@/types";

export function parseMoneyToMinor(input: string): number {
  const normalized = input.trim().replace(/[₪,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    throw new Error("Enter a valid amount with up to 2 decimals.");
  }

  const [whole, decimal = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}

export function formatMoney(amountMinor: number, currency: CurrencyCode = "ILS", locale = "he-IL") {
  return new Intl.NumberFormat(locale, {
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

export function calculateOnePersonShares(amountMinor: number, participants: string[], owedByUid: string) {
  assertParticipant(owedByUid, participants);
  return participants.reduce<Record<string, number>>((shares, uid) => {
    shares[uid] = uid === owedByUid ? amountMinor : 0;
    return shares;
  }, {});
}

export function calculateAmountShares(amountMinor: number, participants: string[], shareAmounts: Record<string, string> = {}) {
  const shares = participants.reduce<Record<string, number>>((nextShares, uid) => {
    nextShares[uid] = parseMoneyToMinor(shareAmounts[uid] ?? "");
    return nextShares;
  }, {});

  assertSharesTotal(amountMinor, shares);
  return shares;
}

export function calculatePercentageShares(
  amountMinor: number,
  participants: string[],
  sharePercentages: Record<string, string> = {}
) {
  if (participants.length === 0) {
    throw new Error("Choose at least one participant.");
  }

  const percentages = participants.map((uid) => parsePercentage(sharePercentages[uid] ?? ""));
  const total = percentages.reduce((sum, value) => sum + value, 0);
  if (total !== 100) {
    throw new Error("Percentages must add up to 100.");
  }

  let allocated = 0;
  return participants.reduce<Record<string, number>>((shares, uid, index) => {
    const isLast = index === participants.length - 1;
    const share = isLast ? amountMinor - allocated : Math.round((amountMinor * percentages[index]) / 100);
    shares[uid] = share;
    allocated += share;
    return shares;
  }, {});
}

export function assertSharesTotal(amountMinor: number, shares: Record<string, number>) {
  const total = Object.values(shares).reduce((sum, value) => sum + value, 0);
  if (total !== amountMinor) {
    throw new Error("Split shares must equal the total amount.");
  }
}

function assertParticipant(uid: string, participants: string[]) {
  if (!participants.includes(uid)) {
    throw new Error("Choose a household member.");
  }
}

function parsePercentage(input: string) {
  const normalized = input.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    throw new Error("Enter a valid percentage.");
  }

  const value = Number(normalized);
  if (value < 0 || value > 100) {
    throw new Error("Percentages must be between 0 and 100.");
  }

  return value;
}
