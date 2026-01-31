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

    const { licenseId, targetEmail, durationDays } = await request.json();

    if (!licenseId || !targetEmail) {
      return NextResponse.json({ 
        error: "License ID and target email are required" 
      }, { status: 400 });
    }

    const license = await prisma.license.findFirst({
      where: {
        id: licenseId,
        userId: session.user.id,
      },
      include: {
        product: true,
        activations: true,
      },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const decodedLicense = verifyModernLicenseKey(license.licenseKey);
    if (!decodedLicense) {
      return NextResponse.json({ 
        error: "Cannot transfer legacy licenses" 
      }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json({ 
        error: "Cannot transfer license to yourself" 
      }, { status: 400 });
    }

    const newLicenseKey = generateModernLicenseKey({
      productId: license.product.id,
      email: targetEmail,
      durationDays: durationDays || Math.ceil(
        (decodedLicense.expiresAt - Math.floor(Date.now() / 1000)) / (24 * 60 * 60)
      ),
      maxActivations: decodedLicense.maxActivations,
      features: decodedLicense.features,
      serverId: "*",
    });

    const transferRecord = await prisma.$transaction(async (tx) => {
      await tx.licenseActivation.deleteMany({
        where: { licenseId: license.id },
      });

      await tx.license.delete({
        where: { id: license.id },
      });

      const newLicense = await tx.license.create({
        data: {
          licenseKey: newLicenseKey,
          status: "ACTIVE",
          maxActivations: decodedLicense.maxActivations,
          userId: targetUser.id,
          productId: license.product.id,
          expiresAt: new Date(decodedLicense.expiresAt * 1000),
        },
      });

      // Note: LicenseTransfer model creation will be available after schema deployment
      // This is a placeholder for future transfer logging

      return newLicense;
    });

    return NextResponse.json({
      success: true,
      message: `License transferred successfully to ${targetEmail}`,
      newLicenseId: transferRecord.id,
    });

  } catch (error) {
    console.error("License transfer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Temporary mock data until schema migration
    const transfers: Array<{
      id: string;
      fromUser: { name: string | null; email: string };
      toUser: { name: string | null; email: string };
      originalLicense: { product: { name: string } };
      newLicense: { product: { name: string } };
      transferredAt: string;
    }> = [];

    return NextResponse.json({ transfers });

  } catch (error) {
    console.error("Get transfers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}