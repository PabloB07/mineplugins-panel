import crypto from "crypto";

const PAYKU_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://app.payku.cl/api"
    : "https://des.payku.cl/api";

const PAYKU_API_TOKEN = process.env.PAYKU_API_TOKEN!;
const PAYKU_SECRET_KEY = process.env.PAYKU_SECRET_KEY!;

export interface PaykuPaymentCreate {
  order: string; // Número de orden único
  subject: string; // Descripción del pago
  amount: number; // Monto en CLP (no centavos)
  email: string; // Email del cliente
  payment_url?: string; // URL de retorno después del pago
  webhook?: string; // URL para notificaciones
}

export interface PaykuPaymentResponse {
  id: string; // ID de la transacción
  order: string; // Número de orden
  payment_key: string; // Clave de pago
  transaction_key: string; // Clave de transacción
  verification_key: string; // Clave de verificación
  status: string; // Estado inicial
  payment_url: string; // URL para redirigir al cliente
}

export interface PaykuPaymentStatus {
  transaction_id: string;
  payment_key: string;
  transaction_key: string;
  verification_key: string;
  order: string;
  status: "success" | "pending" | "failed" | "cancelled";
  amount?: number;
  currency?: string;
  email?: string;
  created_at?: string;
  paid_at?: string;
}

/**
 * Crea un pago con Payku
 */
export async function createPaykuPayment(
  data: PaykuPaymentCreate
): Promise<PaykuPaymentResponse> {
  try {
    const payload = {
      order: data.order,
      subject: data.subject,
      amount: data.amount,
      email: data.email,
      payment_url: data.payment_url,
      webhook: data.webhook,
    };

    const response = await fetch(`${PAYKU_API_URL}/api/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYKU_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Payku error:", responseData);
      throw new Error(`Payku error: ${responseData.message || "Unknown error"}`);
    }

    return responseData;
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
    const response = await fetch(`${PAYKU_API_URL}/api/payment/${order}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYKU_API_TOKEN}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Payku status error:", responseData);
      throw new Error(`Payku error: ${responseData.message || "Unknown error"}`);
    }

    return responseData;
  } catch (error) {
    console.error("Payku status check error:", error);
    throw error;
  }
}

/**
 * Verifica la firma del webhook de Payku
 */
export function verifyPaykuWebhookSignature(
  payload: any,
  receivedSignature: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", PAYKU_SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );
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
 * Genera un número de orden único para Payku
 */
export function generatePaykuOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PK-${timestamp}-${random}`;
}

/**
 * Cancela un pago en Payku
 */
export async function cancelPaykuPayment(
  order: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${PAYKU_API_URL}/api/payment/${order}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYKU_API_TOKEN}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Payku cancel error:", responseData);
      return {
        success: false,
        message: responseData.message || "Failed to cancel payment",
      };
    }

    return {
      success: true,
      message: "Payment cancelled successfully",
    };
  } catch (error) {
    console.error("Payku payment cancel error:", error);
    return {
      success: false,
      message: "Network error while cancelling payment",
    };
  }
}

/**
 * Reembolsa un pago en Payku
 */
export async function refundPaykuPayment(
  order: string,
  amount?: number
): Promise<{ success: boolean; message: string; refund_id?: string }> {
  try {
    const payload = amount ? { amount } : {};
    
    const response = await fetch(`${PAYKU_API_URL}/api/payment/${order}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYKU_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Payku refund error:", responseData);
      return {
        success: false,
        message: responseData.message || "Failed to refund payment",
      };
    }

    return {
      success: true,
      message: "Payment refunded successfully",
      refund_id: responseData.refund_id,
    };
  } catch (error) {
    console.error("Payku payment refund error:", error);
    return {
      success: false,
      message: "Network error while refunding payment",
    };
  }
}

/**
 * Obtiene lista de pagos (con paginación)
 */
export async function getPaykuPayments(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<{
  payments: PaykuPaymentStatus[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append("status", status);
    }

    const response = await fetch(`${PAYKU_API_URL}/api/payments?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYKU_API_TOKEN}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Payku payments list error:", responseData);
      throw new Error(`Payku error: ${responseData.message || "Unknown error"}`);
    }

    return responseData;
  } catch (error) {
    console.error("Payku payments list error:", error);
    throw error;
  }
}

/**
 * Obtiene detalles completos de una transacción
 */
export async function getPaykuTransactionDetails(
  transactionKey: string
): Promise<PaykuPaymentStatus & {
  payment_method?: string;
  card_type?: string;
  card_last_four?: string;
  installments?: number;
  fee?: number;
  net_amount?: number;
}> {
  try {
    const response = await fetch(`${PAYKU_API_URL}/api/transaction/${transactionKey}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYKU_API_TOKEN}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Payku transaction details error:", responseData);
      throw new Error(`Payku error: ${responseData.message || "Unknown error"}`);
    }

    return responseData;
  } catch (error) {
    console.error("Payku transaction details error:", error);
    throw error;
  }
}

/**
 * Valida que el monto sea válido para Payku (mínimo CLP 1,000)
 */
export function validatePaykuAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 1000) {
    return {
      valid: false,
      error: "Minimum amount is CLP 1,000",
    };
  }
  
  if (amount > 1000000) {
    return {
      valid: false,
      error: "Maximum amount is CLP 1,000,000",
    };
  }

  if (!Number.isInteger(amount)) {
    return {
      valid: false,
      error: "Amount must be an integer (no cents)",
    };
  }

  return { valid: true };
}

/**
 * Procesa webhook de Payku
 */
export async function processPaykuWebhook(
  payload: any,
  signature: string,
  onPaymentSuccess: (payment: PaykuPaymentStatus) => Promise<void>,
  onPaymentFailed?: (payment: PaykuPaymentStatus) => Promise<void>
): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar firma
    if (!verifyPaykuWebhookSignature(payload, signature)) {
      return {
        success: false,
        message: "Invalid webhook signature",
      };
    }

    // Procesar según el tipo de evento
    const { event, data } = payload;

    switch (event) {
      case "payment.success":
        await onPaymentSuccess(data);
        break;
      
      case "payment.failed":
        if (onPaymentFailed) {
          await onPaymentFailed(data);
        }
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
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