import { NextRequest, NextResponse } from "next/server";
import { withPluginAuth, validateProductApiKey, checkRateLimit, getClientIp } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { normalizePluginId } from "@/lib/license-utils";

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

interface GetBody {
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
    const body = (await request.json()) as GetBody;
    const key = (body.key || "").trim();

    if (!key) {
      return NextResponse.json({ license: null }, { status: 400 });
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
      return NextResponse.json({ license: null });
    }

    return NextResponse.json({
      license: toPanelLicenseDto(license),
    });
  } catch (error) {
    console.error("Paper license get error:", error);
    return NextResponse.json({ license: null }, { status: 500 });
  }
}

export const POST = withProductAuth(handler);
