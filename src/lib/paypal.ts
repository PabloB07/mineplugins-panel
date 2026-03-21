import { getGatewaySettings, type GatewayEnvironment } from "@/lib/payment-gateway-settings";

type PaypalEnvironment = "sandbox" | "production";

function toPaypalEnvironment(value: GatewayEnvironment): PaypalEnvironment {
  return value === "PRODUCTION" ? "production" : "sandbox";
}

function getPaypalBaseUrl(env: PaypalEnvironment): string {
  // PayPal Orders API hostnames
  return env === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPaypalAccessToken(): Promise<string> {
  const settings = await getGatewaySettings();
  const PAYPAL_CLIENT_ID = settings.paypal.clientId || "";
  const PAYPAL_CLIENT_SECRET = settings.paypal.clientSecret || "";
  const paypalEnvironment = toPaypalEnvironment(settings.paypal.environment);

  if (
    !PAYPAL_CLIENT_ID ||
    !PAYPAL_CLIENT_SECRET ||
    PAYPAL_CLIENT_ID === "placeholder" ||
    PAYPAL_CLIENT_SECRET === "placeholder"
  ) {
    throw new Error(
      "PayPal is not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET."
    );
  }

  const baseUrl = getPaypalBaseUrl(paypalEnvironment);

  const basicAuth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const message =
      (typeof data?.error_description === "string" && data.error_description) ||
      (typeof data?.message === "string" && data.message) ||
      `PayPal token error: ${response.status}`;
    throw new Error(message);
  }

  if (typeof data?.access_token !== "string") {
    throw new Error("PayPal token response missing access_token");
  }

  return data.access_token;
}

export function generatePaypalOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PP-${timestamp}-${random}`;
}

export interface PaypalPaymentCreate {
  order: string; // internal orderNumber (invoice_id)
  productName: string; // description
  amountUSD: number;
  email: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaypalPaymentCreateResponse {
  orderId: string; // PayPal order id
  approvalUrl: string;
}

export interface PaypalCaptureResponse {
  id: string;
  status: string;
  purchase_units?: Array<{
    invoice_id?: string;
    reference_id?: string;
  }>;
}

export async function createPaypalPayment(
  data: PaypalPaymentCreate
): Promise<PaypalPaymentCreateResponse> {
  const settings = await getGatewaySettings();
  const paypalEnvironment = toPaypalEnvironment(settings.paypal.environment);

  if (!settings.paypal.clientId || !settings.paypal.clientSecret) {
    throw new Error("PayPal is not configured. Check environment variables.");
  }

  if (!data.order || data.order.trim().length === 0) {
    throw new Error("Order number is required");
  }
  if (!data.productName || data.productName.trim().length === 0) {
    throw new Error("Product name is required");
  }
  if (!data.email || data.email.trim().length === 0) {
    throw new Error("Email is required");
  }
  if (!Number.isFinite(data.amountUSD) || data.amountUSD <= 0) {
    throw new Error("Valid amountUSD is required");
  }

  const baseUrl = getPaypalBaseUrl(paypalEnvironment);
  const accessToken = await getPaypalAccessToken();

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        invoice_id: data.order,
        reference_id: data.order,
        description: data.productName,
        amount: {
          currency_code: "USD",
          value: data.amountUSD.toFixed(2),
        },
      },
    ],
    application_context: {
      return_url: data.returnUrl,
      cancel_url: data.cancelUrl,
      brand_name: "MinePlugins",
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
    },
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseData = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const message =
      (typeof responseData?.message === "string" && responseData.message) ||
      (typeof responseData?.error_description === "string" && responseData.error_description) ||
      `PayPal create order error: ${response.status}`;
    throw new Error(message);
  }

  const orderId = typeof responseData?.id === "string" ? responseData.id : "";

  const approvalLink = Array.isArray(responseData?.links)
    ? (responseData.links as Array<Record<string, unknown>>).find(
        (l) => l?.rel === "approve" && typeof l?.href === "string"
      )?.href
    : undefined;

  if (!orderId) {
    throw new Error("PayPal create order response missing id");
  }
  if (!approvalLink || typeof approvalLink !== "string") {
    throw new Error("PayPal create order response missing approval link");
  }

  return {
    orderId,
    approvalUrl: approvalLink,
  };
}

export async function capturePaypalPayment(orderId: string): Promise<PaypalCaptureResponse> {
  if (!orderId || orderId.trim().length === 0) {
    throw new Error("PayPal orderId is required");
  }

  const settings = await getGatewaySettings();
  const paypalEnvironment = toPaypalEnvironment(settings.paypal.environment);
  const baseUrl = getPaypalBaseUrl(paypalEnvironment);
  const accessToken = await getPaypalAccessToken();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({}),
  });

  const responseData = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const message =
      (typeof responseData?.message === "string" && responseData.message) ||
      (typeof responseData?.error_description === "string" && responseData.error_description) ||
      `PayPal capture error: ${response.status}`;
    throw new Error(message);
  }

  return {
    id: typeof responseData?.id === "string" ? responseData.id : orderId,
    status: typeof responseData?.status === "string" ? responseData.status : "UNKNOWN",
    purchase_units: Array.isArray(responseData?.purchase_units)
      ? (responseData.purchase_units as Array<Record<string, unknown>>).map((unit) => ({
          invoice_id: typeof unit?.invoice_id === "string" ? unit.invoice_id : undefined,
          reference_id: typeof unit?.reference_id === "string" ? unit.reference_id : undefined,
        }))
      : undefined,
  };
}

export async function verifyPaypalWebhookSignature(
  payload: string,
  headers: Headers
): Promise<boolean> {
  try {
    const settings = await getGatewaySettings();
    const PAYPAL_WEBHOOK_ID = settings.paypal.webhookId || process.env.PAYPAL_WEBHOOK_ID || "";
    const paypalEnvironment = toPaypalEnvironment(settings.paypal.environment);

    if (!PAYPAL_WEBHOOK_ID) {
      console.warn("PAYPAL_WEBHOOK_ID is not configured");
      return false;
    }

    const transmissionId = headers.get("paypal-transmission-id") || "";
    const transmissionSig = headers.get("paypal-transmission-sig") || "";
    const transmissionTime = headers.get("paypal-transmission-time") || "";
    const certUrl = headers.get("paypal-cert-url") || "";
    const authAlgo = headers.get("paypal-auth-algo") || "";

    if (!transmissionId || !transmissionSig || !transmissionTime || !certUrl || !authAlgo) {
      return false;
    }

    const baseUrl = getPaypalBaseUrl(paypalEnvironment);
    const accessToken = await getPaypalAccessToken();

    const webhookEvent = JSON.parse(payload);

    const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: webhookEvent,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      console.warn("PayPal webhook signature verification failed:", {
        status: response.status,
        data,
      });
      return false;
    }

    return data?.verification_status === "SUCCESS";
  } catch (error) {
    console.error("PayPal webhook signature verification error:", error);
    return false;
  }
}

