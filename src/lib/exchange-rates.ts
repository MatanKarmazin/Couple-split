import { convertMinor } from "@/lib/money";
import type { CurrencyCode, ExchangeRateInfo } from "@/types";

export const quickCurrencies = ["ILS", "USD", "EUR"] as const;

export async function fetchCurrencies(): Promise<Array<{ code: CurrencyCode; name: string }>> {
  const response = await fetch("https://api.frankfurter.dev/v2/currencies");
  if (!response.ok) throw new Error("Could not load currencies.");

  const data = await response.json();
  if (Array.isArray(data)) {
    return data
      .map((item) => ({ code: String(item.iso_code ?? item.code ?? "").toUpperCase(), name: String(item.name ?? item.iso_code ?? "") }))
      .filter((item) => /^[A-Z]{3}$/.test(item.code));
  }

  return Object.entries(data as Record<string, string>)
    .map(([code, name]) => ({ code: code.toUpperCase(), name }))
    .filter((item) => /^[A-Z]{3}$/.test(item.code));
}

export async function fetchExchangeRate(sourceCurrency: CurrencyCode, targetCurrency: CurrencyCode, date: string): Promise<ExchangeRateInfo> {
  const source = normalizeCurrency(sourceCurrency);
  const target = normalizeCurrency(targetCurrency);
  if (source === target) {
    return { sourceCurrency: source, targetCurrency: target, rate: 1, provider: "fixed", rateDate: date };
  }

  const url = new URL(`https://api.frankfurter.dev/v2/rate/${source}/${target}`);
  if (date) url.searchParams.set("date", date);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch ${source}/${target} exchange rate.`);
  const data = await response.json();
  const rate = Number(data.rate);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error(`Could not fetch ${source}/${target} exchange rate.`);

  return {
    sourceCurrency: source,
    targetCurrency: target,
    rate,
    provider: "Frankfurter",
    rateDate: String(data.date ?? date)
  };
}

export function convertShares(shares: Record<string, number>, rate: number, targetTotalMinor: number) {
  const entries = Object.entries(shares).map(([uid, amountMinor]) => {
    const exact = amountMinor * rate;
    const base = Math.floor(exact);
    return { uid, base, remainder: exact - base };
  });
  let remaining = targetTotalMinor - entries.reduce((sum, entry) => sum + entry.base, 0);

  return entries
    .sort((a, b) => b.remainder - a.remainder)
    .reduce<Record<string, number>>((nextShares, entry) => {
      nextShares[entry.uid] = entry.base + (remaining > 0 ? 1 : 0);
      remaining -= 1;
      return nextShares;
    }, {});
}

export async function buildConvertedMoneyPayload({
  amountMinor,
  shares,
  sourceCurrency,
  targetCurrency,
  date
}: {
  amountMinor: number;
  shares?: Record<string, number>;
  sourceCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  date: string;
}) {
  const exchangeRate = await fetchExchangeRate(sourceCurrency, targetCurrency, date);
  const householdAmountMinor = convertMinor(amountMinor, exchangeRate.rate);
  return {
    householdCurrency: exchangeRate.targetCurrency,
    householdAmountMinor,
    exchangeRate,
    householdShares: shares ? convertShares(shares, exchangeRate.rate, householdAmountMinor) : undefined
  };
}

export function normalizeCurrency(currency: CurrencyCode) {
  return currency.trim().toUpperCase();
}
