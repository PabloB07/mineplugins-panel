import crypto from "crypto";
import { getRequiredEnv } from "./security";

const TEBEX_API_URL = "https://api.tebex.io/api/v2";
const TEBEX_SECRET_KEY = getRequiredEnv("TEBEX_SECRET_KEY");
const TEBEX_STORE_ID = getRequiredEnv("TEBEX_STORE_ID");

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
  const response = await fetch(`${TEBEX_API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: TEBEX_SECRET_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("Tebex API error:", error);
    throw new Error(`Tebex API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

export async function createTebexPayment(
  data: TebexPaymentCreate
): Promise<TebexPaymentResponse> {
  try {
    if (!data.order || data.order.trim().length === 0) {
      throw new Error("Order number is required");
    }
    if (!data.productName || data.productName.trim().length === 0) {
      throw new Error("Product name is required");
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error("Valid amount is required");
    }
    if (!data.email || data.email.trim().length === 0) {
      throw new Error("Email is required");
    }

    const payload: Record<string, unknown> = {
      checkout: {
        complete_redirect_url: data.redirectUrl || `${process.env.NEXTAUTH_URL}/orders?success=true`,
        incomplete_redirect_url: `${process.env.NEXTAUTH_URL}/orders?pending=true`,
      },
      email: data.email.trim(),
      username: data.username || data.email.split("@")[0],
      products: [
        {
          id: data.order,
          name: data.productName,
          price: Math.round(data.amount * 100) / 100,
          quantity: 1,
        },
      ],
    };

    if (data.webhookUrl) {
      payload.webhook = data.webhookUrl;
    }

    if (data.customFields) {
      payload.fields = Object.entries(data.customFields).map(([key, value]) => ({
        name: key,
        value: String(value),
      }));
    }

    const result = await tebexRequest<{
      data: {
        id: string;
        url: string;
      };
    }>("/checkout/transaction", "POST", payload);

    return {
      id: result.data.id,
      checkoutUrl: result.data.url,
      status: "pending",
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
        id: string;
        status: string;
        email: string;
        username?: string;
        price: {
          total: number;
          currency: string;
        };
        products: Array<{
          id: number;
          name: string;
          quantity: number;
          price: number;
        }>;
        date: {
          created: string;
        };
        completed_date?: string;
      };
    }>(`/transactions/${transactionId}`, "GET");

    return {
      status: mapTebexStatus(result.data.status),
      transactionId: result.data.id,
      email: result.data.email,
      amount: result.data.price.total,
      currency: result.data.price.currency,
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
  switch (status.toLowerCase()) {
    case "completed":
    case "paid":
      return "completed";
    case "pending":
    case "waiting":
      return "pending";
    case "refunded":
      return "refunded";
    case "chargeback":
      return "chargeback";
    case "failed":
    case "cancelled":
    case "canceled":
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

    const priceData = data.price as { total?: number; currency?: string } | undefined;
    const paymentStatus: TebexPaymentStatus = {
      status: mapTebexStatus(String(data.status || "pending")),
      transactionId: String(data.id || ""),
      email: String(data.email || ""),
      amount: Number(priceData?.total || data.amount || 0),
      currency: String(priceData?.currency || data.currency || "USD"),
    };

    switch (eventType) {
      case "sale.complete":
      case "payment.success":
        await onPaymentSuccess(paymentStatus);
        break;

      case "sale.refunded":
      case "refund.created":
        if (onPaymentFailed) {
          paymentStatus.status = "refunded";
          await onPaymentFailed(paymentStatus);
        }
        break;

      case "sale.chargeback":
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
