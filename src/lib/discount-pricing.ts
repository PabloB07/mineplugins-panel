import { Currency, EXCHANGE_RATES } from "@/lib/pricing";

export type SupportedCurrency = Currency;

const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["CLP", "USD", "EUR", "CAD"];

export type DiscountLike = {
  type: "PERCENTAGE" | "FIXED";
  value: number;
  currency?: string | null;
  minPurchase?: number | null;
};

export function isSupportedCurrency(value: string | null | undefined): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes((value || "") as SupportedCurrency);
}

export function getDiscountCurrency(value: string | null | undefined): SupportedCurrency {
  return isSupportedCurrency(value) ? value : "CLP";
}

export function normalizeAmountForStorage(amount: number, currency: SupportedCurrency): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return currency === "CLP" ? Math.round(amount) : Math.round(amount * 100);
}

export function denormalizeStoredAmount(amount: number, currency: SupportedCurrency): number {
  if (!Number.isFinite(amount)) return 0;
  return currency === "CLP" ? amount : amount / 100;
}

export function roundCurrencyAmount(amount: number, currency: SupportedCurrency): number {
  return currency === "CLP" ? Math.round(amount) : Number(amount.toFixed(2));
}

export function convertCurrencyAmount(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): number {
  if (!Number.isFinite(amount)) return 0;
  if (fromCurrency === toCurrency) return roundCurrencyAmount(amount, toCurrency);

  const amountInUSD = (() => {
    switch (fromCurrency) {
      case "USD":
        return amount;
      case "CLP":
        return amount / EXCHANGE_RATES.USD_TO_CLP;
      case "EUR":
        return amount / EXCHANGE_RATES.USD_TO_EUR;
      case "CAD":
        return amount / EXCHANGE_RATES.USD_TO_CAD;
    }
  })();

  const converted = (() => {
    switch (toCurrency) {
      case "USD":
        return amountInUSD;
      case "CLP":
        return amountInUSD * EXCHANGE_RATES.USD_TO_CLP;
      case "EUR":
        return amountInUSD * EXCHANGE_RATES.USD_TO_EUR;
      case "CAD":
        return amountInUSD * EXCHANGE_RATES.USD_TO_CAD;
    }
  })();

  return roundCurrencyAmount(converted, toCurrency);
}

export function getSubtotalForCurrency(
  subtotalUSD: number,
  subtotalCLP: number,
  currency: SupportedCurrency
): number {
  if (currency === "CLP") return roundCurrencyAmount(subtotalCLP, "CLP");
  return roundCurrencyAmount(convertCurrencyAmount(subtotalUSD, "USD", currency), currency);
}

export function formatCurrencyAmount(amount: number, currency: SupportedCurrency): string {
  if (currency === "CLP") {
    return `$${Math.round(amount).toLocaleString("es-CL")} CLP`;
  }

  const locale = currency === "EUR" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getDiscountValueInOwnCurrency(discount: DiscountLike): number {
  if (discount.type === "PERCENTAGE") return discount.value;
  return denormalizeStoredAmount(discount.value, getDiscountCurrency(discount.currency));
}

export function getMinPurchaseInOwnCurrency(discount: DiscountLike): number | null {
  if (!discount.minPurchase) return null;
  return denormalizeStoredAmount(discount.minPurchase, getDiscountCurrency(discount.currency));
}

export function calculateDiscountAmounts(
  discount: DiscountLike,
  subtotalUSD: number,
  subtotalCLP: number
) {
  const discountCurrency = getDiscountCurrency(discount.currency);
  const subtotalEUR = getSubtotalForCurrency(subtotalUSD, subtotalCLP, "EUR");
  const subtotalCAD = getSubtotalForCurrency(subtotalUSD, subtotalCLP, "CAD");

  let discountUSD = 0;
  let discountCLP = 0;
  let discountEUR = 0;
  let discountCAD = 0;

  if (discount.type === "PERCENTAGE") {
    const percentage = Math.max(0, discount.value);
    discountUSD = roundCurrencyAmount((subtotalUSD * percentage) / 100, "USD");
    discountCLP = roundCurrencyAmount((subtotalCLP * percentage) / 100, "CLP");
    discountEUR = roundCurrencyAmount((subtotalEUR * percentage) / 100, "EUR");
    discountCAD = roundCurrencyAmount((subtotalCAD * percentage) / 100, "CAD");
  } else {
    const fixedAmount = denormalizeStoredAmount(discount.value, discountCurrency);
    discountUSD = convertCurrencyAmount(fixedAmount, discountCurrency, "USD");
    discountCLP = convertCurrencyAmount(fixedAmount, discountCurrency, "CLP");
    discountEUR = convertCurrencyAmount(fixedAmount, discountCurrency, "EUR");
    discountCAD = convertCurrencyAmount(fixedAmount, discountCurrency, "CAD");
  }

  return {
    discountUSD: Math.min(roundCurrencyAmount(discountUSD, "USD"), roundCurrencyAmount(subtotalUSD, "USD")),
    discountCLP: Math.min(roundCurrencyAmount(discountCLP, "CLP"), roundCurrencyAmount(subtotalCLP, "CLP")),
    discountEUR: Math.min(roundCurrencyAmount(discountEUR, "EUR"), roundCurrencyAmount(subtotalEUR, "EUR")),
    discountCAD: Math.min(roundCurrencyAmount(discountCAD, "CAD"), roundCurrencyAmount(subtotalCAD, "CAD")),
  };
}
