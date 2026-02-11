import { NextRequest, NextResponse } from "next/server";
import { hashForPrivacy } from "@/lib/license";
import { prisma } from "@/lib/prisma";
import { loadRuntimeLicense, touchLicenseActivation } from "@/lib/paper/license-runtime";

interface ModernValidationRequest {
  pluginId?: string;
  licenseKey: string;
  serverId: string;
  serverIp?: string;
  minecraftVersion?: string;
  serverVersion?: string;
  serverName?: string;
  onlineMode?: boolean;
  maxPlayers?: number;
  onlinePlayers?: number;
  plugins?: string[];
  macAddress?: string;
  hardwareHash?: string;
  networkSignature?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ModernValidationRequest = await request.json();
    const licenseKey = (body.licenseKey || "").trim();
    const serverId = (body.serverId || "").trim();

    if (!licenseKey || !serverId) {
      return NextResponse.json(
        { valid: false, error: "MISSING_FIELDS", message: "License key and server ID are required" },
        { status: 400 }
      );
    }

    const runtime = await loadRuntimeLicense(licenseKey, body.pluginId);
    if (!runtime.ok) {
      return NextResponse.json(
        { valid: false, result: runtime.error.result, error: runtime.error.message },
        { status: runtime.error.status }
      );
    }

    const clientIp =
      body.serverIp ||
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const activation = await touchLicenseActivation(runtime.data.license, serverId, {
      serverIp: hashForPrivacy(clientIp),
      serverVersion: body.serverVersion || body.minecraftVersion,
      minecraftVersion: body.minecraftVersion,
      serverName: body.serverName,
      onlineMode: body.onlineMode,
      maxPlayers: body.maxPlayers,
      onlinePlayers: body.onlinePlayers,
      plugins: body.plugins,
      macAddress: body.macAddress ? hashForPrivacy(body.macAddress) : undefined,
      hardwareHash: body.hardwareHash,
      networkSignature: body.networkSignature,
    });

    if (!activation.ok) {
      return NextResponse.json(
        { valid: false, result: activation.error, error: activation.message },
        { status: activation.status }
      );
    }

    await prisma.license.update({
      where: { id: runtime.data.license.id },
      data: { lastValidatedAt: new Date() },
    });

    return NextResponse.json({
      valid: true,
      result: "VALID",
      pluginId: runtime.data.pluginId,
      productId: runtime.data.license.productId,
      expiresAt: runtime.data.license.expiresAt.toISOString(),
      maxActivations: runtime.data.license.maxActivations,
      currentActivations: activation.currentActivations,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("License validation error:", error);
    return NextResponse.json(
      { valid: false, result: "REMOTE_ERROR", error: "Internal server error" },
      { status: 500 }
    );
  }
}
