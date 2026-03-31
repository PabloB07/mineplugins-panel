import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashForPrivacy } from "@/lib/license";
import { validateApiKey, checkRateLimit, getClientIp } from "@/lib/api-auth";
import { loadRuntimeLicense, touchLicenseActivation } from "@/lib/paper/license-runtime";

interface HeartbeatRequest {
  licenseKey: string;
  pluginId?: string;
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
  lastSeen?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request);

  const rateLimitResponse = checkRateLimit(clientIp, 60);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // API key validation is optional for heartbeat
  // if (!validateApiKey(request)) {
  //   return NextResponse.json(
  //     { success: false, error: "UNAUTHORIZED", message: "Invalid or missing API key" },
  //     { status: 401 }
  //   );
  // }

  try {
    const body: HeartbeatRequest = await request.json();
    const licenseKey = (body.licenseKey || "").trim();
    const serverId = (body.serverId || "").trim();

    if (!licenseKey || !serverId) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS", message: "License key and server ID are required" },
        { status: 400 }
      );
    }

    const runtime = await loadRuntimeLicense(licenseKey, body.pluginId);
    if (!runtime.ok) {
      return NextResponse.json(
        { success: false, error: runtime.error.result, message: runtime.error.message },
        { status: runtime.error.status }
      );
    }

    const activations = await prisma.licenseActivation.findMany({
      where: { licenseId: runtime.data.license.id, isActive: true },
    });

    const existing = activations.find((a) => a.serverId === serverId);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_ACTIVATION",
          message: "Server not activated. Please validate license first.",
        },
        { status: 404 }
      );
    }

    const activation = await touchLicenseActivation(runtime.data.license, serverId, {
      serverIp: clientIp,
      serverVersion: body.version,
      minecraftVersion: body.minecraftVersion,
      motd: body.motd,
      maxPlayers: body.maxPlayers,
      onlinePlayers: body.onlinePlayers,
      plugins: body.plugins,
    });

    if (!activation.ok) {
      return NextResponse.json(
        { success: false, error: activation.error, message: activation.message },
        { status: activation.status }
      );
    }

    if (body.tps !== undefined || body.memoryUsage !== undefined) {
      await prisma.licenseActivation.updateMany({
        where: {
          licenseId: runtime.data.license.id,
          serverId,
        },
        data: {
          tps: body.tps,
          memoryUsage: body.memoryUsage,
        },
      });
    }

    await prisma.license.update({
      where: { id: runtime.data.license.id },
      data: { lastValidatedAt: new Date() },
    });

    const responseData: HeartbeatResponse = {
      success: true,
      message: "Heartbeat received successfully",
      lastSeen: new Date().toISOString(),
    };

    const processingTime = Date.now() - startTime;
    return NextResponse.json(responseData, {
      headers: {
        "X-Processing-Time": `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Heartbeat service error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      service: "MinePlugins Server Heartbeat",
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
