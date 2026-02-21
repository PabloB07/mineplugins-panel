export type PaymentMethodId = "PAYKU";

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
    id: "PAYKU",
    name: "Payku",
    checkoutLabel: "Payku",
    description: "Alternative payment processor with multiple payment options",
    logo: "/payku-logo.png",
    accentClass: "text-blue-400",
  },
];

export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = "PAYKU";
