export type Currency = 'USD' | 'CLP' | 'EUR' | 'CAD';

export const EXCHANGE_RATES = {
  USD_TO_EUR: 0.92,
  USD_TO_CAD: 1.36,
  USD_TO_CLP: 920,
};

let cachedRates: typeof EXCHANGE_RATES = EXCHANGE_RATES;
let lastFetch = 0;
const CACHE_DURATION = 60 * 60 * 1000;

export async function refreshExchangeRates(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const now = Date.now();
  if (now - lastFetch < CACHE_DURATION) return;
  
  try {
    const res = await fetch('/api/exchange-rates');
    if (res.ok) {
      const data = await res.json();
      cachedRates = {
        USD_TO_EUR: data.EUR || 0.92,
        USD_TO_CAD: data.CAD || 1.36,
        USD_TO_CLP: data.CLP || 920,
      };
      lastFetch = now;
      localStorage.setItem('exchange_rates', JSON.stringify(cachedRates));
    }
  } catch {
    // Keep cached rates
  }
}

export function getExchangeRates(): typeof EXCHANGE_RATES {
  if (typeof window === 'undefined') return EXCHANGE_RATES;
  
  const stored = localStorage.getItem('exchange_rates');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return cachedRates;
    }
  }
  return cachedRates;
}

export function formatUSD(dollars: number): string {
  return `$${dollars.toFixed(2)} USD`;
}

export function formatEUR(dollars: number): string {
  const rates = getExchangeRates();
  const eur = dollars * rates.USD_TO_EUR;
  return `€${eur.toFixed(2)} EUR`;
}

export function formatCAD(dollars: number): string {
  const rates = getExchangeRates();
  const cad = dollars * rates.USD_TO_CAD;
  return `$${cad.toFixed(2)} CAD`;
}

export function formatCLP(dollars: number): string {
  const rates = getExchangeRates();
  const clp = Math.round(dollars * rates.USD_TO_CLP);
  return `$${clp.toLocaleString('es-CL')} CLP`;
}

export function formatCLPValue(clp: number): string {
  return `$${Math.round(clp).toLocaleString('es-CL')} CLP`;
}

export function formatCurrency(dollars: number, currency: Currency): string {
  switch (currency) {
    case 'USD':
      return formatUSD(dollars);
    case 'CLP':
      return formatCLP(dollars);
    case 'EUR':
      return formatEUR(dollars);
    case 'CAD':
      return formatCAD(dollars);
    default:
      return formatUSD(dollars);
  }
}

export function convertPrice(dollars: number, fromCurrency: Currency, toCurrency: Currency): number {
  if (fromCurrency === toCurrency) return dollars;
  
  const rates = getExchangeRates();
  
  switch (toCurrency) {
    case 'CLP':
      return dollars * rates.USD_TO_CLP;
    case 'EUR':
      return dollars * rates.USD_TO_EUR;
    case 'CAD':
      return dollars * rates.USD_TO_CAD;
    default:
      return dollars;
  }
}
