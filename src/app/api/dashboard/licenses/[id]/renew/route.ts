import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateModernLicenseKey, verifyModernLicenseKey } from "@/lib/license";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { licenseId, durationDays } = await request.json();

    if (!licenseId || !durationDays) {
      return NextResponse.json({ 
        error: "License ID and duration are required" 
      }, { status: 400 });
    }

    const license = await prisma.license.findFirst({
      where: {
        id: licenseId,
        userId: session.user.id,
      },
      include: {
        product: true,
      },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const decodedLicense = verifyModernLicenseKey(license.licenseKey);
    if (!decodedLicense) {
      return NextResponse.json({ 
        error: "Cannot renew legacy licenses" 
      }, { status: 400 });
    }

    const currentExpiry = Math.max(decodedLicense.expiresAt, Math.floor(Date.now() / 1000));
    const newExpiry = currentExpiry + (durationDays * 24 * 60 * 60);

    const newLicenseKey = generateModernLicenseKey({
      productId: license.product.id,
      email: session.user.email || "",
      durationDays: Math.ceil((newExpiry - decodedLicense.createdAt) / (24 * 60 * 60)),
      maxActivations: decodedLicense.maxActivations,
      features: decodedLicense.features,
      serverId: "*",
    });

    const updatedLicense = await prisma.license.update({
      where: { id: licenseId },
      data: {
        licenseKey: newLicenseKey,
        expiresAt: new Date(newExpiry * 1000),
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      license: updatedLicense,
      message: `License renewed successfully for ${durationDays} days`,
      newExpiryDate: new Date(newExpiry * 1000).toISOString(),
    });

  } catch (error) {
    console.error("License renewal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}