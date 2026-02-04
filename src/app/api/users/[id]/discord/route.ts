import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Revoke Discord connection for a user (admin only)
 * DELETE /api/users/[id]/discord
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please log in" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === UserRole.ADMIN ||
      session.user.role === UserRole.SUPER_ADMIN;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const discordAccount = await prisma.account.findFirst({
      where: {
        userId: id,
        provider: "discord",
      },
    });

    if (!discordAccount) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Discord account not found" },
        { status: 404 }
      );
    }

    await prisma.account.delete({
      where: { id: discordAccount.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke discord error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to revoke Discord access" },
      { status: 500 }
    );
  }
}
