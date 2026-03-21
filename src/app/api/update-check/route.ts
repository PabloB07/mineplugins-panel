import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateApiKey,
  checkRateLimit,
  getClientIp,
  errorResponse,
} from "@/lib/api-auth";
import { loadRuntimeLicense } from "@/lib/paper/license-runtime";
import { toOptionalTrimmedString } from "@/lib/security";

interface UpdateCheckRequest {
  currentVersion: string;
  license: string;
  productId?: string;
  pluginId?: string;
  serverId?: string;
}

interface UpdateCheckResponse {
  updateAvailable: boolean;
  currentVersion: string;
  newVersion?: string;
  releaseDate?: string;
  downloadUrl?: string;
  changelog?: string;
  mandatory?: boolean;
  minLicenseVersion?: string;
  error?: string;
  message?: string;
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map((x) => parseInt(x, 10) || 0);
  const parts2 = v2.split(".").map((x) => parseInt(x, 10) || 0);
  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  const rateLimitResponse = checkRateLimit(clientIp);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (!validateApiKey(request)) {
    return errorResponse("UNAUTHORIZED", "Invalid or missing API key", 401);
  }

  try {
    const body: UpdateCheckRequest = await request.json();
    const currentVersion = toOptionalTrimmedString(body.currentVersion, 64) || "";
    const licenseKey = toOptionalTrimmedString(body.license, 255) || "";
    const productId = toOptionalTrimmedString(body.productId, 64);
    const pluginId = toOptionalTrimmedString(body.pluginId, 64);

    if (!currentVersion || !licenseKey) {
      return NextResponse.json(
        {
          updateAvailable: false,
          currentVersion: currentVersion || "unknown",
          error: "MISSING_FIELDS",
          message: "Current version and license key are required",
        },
        { status: 400 }
      );
    }

    const runtime = await loadRuntimeLicense(licenseKey, pluginId);
    if (!runtime.ok) {
      return NextResponse.json(
        {
          updateAvailable: false,
          currentVersion,
          error: runtime.error.result,
          message: runtime.error.message,
        },
        { status: runtime.error.status }
      );
    }

    if (productId && productId !== runtime.data.license.productId) {
      return NextResponse.json(
        {
          updateAvailable: false,
          currentVersion,
          error: "WRONG_PLUGIN",
          message: "License product mismatch",
        },
        { status: 403 }
      );
    }

    const latestVersion = await prisma.pluginVersion.findFirst({
      where: {
        productId: runtime.data.license.productId,
        isLatest: true,
        isBeta: false,
      },
      select: {
        id: true,
        version: true,
        changelog: true,
        downloadUrl: true,
        publishedAt: true,
        isMandatory: true,
        minJavaVersion: true,
        minMcVersion: true,
      },
    });

    if (!latestVersion) {
      return NextResponse.json({
        updateAvailable: false,
        currentVersion,
        message: "No versions available",
      });
    }

    if (compareVersions(currentVersion, latestVersion.version) >= 0) {
      return NextResponse.json({
        updateAvailable: false,
        currentVersion,
        message: "Plugin is up to date",
      });
    }

    const response: UpdateCheckResponse = {
      updateAvailable: true,
      currentVersion,
      newVersion: latestVersion.version,
      releaseDate: latestVersion.publishedAt.toISOString().split("T")[0],
      changelog: latestVersion.changelog || undefined,
      mandatory: latestVersion.isMandatory,
      downloadUrl: `/api/download?versionId=${latestVersion.id}&license=${licenseKey}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Update check error:", error);
    return NextResponse.json(
      {
        updateAvailable: false,
        currentVersion: "unknown",
        error: "INTERNAL_ERROR",
        message: "Update check service error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "MinePlugins Update Check",
    timestamp: new Date().toISOString(),
  });
}
