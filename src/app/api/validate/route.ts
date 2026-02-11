import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashForPrivacy } from "@/lib/license";
import {
  validateApiKey,
  checkRateLimit,
  getClientIp,
  errorResponse,
} from "@/lib/api-auth";
import { loadRuntimeLicense, touchLicenseActivation } from "@/lib/paper/license-runtime";

interface ValidationRequest {
  license: string;
  pluginId?: string;
  serverId: string;
  version?: string;
  minecraftVersion?: string;
  serverName?: string;
  onlineMode?: boolean;
  maxPlayers?: number;
  onlinePlayers?: number;
  plugins?: string[];
  macAddress?: string;
  hardwareHash?: string;
  networkSignature?: string;
  serverPort?: number;
  motd?: string;
}

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
        licenseKey: hashForPrivacy(licenseKey),
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request);

  const rateLimitResponse = checkRateLimit(clientIp);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (!validateApiKey(request)) {
    return errorResponse("UNAUTHORIZED", "Invalid or missing API key", 401);
  }

  try {
    const body: ValidationRequest = await request.json();
    const licenseKey = (body.license || "").trim();
    const serverId = (body.serverId || "").trim();

    if (!licenseKey || !serverId) {
      return NextResponse.json(
        { valid: false, error: "MISSING_FIELDS", message: "License key and server ID are required" },
        { status: 400 }
      );
    }

    const runtime = await loadRuntimeLicense(licenseKey, body.pluginId);
    if (!runtime.ok) {
      await logValidation(licenseKey, serverId, body.version, false, runtime.error.result, clientIp);
      return NextResponse.json(
        { valid: false, error: runtime.error.result, message: runtime.error.message },
        { status: runtime.error.status }
      );
    }

    const activation = await touchLicenseActivation(runtime.data.license, serverId, {
      serverIp: hashForPrivacy(clientIp),
      serverVersion: body.version,
      minecraftVersion: body.minecraftVersion,
      serverName: body.serverName,
      serverPort: body.serverPort,
      motd: body.motd,
      onlineMode: body.onlineMode,
      maxPlayers: body.maxPlayers,
      onlinePlayers: body.onlinePlayers,
      plugins: body.plugins,
      macAddress: body.macAddress ? hashForPrivacy(body.macAddress) : undefined,
      hardwareHash: body.hardwareHash,
      networkSignature: body.networkSignature,
    });

    if (!activation.ok) {
      await logValidation(licenseKey, serverId, body.version, false, activation.error, clientIp);
      return NextResponse.json(
        { valid: false, error: activation.error, message: activation.message },
        { status: activation.status }
      );
    }

    await prisma.license.update({
      where: { id: runtime.data.license.id },
      data: { lastValidatedAt: new Date() },
    });

    await logValidation(licenseKey, serverId, body.version, true, null, clientIp);

    const processingTime = Date.now() - startTime;
    return NextResponse.json(
      {
        valid: true,
        result: "VALID",
        licenseId: runtime.data.license.id,
        productId: runtime.data.license.productId,
        pluginId: runtime.data.pluginId,
        expiresAt: runtime.data.license.expiresAt.toISOString(),
        maxActivations: runtime.data.license.maxActivations,
        currentActivations: activation.currentActivations,
      },
      { headers: { "X-Processing-Time": `${processingTime}ms` } }
    );
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { valid: false, error: "INTERNAL_ERROR", message: "Validation service error" },
      { status: 500 }
    );
  }
}
