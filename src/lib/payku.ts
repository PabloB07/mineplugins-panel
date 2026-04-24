import { getGatewaySettings, type GatewayEnvironment } from "@/lib/payment-gateway-settings";

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

function getPaykuApiUrl(environment: GatewayEnvironment): string {
  return environment === "PRODUCTION"
    ? "https://app.payku.cl/api"
    : "https://des.payku.cl/api";
}

/**
 * Returns public and private tokens plus the resolved API base URL.
 *
 * - publicToken  → POST /transaction  (create)
 * - privateToken → GET  /transaction/:id (query status)
 *
 * Sandbox registration: https://des.payku.cl
 * Test credentials inside WebPay sandbox: RUT 11111111-1 / Password 123
 */
async function getPaykuClientConfig() {
  const settings = await getGatewaySettings();

  const apiUrl =
    settings.payku.apiUrl || getPaykuApiUrl(settings.payku.environment);

  return {
    publicToken: (settings.payku.apiToken || process.env.PAYKU_PUBLIC_TOKEN || "").trim(),
    privateToken: (settings.payku.privateToken || process.env.PAYKU_PRIVATE_TOKEN || "").trim(),
    apiUrl: apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl,
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

/**
 * Normalized callback payload received from Payku via webhook or return URL.
 */
export interface PaykuCallbackPayload {
  orderId?: string;
  transactionId?: string;
  status?: string;
  verificationKey?: string;
  email?: string;
  amount?: number;
  currency?: string;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

/**
 * Maps any value Payku may return in `estado` / `status` to a normalized
 * internal status.
 *
 * Payku numeric codes:
 *   1 → success   (Exitoso / Aprobado)
 *   2 → pending   (Pendiente / En proceso)
 *   3 → failed    (Rechazado)
 *   4 → cancelled (Anulado)
 */
export function mapPaykuStatus(
  status: unknown
): "success" | "pending" | "failed" | "cancelled" {
  if (status === undefined || status === null) return "pending";

  if (typeof status === "number") {
    if (status === 1) return "success";
    if (status === 2) return "pending";
    if (status === 3) return "failed";
    if (status === 4) return "cancelled";
    return "pending";
  }

  const s = String(status).toLowerCase().trim();

  const successStates = [
    "1", "success", "aprobado", "aprobada", "approved",
    "validada", "validado", "v",
  ];
  const failedStates = [
    "3", "failed", "rechazado", "rechazada", "rejected", "r", "error",
  ];
  const cancelledStates = [
    "4", "cancelled", "cancelado", "cancelada", "anulado", "anulada", "c",
  ];

  if (successStates.includes(s)) return "success";
  if (failedStates.includes(s)) return "failed";
  if (cancelledStates.includes(s)) return "cancelled";

  return "pending";
}

// ---------------------------------------------------------------------------
// Create transaction  (uses PUBLIC token)
// Forced to WebPay via additional_parameters.gateway
// ---------------------------------------------------------------------------

export async function createPaykuPayment(
  data: PaykuPaymentCreate
): Promise<PaykuPaymentResponse> {
  const { publicToken, apiUrl } = await getPaykuClientConfig();

  if (!publicToken) {
    throw new Error(
      "Payku public token not configured. " +
      "Set PAYKU_PUBLIC_TOKEN in .env or in the panel settings."
    );
  }

  // Force WebPay as the only payment gateway shown to the user
  const payload = {
    order: data.order,
    subject: data.subject,
    amount: data.amount,
    email: data.email,
    additional_parameters: {
      gateway: "webpay",
    },
    ...(data.returnUrl && { urlreturn: data.returnUrl }),
    ...(data.notifyUrl && { urlnotify: data.notifyUrl }),
  };

  const finalUrl = `${apiUrl}/transaction`;

  console.log("[Payku] POST", finalUrl);
  console.log("[Payku] Payload:", JSON.stringify(payload));

  const response = await fetch(finalUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicToken}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log(`[Payku Create] HTTP ${response.status}:`, responseText);

  let responseData: Record<string, unknown>;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Payku returned invalid JSON (HTTP ${response.status}): ${responseText.slice(0, 200)}`
    );
  }

  if (!response.ok) {
    const msg =
      (responseData.message as string) ||
      (responseData.message_error as string) ||
      "Unknown error";
    throw new Error(`Payku error (${response.status}): ${msg}`);
  }

  // Payku returns the WebPay redirect URL in the `url` field
  const paymentUrl =
    (responseData.url as string) ||
    (responseData.url_pago as string) ||
    (responseData.paymentUrl as string);

  const transactionId =
    (responseData.id as string) || (responseData.token as string);

  if (!paymentUrl) {
    console.error("[Payku Create] Response missing URL:", responseData);
    throw new Error("Payku did not return a payment URL.");
  }

  console.log(
    `[Payku Create] OK — ID: ${transactionId}, WebPay URL: ${paymentUrl}`
  );

  return {
    id: transactionId,
    order: (responseData.order as string) || data.order,
    paymentUrl,
    url: paymentUrl,
    status: mapPaykuStatus(responseData.estado ?? responseData.status),
  };
}

// ---------------------------------------------------------------------------
// Query transaction status  (uses PRIVATE token)
// ---------------------------------------------------------------------------

export async function getPaykuPaymentStatus(
  id: string
): Promise<PaykuStatusData> {
  const { privateToken, apiUrl } = await getPaykuClientConfig();

  if (!privateToken) {
    console.warn(
      "[Payku] Private token not configured — status checks will return 'pending'. " +
      "Set PAYKU_PRIVATE_TOKEN in .env or in the panel settings."
    );
    return { status: "pending", id };
  }

  const url = `${apiUrl}/transaction/${id}`;
  console.log(`[Payku] GET ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${privateToken}` },
    });

    const responseText = await response.text();
    console.log(`[Payku Status] HTTP ${response.status}:`, responseText);

    let responseData: Record<string, unknown>;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error("[Payku] Failed to parse status JSON:", responseText.slice(0, 500));
      return { status: "pending", id };
    }

    if (!response.ok) {
      console.warn(`[Payku] Status check HTTP ${response.status}:`, responseData.message);
      return { status: "pending", id };
    }

    const rawEstado = responseData.estado ?? responseData.status;
    const mappedStatus = mapPaykuStatus(rawEstado);

    console.log(
      `[Payku Status] ID: ${id} | Raw: "${rawEstado}" | Mapped: "${mappedStatus}"`
    );

    return {
      id: (responseData.id as string) || id,
      order: responseData.order as string | undefined,
      status: mappedStatus,
      amount: responseData.monto as number | undefined,
      currency: (responseData.moneda as string) || "CLP",
      email: responseData.email as string | undefined,
    };
  } catch (err) {
    console.error("[Payku] Status check error:", err);
    return { status: "pending", id };
  }
}

// ---------------------------------------------------------------------------
// Webhook / return URL payload parsing
// ---------------------------------------------------------------------------

/**
 * Parses the incoming Payku callback (webhook POST or return GET/POST).
 * Handles JSON, form-encoded, and raw text bodies.
 */
export async function parsePaykuCallbackRequest(
  request: Request
): Promise<PaykuCallbackPayload> {
  const contentType = request.headers.get("content-type") || "";

  let raw: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    raw = (await request.json()) as Record<string, unknown>;
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    raw = Object.fromEntries(formData.entries());
  } else {
    const text = await request.text();
    if (text.trim()) {
      try {
        raw = JSON.parse(text) as Record<string, unknown>;
      } catch {
        raw = Object.fromEntries(new URLSearchParams(text).entries());
      }
    }
  }

  return normalizePaykuCallbackPayload(raw);
}

function normalizePaykuCallbackPayload(
  payload: Record<string, unknown>
): PaykuCallbackPayload {
  return {
    orderId:         readString(payload.order_id   ?? payload.orderId   ?? payload.order),
    transactionId:   readString(payload.transaction_id ?? payload.transactionId ?? payload.id ?? payload.token),
    status:          readString(payload.status ?? payload.estado),
    verificationKey: readString(payload.verification_key ?? payload.verificationKey),
    email:           readString(payload.email ?? payload.email_from),
    amount:          readNumber(payload.amount ?? payload.amount_order ?? payload.monto),
    currency:        readString(payload.currency ?? payload.currency_code ?? payload.moneda),
    detail:          readString(payload.detail),
  };
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Verification  (re-query via private token — Payku's recommended approach)
// ---------------------------------------------------------------------------

/**
 * Verifies a Payku callback by re-querying the transaction via private token.
 *
 * Payku does NOT use HMAC signatures. The safest approach is to look up
 * the transaction with the private token and trust that status.
 *
 * Returns "VALID" when the re-queried status is "success", "INVALID" otherwise.
 */
export async function verifyPaykuPayment(
  payload: PaykuCallbackPayload,
  _expected: {
    orderId: string;
    amount: number;
    email: string;
    currency?: string;
    detail?: string;
  }
): Promise<"VALID" | "INVALID"> {
  const transactionId = payload.transactionId;

  if (!transactionId) {
    console.warn("[Payku Verify] No transactionId in payload — cannot verify");
    return "INVALID";
  }

  const statusData = await getPaykuPaymentStatus(transactionId);
  const mapped = mapPaykuStatus(statusData.status);

  console.log(`[Payku Verify] Transaction ${transactionId} → ${mapped}`);
  return mapped === "success" ? "VALID" : "INVALID";
}

// ---------------------------------------------------------------------------
// Legacy webhook helper (kept for backward compatibility)
// ---------------------------------------------------------------------------

export async function verifyPaykuWebhook(
  transactionId: string
): Promise<PaykuStatusData> {
  if (!transactionId) {
    throw new Error("verifyPaykuWebhook: transactionId is required");
  }
  return getPaykuPaymentStatus(transactionId);
}

export async function processPaykuWebhook(
  payload: Record<string, unknown>,
  onPaymentSuccess: (payment: PaykuStatusData) => Promise<void>,
  onPaymentFailed?: (payment: PaykuStatusData) => Promise<void>
): Promise<{ success: boolean; message: string }> {
  try {
    const transactionId = (payload.id ?? payload.token) as string | undefined;

    if (!transactionId) {
      console.error("[Payku Webhook] Missing transaction id:", payload);
      return { success: false, message: "Missing transaction id in payload" };
    }

    console.log(`[Payku Webhook] Received for transaction: ${transactionId}`);

    const payment = await verifyPaykuWebhook(transactionId);

    console.log(
      `[Payku Webhook] Verified status for ${transactionId}: "${payment.status}"`
    );

    switch (payment.status) {
      case "success":
        await onPaymentSuccess(payment);
        break;
      case "failed":
      case "cancelled":
        if (onPaymentFailed) await onPaymentFailed(payment);
        break;
      case "pending":
        console.log(`[Payku Webhook] Transaction ${transactionId} still pending.`);
        break;
    }

    return { success: true, message: "Webhook processed" };
  } catch (error) {
    console.error("[Payku Webhook] Error:", error);
    return { success: false, message: "Error processing webhook" };
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export const PaykuPaymentStatus = {
  SUCCESS: "success",
  PENDING: "pending",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export function getPaykuStatusLabel(status: string): string {
  switch (status) {
    case PaykuPaymentStatus.SUCCESS:    return "Paid";
    case PaykuPaymentStatus.PENDING:    return "Pending";
    case PaykuPaymentStatus.FAILED:     return "Failed";
    case PaykuPaymentStatus.CANCELLED:  return "Cancelled";
    default:                            return "Unknown";
  }
}

export function generatePaykuOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PK-${timestamp}-${random}`;
}

// ---------------------------------------------------------------------------
// WebPay Sandbox credentials (for testing at des.payku.cl)
// ---------------------------------------------------------------------------
//
// RUT:      11111111-1
// Password: 123
//
// Required env vars:
//   PAYKU_PUBLIC_TOKEN=<sandbox public token from des.payku.cl>
//   PAYKU_PRIVATE_TOKEN=<sandbox private token from des.payku.cl>
//   PAYKU_ENV=sandbox   (or leave out — defaults to SANDBOX in non-production)
//
// Sandbox API:  https://des.payku.cl/api
// Production:   https://app.payku.cl/api
// ---------------------------------------------------------------------------
