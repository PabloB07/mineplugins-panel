// Utility functions for pricing and currency display
export interface PriceDisplay {
  CLP: string;
  USD: string;
}

export interface ProductPricing {
  priceUSD: number;      // USD in cents (e.g., 999 = $9.99)
  priceCLP: number;      // CLP in pesos (e.g., 4990)
  salePriceUSD?: number | null;
  salePriceCLP?: number | null;
}

export function formatUSD(cents: number): string {
  if (cents % 100 === 0) {
    return `$${cents / 100} USD`;
  }
  return `$${(cents / 100).toFixed(2)} USD`;
}

export function formatCLP(pesos: number): string {
  return `$${pesos.toLocaleString('es-CL')} CLP`;
}

export function formatPrice(amount: number, currency: 'CLP' | 'USD'): string {
  if (currency === 'CLP') {
    return formatCLP(amount);
  } else {
    return formatUSD(amount);
  }
}

export function displayProductPrice(pricing: ProductPricing): PriceDisplay {
  const usdPrice = pricing.salePriceUSD ?? pricing.priceUSD;
  const clpPrice = pricing.salePriceCLP ?? pricing.priceCLP;

  return {
    USD: formatUSD(usdPrice),
    CLP: formatCLP(clpPrice),
  };
}

export function displayOriginalPrice(pricing: ProductPricing): PriceDisplay | null {
  if (!pricing.salePriceUSD && !pricing.salePriceCLP) {
    return null;
  }

  return {
    USD: formatUSD(pricing.priceUSD),
    CLP: formatCLP(pricing.priceCLP),
  };
}

export function formatPriceRange(pricing: ProductPricing): {
  current: PriceDisplay;
  original?: PriceDisplay;
} {
  const result: {
    current: PriceDisplay;
    original?: PriceDisplay;
  } = {
    current: displayProductPrice(pricing),
  };

  const original = displayOriginalPrice(pricing);
  if (original) {
    result.original = original;
  }

  return result;
}