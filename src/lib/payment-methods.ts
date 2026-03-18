export type PaymentMethodId = "PAYKU" | "TEBEX";

export interface PaymentMethodConfig {
  id: PaymentMethodId;
  name: string;
  checkoutLabel: string;
  description: string;
  logo: string;
  accentClass: string;
  available?: boolean;
}

const isDev = process.env.NODE_ENV !== "production";

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "PAYKU",
    name: "Payku",
    checkoutLabel: "Payku",
    description: "Chile's favorite payment processor - Pay with debit, credit or crypto",
    logo: "/payku-logo.png",
    accentClass: "text-blue-400",
    available: true,
  },
  {
    id: "TEBEX",
    name: "Tebex",
    checkoutLabel: "Tebex",
    description: "Global payment processor - Pay with credit card, PayPal and more",
    logo: "/tebex-logo.svg",
    accentClass: "text-purple-400",
    available: true, // Requires prior approval from Tebex
  },
];

export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = "PAYKU";

export function getAvailablePaymentMethods(): PaymentMethodConfig[] {
  return PAYMENT_METHODS.filter(method => method.available !== false);
}
