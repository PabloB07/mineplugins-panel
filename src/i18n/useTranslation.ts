"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { Currency } from "@/lib/pricing";

export function useTranslation() {
  const { t, locale, setLocale, currency, setCurrency, formatPrice, formatPriceValue, exchangeRates } = useI18n();
  return { t, locale, setLocale, currency, setCurrency, formatPrice, formatPriceValue, exchangeRates };
}

export type { Currency };

