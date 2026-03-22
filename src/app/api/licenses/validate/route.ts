import { NextRequest, NextResponse } from "next/server";
import { withPluginAuth, validateProductApiKey } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { verifyPaperLicenseKey } from "@/lib/license";
import { normalizePluginId } from "@/lib/license-utils";
import { checkRateLimit, getClientIp } from "@/lib/api-auth";

function withProductAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    const clientIp = getClientIp(request);
    const rateLimitResponse = checkRateLimit(clientIp);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authResult = await validateProductApiKey(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    return handler(request);
  };
}

interface ValidateBody {
  pluginId: string;
  key: string;
  serverId?: string;
}

interface PanelLicenseResponse {
  key: string;
  pluginId: string;
  owner: string;
  issuedAt: number;
  expiresAt: number;
  revoked: boolean;
}

function toPanelLicenseDto(license: {
  licenseKey: string;
  product: { slug: string };
  user: { email: string };
  createdAt: Date;
  expiresAt: Date;
  status: string;
}): PanelLicenseResponse {
  return {
    key: license.licenseKey,
    pluginId: normalizePluginId(license.product.slug),
    owner: license.user.email,
    issuedAt: new Date(license.createdAt).getTime(),
    expiresAt: license.status === "REVOKED" ? 0 : new Date(license.expiresAt).getTime(),
    revoked: license.status === "REVOKED",
  };
}

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ValidateBody;
    const pluginId = normalizePluginId(body.pluginId);
    const key = (body.key || "").trim();

    if (!pluginId || !key) {
      return NextResponse.json({ result: "REMOTE_ERROR" }, { status: 400 });
    }

    if (!verifyPaperLicenseKey(pluginId, key)) {
      return NextResponse.json({ result: "SIGNATURE_INVALID" });
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey: key },
      include: {
        product: {
          select: { slug: true },
        },
        user: {
          select: { email: true },
        },
      },
    });

    if (!license) {
      return NextResponse.json({ result: "NOT_FOUND" });
    }

    const dbPluginId = normalizePluginId(license.product.slug);
    if (dbPluginId !== pluginId) {
      return NextResponse.json({ result: "WRONG_PLUGIN" });
    }

    if (license.status === "REVOKED") {
      return NextResponse.json({ result: "REVOKED" });
    }

    if (license.expiresAt < new Date() && license.status === "ACTIVE") {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ result: "EXPIRED" });
    }

    if (license.status === "EXPIRED") {
      return NextResponse.json({ result: "EXPIRED" });
    }

    if (license.status === "SUSPENDED") {
      return NextResponse.json({ result: "SUSPENDED" });
    }

    await prisma.license.update({
      where: { id: license.id },
      data: { lastValidatedAt: new Date() },
    });

    return NextResponse.json({
      result: "VALID",
      license: toPanelLicenseDto(license),
    });
  } catch (error) {
    console.error("Paper license validate error:", error);
    return NextResponse.json({ result: "REMOTE_ERROR" }, { status: 500 });
  }
}

export const POST = withProductAuth(handler);
