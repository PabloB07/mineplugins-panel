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

  const apiUrl =
    settings.payku.apiUrl || getPaykuApiUrl(settings.payku.environment);

  return {
    publicToken: (settings.payku.apiToken || process.env.PAYKU_PUBLIC_TOKEN || "").trim(),
    privateToken: (settings.payku.privateToken || process.env.PAYKU_PRIVATE_TOKEN || "").trim(),
    apiUrl: apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl,
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
  const { publicToken, apiUrl } = await getPaykuClientConfig();

  if (!publicToken) {
    throw new Error(
      "Payku public token not configured. " +
      "Set PAYKU_PUBLIC_TOKEN in your .env or in the panel settings."
    );
  }

  const payload = {
    order: data.order,
    subject: data.subject,
    amount: data.amount,
    email: data.email,
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
  console.log(`[Payku Create] Status (${response.status}):`, responseText);

  let responseData: Record<string, unknown>;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Payku returned invalid JSON (Status: ${response.status}): ${responseText.slice(0, 200)}`
    );
  }

  if (!response.ok) {
    const msg =
      (responseData.message as string) ||
      (responseData.message_error as string) ||
      "Unknown error";
    throw new Error(`Payku error (${response.status}): ${msg}`);
  }

  const paymentUrl = extractPaykuPaymentUrl(responseData, data);
  const redirectMethod = inferPaykuRedirectMethod(responseData);
  const formFields = extractPaykuFormFields(responseData);
  const transactionId =
    (responseData.id as string) ||
    (responseData.transaction_id as string) ||
    (responseData.identifier as string) ||
    (responseData.token as string) ||
    (responseData.token_ws as string);

  if (!paymentUrl) {
    console.error("[Payku Create] Response missing URL:", responseData);
    throw new Error("Payku did not return a payment URL in the response.");
  }

  console.log(
    `[Payku Create] Success. ID: ${transactionId}, Redirect URL: ${paymentUrl}`
  );

  return {
    id: transactionId,
    order: (responseData.order as string) || data.order,
    paymentUrl,
    url: paymentUrl,
    redirectMethod,
    formFields,
    status: mapPaykuStatus(responseData.estado ?? responseData.status),
  };
}

function extractPaykuPaymentUrl(
  responseData: Record<string, unknown>,
  requestData?: PaykuPaymentCreate
): string | undefined {
  const candidates = [
    responseData.paymentUrl,
    responseData.payment_url,
    responseData.redirect_url,
    responseData.redirectUrl,
    responseData.url_pago,
    responseData.url,
  ];

  const callbackUrls = new Set(
    [requestData?.returnUrl, requestData?.notifyUrl]
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
  );

  const normalizedCandidates = candidates
    .filter((candidate): candidate is string => typeof candidate === "string")
    .map((candidate) => candidate.trim())
    .filter(Boolean);

  const externalCandidate = normalizedCandidates.find((candidate) =>
    isLikelyPaykuCheckoutUrl(candidate, callbackUrls)
  );

  if (externalCandidate) {
    return externalCandidate;
  }

  for (const candidate of normalizedCandidates) {
    if (!callbackUrls.has(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function isLikelyPaykuCheckoutUrl(
  candidate: string,
  callbackUrls: Set<string>
): boolean {
  if (callbackUrls.has(candidate)) {
    return false;
  }

  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("payku")) {
      return true;
    }

    if (host.includes("transbank") || host.includes("webpay")) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function inferPaykuRedirectMethod(
  responseData: Record<string, unknown>
): "GET" | "POST" {
  if (extractPaykuPostTokenFields(responseData)) {
    return "POST";
  }

  const methodCandidate =
    responseData.method ??
    responseData.redirect_method ??
    responseData.redirectMethod;

  if (typeof methodCandidate === "string" && methodCandidate.trim().toUpperCase() === "POST") {
    return "POST";
  }

  return "GET";
}

function extractPaykuFormFields(
  responseData: Record<string, unknown>
): Record<string, string> | undefined {
  const tokenFields = extractPaykuPostTokenFields(responseData);
  if (tokenFields) {
    return tokenFields;
  }

  const rawFields =
    responseData.formFields ??
    responseData.form_fields ??
    responseData.fields;

  if (!rawFields || typeof rawFields !== "object" || Array.isArray(rawFields)) {
    return undefined;
  }

  const parsedEntries = Object.entries(rawFields).flatMap(([key, value]) => {
    if (typeof value !== "string") return [];
    const trimmed = value.trim();
    return trimmed ? [[key, trimmed] as const] : [];
  });

  return parsedEntries.length > 0 ? Object.fromEntries(parsedEntries) : undefined;
}

function extractPaykuPostTokenFields(
  responseData: Record<string, unknown>
): Record<string, string> | undefined {
  const tokenWs = toNonEmptyString(responseData.token_ws);
  if (tokenWs) {
    return { token_ws: tokenWs };
  }

  const token = toNonEmptyString(responseData.token);
  if (token) {
    return { token };
  }

  return undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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
