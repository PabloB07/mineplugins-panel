"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

type Messages = typeof en;

const messages: Record<string, Messages> = {
  en,
  es,
};

type I18nContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("locale");
    if (stored && (stored === "en" || stored === "es")) {
      setLocale(stored);
    }
    setMounted(true);
  }, []);

  const handleSetLocale = (newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (key: string): string => {
    if (!mounted) return key;
    
    const keys = key.split(".");
    let result: any = messages[locale];
    
    for (const k of keys) {
      if (result && typeof result === "object" && k in result) {
        result = result[k];
      } else {
        return key;
      }
    }
    
    return typeof result === "string" ? result : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
