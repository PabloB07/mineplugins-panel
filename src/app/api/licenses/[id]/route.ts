import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Get a single license
 * GET /api/licenses/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please log in" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const isAdmin =
      session.user.role === UserRole.ADMIN ||
      session.user.role === UserRole.SUPER_ADMIN;

    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        product: true,
        user: isAdmin
          ? {
              select: {
                id: true,
                email: true,
                name: true,
                image: true,
              },
            }
          : false,
        activations: {
          orderBy: { lastSeenAt: "desc" },
        },
        order: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                paidAt: true,
                total: true,
              },
            },
          },
        },
      },
    });

    if (!license) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "License not found" },
        { status: 404 }
      );
    }

    // Check access
    if (!isAdmin && license.userId !== session.user.id) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ license });
  } catch (error) {
    console.error("Get license error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get license" },
      { status: 500 }
    );
  }
}

/**
 * Update a license (admin only)
 * PATCH /api/licenses/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json();
    const { status, maxActivations, expiresAt, notes } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
    }

    if (maxActivations !== undefined) {
      updateData.maxActivations = maxActivations;
    }

    if (expiresAt) {
      updateData.expiresAt = new Date(expiresAt);
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const license = await prisma.license.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ license });
  } catch (error) {
    console.error("Update license error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to update license" },
      { status: 500 }
    );
  }
}

/**
 * Delete/revoke a license (admin only)
 * DELETE /api/licenses/[id]
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

    // Check if license exists
    const license = await prisma.license.findUnique({
      where: { id },
    });

    if (!license) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "License not found" },
        { status: 404 }
      );
    }

    // Soft delete by revoking instead of hard delete
    await prisma.license.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({
      success: true,
      message: "License revoked successfully",
    });
  } catch (error) {
    console.error("Delete license error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to delete license" },
      { status: 500 }
    );
  }
}
