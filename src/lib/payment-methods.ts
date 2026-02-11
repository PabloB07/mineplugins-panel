export type PaymentMethodId = "FLOW_CL" | "PAYKU";

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
    id: "FLOW_CL",
    name: "Flow.cl (Webpay Plus)",
    checkoutLabel: "Flow.cl",
    description: "Pay with credit card, debit card, or bank transfer",
    logo: "/webpay-logo.png",
    accentClass: "text-emerald-400",
  },
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
