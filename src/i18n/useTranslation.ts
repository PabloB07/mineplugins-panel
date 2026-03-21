"use client";

import { useI18n, Currency } from "@/i18n/I18nProvider";

export function useTranslation() {
  const { t, locale, setLocale, currency, setCurrency, formatPrice, formatPriceValue } = useI18n();
  return { t, locale, setLocale, currency, setCurrency, formatPrice, formatPriceValue };
}

export type { Currency };

