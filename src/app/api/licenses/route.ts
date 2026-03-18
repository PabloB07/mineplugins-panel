import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePaperLicenseKey } from "@/lib/license";
import { UserRole } from "@prisma/client";
import { toSafeInt } from "@/lib/security";

/**
 * Get all licenses for the current user (or all if admin)
 * GET /api/licenses
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

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
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

    // Non-admins can only see their own licenses
    if (!isAdmin) {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (productId) {
      where.productId = productId;
    }

    if (search && isAdmin) {
      where.OR = [
        { licenseKey: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { product: { name: { contains: search, mode: "insensitive" } } },
        { product: { slug: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.license.count({ where });

    const licenses = await prisma.license.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
        user: isAdmin
          ? {
              select: {
                id: true,
                email: true,
                name: true,
              },
            }
          : false,
        activations: {
          select: {
            id: true,
            serverId: true,
            serverIp: true,
            isActive: true,
            lastSeenAt: true,
            serverVersion: true,
            validationCount: true,
          },
        },
        _count: {
          select: {
            activations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ 
      licenses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    });
  } catch (error) {
    console.error("Get licenses error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get licenses" },
      { status: 500 }
    );
  }
}

/**
 * Create a new license (admin only)
 * POST /api/licenses
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const productId = typeof body?.productId === "string" ? body.productId : "";
    const durationDays = toSafeInt(body?.durationDays, {
      defaultValue: 365,
      min: 1,
      max: 3650,
    });
    const maxActivations =
      body?.maxActivations === undefined
        ? undefined
        : toSafeInt(body?.maxActivations, {
            defaultValue: 1,
            min: 1,
            max: 100,
          });
    const notes = typeof body?.notes === "string" ? body.notes.slice(0, 4000) : undefined;

    if (!userId || !productId) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "userId and productId are required" },
        { status: 400 }
      );
    }

    // Get user and product
    const [user, product] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "User not found" },
        { status: 404 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "Product not found" },
        { status: 404 }
      );
    }

    // Generate license key
    const days = durationDays || product.defaultDurationDays;
    const licenseKey = generatePaperLicenseKey(product.slug);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Create license
    const license = await prisma.license.create({
      data: {
        licenseKey,
        userId,
        productId,
        status: "ACTIVE",
        expiresAt,
        maxActivations: maxActivations ?? product.maxActivations,
        notes,
      },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ license }, { status: 201 });
  } catch (error) {
    console.error("Create license error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to create license" },
      { status: 500 }
    );
  }
}

/**
 * Hard delete revoked licenses (admin only)
 * DELETE /api/licenses
 * body: { status: "REVOKED" }
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
    if (body?.status !== "REVOKED") {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Only status REVOKED is supported for bulk deletion" },
        { status: 400 }
      );
    }

    const revokedLicenses = await prisma.license.findMany({
      where: { status: "REVOKED" },
      select: { id: true },
    });

    const revokedIds = revokedLicenses.map((license) => license.id);
    if (revokedIds.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: "No revoked licenses found",
      });
    }

    const deletedCount = await prisma.$transaction(async (tx) => {
      await tx.orderItem.updateMany({
        where: { licenseId: { in: revokedIds } },
        data: { licenseId: null },
      });

      const deleted = await tx.license.deleteMany({
        where: { id: { in: revokedIds } },
      });

      return deleted.count;
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} revoked license(s)`,
    });
  } catch (error) {
    console.error("Bulk delete revoked licenses error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to delete revoked licenses" },
      { status: 500 }
    );
  }
}
