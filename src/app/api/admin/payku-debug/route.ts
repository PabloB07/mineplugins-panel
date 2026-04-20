import { NextResponse } from "next/server";
import { getGatewaySettings } from "@/lib/payment-gateway-settings";
import { createPaykuPayment } from "@/lib/payku";

export async function GET() {
  const settings = await getGatewaySettings();

  let testResult = null;
  
  try {
    const testPayment = await createPaykuPayment({
      order: "TEST-" + Date.now(),
      subject: "Test sandbox payment",
      amount: 1000,
      email: "test@test.com",
      returnUrl: "https://mineplugins.vercel.app/payment/success",
      notifyUrl: "https://mineplugins.vercel.app/api/payment/payku/webhook"
    });
    testResult = {
      success: true,
      paymentUrl: testPayment.paymentUrl,
      id: testPayment.id,
      status: testPayment.status
    };
  } catch (err) {
    testResult = {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error"
    };
  }

  return NextResponse.json({
    config: {
      environment: settings.payku.environment,
      source: settings.payku.source,
      apiTokenPrefix: settings.payku.apiToken?.substring(0, 10) + "...",
      hasToken: !!settings.payku.apiToken,
      apiUrl: settings.payku.apiUrl || "default (des.payku.cl/api)",
    },
    testPayment: testResult
  });
}