import crypto from "crypto";
import { getGatewaySettings, type GatewayEnvironment } from "@/lib/payment-gateway-settings";

function getPaykuApiUrl(environment: GatewayEnvironment): string {
  return environment === "PRODUCTION"
    ? "https://app.payku.cl/api"
    : "https://des.payku.cl/api";
}

async function getPaykuClientConfig() {
  const settings = await getGatewaySettings();

  return {
    apiToken: settings.payku.apiToken || "",
    apiUrl: getPaykuApiUrl(settings.payku.environment),
    secretKey: (settings.payku.secretKey || process.env.PAYKU_SECRET_KEY || "").trim(),
  };
}

export interface PaykuPaymentCreate {
  order: string;
  subject: string;
  amount: number;
  email: string;
  returnUrl?: string;
  notifyUrl?: string;
}

export interface PaykuPaymentResponse {
  id?: string;
  order?: string;
  paymentUrl?: string;
  url?: string;
  status?: string;
}

export interface PaykuPaymentStatus {
  id?: string;
  order?: string;
  status: "success" | "pending" | "failed" | "cancelled";
  amount?: number;
  currency?: string;
  email?: string;
}

export async function createPaykuPayment(
  data: PaykuPaymentCreate
): Promise<PaykuPaymentResponse> {
  const { apiToken, apiUrl } = await getPaykuClientConfig();

  if (!apiToken) {
    throw new Error("Payku API token not configured");
  }

  const payload = {
    order: data.order,
    subject: data.subject,
    amount: data.amount,
    email: data.email,
    currency: "CLP",
    ...(data.returnUrl && { urlreturn: data.returnUrl }),
    ...(data.notifyUrl && { urlnotify: data.notifyUrl }),
  };

  console.log("[Payku] POST", `${apiUrl}/transaction`);
  console.log("[Payku] Payload:", JSON.stringify(payload));

  const response = await fetch(`${apiUrl}/transaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiToken}`,
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();
  console.log("[Payku] Response:", JSON.stringify(responseData));

  if (!response.ok) {
    const msg = responseData.message || responseData.message_error || "Unknown error";
    throw new Error(`Payku error: ${msg}`);
  }

  const paymentUrl = responseData.url || responseData.url_pago || responseData.paymentUrl;
  if (!paymentUrl) {
    throw new Error("No payment URL in response");
  }

  return {
    id: responseData.id,
    order: responseData.orden || data.order,
    paymentUrl: paymentUrl,
    url: paymentUrl,
    status: responseData.estado || "pending",
  };
}

export async function getPaykuPaymentStatus(
  order: string
): Promise<PaykuPaymentStatus> {
  const { apiToken, apiUrl } = await getPaykuClientConfig();

  console.log("[Payku] GET", `${apiUrl}/transaction/${order}`);

  const response = await fetch(`${apiUrl}/transaction/${order}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
    },
  });

  const responseData = await response.json();
  console.log("[Payku] Status Response:", JSON.stringify(responseData));

  if (!response.ok) {
    throw new Error(responseData.message || "Failed to get payment status");
  }

  return {
    id: responseData.id,
    order: responseData.orden || order,
    status: responseData.estado || responseData.status || "pending",
    amount: responseData.monto,
    currency: responseData.moneda || "CLP",
    email: responseData.email,
  };
}

export async function verifyPaykuWebhookSignature(
  payload: string,
  receivedSignature: string
): Promise<boolean> {
  try {
    const { secretKey } = await getPaykuClientConfig();
    if (!secretKey) return false;

    const expected = crypto
      .createHmac("sha256", secretKey)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedSignature));
  } catch {
    return false;
  }
}

export const PaykuPaymentStatus = {
  SUCCESS: "success",
  PENDING: "pending",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export function getPaykuStatusLabel(status: string): string {
  switch (status) {
    case PaykuPaymentStatus.SUCCESS: return "Paid";
    case PaykuPaymentStatus.PENDING: return "Pending";
    case PaykuPaymentStatus.FAILED: return "Failed";
    case PaykuPaymentStatus.CANCELLED: return "Cancelled";
    default: return "Unknown";
  }
}

export async function processPaykuWebhook(
  payload: Record<string, unknown>,
  onPaymentSuccess: (payment: PaykuPaymentStatus) => Promise<void>,
  onPaymentFailed?: (payment: PaykuPaymentStatus) => Promise<void>
): Promise<{ success: boolean; message: string }> {
  try {
    const evento = typeof payload.evento === "string" ? payload.evento : "";
    const data = payload.data as PaykuPaymentStatus;

    switch (evento) {
      case "pago.aprobado":
      case "payment.success":
        await onPaymentSuccess(data);
        break;
      case "pago.rechazado":
      case "payment.failed":
        if (onPaymentFailed) await onPaymentFailed(data);
        break;
    }

    return { success: true, message: "Webhook processed" };
  } catch (error) {
    return { success: false, message: "Error processing webhook" };
  }
}

export function generatePaykuOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PK-${timestamp}-${random}`;
}
