import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { toSafeInt } from "@/lib/security";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: licenseId } = await params;
    const body = await request.json();
    const durationDays = toSafeInt(body?.durationDays, {
      defaultValue: 0,
      min: 1,
      max: 730,
    });

    if (!durationDays) {
      return NextResponse.json({ error: "Duration is required" }, { status: 400 });
    }

    const selfServiceEnabled = process.env.ALLOW_SELF_SERVICE_LICENSE_RENEWAL === "true";
    const isAdmin = isAdminRole(session.user.role);
    if (!isAdmin && !selfServiceEnabled) {
      return NextResponse.json(
        {
          error: "RENEWAL_DISABLED",
          message: "Self-service renewal is disabled. Please purchase a new order from the store.",
        },
        { status: 403 }
      );
    }

    const license = await prisma.license.findFirst({
      where: {
        id: licenseId,
        ...(isAdmin ? {} : { userId: session.user.id }),
      },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const now = new Date();
    const base = license.expiresAt > now ? new Date(license.expiresAt) : now;
    const newExpiry = new Date(base);
    newExpiry.setUTCDate(newExpiry.getUTCDate() + Number(durationDays));

    const updatedLicense = await prisma.license.update({
      where: { id: licenseId },
      data: {
        expiresAt: newExpiry,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      license: updatedLicense,
      message: `License renewed successfully for ${durationDays} days`,
      newExpiryDate: newExpiry.toISOString(),
    });
  } catch (error) {
    console.error("License renewal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
