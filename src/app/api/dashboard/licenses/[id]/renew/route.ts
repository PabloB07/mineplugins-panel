import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: licenseId } = await params;
    const { durationDays } = await request.json();

    if (!durationDays) {
      return NextResponse.json({ error: "Duration is required" }, { status: 400 });
    }

    const license = await prisma.license.findFirst({
      where: {
        id: licenseId,
        userId: session.user.id,
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
