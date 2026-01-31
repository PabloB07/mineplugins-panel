import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashForPrivacy } from "@/lib/license";
import { validateApiKey, checkRateLimit, getClientIp } from "@/lib/api-auth";

interface HeartbeatRequest {
  licenseKey: string;
  serverId: string;
  onlinePlayers: number;
  maxPlayers: number;
  tps?: number;
  memoryUsage?: number;
  plugins?: string[];
  motd?: string;
  version?: string;
  minecraftVersion?: string;
}

interface HeartbeatResponse {
  success: boolean;
  message?: string;
  activationId?: string;
  lastSeen?: string;
}

/**
 * Server heartbeat endpoint for TownyFaiths plugin
 * Updates server status and player counts
 * POST /api/heartbeat
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request);

  // Rate limiting
  const rateLimitResponse = checkRateLimit(clientIp, 30); // 30 requests per minute
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // API key validation
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  try {
    const body: HeartbeatRequest = await request.json();
    const {
      licenseKey,
      serverId,
      onlinePlayers,
      maxPlayers,
      tps,
      memoryUsage,
      plugins,
      motd,
      version,
      minecraftVersion,
    } = body;

    // Validate required fields
    if (!licenseKey || !serverId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FIELDS",
          message: "License key and server ID are required",
        },
        { status: 400 }
      );
    }

    // Find license in database
    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: {
        activations: true,
      },
    });

    if (!license) {
      return NextResponse.json(
        {
          success: false,
          error: "LICENSE_NOT_FOUND",
          message: "License not found in database",
        },
        { status: 404 }
      );
    }

    // Check license status
    if (license.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: `LICENSE_${license.status}`,
          message: `License is ${license.status.toLowerCase()}`,
        },
        { status: 403 }
      );
    }

    // Check expiration
    const now = new Date();
    if (now > license.expiresAt) {
      // Update status to expired
      await prisma.license.update({
        where: { id: license.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        {
          success: false,
          error: "LICENSE_EXPIRED",
          message: "License has expired",
          expiresAt: license.expiresAt.toISOString(),
        },
        { status: 403 }
      );
    }

    // Find existing activation
    const existingActivation = license.activations.find(
      (a) => a.serverId === serverId
    );

    if (!existingActivation) {
      // No activation exists for this server
      return NextResponse.json(
        {
          success: false,
          error: "NO_ACTIVATION",
          message: "Server not activated. Please validate license first.",
        },
        { status: 404 }
      );
    }

    // Update activation with heartbeat data
    const updateData: any = {
      lastSeenAt: now,
      onlinePlayers,
      maxPlayers,
      validationCount: { increment: 1 },
    };

    // Optional fields
    if (tps !== undefined) updateData.tps = tps;
    if (memoryUsage !== undefined) updateData.memoryUsage = memoryUsage;
    if (plugins) updateData.plugins = JSON.stringify(plugins);
    if (motd) updateData.motd = motd;
    if (version) updateData.serverVersion = version;
    if (minecraftVersion) updateData.minecraftVersion = minecraftVersion;

    const updatedActivation = await prisma.licenseActivation.update({
      where: { id: existingActivation.id },
      data: updateData,
    });

    // Update license last validated time
    await prisma.license.update({
      where: { id: license.id },
      data: { lastValidatedAt: now },
    });

    const responseData: HeartbeatResponse = {
      success: true,
      message: "Heartbeat received successfully",
      activationId: updatedActivation.id,
      lastSeen: updatedActivation.lastSeenAt.toISOString(),
    };

    // Add processing time header
    const processingTime = Date.now() - startTime;

    return NextResponse.json(responseData, {
      headers: {
        "X-Processing-Time": `${processingTime}ms`,
      },
    });

  } catch (error) {
    console.error("Heartbeat error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Heartbeat service error",
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 * GET /api/heartbeat
 */
export async function GET() {
  try {
    // Quick database connectivity check
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      service: "TownyFaiths Server Heartbeat",
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