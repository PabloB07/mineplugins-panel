"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

type Messages = typeof en;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messages: Record<string, any> = {
  en,
  es,
};

export type Currency = 'USD' | 'CLP' | 'EUR' | 'CAD';

const currencyByLocale: Record<string, Currency> = {
  en: 'USD',
  es: 'CLP',
};

const localeByCurrency: Record<Currency, string> = {
  USD: 'en',
  CLP: 'es',
  EUR: 'en',
  CAD: 'en',
};

type I18nContextType = {
  locale: string;
  currency: Currency;
  setLocale: (locale: string) => void;
  setCurrency: (currency: Currency) => void;
  t: (key: string) => string;
  formatPrice: (priceUSD: number, priceCLP?: number) => string;
  formatPriceValue: (priceUSD: number, priceCLP?: number) => { value: number; currency: Currency; formatted: string };
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState("es");
  const [currency, setCurrencyState] = useState<Currency>("CLP");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedLocale = localStorage.getItem("locale");
    const storedCurrency = localStorage.getItem("currency") as Currency | null;
    
    if (storedLocale && (storedLocale === "en" || storedLocale === "es")) {
      setLocaleState(storedLocale);
      if (!storedCurrency) {
        setCurrencyState(currencyByLocale[storedLocale] || 'CLP');
      }
    }
    
    if (storedCurrency && ['USD', 'CLP', 'EUR', 'CAD'].includes(storedCurrency)) {
      setCurrencyState(storedCurrency);
    }
    
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
    const newCurrency = currencyByLocale[newLocale] || 'USD';
    setCurrencyState(newCurrency);
    localStorage.setItem("currency", newCurrency);
  };

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("currency", newCurrency);
    const newLocale = localeByCurrency[newCurrency];
    if (newLocale !== locale) {
      setLocaleState(newLocale);
      localStorage.setItem("locale", newLocale);
    }
  };

  const formatPriceValue = (priceUSD: number, priceCLP?: number): { value: number; currency: Currency; formatted: string } => {
    switch (currency) {
      case 'USD':
        return {
          value: priceUSD,
          currency: 'USD',
          formatted: `$${(priceUSD / 100).toFixed(2)} USD`,
        };
      case 'CLP':
        const clpPrice = priceCLP || Math.round(priceUSD * 920);
        return {
          value: clpPrice,
          currency: 'CLP',
          formatted: `$${clpPrice.toLocaleString('es-CL')} CLP`,
        };
      case 'EUR':
        const eurPrice = Math.round(priceUSD * 0.92);
        return {
          value: eurPrice,
          currency: 'EUR',
          formatted: `€${(eurPrice / 100).toFixed(2)} EUR`,
        };
      case 'CAD':
        const cadPrice = Math.round(priceUSD * 1.36);
        return {
          value: cadPrice,
          currency: 'CAD',
          formatted: `$${(cadPrice / 100).toFixed(2)} CAD`,
        };
      default:
        return {
          value: priceUSD,
          currency: 'USD',
          formatted: `$${(priceUSD / 100).toFixed(2)} USD`,
        };
    }
  };

  const formatPrice = (priceUSD: number, priceCLP?: number): string => {
    return formatPriceValue(priceUSD, priceCLP).formatted;
  };

  const t = (key: string): string => {
    if (!mounted) return key;
    
    const keys = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <I18nContext.Provider value={{ locale, currency, setLocale: handleSetLocale, setCurrency: handleSetCurrency, t, formatPrice, formatPriceValue }}>
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
