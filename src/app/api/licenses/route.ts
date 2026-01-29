import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLicenseKey } from "@/lib/license";
import { UserRole } from "@prisma/client";

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
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
            isActive: true,
            lastSeenAt: true,
            serverVersion: true,
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
    const { userId, productId, durationDays, maxActivations, notes } = body;

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
    const licenseKey = generateLicenseKey({
      productId: product.id,
      email: user.email,
      durationDays: days,
    });

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
        maxActivations: maxActivations || product.maxActivations,
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
