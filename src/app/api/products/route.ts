import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * Get all products
 * GET /api/products
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active") !== "false";

    const where: Record<string, unknown> = {};

    if (activeOnly) {
      where.isActive = true;
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceUSD: true,
        priceCLP: true,
        salePriceUSD: true,
        salePriceCLP: true,
        defaultDurationDays: true,
        maxActivations: true,
        isActive: true,
        _count: {
          select: {
            licenses: true,
            versions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get products" },
      { status: 500 }
    );
  }
}

/**
 * Create a new product (admin only)
 * POST /api/products
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
    const {
      name,
      slug,
      description,
      priceUSD,
      priceCLP,
      salePriceUSD,
      salePriceCLP,
      defaultDurationDays,
      maxActivations,
    } = body;

    if (!name || !slug || !priceUSD || !priceCLP) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Name, slug, priceUSD, and priceCLP are required" },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existing = await prisma.product.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "SLUG_EXISTS", message: "A product with this slug already exists" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: priceCLP, // Legacy field - mirrors CLP price
        salePrice: salePriceCLP, // Legacy field
        priceUSD,
        priceCLP,
        salePriceUSD,
        salePriceCLP,
        defaultDurationDays: defaultDurationDays || 365,
        maxActivations: maxActivations || 1,
        isActive: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to create product" },
      { status: 500 }
    );
  }
}
