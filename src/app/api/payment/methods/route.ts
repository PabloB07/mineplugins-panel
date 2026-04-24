import { NextResponse } from "next/server";
import { getGatewaySettings } from "@/lib/payment-gateway-settings";

export async function GET() {
  try {
    const settings = await getGatewaySettings();

    const methods = [
      {
        id: "TEBEX",
        name: "Tebex",
        enabled: settings.tebex.enabled,
        environment: settings.tebex.environment,
      },
      {
        id: "PAYPAL",
        name: "PayPal",
        enabled: settings.paypal.enabled,
        environment: settings.paypal.environment,
      },
    ];

    return NextResponse.json({ methods });
  } catch (error) {
    console.error("Payment methods error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get payment methods" },
      { status: 500 }
    );
  }
}