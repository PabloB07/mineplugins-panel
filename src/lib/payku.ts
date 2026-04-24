import { getGatewaySettings, type GatewayEnvironment } from "@/lib/payment-gateway-settings";

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

function getPaykuApiUrl(environment: GatewayEnvironment): string {
  return environment === "PRODUCTION"
    ? "https://app.payku.cl/api"
    : "https://des.payku.cl/api";
}

function getPaykuGatewayUrl(environment: GatewayEnvironment): string {
  return environment === "PRODUCTION"
    ? "https://app.payku.cl/gateway"
    : "https://des.payku.cl/gateway";
}

/**
 * Returns both public and private tokens.
 *
 * - publicToken  → used only to CREATE transactions (POST /transaction)
 * - privateToken → used to QUERY transaction status  (GET /transaction/:id)
 *
 * In sandbox, register at https://des.payku.cl and copy both tokens from
 * Integración → Tokens Integración y API.
 */
async function getPaykuClientConfig() {
  const settings = await getGatewaySettings();

  const apiUrl = getPaykuApiUrl(settings.payku.environment);
  const gatewayBaseUrl = getPaykuGatewayUrl(settings.payku.environment);
  const configuredApiUrl = settings.payku.apiUrl?.trim();

  return {
    publicToken: (settings.payku.apiToken || process.env.PAYKU_PUBLIC_TOKEN || "").trim(),
    privateToken: (settings.payku.privateToken || process.env.PAYKU_PRIVATE_TOKEN || "").trim(),
    apiUrl: (configuredApiUrl || apiUrl).replace(/\/+$/, ""),
    gatewayBaseUrl,
    // secretKey is kept for possible future use but Payku does not use HMAC
    secretKey: (settings.payku.secretKey || process.env.PAYKU_SECRET_KEY || "").trim(),
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
  redirectMethod?: "GET" | "POST";
  formFields?: Record<string, string>;
  status?: string;
}

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

export interface PaykuStatusData {
  id?: string;
  order?: string;
  status: "success" | "pending" | "failed" | "cancelled";
  amount?: number;
  currency?: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

/**
 * Maps any value Payku may return in the `estado` / `status` field to a
 * normalized internal status.
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

  // Handle numeric values directly (API sometimes returns a number, not a string)
  if (typeof status === "number") {
    if (status === 1) return "success";
    if (status === 2) return "pending";
    if (status === 3) return "failed";
    if (status === 4) return "cancelled";
    return "pending";
  }

  const s = String(status).toLowerCase().trim();
  console.log(`[Payku Mapping] Original: "${status}", Cleaned: "${s}"`);

  const successStates = [
    "1", "success", "aprobado", "aprobada", "v",
    "approved", "validada", "validado",
  ];
  const failedStates = [
    "3", "failed", "rechazado", "rechazada", "rejected", "r", "error",
  ];
  const cancelledStates = [
    "4", "cancelled", "cancelado", "cancelada", "anulado", "anulada", "c",
  ];
  const pendingStates = [
    "2", "pending", "pendiente", "register", "p", "not_paid",
  ];

  if (successStates.includes(s)) return "success";
  if (failedStates.includes(s)) return "failed";
  if (cancelledStates.includes(s)) return "cancelled";
  if (pendingStates.includes(s)) return "pending";

  return "pending";
}

// ---------------------------------------------------------------------------
// Create transaction  (uses PUBLIC token)
// ---------------------------------------------------------------------------

export async function createPaykuPayment(
  data: PaykuPaymentCreate
): Promise<PaykuPaymentResponse> {
  const { publicToken, gatewayBaseUrl } = await getPaykuClientConfig();

  if (!publicToken) {
    throw new Error(
      "Payku public token not configured. " +
      "Set PAYKU_PUBLIC_TOKEN in your .env or in the panel settings."
    );
  }

  const paymentUrl = `${gatewayBaseUrl}/pago`;
  const formFields: Record<string, string> = {
    order_id: data.order,
    amount: String(data.amount),
    amount_order: String(data.amount),
    currency: "CLP",
    email_from: data.email,
    token: publicToken,
    detail: data.subject,
    ...(data.notifyUrl ? { notify_url: data.notifyUrl } : {}),
    ...(data.returnUrl ? { return_url: data.returnUrl } : {}),
  };

  console.log("[Payku Create] Using gateway form redirect:", {
    paymentUrl,
    order: data.order,
    amount: data.amount,
  });

  return {
    id: undefined,
    order: data.order,
    paymentUrl,
    url: paymentUrl,
    redirectMethod: "POST",
    formFields,
    status: "pending",
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
      "[Payku] Private token not configured. " +
      "Set PAYKU_PRIVATE_TOKEN in your .env or in the panel settings. " +
      "Status checks will return 'pending' until this is fixed."
    );
    return { status: "pending", id };
  }

  const url = `${apiUrl}/transaction/${id}`;
  console.log(`[Payku] GET ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${privateToken}`,
      },
    });

    const responseText = await response.text();
    console.log(
      `[Payku Status] Raw Response (${response.status}):`,
      responseText
    );

    let responseData: Record<string, unknown>;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error(
        "[Payku] Failed to parse status JSON:",
        responseText.slice(0, 500)
      );
      return { status: "pending", id };
    }

    if (!response.ok) {
      console.warn(
        `[Payku] Status check failed with HTTP ${response.status}:`,
        responseData.message
      );
      return { status: "pending", id };
    }

    const rawEstado = responseData.estado ?? responseData.status;
    const mappedStatus = mapPaykuStatus(rawEstado);

    console.log(
      `[Payku Status] ID: ${id} | Raw estado: "${rawEstado}" | Mapped: "${mappedStatus}"`
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

export async function verifyPaykuPayment(
  payload: PaykuCallbackPayload,
  expected: {
    orderId: string;
    amount: number;
    email: string;
    currency?: string;
    detail?: string;
  }
): Promise<"VALID" | "INVALID"> {
  const { publicToken, gatewayBaseUrl } = await getPaykuClientConfig();

  if (!publicToken) {
    throw new Error("Payku public token not configured");
  }

  if (!payload.transactionId || !payload.verificationKey) {
    return "INVALID";
  }

  const verificationUrl = new URL(`${gatewayBaseUrl}/verificar`);
  verificationUrl.searchParams.set("transaction_id", payload.transactionId);
  verificationUrl.searchParams.set("verification_key", payload.verificationKey);
  verificationUrl.searchParams.set("token", publicToken);
  verificationUrl.searchParams.set("email", expected.email);
  verificationUrl.searchParams.set("amount", String(expected.amount));
  verificationUrl.searchParams.set("currency_code", expected.currency || "CLP");
  verificationUrl.searchParams.set("order_id", expected.orderId);

  if (expected.detail) {
    verificationUrl.searchParams.set("detail", expected.detail);
  }

  const response = await fetch(verificationUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const text = (await response.text()).trim().toUpperCase();
  return response.ok && text === "VALID" ? "VALID" : "INVALID";
}

export async function parsePaykuCallbackRequest(
  request: Request
): Promise<PaykuCallbackPayload> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return normalizePaykuCallbackPayload(body);
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return normalizePaykuCallbackPayload(Object.fromEntries(formData.entries()));
  }

  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return normalizePaykuCallbackPayload({});
  }

  try {
    return normalizePaykuCallbackPayload(JSON.parse(rawBody) as Record<string, unknown>);
  } catch {
    return normalizePaykuCallbackPayload(Object.fromEntries(new URLSearchParams(rawBody).entries()));
  }
}

function normalizePaykuCallbackPayload(
  payload: Record<string, unknown>
): PaykuCallbackPayload {
  return {
    orderId: readString(payload.order_id ?? payload.orderId ?? payload.order),
    transactionId: readString(payload.transaction_id ?? payload.transactionId ?? payload.id),
    status: readString(payload.status ?? payload.estado),
    verificationKey: readString(payload.verification_key ?? payload.verificationKey),
    email: readString(payload.email ?? payload.email_from),
    amount: readNumber(payload.amount ?? payload.amount_order ?? payload.monto),
    currency: readString(payload.currency ?? payload.currency_code ?? payload.moneda),
    detail: readString(payload.detail),
  };
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Webhook handling
//
// Payku does NOT use HMAC-SHA256 signatures. The webhook is a simple POST
// containing the transaction `id`. The correct verification strategy is to
// re-query the transaction via GET /transaction/:id using the private token.
//
// IMPORTANT for sandbox / local development:
//   Payku cannot reach `localhost`. Use a public tunnel:
//     - ngrok:        ngrok http 3000
//     - cloudflared:  cloudflared tunnel --url http://localhost:3000
//   Then set PAYKU_NOTIFY_URL=https://<your-tunnel>/api/webhooks/payku
// ---------------------------------------------------------------------------

/**
 * Verifies a Payku webhook by re-querying the transaction status via the API.
 * This is the correct approach for Payku — it does not sign webhook payloads
 * with HMAC, unlike Stripe or MercadoPago.
 *
 * @param transactionId - The `id` field received in the webhook body.
 * @returns The verified transaction status from the Payku API.
 */
export async function verifyPaykuWebhook(
  transactionId: string
): Promise<PaykuStatusData> {
  if (!transactionId) {
    throw new Error("verifyPaykuWebhook: transactionId is required");
  }
  return getPaykuPaymentStatus(transactionId);
}

/**
 * Process a Payku webhook POST payload.
 *
 * Payku sends either a JSON body or form-encoded body with an `id` field.
 * We always re-verify the status via the API before triggering any callback.
 *
 * Example handler (Next.js App Router):
 *
 *   export async function POST(req: Request) {
 *     const payload = await req.json().catch(() => Object.fromEntries(
 *       new URLSearchParams(await req.text())
 *     ));
 *     const result = await processPaykuWebhook(
 *       payload,
 *       async (payment) => { // activate plugin, send email, etc. },
 *       async (payment) => { // handle failure },
 *     );
 *     return Response.json(result);
 *   }
 */
export async function processPaykuWebhook(
  payload: Record<string, unknown>,
  onPaymentSuccess: (payment: PaykuStatusData) => Promise<void>,
  onPaymentFailed?: (payment: PaykuStatusData) => Promise<void>
): Promise<{ success: boolean; message: string }> {
  try {
    // Payku sends the transaction id in `id` or sometimes `token`
    const transactionId = (payload.id ?? payload.token) as string | undefined;

    if (!transactionId) {
      console.error("[Payku Webhook] Payload missing transaction id:", payload);
      return { success: false, message: "Missing transaction id in payload" };
    }

    console.log(`[Payku Webhook] Received for transaction: ${transactionId}`);

    // Always re-verify via API — never trust webhook payload status alone
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
        // No action needed — transaction is still in progress
        console.log(
          `[Payku Webhook] Transaction ${transactionId} is still pending. No action taken.`
        );
        break;
    }

    return { success: true, message: "Webhook processed" };
  } catch (error) {
    console.error("[Payku Webhook] Error processing webhook:", error);
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
    case PaykuPaymentStatus.SUCCESS: return "Paid";
    case PaykuPaymentStatus.PENDING: return "Pending";
    case PaykuPaymentStatus.FAILED: return "Failed";
    case PaykuPaymentStatus.CANCELLED: return "Cancelled";
    default: return "Unknown";
  }
}

export function generatePaykuOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PK-${timestamp}-${random}`;
}

// ---------------------------------------------------------------------------
// Sandbox setup checklist (remove before production)
// ---------------------------------------------------------------------------
//
// 1. Register at https://des.payku.cl
// 2. Go to Integración → Tokens Integración y API
// 3. Copy both tokens into .env.local:
//
//    PAYKU_PUBLIC_TOKEN=your_sandbox_public_token
//    PAYKU_PRIVATE_TOKEN=your_sandbox_private_token
//
// 4. Expose localhost with a tunnel for webhook testing:
//    npx ngrok http 3000   →   copy the https URL
//
// 5. Set callback URLs in .env.local:
//
//    PAYKU_RETURN_URL=https://xxxx.ngrok-free.app/payment/return
//    PAYKU_NOTIFY_URL=https://xxxx.ngrok-free.app/api/webhooks/payku
//
// 6. When calling createPaykuPayment(), pass those env vars:
//
//    await createPaykuPayment({
//      order: generatePaykuOrderNumber(),
//      subject: "Plugin EpicShop 1.21",
//      amount: 5990,
//      email: user.email,
//      returnUrl: process.env.PAYKU_RETURN_URL,
//      notifyUrl: process.env.PAYKU_NOTIFY_URL,
//    });
//
// ---------------------------------------------------------------------------
