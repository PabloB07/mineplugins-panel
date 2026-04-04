export type Currency = 'USD' | 'CLP' | 'EUR' | 'CAD';

export const EXCHANGE_RATES = {
  USD_TO_EUR: 0.92,
  USD_TO_CAD: 1.36,
  USD_TO_CLP: 920,
};

export function getExchangeRates(): typeof EXCHANGE_RATES {
  return EXCHANGE_RATES;
}

export function refreshExchangeRates(): void {
  // Keep default rates - no external API
}

export function formatUSD(dollars: number): string {
  const rates = getExchangeRates();
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
