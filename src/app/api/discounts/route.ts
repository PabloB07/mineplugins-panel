import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  calculateDiscountAmounts,
  convertCurrencyAmount,
  formatCurrencyAmount,
  getDiscountCurrency,
  getDiscountValueInOwnCurrency,
  getMinPurchaseUSD,
  isSupportedCurrency,
} from "@/lib/discount-pricing";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const productId = searchParams.get("productId");
    const currencyParam = searchParams.get("currency");
    const subtotal = Number(searchParams.get("subtotal") || 0);
    const currency = isSupportedCurrency(currencyParam) ? currencyParam : "CLP";

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

    const discountCurrency = getDiscountCurrency(discount.currency);
    const subtotalInUSD = convertCurrencyAmount(
      Number.isFinite(subtotal) ? subtotal : 0,
      currency,
      "USD"
    );
    const minPurchaseAmount = getMinPurchaseUSD(discount);

    if (minPurchaseAmount && subtotalInUSD > 0 && subtotalInUSD < minPurchaseAmount) {
      return NextResponse.json(
        {
          error: "MIN_PURCHASE_NOT_REACHED",
          message: `Minimum purchase is ${formatCurrencyAmount(minPurchaseAmount, "USD")}`,
        },
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

    const product = productId
      ? await prisma.product.findUnique({
          where: { id: productId },
          select: { priceUSD: true, priceCLP: true, salePriceUSD: true, salePriceCLP: true },
        })
      : null;

    const subtotalUSD = product
      ? product.salePriceUSD || product.priceUSD
      : convertCurrencyAmount(Number.isFinite(subtotal) ? subtotal : 0, currency, "USD");
    const subtotalCLP = product
      ? product.salePriceCLP || product.priceCLP
      : convertCurrencyAmount(Number.isFinite(subtotal) ? subtotal : 0, currency, "CLP");
    const amounts = calculateDiscountAmounts(discount, subtotalUSD, subtotalCLP);

    return NextResponse.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      currency: discountCurrency,
      displayValue: getDiscountValueInOwnCurrency(discount),
      minPurchase: discount.minPurchase,
      minPurchaseDisplay: minPurchaseAmount,
      minPurchaseFormatted: minPurchaseAmount ? formatCurrencyAmount(minPurchaseAmount, "USD") : null,
      amounts,
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
