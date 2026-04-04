import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { toSafeInt } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const productId = searchParams.get("productId");
    const subtotal = toSafeInt(searchParams.get("subtotal"), {
      defaultValue: 0,
      min: 0,
      max: 1_000_000_000,
    });

    if (!code) {
      return NextResponse.json(
        { error: "MISSING_CODE", message: "Discount code is required" },
        { status: 400 }
      );
    }

    const discount = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!discount) {
      return NextResponse.json(
        { error: "INVALID_CODE", message: "Invalid discount code" },
        { status: 404 }
      );
    }

    if (!discount.isActive) {
      return NextResponse.json(
        { error: "INACTIVE_CODE", message: "This discount code is no longer active" },
        { status: 400 }
      );
    }

    if (discount.expiresAt && new Date() > discount.expiresAt) {
      return NextResponse.json(
        { error: "EXPIRED_CODE", message: "This discount code has expired" },
        { status: 400 }
      );
    }

    if (discount.startsAt && new Date() < discount.startsAt) {
      return NextResponse.json(
        { error: "NOT_STARTED", message: "This discount code is not yet active" },
        { status: 400 }
      );
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return NextResponse.json(
        { error: "LIMIT_REACHED", message: "This discount code has reached its usage limit" },
        { status: 400 }
      );
    }

    if (discount.minPurchase && subtotal > 0 && subtotal < discount.minPurchase) {
      return NextResponse.json(
        { error: "MIN_PURCHASE_NOT_REACHED", message: `Minimum purchase is ${discount.minPurchase} CLP` },
        { status: 400 }
      );
    }

    if (discount.maxUsesPerUser && session?.user?.id) {
      const userUsageCount = await prisma.discountUsage.count({
        where: {
          discountCodeId: discount.id,
          userId: session.user.id,
        },
      });

      if (userUsageCount >= discount.maxUsesPerUser) {
        return NextResponse.json(
          { error: "USER_LIMIT_REACHED", message: "You reached max uses for this code" },
          { status: 400 }
        );
      }
    }

    if (discount.productId && productId && discount.productId !== productId) {
      return NextResponse.json(
        { error: "INVALID_PRODUCT", message: "This discount code is not valid for this product" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minPurchase: discount.minPurchase,
      discount: discount,
    });
  } catch (error) {
    console.error("Validate discount error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to validate discount code" },
      { status: 500 }
    );
  }
}
