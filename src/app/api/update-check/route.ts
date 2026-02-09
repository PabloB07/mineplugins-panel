import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLicenseSignature } from "@/lib/license";
import {
  validateApiKey,
  checkRateLimit,
  getClientIp,
  errorResponse,
} from "@/lib/api-auth";

interface UpdateCheckRequest {
  currentVersion: string;
  license: string;
  productId?: string;
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

/**
 * Compares two semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
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

/**
 * Update check endpoint for the Minecraft plugin
 * POST /api/update-check
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // Rate limiting
  const rateLimitResponse = checkRateLimit(clientIp);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // API key validation
  if (!validateApiKey(request)) {
    return errorResponse("UNAUTHORIZED", "Invalid or missing API key", 401);
  }

  try {
    const body: UpdateCheckRequest = await request.json();
    const { currentVersion, license: licenseKey, productId } = body;

    // Validate required fields
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

    // Verify license signature
    if (!verifyLicenseSignature(licenseKey)) {
      return NextResponse.json(
        {
          updateAvailable: false,
          currentVersion,
          error: "INVALID_LICENSE",
          message: "Invalid license format",
        },
        { status: 403 }
      );
    }

    // Find license and check validity
    const license = await prisma.license.findUnique({
      where: { licenseKey },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        productId: true,
      },
    });

    if (!license) {
      return NextResponse.json(
        {
          updateAvailable: false,
          currentVersion,
          error: "LICENSE_NOT_FOUND",
          message: "License not found",
        },
        { status: 404 }
      );
    }

    if (license.status !== "ACTIVE") {
      return NextResponse.json(
        {
          updateAvailable: false,
          currentVersion,
          error: `LICENSE_${license.status}`,
          message: `License is ${license.status.toLowerCase()}`,
        },
        { status: 403 }
      );
    }

    if (new Date() > license.expiresAt) {
      return NextResponse.json(
        {
          updateAvailable: false,
          currentVersion,
          error: "LICENSE_EXPIRED",
          message: "License has expired - renew to receive updates",
        },
        { status: 402 }
      );
    }

    // Get latest version for the product
    const targetProductId = productId || license.productId;

    const latestVersion = await prisma.pluginVersion.findFirst({
      where: {
        productId: targetProductId,
        isLatest: true,
        isBeta: false,
      },
      select: {
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

    // Compare versions
    const versionComparison = compareVersions(
      currentVersion,
      latestVersion.version
    );

    if (versionComparison >= 0) {
      // Current version is equal or newer
      return NextResponse.json({
        updateAvailable: false,
        currentVersion,
        message: "Plugin is up to date",
      });
    }

    // Update is available
    const response: UpdateCheckResponse = {
      updateAvailable: true,
      currentVersion,
      newVersion: latestVersion.version,
      releaseDate: latestVersion.publishedAt.toISOString().split("T")[0],
      changelog: latestVersion.changelog || undefined,
      mandatory: latestVersion.isMandatory,
    };

    // Include download URL (the actual download will require license validation)
    if (latestVersion.downloadUrl) {
      // Don't expose the raw download URL, use our secure download endpoint
      response.downloadUrl = `/api/download?version=${latestVersion.version}`;
    }

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

/**
 * Health check endpoint
 * GET /api/update-check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "MinePlugins Update Check",
    timestamp: new Date().toISOString(),
  });
}
