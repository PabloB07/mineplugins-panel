import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Update a user (admin only)
 * PATCH /api/users/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
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
    const body = await request.json();
    const role = body?.role as UserRole | undefined;

    if (!role) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Role is required" },
        { status: 400 }
      );
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: "INVALID_ROLE", message: "Invalid role provided" },
        { status: 400 }
      );
    }

    if (role === UserRole.SUPER_ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only super admins can grant SUPER_ADMIN role" },
        { status: 403 }
      );
    }

    if (id === session.user.id && role !== session.user.role) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "You cannot change your own role" },
        { status: 403 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to update user" },
      { status: 500 }
    );
  }
}
