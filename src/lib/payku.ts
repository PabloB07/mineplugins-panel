import crypto from "crypto";
import { getGatewaySettings, type GatewayEnvironment } from "@/lib/payment-gateway-settings";

function getPaykuApiUrl(environment: GatewayEnvironment): string {
  return environment === "PRODUCTION"
    ? "https://app.payku.cl"
    : "https://des.payku.cl";
}

export interface PaykuPaymentCreate {
  order: string; // Número de orden único
  subject: string; // Descripción del pago
  amount: number; // Monto en CLP (no centavos)
  email: string; // Email del cliente
  payment_url?: string; // URL de retorno después del pago
  webhook?: string; // URL para notificaciones
  additional_parameters?: Record<string, unknown>; // Parámetros adicionales opcionales
}

export interface PaykuPaymentResponse {
  id?: string; // ID de la transacción
  transaccion_id?: string;
  order?: string; // Número de orden
  orden?: string;
  payment_key?: string; // Clave de pago
  transaction_key?: string; // Clave de transacción
  transaccion_key?: string;
  verification_key?: string; // Clave de verificación
  verificacion_key?: string;
  status?: string; // Estado inicial
  estado?: string;
  payment_url?: string; // URL para redirigir al cliente
  url_pago?: string;
  url_redireccion?: string;
  url?: string;
}

export interface PaykuPaymentStatus {
  transaction_id?: string;
  transaccion_id?: string;
  payment_key?: string;
  transaction_key?: string;
  transaccion_key?: string;
  verification_key?: string;
  verificacion_key?: string;
  order?: string;
  orden?: string;
  status: "success" | "pending" | "failed" | "cancelled";
  estado?: "success" | "pending" | "failed" | "cancelled";
  amount?: number;
  monto?: number;
  currency?: string;
  moneda?: string;
  email?: string;
  created_at?: string;
  fecha_creacion?: string;
  paid_at?: string;
  fecha_pago?: string;
}

/**
 * Crea un pago con Payku
 */
export async function createPaykuPayment(
  data: PaykuPaymentCreate
): Promise<PaykuPaymentResponse> {
  try {
    const settings = await getGatewaySettings();
    const PAYKU_API_TOKEN = settings.payku.apiToken || "";
    const PAYKU_API_URL = getPaykuApiUrl(settings.payku.environment);

    if (!PAYKU_API_TOKEN || PAYKU_API_TOKEN === "placeholder") {
      throw new Error("Payku is not configured. Please set PAYKU_API_TOKEN environment variable.");
    }

    // Validate input with detailed error messages
    if (!data.order || data.order.trim().length === 0) {
      throw new Error("Order number is required and cannot be empty");
    }
    if (!data.subject || data.subject.trim().length === 0) {
      throw new Error("Subject is required and cannot be empty");
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error(`Valid amount is required (minimum CLP 1,000), received: ${data.amount}`);
    }
    if (!data.email || data.email.trim().length === 0) {
      throw new Error("Email is required and cannot be empty");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("Invalid email format");
    }

    // Ensure amount is at least 1000 CLP (Payku minimum)
    const amount = Math.round(data.amount);
    if (amount < 1000) {
      throw new Error(`Amount must be at least CLP 1,000, received: ${amount}`);
    }

    // Build base payload with required fields.
    const requestPayload: Record<string, unknown> = {
      order: data.order.trim(),
      subject: data.subject.trim(),
      amount: amount,
      email: data.email.trim(),
    };

    // Add optional fields only if they have values.
    if (data.payment_url && data.payment_url.trim().length > 0) {
      requestPayload.urlreturn = data.payment_url.trim();
    }
    if (data.webhook && data.webhook.trim().length > 0) {
      requestPayload.webhook = data.webhook.trim();
    }
    if (data.additional_parameters) {
      requestPayload.additional_parameters = data.additional_parameters;
    }

    const response = await fetch(`${PAYKU_API_URL}/api/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYKU_API_TOKEN}`,
      },
      body: JSON.stringify(requestPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Payku error:", responseData);
      throw new Error(`Payku error: ${responseData.message || responseData.error || responseData.mensaje || "Unknown error"}`);
    }

    // Extract payment URL from various possible field names
    const paymentUrl = responseData.url_pago || responseData.payment_url || responseData.url_redireccion || responseData.url_pago_redireccion || responseData.url;

    if (!paymentUrl) {
      console.error("No payment URL found in response:", responseData);
      throw new Error(`Payku error: No payment URL received. Response: ${JSON.stringify(responseData)}`);
    }

    return {
      id: responseData.id || responseData.transaccion_id || responseData.transactionId,
      order: responseData.orden || responseData.order || data.order,
      payment_key: responseData.payment_key || responseData.paymentKey,
      transaction_key: responseData.transaccion_key || responseData.transactionKey,
      verification_key: responseData.verificacion_key || responseData.verificationKey,
      status: responseData.estado || responseData.status || "pending",
      payment_url: paymentUrl,
    };
  } catch (error) {
    console.error("Payku payment creation error:", error);
    throw error;
  }
}

/**
 * Obtiene el estado de un pago desde Payku
 */
export async function getPaykuPaymentStatus(
  order: string
): Promise<PaykuPaymentStatus> {
  try {
    const settings = await getGatewaySettings();
    const PAYKU_API_TOKEN = settings.payku.apiToken || "";
    const PAYKU_API_URL = getPaykuApiUrl(settings.payku.environment);

    const response = await fetch(`${PAYKU_API_URL}/api/transaction/${order}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYKU_API_TOKEN}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Payku error:", responseData);

      // Handle specific validation errors
      if (responseData.status === "failed" || responseData.status === "error") {
        const fieldErrors = [];

        if (responseData.message_error?.includes("subject:invalid")) {
          fieldErrors.push("Subject cannot be empty");
        }
        if (responseData.message_error?.includes("amount:is empty")) {
          fieldErrors.push("Amount must be at least CLP 1,000");
        }
        if (responseData.message_error?.includes("order:invalid")) {
          fieldErrors.push("Order number is invalid or already exists");
        }

        if (fieldErrors.length > 0) {
          throw new Error(`Validation failed: ${fieldErrors.join(", ")}. Please check: subject (cannot be empty), amount (minimum CLP 1,000), order number must be unique.`);
        }
      }

      // Handle "token public is not valid" error specifically
      if (responseData.message_error?.includes("token public is not valid")) {
        throw new Error("Payku API token is invalid. Please check your Payku merchant dashboard and ensure you have a valid API token with payment creation permissions.");
      }

      const errorMessage = responseData.message || responseData.message_error || responseData.error || "Unknown error";
      throw new Error(`Payku error: ${errorMessage}`);
    }

    return {
      transaction_id: responseData.transaccion_id || responseData.id,
      payment_key: responseData.payment_key,
      transaction_key: responseData.transaccion_key,
      verification_key: responseData.verificacion_key || responseData.verification_key,
      order: responseData.orden || order,
      status: responseData.estado || responseData.status,
      amount: responseData.monto,
      currency: responseData.moneda || "CLP",
      email: responseData.email,
      created_at: responseData.fecha_creacion || responseData.created_at,
      paid_at: responseData.fecha_pago || responseData.paid_at,
    };
  } catch (error) {
    console.error("Payku status check error:", error);
    throw error;
  }
}

/**
 * Verifica la firma del webhook de Payku
 */
export async function verifyPaykuWebhookSignature(
  payload: string,
  receivedSignature: string
): Promise<boolean> {
  try {
    const settings = await getGatewaySettings();
    const paykuSecret = (settings.payku.secretKey || process.env.PAYKU_SECRET_KEY || "").trim();

    if (!paykuSecret) {
      console.warn("Payku is not configured, skipping webhook verification");
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", paykuSecret)
      .update(payload)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(receivedSignature);

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    console.error("Payku signature verification error:", error);
    return false;
  }
}

/**
 * Códigos de estado de pago Payku
 */
export const PaykuPaymentStatus = {
  SUCCESS: "success",
  PENDING: "pending",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

/**
 * Obtiene etiqueta legible desde el estado
 */
export function getPaykuStatusLabel(status: string): string {
  switch (status) {
    case PaykuPaymentStatus.SUCCESS:
      return "Paid";
    case PaykuPaymentStatus.PENDING:
      return "Pending";
    case PaykuPaymentStatus.FAILED:
      return "Failed";
    case PaykuPaymentStatus.CANCELLED:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

/**
 * Procesa webhook de Payku
 */
export async function processPaykuWebhook(
  payload: Record<string, unknown>,
  onPaymentSuccess: (payment: PaykuPaymentStatus) => Promise<void>,
  onPaymentFailed?: (payment: PaykuPaymentStatus) => Promise<void>
): Promise<{ success: boolean; message: string }> {
  try {
    // Procesar según el tipo de evento
    const evento = typeof payload.evento === "string" ? payload.evento : "";
    const data =
      payload.data && typeof payload.data === "object"
        ? (payload.data as PaykuPaymentStatus)
        : ({} as PaykuPaymentStatus);

    switch (evento) {
      case "pago.aprobado":
      case "payment.success":
        await onPaymentSuccess(data);
        break;

      case "pago.rechazado":
      case "payment.failed":
        if (onPaymentFailed) {
          await onPaymentFailed(data);
        }
        break;

      default:
        console.log(`Unhandled webhook event: ${evento}`);
    }

    return {
      success: true,
      message: "Webhook processed successfully",
    };
  } catch (error) {
    console.error("Payku webhook processing error:", error);
    return {
      success: false,
      message: "Error processing webhook",
    };
  }
}

/**
 * Genera un número de orden único para Payku
 */
export function generatePaykuOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PK-${timestamp}-${random}`;
}
