import { getGatewaySettings, type GatewayEnvironment } from "@/lib/payment-gateway-settings";

function getPaykuGatewayUrl(environment: GatewayEnvironment): string {
  return environment === "PRODUCTION"
    ? "https://app.payku.cl/gateway"
    : "https://des.payku.cl/gateway";
}

async function getPaykuClientConfig() {
  const settings = await getGatewaySettings();

  return {
    publicToken: (settings.payku.apiToken || process.env.PAYKU_PUBLIC_TOKEN || "").trim(),
    gatewayBaseUrl: getPaykuGatewayUrl(settings.payku.environment),
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
  order?: string;
  paymentUrl?: string;
  url?: string;
  redirectMethod?: "POST";
  formFields?: Record<string, string>;
  status?: "pending";
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

  const normalized = String(status).toLowerCase().trim();

  if (["1", "success", "aprobado", "aprobada", "approved", "validado", "validada", "v"].includes(normalized)) {
    return "success";
  }

  if (["3", "failed", "rechazado", "rechazada", "rejected", "error", "r"].includes(normalized)) {
    return "failed";
  }

  if (["4", "cancelled", "cancelado", "cancelada", "anulado", "anulada", "c"].includes(normalized)) {
    return "cancelled";
  }

  return "pending";
}

export async function createPaykuPayment(
  data: PaykuPaymentCreate
): Promise<PaykuPaymentResponse> {
  const { publicToken, gatewayBaseUrl } = await getPaykuClientConfig();

  if (!publicToken) {
    throw new Error(
      "Payku token not configured. Set PAYKU_API_TOKEN or PAYKU_PUBLIC_TOKEN in your environment or panel settings."
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

  return {
    order: data.order,
    paymentUrl,
    url: paymentUrl,
    redirectMethod: "POST",
    formFields,
    status: "pending",
  };
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
    throw new Error("Payku token not configured");
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
    return normalizePaykuCallbackPayload(
      (await request.json()) as Record<string, unknown>
    );
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return normalizePaykuCallbackPayload(Object.fromEntries(formData.entries()));
  }

  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return normalizePaykuCallbackPayload({});
  }

  try {
    return normalizePaykuCallbackPayload(
      JSON.parse(rawBody) as Record<string, unknown>
    );
  } catch {
    return normalizePaykuCallbackPayload(
      Object.fromEntries(new URLSearchParams(rawBody).entries())
    );
  }
}

export function generatePaykuOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PK-${timestamp}-${random}`;
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
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}
