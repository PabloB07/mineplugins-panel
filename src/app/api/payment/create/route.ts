import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaykuPayment, generatePaykuOrderNumber } from "@/lib/payku";
import { createTebexPayment, generateTebexOrderNumber } from "@/lib/tebex";
import { nanoid } from "nanoid";
import { toOptionalTrimmedString, toSafeInt } from "@/lib/security";
import { PaymentMethod } from "@prisma/client";

interface PaymentCreateRequest {
  productSlug: string;
  durationDays?: number;
  paymentMethod?: "FLOW_CL" | "PAYKU" | "TEBEX";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please log in to continue" },
        { status: 401 }
      );
    }

    const body: PaymentCreateRequest = await request.json();
    const productSlug = toOptionalTrimmedString(body?.productSlug, 120);
    const durationDays = body?.durationDays === undefined
      ? undefined
      : toSafeInt(body?.durationDays, { defaultValue: 365, min: 1, max: 730 });
    const paymentMethodRaw = body?.paymentMethod === "TEBEX" ? "TEBEX" : "PAYKU";
    const paymentMethod: PaymentMethod = paymentMethodRaw as PaymentMethod;

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

    const totalCLP = days === product.defaultDurationDays
      ? basePriceCLP
      : Math.round(basePriceCLP * (days / 365));
    const totalUSD = days === product.defaultDurationDays
      ? basePriceUSD
      : Math.round(basePriceUSD * (days / 365) * 100) / 100;

    const total = Math.round(totalCLP);
    const subtotalCLP = totalCLP;
    const subtotalUSD = totalUSD;

    const orderNumber = paymentMethod === "TEBEX"
      ? generateTebexOrderNumber()
      : paymentMethod === "PAYKU"
        ? generatePaykuOrderNumber()
        : `TF-${Date.now().toString(36).toUpperCase()}-${nanoid(6).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "PENDING",
        paymentMethod,
        currency: "CLP",
        subtotal: total,
        total,
        subtotalCLP,
        subtotalUSD,
        totalCLP,
        totalUSD,
        customerEmail: user.email,
        customerName: user.name,
        items: {
          create: {
            productId: product.id,
            currency: "CLP",
            unitPrice: total,
            unitPriceCLP: totalCLP,
            unitPriceUSD: totalUSD,
            quantity: 1,
            durationDays: days,
          },
        },
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://mineplugins.vercel.app";

    if (paymentMethod === "TEBEX") {
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

    if (paymentMethod === "PAYKU") {
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

      const paykuResponse = await createPaykuPayment({
        order: orderNumber,
        subject: paykuSubject,
        amount: paykuAmount,
        email: user.email,
        payment_url: `${baseUrl}/payment/success`,
        webhook: `${baseUrl}/api/payment/payku/webhook`,
      });

      const paymentUrl = paykuResponse.payment_url || paykuResponse.url_pago || paykuResponse.url_redireccion;

      if (!paymentUrl) {
        console.error("No payment URL in Payku response:", paykuResponse);
        return NextResponse.json(
          { error: "NO_PAYMENT_URL", message: "No payment URL received from Payku" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        paymentUrl,
        paymentKey: paykuResponse.payment_key,
        transactionKey: paykuResponse.transaction_key,
      });
    }

    return NextResponse.json(
      { error: "PAYMENT_METHOD_NOT_SUPPORTED", message: "Payment method not supported" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "PAYMENT_ERROR", message: error instanceof Error ? error.message : "Payment failed" },
      { status: 500 }
    );
  }
}
