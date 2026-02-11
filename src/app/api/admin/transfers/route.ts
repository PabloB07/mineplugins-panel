import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePaperLicenseKey } from "@/lib/license";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { licenseId, targetUserId, targetEmail, durationDays } = await request.json();

    if (!licenseId || (!targetUserId && !targetEmail) || !durationDays) {
      return NextResponse.json(
        { error: "License ID, target user/email, and duration are required" },
        { status: 400 }
      );
    }

    const license = await prisma.license.findFirst({
      where: { id: licenseId },
      include: {
        product: true,
      },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    let targetUser;
    if (targetUserId) {
      targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (targetEmail) {
      targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const newExpiresAt = new Date();
    newExpiresAt.setUTCDate(newExpiresAt.getUTCDate() + Number(durationDays));
    const newLicenseKey = generatePaperLicenseKey(license.product.slug);

    const transferRecord = await prisma.$transaction(async (tx) => {
      await tx.licenseActivation.deleteMany({ where: { licenseId: license.id } });
      await tx.license.delete({ where: { id: license.id } });

      const newLicense = await tx.license.create({
        data: {
          licenseKey: newLicenseKey,
          status: "ACTIVE",
          maxActivations: license.maxActivations,
          userId: targetUser.id,
          productId: license.product.id,
          expiresAt: newExpiresAt,
        },
      });

      return newLicense;
    });

    return NextResponse.json({
      success: true,
      message: `License transferred successfully to ${targetUser.email}`,
      newLicenseId: transferRecord.id,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    });
  } catch (error) {
    console.error("License transfer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const transfers = await prisma.$queryRaw<Array<{
      id: string;
      from_user_email: string;
      to_user_email: string;
      product_name: string;
      transferred_at: Date;
    }>>`
      SELECT 
        lt.id,
        u_from.email as from_user_email,
        u_to.email as to_user_email,
        p.name as product_name,
        lt.transferred_at as transferred_at
      FROM license_transfers lt
      JOIN "User" u_from ON lt.from_user_id = u_from.id
      JOIN "User" u_to ON lt.to_user_id = u_to.id
      JOIN License l_orig ON lt.original_license_id = l_orig.id
      JOIN License l_new ON lt.new_license_id = l_new.id
      JOIN Product p ON l_new.product_id = p.id
      ORDER BY lt.transferred_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error("Get transfers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
