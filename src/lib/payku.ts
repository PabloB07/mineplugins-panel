import crypto from "crypto";

 const PAYKU_API_URL =
   process.env.NODE_ENV === "production"
     ? "https://app.payku.cl"
     : "https://des.payku.cl";

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
  id?: string; // ID de la transacción
  transaccion_id?: string; // Alternative ID field
  order?: string; // Número de orden
  orden?: string; // Spanish field for order
  payment_key?: string; // Clave de pago
  transaction_key?: string; // Clave de transacción
  transaccion_key?: string; // Spanish field for transaction key
  verification_key?: string; // Clave de verificación
  verificacion_key?: string; // Spanish field for verification key
  status?: string; // Estado inicial
  estado?: string; // Spanish field for status
  payment_url?: string; // URL para redirigir al cliente
  url_pago?: string; // Spanish field for payment URL
  url_redireccion?: string; // Spanish field for redirect URL
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
    // Validate input
    if (!data.order) {
      throw new Error("Order number is required");
    }
    if (!data.subject) {
      throw new Error("Subject is required");
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error("Valid amount is required");
    }
    if (!data.email) {
      throw new Error("Email is required");
    }

    const payload = {
      orden: data.order,
      concepto: data.subject,
      monto: data.amount,
      email: data.email,
      url_retorno: data.payment_url,
      url_webhook: data.webhook,
    };

    console.log("Creating Payku payment with payload:", payload);

    const response = await fetch(`${PAYKU_API_URL}/api/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYKU_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    console.log("Payku API response:", {
      status: response.status,
      ok: response.ok,
      data: responseData
    });

    if (!response.ok) {
      console.error("Payku error:", responseData);
      throw new Error(`Payku error: ${responseData.message || responseData.error || responseData.mensaje || "Unknown error"}`);
    }

    return {
      id: responseData.id || responseData.transaccion_id,
      order: responseData.orden || data.order,
      payment_key: responseData.data?.payment_key || responseData.payment_key,
      transaction_key: responseData.transaccion_key || responseData.transaction_key,
      verification_key: responseData.verificacion_key || responseData.verification_key,
      status: responseData.estado || responseData.status,
      payment_url: responseData.url_pago || responseData.payment_url || responseData.url_redireccion,
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
    const response = await fetch(`${PAYKU_API_URL}/api/transaction/${order}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYKU_API_TOKEN}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Payku status error:", responseData);
      throw new Error(`Payku error: ${responseData.message || responseData.error || "Unknown error"}`);
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
export function verifyPaykuWebhookSignature(
  payload: any,
  receivedSignature: string
): boolean {
  try {
    // Try different payload formats for signature verification
    const payloadString = JSON.stringify(payload);
    
    const expectedSignature = crypto
      .createHmac("sha256", PAYKU_SECRET_KEY)
      .update(payloadString)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );

    console.log("Payku webhook signature verification:", {
      received: receivedSignature,
      expected: expectedSignature,
      isValid,
      payload: payloadString
    });

    return isValid;
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
  const orderNumber = `PK-${timestamp}-${random}`;
  console.log("Generated Payku order number:", orderNumber);
  return orderNumber;
}

/**
 * Cancela un pago en Payku
 */
export async function cancelPaykuPayment(
  order: string
): Promise<{ success: boolean; message: string }> {
  try {
     const response = await fetch(`${PAYKU_API_URL}/api/transaction/${order}/cancel`, {
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
        message: responseData.message || responseData.error || "Failed to cancel payment",
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
    
    const response = await fetch(`${PAYKU_API_URL}/api/transaction/${order}/refund`, {
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
        message: responseData.message || responseData.error || "Failed to refund payment",
      };
    }

    return {
      success: true,
      message: "Payment refunded successfully",
      refund_id: responseData.refund_id || responseData.id_reembolso,
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

    const response = await fetch(`${PAYKU_API_URL}/api/transactions?${params}`, {
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
     const { evento, data } = payload;

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