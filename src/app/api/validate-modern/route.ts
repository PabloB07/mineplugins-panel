import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkLicenseValidity, hashForPrivacy, verifyLicenseSignature } from "@/lib/license";

interface ModernValidationRequest {
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
    const {
      licenseKey,
      serverId,
      serverIp,
      minecraftVersion,
      serverVersion,
      serverName,
      onlineMode,
      maxPlayers,
      onlinePlayers,
      plugins,
      macAddress,
      hardwareHash,
      networkSignature,
    } = body;

    if (!licenseKey || !serverId) {
      return NextResponse.json({ 
        error: "License key and server ID are required" 
      }, { status: 400 });
    }

    // Step 1: Verify license signature (offline check)
    if (!verifyLicenseSignature(licenseKey)) {
      return NextResponse.json({ 
        valid: false, 
        error: "Invalid license format" 
      }, { status: 400 });
    }

    // Step 2: Check license validity
    const validity = checkLicenseValidity(licenseKey);
    
    if (!validity.decoded) {
      return NextResponse.json({ 
        valid: false, 
        error: "Invalid license format" 
      }, { status: 400 });
    }

    if (!validity.valid && !validity.inGracePeriod) {
      return NextResponse.json({ 
        valid: false, 
        expired: true,
        error: "License has expired" 
      });
    }

    // Step 3: Find license in database
    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: {
        product: true,
        activations: true,
      },
    });

    if (!license) {
      return NextResponse.json({ 
        valid: false, 
        error: "License not found" 
      }, { status: 404 });
    }

    // Step 4: Check license status
    if (license.status !== "ACTIVE") {
      return NextResponse.json({ 
        valid: false, 
        error: `License is ${license.status.toLowerCase()}` 
      }, { status: 403 });
    }

    const decoded = validity.decoded;
    const clientIp = serverIp || (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');
    const hashedIp = hashForPrivacy(clientIp);

    // Step 5: Handle activation tracking
    const existingActivation = license.activations.find(
      (a) => a.serverId === serverId
    );

    if (!existingActivation) {
      // This is a new server trying to activate
      const activeActivations = license.activations.filter(
        (a) => a.isActive
      ).length;

      if (activeActivations >= decoded.maxActivations) {
        return NextResponse.json({ 
          valid: false, 
          error: `Maximum activations reached (${decoded.maxActivations})` 
        }, { status: 403 });
      }

      // Create new activation
      await prisma.licenseActivation.create({
        data: {
          licenseId: license.id,
          serverId,
          macAddress: macAddress ? hashForPrivacy(macAddress) : null,
          hardwareHash,
          networkSignature,
          serverVersion: serverVersion || minecraftVersion,
          minecraftVersion,
          serverName,
          serverIp: hashedIp,
          onlineMode,
          maxPlayers,
          onlinePlayers,
          plugins: plugins ? JSON.stringify(plugins) : null,
          isActive: true,
          validationCount: 1,
        },
      });
    } else {
      // Update existing activation
      await prisma.licenseActivation.update({
        where: { id: existingActivation.id },
        data: {
          lastSeenAt: new Date(),
          validationCount: { increment: 1 },
          serverVersion: serverVersion || minecraftVersion || existingActivation.serverVersion,
          minecraftVersion: minecraftVersion || existingActivation.minecraftVersion,
          serverName: serverName || existingActivation.serverName,
          onlineMode: onlineMode !== undefined ? onlineMode : existingActivation.onlineMode,
          maxPlayers: maxPlayers !== undefined ? maxPlayers : existingActivation.maxPlayers,
          onlinePlayers: onlinePlayers !== undefined ? onlinePlayers : existingActivation.onlinePlayers,
          plugins: plugins ? JSON.stringify(plugins) : existingActivation.plugins,
          // Update fingerprints if provided
          macAddress: macAddress
            ? hashForPrivacy(macAddress)
            : existingActivation.macAddress,
          hardwareHash: hardwareHash || existingActivation.hardwareHash,
          networkSignature: networkSignature || existingActivation.networkSignature,
        },
      });
    }

    // Step 6: Update license last validated time
    await prisma.license.update({
      where: { id: license.id },
      data: { lastValidatedAt: new Date() },
    });

    const response = {
      valid: true,
      expired: validity.expired,
      inGracePeriod: validity.inGracePeriod,
      productId: decoded.productId,
      expiresAt: new Date(decoded.expiresAt * 1000).toISOString(),
      maxActivations: decoded.maxActivations,
      features: decoded.features,
      version: decoded.version,
      serverId: hashedIp ? `${serverId.substring(0, 8)}...` : serverId,
    };

    const responseSignature = Buffer.from(JSON.stringify(response)).toString('base64');
    
    return NextResponse.json({
      ...response,
      signature: responseSignature,
      timestamp: Math.floor(Date.now() / 1000),
    });

  } catch (error) {
    console.error("License validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}