import { NextResponse } from "next/server";
import { getGatewaySettings } from "@/lib/payment-gateway-settings";

export async function GET() {
  const settings = await getGatewaySettings();

  return NextResponse.json({
    payku: {
      environment: settings.payku.environment,
      source: settings.payku.source,
      apiTokenPrefix: settings.payku.apiToken?.substring(0, 10) + "...",
      hasToken: !!settings.payku.apiToken,
      apiUrl: settings.payku.apiUrl || "default (des.payku.cl/api)",
    }
  });
}