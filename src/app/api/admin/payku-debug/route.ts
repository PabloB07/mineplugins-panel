import { NextResponse } from "next/server";
import { getGatewaySettings } from "@/lib/payment-gateway-settings";
import { createPaykuPayment } from "@/lib/payku";

export async function GET() {
  let settings;
  try {
    settings = await getGatewaySettings();
  } catch (err) {
    console.error("[payku-debug] Failed to get gateway settings:", err);
    return NextResponse.json(
      { error: "Failed to load gateway settings", details: String(err) },
      { status: 500 }
    );
  }

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
    console.error("[payku-debug] Failed to create test payment:", err);
    testResult = {
      success: false,
      error: String(err)
    };
  }

  // Give user time to pay manually in Payku dashboard, then check again
  // In sandbox, you need to approve payment in Payku dashboard

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