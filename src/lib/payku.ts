import * as crypto from "crypto";
import { getGatewaySettings, type GatewayEnvironment } from "@/lib/payment-gateway-settings";

function getPaykuApiUrl(environment: GatewayEnvironment): string {
  return environment === "PRODUCTION"
    ? "https://app.payku.cl/api"
    : "https://des.payku.cl/api";
}

async function getPaykuClientConfig() {
  const settings = await getGatewaySettings();
  const apiUrl = settings.payku.apiUrl || getPaykuApiUrl(settings.payku.environment);

  return {
    apiToken: settings.payku.apiToken || "",
    apiUrl,
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

export interface PaykuStatusData {
  id?: string;
  order?: string;
  status: "success" | "pending" | "failed" | "cancelled";
  amount?: number;
  currency?: string;
  email?: string;
}

export function mapPaykuStatus(status: any): "success" | "pending" | "failed" | "cancelled" {
  if (status === undefined || status === null) return "pending";
  
  const s = String(status).toLowerCase().trim();
  
  const successStates = ["1", "success", "aprobado", "aprobada", "v", "approved", "validada", "validado"];
  const failedStates = ["3", "failed", "rechazado", "rechazada", "rejected", "r", "error"];
  const cancelledStates = ["4", "cancelled", "cancelado", "cancelada", "anulado", "anulada", "c"];
  const pendingStates = ["2", "pending", "pendiente", "register", "p", "not_paid"];

  if (successStates.includes(s)) return "success";
  if (failedStates.includes(s)) return "failed";
  if (cancelledStates.includes(s)) return "cancelled";
  if (pendingStates.includes(s)) return "pending";
  
  return "pending";
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
    medioPago: "1",
    ...(data.returnUrl && { urlreturn: data.returnUrl }),
    ...(data.notifyUrl && { urlnotify: data.notifyUrl }),
  };
  
  const baseUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;
  const finalUrl = `${baseUrl}transaction`;

  const response = await fetch(finalUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiToken}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Payku returned invalid JSON (Status: ${response.status}): ${responseText.slice(0, 100)}`);
  }

  if (!response.ok) {
    const msg = responseData.message || responseData.message_error || "Unknown error";
    throw new Error(`Payku error (${response.status}): ${msg}`);
  }

  const paymentUrl = responseData.url || responseData.url_pago || responseData.paymentUrl || "";
  const transactionId = responseData.id || responseData.token;

  if (!paymentUrl || paymentUrl.trim() === "") {
    throw new Error(`Payku returned empty payment URL`);
  }

  if (!paymentUrl.startsWith("http")) {
    throw new Error(`Invalid payment URL from Payku: "${paymentUrl}"`);
  }

  return {
    id: transactionId,
    order: responseData.order || data.order,
    paymentUrl: paymentUrl,
    url: paymentUrl,
    status: mapPaykuStatus(responseData.estado || responseData.status),
  };
}

export async function getPaykuPaymentStatus(
  id: string
): Promise<PaykuStatusData> {
  const { apiToken, apiUrl } = await getPaykuClientConfig();

  try {
    const response = await fetch(`${apiUrl}/transaction/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
      },
    });

    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      return { status: "pending", id };
    }

    if (!response.ok) {
      return { status: "pending", id };
    }

    const rawEstado = responseData.estado || responseData.status;
    const mappedStatus = mapPaykuStatus(rawEstado);

    return {
      id: responseData.id || id,
      order: responseData.order,
      status: mappedStatus,
      amount: responseData.monto,
      currency: responseData.moneda || "CLP",
      email: responseData.email,
    };
  } catch (err) {
    return { status: "pending", id };
  }
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
  } catch (error) {
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
  onPaymentSuccess: (payment: PaykuStatusData) => Promise<void>,
  onPaymentFailed?: (payment: PaykuStatusData) => Promise<void>
): Promise<{ success: boolean; message: string }> {
  try {
    const evento = typeof payload.evento === "string" ? payload.evento : "";
    const data = payload.data as PaykuStatusData;

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