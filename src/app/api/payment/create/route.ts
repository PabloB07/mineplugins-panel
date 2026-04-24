import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaykuPayment, generatePaykuOrderNumber } from "@/lib/payku";
import { createTebexPayment, generateTebexOrderNumber } from "@/lib/tebex";
import { createPaypalPayment, generatePaypalOrderNumber } from "@/lib/paypal";
import { toOptionalTrimmedString, toSafeInt } from "@/lib/security";
import { PaymentMethod } from "@prisma/client";
import {
  calculateDiscountAmounts,
  convertCurrencyAmount,
  formatCurrencyAmount,
  getMinPurchaseUSD,
} from "@/lib/discount-pricing";
import { getGatewaySettings } from "@/lib/payment-gateway-settings";

interface PaymentCreateRequest {
  productSlug: string;
  durationDays?: number;
  paymentMethod?: "PAYKU" | "TEBEX" | "PAYPAL";
  discountCode?: string;
  currency?: "CLP" | "USD" | "EUR" | "CAD";
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please log in to continue" },
        { status: 401 }
      );
    }

    const body: PaymentCreateRequest = await request.json();
    const productSlug = toOptionalTrimmedString(body?.productSlug, 120);
    const discountCodeInput = toOptionalTrimmedString(body?.discountCode, 64);
    const durationDays = body?.durationDays === undefined
      ? undefined
      : toSafeInt(body?.durationDays, { defaultValue: 365, min: 1, max: 730 });
    const paymentMethodId: "PAYKU" | "TEBEX" | "PAYPAL" =
      body?.paymentMethod === "TEBEX"
        ? "TEBEX"
        : body?.paymentMethod === "PAYPAL"
          ? "PAYPAL"
          : "PAYKU";

    const paymentMethod: PaymentMethod = paymentMethodId as unknown as PaymentMethod;

    const settings = await getGatewaySettings();

    if (paymentMethodId === "PAYKU" && !settings.payku.enabled) {
      return NextResponse.json(
        { error: "PAYMENT_METHOD_DISABLED", message: "Payku payment is currently disabled" },
        { status: 400 }
      );
    }

    if (paymentMethodId === "PAYPAL" && !settings.paypal.enabled) {
      return NextResponse.json(
        { error: "PAYMENT_METHOD_DISABLED", message: "PayPal payment is currently disabled" },
        { status: 400 }
      );
    }

    if (paymentMethodId === "TEBEX" && !settings.tebex.enabled) {
      return NextResponse.json(
        { error: "PAYMENT_METHOD_DISABLED", message: "Tebex payment is currently disabled" },
        { status: 400 }
      );
    }

    if (!productSlug) {
      return NextResponse.json(
        { error: "MISSING_PRODUCT", message: "Product is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: { slug: productSlug, isActive: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "Product not found" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "User not found" },
        { status: 404 }
      );
    }

    const days = durationDays ?? product.defaultDurationDays;
    const basePriceCLP = product.salePriceCLP || product.priceCLP;
    const basePriceUSD = product.salePriceUSD || product.priceUSD;

    const subtotalCLP = days === product.defaultDurationDays
      ? basePriceCLP
      : Math.round(basePriceCLP * (days / 365));
    const subtotalUSD = days === product.defaultDurationDays
      ? basePriceUSD
      : Number((basePriceUSD * (days / 365)).toFixed(2));

    let discountCodeId: string | null = null;
    let discountCLP = 0;
    let discountUSD = 0;

    if (discountCodeInput) {
      const normalizedCode = discountCodeInput.toUpperCase();
      const discountCode = await prisma.discountCode.findUnique({
        where: { code: normalizedCode },
      });

      if (!discountCode) {
        return NextResponse.json(
          { error: "INVALID_DISCOUNT_CODE", message: "Discount code is invalid" },
          { status: 400 }
        );
      }

      if (!discountCode.isActive) {
        return NextResponse.json(
          { error: "INACTIVE_DISCOUNT_CODE", message: "Discount code is inactive" },
          { status: 400 }
        );
      }

      const now = new Date();
      if (discountCode.startsAt && now < discountCode.startsAt) {
        return NextResponse.json(
          { error: "DISCOUNT_NOT_STARTED", message: "Discount code is not active yet" },
          { status: 400 }
        );
      }

      if (discountCode.expiresAt && now > discountCode.expiresAt) {
        return NextResponse.json(
          { error: "DISCOUNT_EXPIRED", message: "Discount code has expired" },
          { status: 400 }
        );
      }

      if (discountCode.productId && discountCode.productId !== product.id) {
        return NextResponse.json(
          { error: "DISCOUNT_PRODUCT_MISMATCH", message: "Discount code is not valid for this product" },
          { status: 400 }
        );
      }

      const minPurchaseAmount = getMinPurchaseUSD(discountCode);
      if (minPurchaseAmount) {
        const subtotalInDiscountCurrency = convertCurrencyAmount(subtotalUSD, "USD", "USD");

        if (subtotalInDiscountCurrency < minPurchaseAmount) {
          return NextResponse.json(
            {
              error: "MIN_PURCHASE_NOT_REACHED",
              message: `Minimum purchase is ${formatCurrencyAmount(minPurchaseAmount, "USD")}`,
            },
            { status: 400 }
          );
        }
      }

      if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
        return NextResponse.json(
          { error: "DISCOUNT_USAGE_LIMIT_REACHED", message: "Discount code reached max usage limit" },
          { status: 400 }
        );
      }

      if (discountCode.maxUsesPerUser) {
        const userUsageCount = await prisma.discountUsage.count({
          where: {
            discountCodeId: discountCode.id,
            userId: user.id,
          },
        });

        if (userUsageCount >= discountCode.maxUsesPerUser) {
          return NextResponse.json(
            { error: "DISCOUNT_USER_LIMIT_REACHED", message: "You already reached max uses for this discount code" },
            { status: 400 }
          );
        }
      }

      discountCodeId = discountCode.id;

      const amounts = calculateDiscountAmounts(discountCode, subtotalUSD, subtotalCLP);
      discountCLP = amounts.discountCLP;
      discountUSD = amounts.discountUSD;
    }

    const totalCLP = Math.max(0, subtotalCLP - discountCLP);
    const totalUSD = Number(Math.max(0, subtotalUSD - discountUSD).toFixed(2));
    const orderCurrency = paymentMethodId === "PAYKU" ? "CLP" : "USD";
    const subtotalLegacy = orderCurrency === "CLP" ? Math.round(subtotalCLP) : Math.round(subtotalUSD);
    const discountLegacy = orderCurrency === "CLP" ? Math.round(discountCLP) : Math.round(discountUSD);
    const totalLegacy = orderCurrency === "CLP" ? Math.round(totalCLP) : Math.round(totalUSD);

    const orderNumber =
      paymentMethodId === "TEBEX"
        ? generateTebexOrderNumber()
        : paymentMethodId === "PAYKU"
          ? generatePaykuOrderNumber()
          : generatePaypalOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "PENDING",
        paymentMethod,
        currency: orderCurrency,
        subtotal: subtotalLegacy,
        discount: discountLegacy,
        total: totalLegacy,
        subtotalCLP: Number(subtotalCLP.toFixed(2)),
        subtotalUSD,
        discountCLP: Number(discountCLP.toFixed(2)),
        discountUSD,
        totalCLP,
        totalUSD,
        discountCodeId,
        customerEmail: user.email,
        customerName: user.name,
        items: {
          create: {
            productId: product.id,
            currency: orderCurrency,
            unitPrice: orderCurrency === "CLP" ? Math.round(subtotalCLP) : Math.round(subtotalUSD),
            unitPriceCLP: Number(subtotalCLP.toFixed(2)),
            unitPriceUSD: subtotalUSD,
            quantity: 1,
            durationDays: days,
          },
        },
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://mineplugins.vercel.app";

    if (paymentMethodId === "TEBEX") {
      const tebexResponse = await createTebexPayment({
        order: orderNumber,
        productName: `${product.name} - ${days} days license`,
        amount: totalUSD,
        email: user.email,
        username: user.name || user.email.split("@")[0],
        redirectUrl: `${baseUrl}/payment/success`,
        webhookUrl: `${baseUrl}/api/payment/tebex/webhook`,
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        paymentUrl: tebexResponse.checkoutUrl,
        transactionId: tebexResponse.ident || tebexResponse.id,
      });
    }

    if (paymentMethodId === "PAYKU") {
      const paykuAmount = Math.round(totalCLP);
      const paykuSubject = `MinePlugins License - ${days} days`;

      if (!orderNumber || orderNumber.trim().length === 0) {
        throw new Error("Order number is empty");
      }
      if (!paykuSubject || paykuSubject.trim().length === 0) {
        throw new Error("Subject is empty");
      }
      if (!paykuAmount || paykuAmount <= 0) {
        throw new Error(`Invalid amount: ${paykuAmount}`);
      }
      if (!user.email || user.email.trim().length === 0) {
        throw new Error("User email is empty");
      }

      console.log("[CreatePayment] Creating Payku payment:", { order: orderNumber, amount: paykuAmount, subject: paykuSubject });

      const paykuResponse = await createPaykuPayment({
        order: orderNumber,
        subject: paykuSubject,
        amount: paykuAmount,
        email: user.email,
        returnUrl: `${baseUrl}/api/payment/payku/return?order=${orderNumber}`,
        notifyUrl: `${baseUrl}/api/payment/payku/webhook`,
      });

      console.log("[CreatePayment] Payku response:", paykuResponse);
      console.log("[CreatePayment] paymentUrl:", paykuResponse.paymentUrl);
      console.log("[CreatePayment] Payku transaction ID:", paykuResponse.id);
      console.log("[CreatePayment] Order ID:", order.id);

      // Save the gateway transaction ID for better status tracking
      if (paykuResponse.id) {
        try {
          await prisma.order.update({
            where: { id: order.id },
            data: { flowOrderNumber: paykuResponse.id }
          });
          console.log("[CreatePayment] Saved flowOrderNumber:", paykuResponse.id);
        } catch (dbError) {
          console.error("[CreateOrder] Failed to update flowOrderNumber:", dbError);
          // We don't throw here to avoid preventing the user from paying
        }
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        paymentUrl: paykuResponse.paymentUrl,
        redirectMethod: paykuResponse.redirectMethod,
        formFields: paykuResponse.formFields,
      });
    }

    if (paymentMethodId === "PAYPAL") {
      const paypalReturnUrl = `${baseUrl}/api/payment/paypal/return`;
      const paypalCancelUrl = `${baseUrl}/api/payment/paypal/cancel`;

      const paypalResponse = await createPaypalPayment({
        order: orderNumber,
        productName: `${product.name} - ${days} days license`,
        amountUSD: totalUSD,
        email: user.email,
        returnUrl: paypalReturnUrl,
        cancelUrl: paypalCancelUrl,
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        paymentUrl: paypalResponse.approvalUrl,
        transactionId: paypalResponse.orderId,
      });
    }

    return NextResponse.json(
      { error: "PAYMENT_METHOD_NOT_SUPPORTED", message: "Payment method not supported" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[CreatePayment] Unhandled error:", error);
    const errorMessage = error instanceof Error ? error.message : "Payment failed";
    return NextResponse.json(
      { error: "PAYMENT_ERROR", message: errorMessage },
      { status: 500 }
    );
  }
}
