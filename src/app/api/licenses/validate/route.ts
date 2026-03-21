import { NextRequest, NextResponse } from "next/server";
import { withPluginAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { verifyPaperLicenseKey } from "@/lib/license";
import {
  mapStatusToValidationResult,
  normalizePluginId,
  toPanelLicenseDto,
} from "@/lib/license-utils";

interface ValidateBody {
  pluginId: string;
  key: string;
  serverId?: string;
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
        product: true,
        user: true,
      },
    });

    if (!license) {
      return NextResponse.json({ result: "NOT_FOUND" });
    }

    const dbPluginId = normalizePluginId(license.product.slug);
    if (dbPluginId !== pluginId) {
      return NextResponse.json({ result: "WRONG_PLUGIN" });
    }

    if (new Date(license.expiresAt) < new Date() && license.status === "ACTIVE") {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ result: "EXPIRED" });
    }

    const statusResult = mapStatusToValidationResult(license.status);
    if (statusResult !== "VALID") {
      return NextResponse.json({ result: statusResult });
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

export const POST = withPluginAuth(handler);
