import { NextRequest, NextResponse } from "next/server";
import { checkLicenseValidity, hashForPrivacy } from "@/lib/license";

export async function POST(request: NextRequest) {
  try {
    const { licenseKey, serverId, serverIp } = await request.json();

    if (!licenseKey || !serverId) {
      return NextResponse.json({ 
        error: "License key and server ID are required" 
      }, { status: 400 });
    }

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

    const decoded = validity.decoded;
    const serverMatches = decoded.serverId === "*" || decoded.serverId === serverId;

    if (!serverMatches) {
      return NextResponse.json({ 
        valid: false, 
        error: "License not valid for this server" 
      }, { status: 403 });
    }

    const hashedIp = serverIp ? hashForPrivacy(serverIp) : null;

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