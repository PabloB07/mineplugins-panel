import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFlowPayment } from "@/lib/flow";
import { createPaykuPayment, generatePaykuOrderNumber } from "@/lib/payku";
import { nanoid } from "nanoid";

interface PaymentCreateRequest {
  productSlug: string;
  durationDays?: number;
  paymentMethod?: "FLOW_CL" | "PAYKU";
}

/**
 * Creates a payment order and redirects to Flow.cl
 * POST /api/payment/create
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please log in to continue" },
        { status: 401 }
      );
    }

    const body: PaymentCreateRequest = await request.json();
    const { productSlug, durationDays, paymentMethod = "FLOW_CL" } = body;

    if (!productSlug) {
      return NextResponse.json(
        { error: "MISSING_PRODUCT", message: "Product is required" },
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { slug: productSlug, isActive: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "Product not found" },
        { status: 404 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "User not found" },
        { status: 404 }
      );
    }

    // Calculate prices for both currencies
    const days = durationDays || product.defaultDurationDays;
    const basePriceCLP = product.salePriceCLP || product.priceCLP;
    const basePriceUSD = product.salePriceUSD || product.priceUSD;

    // Pro-rate for duration (if not default 365 days)
    const totalCLP =
      days === product.defaultDurationDays
        ? basePriceCLP
        : Math.round(basePriceCLP * (days / 365));
    const totalUSD =
      days === product.defaultDurationDays
        ? basePriceUSD
        : Math.round(basePriceUSD * (days / 365) * 100) / 100;

    // Legacy total field (Int, in CLP)
    const total = Math.round(totalCLP);

    // Generate unique order number
    const orderNumber = paymentMethod === "PAYKU" 
      ? generatePaykuOrderNumber()
      : `TF-${Date.now().toString(36).toUpperCase()}-${nanoid(6).toUpperCase()}`;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "PENDING",
        paymentMethod,
        currency: "CLP",
        // Legacy fields (Int)
        subtotal: total,
        total,
        // New dual-currency fields (Float)
        subtotalCLP: totalCLP,
        subtotalUSD: totalUSD,
        totalCLP,
        totalUSD,
        customerEmail: user.email,
        customerName: user.name,
        items: {
          create: {
            productId: product.id,
            currency: "CLP",
            unitPrice: total, // Legacy field
            unitPriceCLP: totalCLP,
            unitPriceUSD: totalUSD,
            quantity: 1,
            durationDays: days,
          },
        },
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://townyfaith.vercel.app";

    if (paymentMethod === "PAYKU") {
      // Create Payku payment
      const paykuResponse = await createPaykuPayment({
        order: orderNumber,
        subject: `TownyFaiths License - ${days} days`,
        amount: Math.round(totalCLP), // Payku expects integer CLP
        email: user.email,
        payment_url: `${baseUrl}/payment/success`,
        webhook: `${baseUrl}/api/payment/payku/webhook`,
      });

      // Update order with Payku data
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paykuPaymentKey: paykuResponse.payment_key,
          paykuTransactionKey: paykuResponse.transaction_key,
          paykuVerificationKey: paykuResponse.verification_key,
          paykuPaymentUrl: paykuResponse.payment_url,
        },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        paymentUrl: paykuResponse.payment_url,
        paymentKey: paykuResponse.payment_key,
        transactionKey: paykuResponse.transaction_key,
      });
    } else {
      // Create Flow.cl payment
      const flowResponse = await createFlowPayment({
        commerceOrder: orderNumber,
        subject: `TownyFaiths License - ${days} days`,
        amount: total, // Flow expects CLP pesos
        email: user.email,
        urlConfirmation: `${baseUrl}/api/payment/confirm`,
        urlReturn: `${baseUrl}/api/payment/return`,
      });

      // Update order with Flow data
      await prisma.order.update({
        where: { id: order.id },
        data: {
          flowToken: flowResponse.token,
          flowOrderNumber: String(flowResponse.flowOrder),
          flowPaymentUrl: `${flowResponse.url}?token=${flowResponse.token}`,
        },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        paymentUrl: `${flowResponse.url}?token=${flowResponse.token}`,
        token: flowResponse.token,
      });
    }
  } catch (error) {
    console.error("Payment creation error:", error);

    return NextResponse.json(
      {
        error: "PAYMENT_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create payment",
      },
      { status: 500 }
    );
  }
}
