"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  directionForLanguage,
  localeForLanguage,
  systemLanguage,
  translate,
  type Language,
  type LanguageMode,
  type TranslationKey
} from "@/lib/i18n";

export type { LanguageMode } from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  mode: LanguageMode;
  locale: string;
  dir: "ltr" | "rtl";
  setMode: (mode: LanguageMode) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const storageKey = "couplesplit-language";

function applyDocumentLanguage(language: Language) {
  document.documentElement.lang = language;
  document.documentElement.dir = directionForLanguage(language);
}

function storedLanguageMode(): LanguageMode {
  const stored = window.localStorage.getItem(storageKey);
  return stored === "en" || stored === "he" ? stored : "system";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LanguageMode>("system");
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const nextMode = storedLanguageMode();
    const nextLanguage = nextMode === "system" ? systemLanguage() : nextMode;
    setModeState(nextMode);
    setLanguage(nextLanguage);
    applyDocumentLanguage(nextLanguage);
  }, []);

  const setMode = useCallback((nextMode: LanguageMode) => {
    const nextLanguage = nextMode === "system" ? systemLanguage() : nextMode;
    setModeState(nextMode);
    setLanguage(nextLanguage);
    if (nextMode === "system") {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, nextMode);
    }
    applyDocumentLanguage(nextLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) => translate(language, key, values),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      mode,
      locale: localeForLanguage(language),
      dir: directionForLanguage(language),
      setMode,
      t
    }),
    [language, mode, setMode, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
