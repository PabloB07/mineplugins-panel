import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { toSafeInt } from "@/lib/security";
import { getDiscountCurrency } from "@/lib/discount-pricing";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const active = searchParams.get("active");
    const page = toSafeInt(searchParams.get("page"), { defaultValue: 1, min: 1, max: 1000 });
    const limit = toSafeInt(searchParams.get("limit"), { defaultValue: 25, min: 1, max: 100 });
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;

    if (search) {
      where.code = { contains: search, mode: "insensitive" };
    }

    const [total, codes] = await Promise.all([
      prisma.discountCode.count({ where }),
      prisma.discountCode.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          _count: { select: { usages: true, orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      codes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get discounts error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const { code, type, value, currency, minPurchase, maxUses, maxUsesPerUser, productId, startsAt, expiresAt } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const existingCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      return NextResponse.json({ error: "CODE_EXISTS" }, { status: 400 });
    }

    const discountCode = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        currency: getDiscountCurrency(currency),
        minPurchase,
        maxUses,
        maxUsesPerUser,
        productId,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ success: true, discountCode });
  } catch (error) {
    console.error("Create discount error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
