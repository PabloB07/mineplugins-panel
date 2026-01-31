import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateActivationToken, verifyModernLicenseKey } from "@/lib/license";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: licenseId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId, serverIp, serverVersion } = await request.json();

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 });
    }

    const license = await prisma.license.findFirst({
      where: {
        id: licenseId,
        userId: session.user.id,
      },
      include: {
        activations: true,
      },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const decodedLicense = verifyModernLicenseKey(license.licenseKey);
    if (!decodedLicense) {
      return NextResponse.json({ error: "Invalid license" }, { status: 400 });
    }

    const activeActivations = license.activations.filter(a => a.isActive);
    if (activeActivations.length >= decodedLicense.maxActivations) {
      return NextResponse.json({ 
        error: `Maximum activations reached (${decodedLicense.maxActivations})` 
      }, { status: 400 });
    }

    const existingActivation = license.activations.find(a => a.serverId === serverId);
    if (existingActivation) {
      const updatedActivation = await prisma.licenseActivation.update({
        where: { id: existingActivation.id },
        data: {
          isActive: true,
          serverIp,
          serverVersion,
          lastSeenAt: new Date(),
          validationCount: existingActivation.validationCount + 1,
        },
      });

      const activationToken = generateActivationToken(license.licenseKey, serverId);

      return NextResponse.json({
        success: true,
        activation: updatedActivation,
        activationToken,
        message: "License reactivated successfully",
      });
    }

    const activation = await prisma.licenseActivation.create({
      data: {
        licenseId: license.id,
        serverId,
        serverIp,
        serverVersion,
        isActive: true,
        lastSeenAt: new Date(),
        validationCount: 1,
      },
    });

    const activationToken = generateActivationToken(license.licenseKey, serverId);

    await prisma.license.update({
      where: { id: license.id },
      data: { lastValidatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      activation,
      activationToken,
      message: "License activated successfully",
    });
  } catch (error) {
    console.error("License activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: licenseId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId } = await request.json();

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 });
    }

    const license = await prisma.license.findFirst({
      where: {
        id: licenseId,
        userId: session.user.id,
      },
      include: {
        activations: true,
      },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const activation = license.activations.find(a => a.serverId === serverId);
    if (!activation) {
      return NextResponse.json({ error: "Activation not found" }, { status: 404 });
    }

    await prisma.licenseActivation.update({
      where: { id: activation.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "License deactivated successfully",
    });
  } catch (error) {
    console.error("License deactivation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}