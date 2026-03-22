import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { toOptionalTrimmedString, toSafeInt } from "@/lib/security";

/**
 * Get all products
 * GET /api/products
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const showAll = searchParams.get("showAll") === "true";
    const search = searchParams.get("search");
    const page = toSafeInt(searchParams.get("page"), { defaultValue: 1, min: 1, max: 1000 });
    const limit = toSafeInt(searchParams.get("limit"), { defaultValue: 10, min: 1, max: 50 });
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (!showAll) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
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
          apiToken: true,
          versions: {
            orderBy: { publishedAt: "desc" },
            take: 5,
          },
          _count: {
            select: {
              licenses: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages },
    });
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
    const name = toOptionalTrimmedString(body?.name, 120);
    const slug = toOptionalTrimmedString(body?.slug, 120)?.toLowerCase();
    const description = toOptionalTrimmedString(body?.description, 2000);
    const priceUSD = Number(body?.priceUSD);
    const priceCLP = Number(body?.priceCLP);
    const salePriceUSD = body?.salePriceUSD === null ? null : Number(body?.salePriceUSD);
    const salePriceCLP = body?.salePriceCLP === null ? null : Number(body?.salePriceCLP);
    const defaultDurationDays = toSafeInt(body?.defaultDurationDays, {
      defaultValue: 365,
      min: 1,
      max: 3650,
    });
    const maxActivations = toSafeInt(body?.maxActivations, {
      defaultValue: 1,
      min: 1,
      max: 100,
    });

    if (!name || !slug || !Number.isFinite(priceUSD) || !Number.isFinite(priceCLP) || priceUSD <= 0 || priceCLP <= 0) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Name, slug, priceUSD, and priceCLP are required" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        {
          error: "INVALID_SLUG",
          message: "Slug must contain only lowercase letters, numbers, and hyphens",
        },
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
        salePriceUSD: Number.isFinite(salePriceUSD) && salePriceUSD && salePriceUSD > 0 ? salePriceUSD : null,
        salePriceCLP: Number.isFinite(salePriceCLP) && salePriceCLP && salePriceCLP > 0 ? salePriceCLP : null,
        defaultDurationDays,
        maxActivations,
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
