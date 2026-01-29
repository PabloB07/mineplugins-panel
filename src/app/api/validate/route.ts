import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyLicenseSignature,
  generateResponseSignature,
  hashForPrivacy,
} from "@/lib/license";
import {
  validateApiKey,
  checkRateLimit,
  getClientIp,
  errorResponse,
} from "@/lib/api-auth";

interface ValidationRequest {
  license: string;
  serverId: string;
  version: string;
  macAddress?: string;
  hardwareHash?: string;
  networkSignature?: string;
}

interface ValidationResponse {
  valid: boolean;
  error?: string;
  message?: string;
  licenseId?: string;
  productId?: string;
  expiresAt?: string;
  maxActivations?: number;
  currentActivations?: number;
  signature?: string;
}

/**
 * Logs a validation attempt for analytics
 */
async function logValidation(
  licenseKey: string,
  serverId: string,
  serverVersion: string | undefined,
  isValid: boolean,
  failureReason: string | null,
  ipAddress: string | null
) {
  try {
    await prisma.validationLog.create({
      data: {
        licenseKey: hashForPrivacy(licenseKey), // Don't store raw license keys in logs
        serverId,
        serverVersion,
        isValid,
        failureReason,
        ipAddress: ipAddress ? hashForPrivacy(ipAddress) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log validation:", error);
  }
}

/**
 * License validation endpoint for the Minecraft plugin
 * POST /api/validate
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
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
    const body: ValidationRequest = await request.json();
    const {
      license: licenseKey,
      serverId,
      version,
      macAddress,
      hardwareHash,
      networkSignature,
    } = body;

    // Validate required fields
    if (!licenseKey || !serverId) {
      return NextResponse.json(
        {
          valid: false,
          error: "MISSING_FIELDS",
          message: "License key and server ID are required",
        },
        { status: 400 }
      );
    }

    // Step 1: Verify license signature (offline check)
    if (!verifyLicenseSignature(licenseKey)) {
      await logValidation(
        licenseKey,
        serverId,
        version,
        false,
        "INVALID_SIGNATURE",
        clientIp
      );
      return NextResponse.json(
        {
          valid: false,
          error: "INVALID_SIGNATURE",
          message: "Invalid license format or signature",
        },
        { status: 400 }
      );
    }

    // Step 2: Find license in database
    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: {
        product: true,
        activations: true,
      },
    });

    if (!license) {
      await logValidation(
        licenseKey,
        serverId,
        version,
        false,
        "LICENSE_NOT_FOUND",
        clientIp
      );
      return NextResponse.json(
        {
          valid: false,
          error: "LICENSE_NOT_FOUND",
          message: "License not found in database",
        },
        { status: 404 }
      );
    }

    // Step 3: Check license status
    if (license.status !== "ACTIVE") {
      await logValidation(
        licenseKey,
        serverId,
        version,
        false,
        `STATUS_${license.status}`,
        clientIp
      );
      return NextResponse.json(
        {
          valid: false,
          error: `LICENSE_${license.status}`,
          message: `License is ${license.status.toLowerCase()}`,
        },
        { status: 403 }
      );
    }

    // Step 4: Check expiration
    const now = new Date();
    if (now > license.expiresAt) {
      // Update status to expired
      await prisma.license.update({
        where: { id: license.id },
        data: { status: "EXPIRED" },
      });

      await logValidation(
        licenseKey,
        serverId,
        version,
        false,
        "EXPIRED",
        clientIp
      );
      return NextResponse.json(
        {
          valid: false,
          error: "LICENSE_EXPIRED",
          message: "License has expired",
          expiresAt: license.expiresAt.toISOString(),
        },
        { status: 403 }
      );
    }

    // Step 5: Check activation limit
    const existingActivation = license.activations.find(
      (a: any) => a.serverId === serverId
    );

    if (!existingActivation) {
      // This is a new server trying to activate
      const activeActivations = license.activations.filter(
        (a: any) => a.isActive
      ).length;

      if (activeActivations >= license.maxActivations) {
        await logValidation(
          licenseKey,
          serverId,
          version,
          false,
          "MAX_ACTIVATIONS",
          clientIp
        );
        return NextResponse.json(
          {
            valid: false,
            error: "MAX_ACTIVATIONS",
            message: `Maximum activations reached (${license.maxActivations})`,
            activations: activeActivations,
            maxActivations: license.maxActivations,
          },
          { status: 403 }
        );
      }

      // Create new activation
      await prisma.licenseActivation.create({
        data: {
          licenseId: license.id,
          serverId,
          macAddress: macAddress ? hashForPrivacy(macAddress) : null,
          hardwareHash,
          networkSignature,
          serverVersion: version,
          serverIp: hashForPrivacy(clientIp),
          isActive: true,
          validationCount: 1,
        },
      });
    } else {
      // Update existing activation
      await prisma.licenseActivation.update({
        where: { id: existingActivation.id },
        data: {
          lastSeenAt: now,
          validationCount: { increment: 1 },
          serverVersion: version,
          // Update fingerprints if provided
          macAddress: macAddress
            ? hashForPrivacy(macAddress)
            : existingActivation.macAddress,
          hardwareHash: hardwareHash || existingActivation.hardwareHash,
          networkSignature:
            networkSignature || existingActivation.networkSignature,
        },
      });
    }

    // Step 6: Update license last validated time
    await prisma.license.update({
      where: { id: license.id },
      data: { lastValidatedAt: now },
    });

    // Log successful validation
    await logValidation(licenseKey, serverId, version, true, null, clientIp);

    // Step 7: Build and sign response
    const currentActivations = license.activations.filter(
      (a: any) => a.isActive
    ).length;
    const responseData: ValidationResponse = {
      valid: true,
      licenseId: license.id,
      productId: license.productId,
      expiresAt: license.expiresAt.toISOString(),
      maxActivations: license.maxActivations,
      currentActivations: existingActivation
        ? currentActivations
        : currentActivations + 1,
    };

    // Add signature for verification on plugin side
    responseData.signature = generateResponseSignature(responseData);

    // Add processing time header
    const processingTime = Date.now() - startTime;

    return NextResponse.json(responseData, {
      headers: {
        "X-Processing-Time": `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error("Validation error:", error);

    return NextResponse.json(
      {
        valid: false,
        error: "INTERNAL_ERROR",
        message: "Validation service error",
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 * GET /api/validate
 */
export async function GET() {
  try {
    // Quick database connectivity check
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      service: "TownyFaiths License Validation",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
