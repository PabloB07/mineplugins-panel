import crypto from "crypto";

const TEBEX_API_URL = "https://checkout.tebex.io/api";
const TEBEX_SECRET_KEY = process.env.TEBEX_SECRET_KEY || "";
const TEBEX_STORE_ID = process.env.TEBEX_STORE_ID || "";

function isTebexConfigured(): boolean {
  return !!(TEBEX_SECRET_KEY && TEBEX_STORE_ID && TEBEX_SECRET_KEY !== "placeholder");
}

function getBasicAuthHeader(): string {
  const credentials = Buffer.from(`${TEBEX_STORE_ID}:${TEBEX_SECRET_KEY}`).toString("base64");
  return `Basic ${credentials}`;
}

export interface TebexPaymentCreate {
  order: string;
  productName: string;
  amount: number;
  email: string;
  username?: string;
  webhookUrl?: string;
  redirectUrl?: string;
  customFields?: Record<string, string | number>;
}

export interface TebexPaymentResponse {
  id: string;
  checkoutUrl: string;
  status: string;
  ident?: string;
}

export interface TebexTransaction {
  id: string;
  status: "completed" | "pending" | "refunded" | "chargeback" | "failed";
  email: string;
  username?: string;
  amount: number;
  currency: string;
  products: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface TebexPaymentStatus {
  status: "completed" | "pending" | "refunded" | "chargeback" | "failed";
  transactionId: string;
  email: string;
  amount: number;
  currency: string;
}

async function tebexRequest<T>(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  if (!isTebexConfigured()) {
    throw new Error("Tebex is not configured. Please set TEBEX_SECRET_KEY and TEBEX_STORE_ID environment variables.");
  }

  const authHeader = `Basic ${Buffer.from(`${TEBEX_STORE_ID}:${TEBEX_SECRET_KEY}`).toString("base64")}`;
  
  console.log("Tebex request:", method, TEBEX_API_URL + endpoint);
  console.log("Tebex auth:", authHeader.substring(0, 20) + "...");

  const response = await fetch(`${TEBEX_API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
      "Accept": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    console.error("Tebex API error:", response.status, responseText);
    throw new Error(`Tebex API error: ${response.status} - ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`Tebex invalid JSON response: ${responseText}`);
  }
}

export async function createTebexPayment(
  data: TebexPaymentCreate
): Promise<TebexPaymentResponse> {
  try {
    if (!isTebexConfigured()) {
      throw new Error("Tebex is not configured. Please set TEBEX_SECRET_KEY and TEBEX_STORE_ID environment variables.");
    }

    if (!data.order || data.order.trim().length === 0) {
      throw new Error("Order number is required");
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error("Valid amount is required");
    }
    if (!data.email || data.email.trim().length === 0) {
      throw new Error("Email is required");
    }

    const payload: Record<string, unknown> = {
      complete_url: data.redirectUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`,
      email: data.email.trim(),
      first_name: data.username || data.email.split("@")[0],
      last_name: "Customer",
      items: [
        {
          product_name: data.productName,
          price: Number((Math.round(data.amount * 100) / 100).toFixed(2)),
          qty: 1,
        },
      ],
    };

    console.log("Tebex payload:", JSON.stringify(payload, null, 2));

    const result = await tebexRequest<{
      data: {
        ident: string;
        links: {
          checkout: string;
          payment?: string;
        };
      };
    }>("/checkout", "POST", payload);

    return {
      id: result.data.ident,
      checkoutUrl: result.data.links.checkout,
      status: "pending",
      ident: result.data.ident,
    };
  } catch (error) {
    console.error("Tebex payment creation error:", error);
    throw error;
  }
}

export async function getTebexPaymentStatus(
  transactionId: string
): Promise<TebexPaymentStatus> {
  try {
    const result = await tebexRequest<{
      data: {
        ident: string;
        status: string;
        buyer: {
          email: string;
        };
        total: number;
        currency: string;
      };
    }>(`/baskets/${transactionId}`, "GET");

    return {
      status: mapTebexStatus(result.data.status),
      transactionId: result.data.ident,
      email: result.data.buyer.email,
      amount: result.data.total,
      currency: result.data.currency,
    };
  } catch (error) {
    console.error("Tebex status check error:", error);
    throw error;
  }
}

export function verifyTebexWebhookSignature(
  payload: string,
  signature: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", TEBEX_SECRET_KEY)
      .update(payload)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    console.error("Tebex signature verification error:", error);
    return false;
  }
}

function mapTebexStatus(status: string): TebexPaymentStatus["status"] {
  switch (status?.toLowerCase()) {
    case "completed":
    case "paid":
    case "Complete":
      return "completed";
    case "pending":
    case "waiting":
    case "Pending":
      return "pending";
    case "refunded":
    case "Refunded":
      return "refunded";
    case "chargeback":
    case "Chargeback":
      return "chargeback";
    case "failed":
    case "cancelled":
    case "canceled":
    case "Failed":
      return "failed";
    default:
      return "pending";
  }
}

export const TebexPaymentStatus = {
  COMPLETED: "completed",
  PENDING: "pending",
  REFUNDED: "refunded",
  CHARGEBACK: "chargeback",
  FAILED: "failed",
} as const;

export function getTebexStatusLabel(status: string): string {
  switch (status) {
    case TebexPaymentStatus.COMPLETED:
      return "Paid";
    case TebexPaymentStatus.PENDING:
      return "Pending";
    case TebexPaymentStatus.REFUNDED:
      return "Refunded";
    case TebexPaymentStatus.CHARGEBACK:
      return "Chargeback";
    case TebexPaymentStatus.FAILED:
      return "Failed";
    default:
      return "Unknown";
  }
}

export async function processTebexWebhook(
  payload: Record<string, unknown>,
  onPaymentSuccess: (payment: TebexPaymentStatus) => Promise<void>,
  onPaymentFailed?: (payment: TebexPaymentStatus) => Promise<void>
): Promise<{ success: boolean; message: string }> {
  try {
    const eventType = payload.event as string;
    const data = payload.data as Record<string, unknown>;

    if (!data) {
      return { success: false, message: "No data in webhook" };
    }

    const paymentStatus: TebexPaymentStatus = {
      status: mapTebexStatus(String(data.status || data.payment_status || "pending")),
      transactionId: String(data.ident || data.id || ""),
      email: String(data.email || ""),
      amount: Number(data.total || data.amount || 0),
      currency: String(data.currency || "USD"),
    };

    switch (eventType) {
      case "payment_success":
      case "payment.complete":
        await onPaymentSuccess(paymentStatus);
        break;

      case "payment_refunded":
        if (onPaymentFailed) {
          paymentStatus.status = "refunded";
          await onPaymentFailed(paymentStatus);
        }
        break;

      case "payment_chargeback":
        if (onPaymentFailed) {
          paymentStatus.status = "chargeback";
          await onPaymentFailed(paymentStatus);
        }
        break;

      default:
        console.log(`Unhandled Tebex webhook event: ${eventType}`);
    }

    return {
      success: true,
      message: "Webhook processed successfully",
    };
  } catch (error) {
    console.error("Tebex webhook processing error:", error);
    return {
      success: false,
      message: "Error processing webhook",
    };
  }
}

export function generateTebexOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TBX-${timestamp}-${random}`;
}
