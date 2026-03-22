import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withPluginAuth } from "@/lib/api-auth";
import { generateSimpleLicenseKey } from "@/lib/license";
import { prisma } from "@/lib/prisma";
import { normalizePluginId } from "@/lib/license-utils";

interface IssueBody {
  pluginId: string;
  owner: string;
  validDays?: number;
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
    const body = (await request.json()) as IssueBody;
    const pluginId = normalizePluginId(body.pluginId);
    const owner = (body.owner || "").trim();
    const validDays = Number.isFinite(body.validDays) ? Number(body.validDays) : -1;

    if (!pluginId || !owner) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const [product, user] = await Promise.all([
      prisma.product.findFirst({
        where: {
          OR: [
            { slug: { equals: pluginId, mode: "insensitive" } },
            { id: pluginId },
          ],
        },
      }),
      prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: owner, mode: "insensitive" } },
            { id: owner },
          ],
        },
      }),
    ]);

    if (!product) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: `No product found for pluginId '${pluginId}'` },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: `No user found for owner '${owner}'` },
        { status: 404 }
      );
    }

    let expiresAt: Date;
    if (validDays === -1) {
      expiresAt = new Date("2099-12-31T23:59:59.999Z");
    } else {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validDays);
    }

    let created = null;
    for (let i = 0; i < 5; i++) {
      const key = generateSimpleLicenseKey();
      try {
        created = await prisma.license.create({
          data: {
            licenseKey: key,
            userId: user.id,
            productId: product.id,
            status: "ACTIVE",
            expiresAt,
            maxActivations: product.maxActivations,
            notes: `Issued via plugin API owner=${owner}`,
          },
          include: {
            product: {
              select: { slug: true },
            },
            user: {
              select: { email: true },
            },
          },
        });
        break;
      } catch (error: unknown) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
          throw error;
        }
      }
    }

    if (!created) {
      return NextResponse.json({ error: "KEY_GENERATION_FAILED" }, { status: 500 });
    }

    return NextResponse.json({
      license: toPanelLicenseDto(created),
    });
  } catch (error) {
    console.error("Paper license issue error:", error);
    return NextResponse.json({ error: "REMOTE_ERROR" }, { status: 500 });
  }
}

export const POST = withPluginAuth(handler);
