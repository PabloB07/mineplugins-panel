import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getGatewaySettings, maskSecret, upsertGatewaySettings } from "@/lib/payment-gateway-settings";
import { toOptionalTrimmedString } from "@/lib/security";
import type { GatewayEnvironment } from "@/lib/payment-gateway-settings";

function parseEnvironment(value: unknown, fallback: GatewayEnvironment): GatewayEnvironment {
  if (value === "SANDBOX") return "SANDBOX";
  if (value === "PRODUCTION") return "PRODUCTION";
  return fallback;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const isAdmin =
    session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;
  return isAdmin ? session : null;
}

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const settings = await getGatewaySettings();

    return NextResponse.json({
      payku: {
        apiToken: maskSecret(settings.payku.apiToken),
        secretKey: maskSecret(settings.payku.secretKey),
        hasApiToken: !!settings.payku.apiToken,
        hasSecretKey: !!settings.payku.secretKey,
        environment: settings.payku.environment,
      },
      tebex: {
        storeId: settings.tebex.storeId || "",
        secretKey: maskSecret(settings.tebex.secretKey),
        hasSecretKey: !!settings.tebex.secretKey,
        environment: settings.tebex.environment,
      },
      paypal: {
        clientId: settings.paypal.clientId || "",
        clientSecret: maskSecret(settings.paypal.clientSecret),
        webhookId: settings.paypal.webhookId || "",
        hasClientSecret: !!settings.paypal.clientSecret,
        environment: settings.paypal.environment,
      },
    });
  } catch (error) {
    console.error("Admin payment settings GET error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const payku = (body.payku || {}) as Record<string, unknown>;
    const tebex = (body.tebex || {}) as Record<string, unknown>;
    const paypal = (body.paypal || {}) as Record<string, unknown>;

    await upsertGatewaySettings({
      paykuApiToken: toOptionalTrimmedString(payku.apiToken, 1000),
      paykuSecretKey: toOptionalTrimmedString(payku.secretKey, 1000),
      paykuEnvironment: parseEnvironment(payku.environment, "SANDBOX"),
      tebexStoreId: toOptionalTrimmedString(tebex.storeId, 255),
      tebexSecretKey: toOptionalTrimmedString(tebex.secretKey, 1000),
      tebexEnvironment: parseEnvironment(tebex.environment, "PRODUCTION"),
      paypalClientId: toOptionalTrimmedString(paypal.clientId, 1000),
      paypalClientSecret: toOptionalTrimmedString(paypal.clientSecret, 1000),
      paypalWebhookId: toOptionalTrimmedString(paypal.webhookId, 1000),
      paypalEnvironment: parseEnvironment(paypal.environment, "SANDBOX"),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin payment settings PUT error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

