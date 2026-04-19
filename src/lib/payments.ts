import { createPaykuPayment, getPaykuPaymentStatus } from "./payku";
import { createTebexPayment, getTebexPaymentStatus } from "./tebex";

export type PaymentProvider = "payku" | "tebex";

export interface PaymentCreateParams {
  order: string;
  productName: string;
  amountUSD: number;
  amountCLP: number;
  email: string;
  username?: string;
  webhookUrl?: string;
  redirectUrl?: string;
}

export interface PaymentResponse {
  provider: PaymentProvider;
  transactionId: string;
  checkoutUrl: string;
  status: string;
}

export interface PaymentStatus {
  provider: PaymentProvider;
  status: "success" | "pending" | "failed" | "refunded" | "cancelled";
  transactionId: string;
  amount: number;
  currency: string;
}

const ACTIVE_PROVIDER = (process.env.ACTIVE_PAYMENT_PROVIDER as PaymentProvider) || "payku";

export async function createPayment(
  params: PaymentCreateParams
): Promise<PaymentResponse> {
  switch (ACTIVE_PROVIDER) {
    case "tebex":
      return createTebexPaymentFlow(params);
    case "payku":
    default:
      return createPaykuPaymentFlow(params);
  }
}

export async function getPaymentStatus(
  transactionId: string
): Promise<PaymentStatus> {
  switch (ACTIVE_PROVIDER) {
    case "tebex":
      return getTebexPaymentStatusFlow(transactionId);
    case "payku":
    default:
      return getPaykuPaymentStatusFlow(transactionId);
  }
}

async function createPaykuPaymentFlow(
  params: PaymentCreateParams
): Promise<PaymentResponse> {
  const result = await createPaykuPayment({
    order: params.order,
    subject: params.productName,
    amount: params.amountCLP,
    email: params.email,
    returnUrl: params.redirectUrl,
    notifyUrl: params.webhookUrl,
  });

  return {
    provider: "payku",
    transactionId: result.id || result.order || params.order,
    checkoutUrl: result.paymentUrl || result.url || "",
    status: result.status || "pending",
  };
}

async function createTebexPaymentFlow(
  params: PaymentCreateParams
): Promise<PaymentResponse> {
  const result = await createTebexPayment({
    order: params.order,
    productName: params.productName,
    amount: params.amountUSD,
    email: params.email,
    username: params.username,
    webhookUrl: params.webhookUrl,
    redirectUrl: params.redirectUrl,
  });

  return {
    provider: "tebex",
    transactionId: result.id,
    checkoutUrl: result.checkoutUrl,
    status: result.status,
  };
}

async function getPaykuPaymentStatusFlow(
  transactionId: string
): Promise<PaymentStatus> {
  const result = await getPaykuPaymentStatus(transactionId);

  return {
    provider: "payku",
    status: mapPaykuStatus(result.status),
    transactionId: result.id || transactionId,
    amount: result.amount || 0,
    currency: result.currency || "CLP",
  };
}

async function getTebexPaymentStatusFlow(
  transactionId: string
): Promise<PaymentStatus> {
  const result = await getTebexPaymentStatus(transactionId);

  const statusMap: Record<string, PaymentStatus["status"]> = {
    completed: "success",
    pending: "pending",
    refunded: "refunded",
    chargeback: "failed",
    failed: "failed",
  };

  return {
    provider: "tebex",
    status: statusMap[result.status] || "pending",
    transactionId: result.transactionId,
    amount: result.amount,
    currency: result.currency,
  };
}

function mapPaykuStatus(
  status: string
): PaymentStatus["status"] {
  switch (status?.toLowerCase()) {
    case "success":
    case "approved":
      return "success";
    case "pending":
    case "waiting":
      return "pending";
    case "failed":
    case "rejected":
      return "failed";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "pending";
  }
}

export function getActiveProvider(): PaymentProvider {
  return ACTIVE_PROVIDER;
}

export function isProviderEnabled(provider: PaymentProvider): boolean {
  if (provider === "payku") {
    return !!process.env.PAYKU_API_TOKEN && process.env.PAYKU_API_TOKEN !== "placeholder";
  }
  if (provider === "tebex") {
    return !!process.env.TEBEX_SECRET_KEY && process.env.TEBEX_SECRET_KEY !== "placeholder";
  }
  return false;
}

export const AVAILABLE_PROVIDERS: PaymentProvider[] = ["payku", "tebex"];
