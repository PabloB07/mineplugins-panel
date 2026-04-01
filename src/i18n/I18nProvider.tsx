"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import { formatCurrency, Currency as CurrencyType, EXCHANGE_RATES } from "@/lib/pricing";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messages: Record<string, any> = {
  en,
  es,
};

export type Currency = CurrencyType;

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
  exchangeRates: typeof EXCHANGE_RATES;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getInitialLocale(): string {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem("locale");
  return (stored === "en" || stored === "es") ? stored : 'en';
}

function getInitialCurrency(): Currency {
  if (typeof window === 'undefined') return 'USD';
  const stored = localStorage.getItem("currency") as Currency | null;
  if (stored && ['USD', 'CLP', 'EUR', 'CAD'].includes(stored)) {
    return stored;
  }
  return 'USD';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(getInitialLocale);
  const [currency, setCurrencyState] = useState<Currency>(getInitialCurrency);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  const handleSetLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("currency", newCurrency);
  };

  const formatPriceValue = (priceUSD: number, priceCLP?: number): { value: number; currency: Currency; formatted: string } => {
    switch (currency) {
      case 'USD':
        return {
          value: priceUSD,
          currency: 'USD',
          formatted: formatCurrency(priceUSD, 'USD'),
        };
      case 'CLP':
        const clpPrice = priceCLP || Math.round(priceUSD * EXCHANGE_RATES.USD_TO_CLP);
        return {
          value: clpPrice,
          currency: 'CLP',
          formatted: `$${clpPrice.toLocaleString('es-CL')} CLP`,
        };
      case 'EUR':
        const eurPrice = priceUSD * EXCHANGE_RATES.USD_TO_EUR;
        return {
          value: eurPrice,
          currency: 'EUR',
          formatted: formatCurrency(eurPrice, 'EUR'),
        };
      case 'CAD':
        const cadPrice = priceUSD * EXCHANGE_RATES.USD_TO_CAD;
        return {
          value: cadPrice,
          currency: 'CAD',
          formatted: formatCurrency(cadPrice, 'CAD'),
        };
      default:
        return {
          value: priceUSD,
          currency: 'USD',
          formatted: formatCurrency(priceUSD, 'USD'),
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
    <I18nContext.Provider value={{ 
      locale, 
      currency, 
      setLocale: handleSetLocale, 
      setCurrency: handleSetCurrency, 
      t, 
      formatPrice, 
      formatPriceValue,
      exchangeRates: EXCHANGE_RATES,
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
