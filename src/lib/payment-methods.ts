export type PaymentMethodId = "TEBEX" | "PAYPAL";

export interface PaymentMethodConfig {
  id: PaymentMethodId;
  name: string;
  checkoutLabel: string;
  description: string;
  logo: string;
  accentClass: string;
  available?: boolean;
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "TEBEX",
    name: "Tebex",
    checkoutLabel: "Tebex",
    description: "Global payment processor - Pay with credit card, PayPal and more",
    logo: "/tebex-logo.png",
    accentClass: "text-purple-400",
    available: true, // Requires prior approval from Tebex
  },
  {
    id: "PAYPAL",
    name: "PayPal",
    checkoutLabel: "PayPal",
    description: "Pay with PayPal account (secure checkout)",
    logo: "/paypal-logo.svg",
    accentClass: "text-[#0070e0]",
    available: true,
  },
];

export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = "PAYPAL";

export function getAvailablePaymentMethods(): PaymentMethodConfig[] {
  return PAYMENT_METHODS.filter(method => method.available !== false);
}
