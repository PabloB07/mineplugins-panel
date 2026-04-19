import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import {
  getGatewaySettings,
  maskSecret,
  parseGatewayConfigSource,
  parseGatewayEnvironment,
  upsertGatewaySettings,
} from "@/lib/payment-gateway-settings";
import { toOptionalTrimmedString } from "@/lib/security";

function parseOptionalTextUpdate(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  return toOptionalTrimmedString(value, maxLength) ?? null;
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
        source: settings.payku.source,
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
      paykuConfigSource: parseGatewayConfigSource(
        typeof payku.source === "string" ? payku.source : undefined,
        "ENV"
      ),
      paykuApiToken: parseOptionalTextUpdate(payku.apiToken, 1000),
      paykuSecretKey: parseOptionalTextUpdate(payku.secretKey, 1000),
      paykuEnvironment: parseGatewayEnvironment(
        typeof payku.environment === "string" ? payku.environment : undefined,
        "SANDBOX"
      ),
      tebexStoreId: parseOptionalTextUpdate(tebex.storeId, 255),
      tebexSecretKey: parseOptionalTextUpdate(tebex.secretKey, 1000),
      tebexEnvironment: parseGatewayEnvironment(
        typeof tebex.environment === "string" ? tebex.environment : undefined,
        "PRODUCTION"
      ),
      paypalClientId: parseOptionalTextUpdate(paypal.clientId, 1000),
      paypalClientSecret: parseOptionalTextUpdate(paypal.clientSecret, 1000),
      paypalWebhookId: parseOptionalTextUpdate(paypal.webhookId, 1000),
      paypalEnvironment: parseGatewayEnvironment(
        typeof paypal.environment === "string" ? paypal.environment : undefined,
        "SANDBOX"
      ),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin payment settings PUT error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
