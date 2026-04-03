import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus, UserRole } from "@prisma/client";
import { toSafeInt } from "@/lib/security";

/**
 * Get all orders with filtering and search (admin only)
 * GET /api/admin/orders?status=PENDING&search=xxx
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const excludedStatuses = searchParams.getAll("excludeStatus");
    const search = searchParams.get("search");
    const page = toSafeInt(searchParams.get("page"), {
      defaultValue: 1,
      min: 1,
      max: 100000,
    });
    const limit = toSafeInt(searchParams.get("limit"), {
      defaultValue: 25,
      min: 1,
      max: 100,
    });
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    } else if (excludedStatuses.length > 0) {
      where.status = { notIn: excludedStatuses };
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            },
            license: {
              select: {
                id: true,
                licenseKey: true,
                status: true,
                expiresAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ 
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    });

  } catch (error) {
    console.error("Get admin orders error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to get orders",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Bulk delete orders by status (admin only)
 * DELETE /api/admin/orders
 * body: { statuses: ["PENDING", "CANCELLED"] }
 */
export async function DELETE(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const rawStatuses = Array.isArray(body?.statuses) ? body.statuses : [];

    const allowedStatuses = new Set<OrderStatus>([
      OrderStatus.PENDING,
      OrderStatus.CANCELLED,
    ]);

    const statuses = rawStatuses.filter(
      (status: unknown): status is OrderStatus =>
        typeof status === "string" &&
        allowedStatuses.has(status as OrderStatus)
    );

    if (statuses.length === 0) {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: "Provide statuses: PENDING and/or CANCELLED" },
        { status: 400 }
      );
    }

    const result = await prisma.order.deleteMany({
      where: {
        status: { in: statuses },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} order(s)`,
    });
  } catch (error) {
    console.error("Bulk delete admin orders error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to delete orders",
      },
      { status: 500 }
    );
  }
}
