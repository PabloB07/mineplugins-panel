import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withPluginAuth } from "@/lib/api-auth";
import { generatePaperLicenseKey } from "@/lib/license";
import { prisma } from "@/lib/prisma";
import {
  buildExpiresAt,
  findProductForPluginId,
  normalizePluginId,
  resolveOwnerUser,
  toPanelLicenseDto,
} from "@/lib/paper/license-endpoint";

interface IssueBody {
  pluginId: string;
  owner: string;
  validDays?: number;
  serverId?: string;
}

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as IssueBody;
    const pluginId = normalizePluginId(body.pluginId);
    const owner = (body.owner || "").trim();
    const validDays = Number.isFinite(body.validDays) ? Number(body.validDays) : 0;

    if (!pluginId || !owner) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const [product, user] = await Promise.all([
      findProductForPluginId(pluginId),
      resolveOwnerUser(owner),
    ]);

    if (!product) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: `No product found for pluginId '${pluginId}'` },
        { status: 404 }
      );
    }

    const expiresAt = buildExpiresAt(validDays);

    let created = null;
    for (let i = 0; i < 5; i++) {
      const key = generatePaperLicenseKey(pluginId);
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
            product: true,
            user: true,
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
