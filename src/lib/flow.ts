import crypto from "crypto";
import { getRequiredEnv } from "./security";

const FLOW_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";

const FLOW_API_KEY = getRequiredEnv("FLOW_API_KEY", { allowEmptyInDev: true });
const FLOW_SECRET_KEY = getRequiredEnv("FLOW_SECRET_KEY", { allowEmptyInDev: true });

export interface FlowPaymentCreate {
  commerceOrder: string;
  subject: string;
  amount: number; // In CLP (not cents)
  email: string;
  urlConfirmation: string;
  urlReturn: string;
  optional?: Record<string, string>;
}

export interface FlowPaymentResponse {
  url: string;
  token: string;
  flowOrder: number;
}

export interface FlowPaymentStatus {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: number; // 1=pending, 2=paid, 3=rejected, 4=cancelled
  subject: string;
  currency: string;
  amount: number;
  payer: string;
  paymentData?: {
    date: string;
    media: string;
    conversionDate: string;
    conversionRate: number;
    amount: number;
    currency: string;
    fee: number;
    balance: number;
    transferDate: string;
  };
}

/**
 * Generates HMAC-SHA256 signature for Flow.cl API requests
 * Params must be sorted alphabetically
 */
function generateFlowSignature(params: Record<string, string | number>): string {
  // Sort params alphabetically by key
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys
    .map((key) => `${key}${params[key]}`)
    .join("");

  return crypto
    .createHmac("sha256", FLOW_SECRET_KEY)
    .update(signatureString)
    .digest("hex");
}

/**
 * Creates a payment request with Flow.cl
 */
export async function createFlowPayment(
  data: FlowPaymentCreate
): Promise<FlowPaymentResponse> {
  const params: Record<string, string | number> = {
    apiKey: FLOW_API_KEY,
    commerceOrder: data.commerceOrder,
    subject: data.subject,
    currency: "CLP",
    amount: data.amount,
    email: data.email,
    urlConfirmation: data.urlConfirmation,
    urlReturn: data.urlReturn,
    ...data.optional,
  };

  const signature = generateFlowSignature(params);

  const formData = new URLSearchParams();
  Object.entries({ ...params, s: signature }).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  const response = await fetch(`${FLOW_API_URL}/payment/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error("Flow.cl error:", responseData);
    throw new Error(`Flow.cl error: ${responseData.message || "Unknown error"}`);
  }

  return responseData;
}

/**
 * Gets payment status from Flow.cl
 */
export async function getFlowPaymentStatus(
  token: string
): Promise<FlowPaymentStatus> {
  const params: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    token,
  };

  const signature = generateFlowSignature(params);

  const queryString = new URLSearchParams({
    ...params,
    s: signature,
  }).toString();

  const response = await fetch(
    `${FLOW_API_URL}/payment/getStatus?${queryString}`
  );

  const responseData = await response.json();

  if (!response.ok) {
    console.error("Flow.cl error:", responseData);
    throw new Error(`Flow.cl error: ${responseData.message || "Unknown error"}`);
  }

  return responseData;
}

/**
 * Gets payment status by commerce order number
 */
export async function getFlowPaymentByCommerceId(
  commerceId: string
): Promise<FlowPaymentStatus> {
  const params: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    commerceId,
  };

  const signature = generateFlowSignature(params);

  const queryString = new URLSearchParams({
    ...params,
    s: signature,
  }).toString();

  const response = await fetch(`${FLOW_API_URL}/payment/getStatusByCommerceId?${queryString}`);

  const responseData = await response.json();

  if (!response.ok) {
    console.error("Flow.cl error:", responseData);
    throw new Error(`Flow.cl error: ${responseData.message || "Unknown error"}`);
  }

  return responseData;
}

/**
 * Verifies webhook signature from Flow.cl
 */
export function verifyFlowWebhookSignature(
  params: Record<string, string | number>,
  receivedSignature: string
): boolean {
  const expectedSignature = generateFlowSignature(params);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Payment status codes
 */
export const FlowPaymentStatusCodes = {
  PENDING: 1,
  PAID: 2,
  REJECTED: 3,
  CANCELLED: 4,
} as const;

/**
 * Get readable status from code
 */
export function getFlowStatusLabel(status: number): string {
  switch (status) {
    case FlowPaymentStatusCodes.PENDING:
      return "Pending";
    case FlowPaymentStatusCodes.PAID:
      return "Paid";
    case FlowPaymentStatusCodes.REJECTED:
      return "Rejected";
    case FlowPaymentStatusCodes.CANCELLED:
      return "Cancelled";
    default:
      return "Unknown";
  }
}
