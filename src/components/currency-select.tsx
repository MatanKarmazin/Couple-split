"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, Select } from "@/components/ui/input";
import { fetchCurrencies, quickCurrencies } from "@/lib/exchange-rates";
import type { CurrencyCode } from "@/types";

export function CurrencySelect({
  value,
  onChange,
  label,
  error
}: {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  label: string;
  error?: string;
}) {
  const normalizedValue = value || "ILS";
  const [mode, setMode] = useState<"quick" | "other">(isQuickCurrency(normalizedValue) ? "quick" : "other");
  const [currencies, setCurrencies] = useState<Array<{ code: CurrencyCode; name: string }>>([]);

  useEffect(() => {
    if (isQuickCurrency(normalizedValue)) setMode("quick");
  }, [normalizedValue]);

  useEffect(() => {
    if (mode !== "other" || currencies.length) return;
    let cancelled = false;
    fetchCurrencies()
      .then((items) => {
        if (!cancelled) setCurrencies(items);
      })
      .catch(() => {
        if (!cancelled) setCurrencies([]);
      });
    return () => {
      cancelled = true;
    };
  }, [currencies.length, mode]);

  const otherCurrencies = useMemo(
    () => currencies.filter((currency) => !isQuickCurrency(currency.code)),
    [currencies]
  );

  return (
    <Field label={label} error={error}>
      <div className="grid gap-2">
        <Select
          value={mode === "other" ? "OTHER" : normalizedValue}
          onChange={(event) => {
            if (event.target.value === "OTHER") {
              setMode("other");
              return;
            }
            setMode("quick");
            onChange(event.target.value);
          }}
        >
          {quickCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
          <option value="OTHER">Other</option>
        </Select>
        {mode === "other" ? (
          <Select value={isQuickCurrency(normalizedValue) ? "" : normalizedValue} onChange={(event) => onChange(event.target.value)}>
            <option value="">Choose currency</option>
            {otherCurrencies.map((currency) => (
              <option key={currency.code} value={currency.code}>{currency.code} - {currency.name}</option>
            ))}
          </Select>
        ) : null}
      </div>
    </Field>
  );
}

function isQuickCurrency(value: string) {
  return quickCurrencies.some((currency) => currency === value);
}
