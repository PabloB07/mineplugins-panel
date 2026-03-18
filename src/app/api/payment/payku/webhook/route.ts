import { NextRequest, NextResponse } from "next/server";
import {
  verifyPaykuWebhookSignature,
  processPaykuWebhook,
  PaykuPaymentStatus,
} from "@/lib/payku";
import { prisma } from "@/lib/prisma";
import { generatePaperLicenseKey } from "@/lib/license";
import { OrderStatus } from "@prisma/client";

/**
 * Webhook endpoint for Payku payment notifications
 * POST /api/payment/payku/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-payku-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    if (!verifyPaykuWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const result = await processPaykuWebhook(
      body,
      async (paymentData) => {
        await handlePaykuSuccess(paymentData);
      },
      async (paymentData) => {
        await handlePaykuFailed(paymentData);
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payku webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handlePaykuSuccess(paymentData: PaykuPaymentStatus) {
  const orderNumber = paymentData.orden || paymentData.order;
  if (!orderNumber) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const orderRecord = await tx.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!orderRecord) {
      return;
    }

    if (orderRecord.status === OrderStatus.COMPLETED) {
      return;
    }

    const claimed = await tx.order.updateMany({
      where: {
        id: orderRecord.id,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.PROCESSING],
        },
      },
      data: {
        status: OrderStatus.PROCESSING,
      },
    });

    if (claimed.count === 0) {
      return;
    }

    for (const item of orderRecord.items) {
      if (item.licenseId) {
        continue;
      }

      const licenseKey = generatePaperLicenseKey(item.product.slug);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + item.durationDays);

      const license = await tx.license.create({
        data: {
          licenseKey,
          userId: orderRecord.userId,
          productId: item.productId,
          status: "ACTIVE",
          expiresAt,
          maxActivations: item.product.maxActivations,
        },
      });

      await tx.orderItem.update({
        where: { id: item.id },
        data: { licenseId: license.id },
      });
    }

    await tx.order.update({
      where: { id: orderRecord.id },
      data: {
        status: OrderStatus.COMPLETED,
        paidAt: orderRecord.paidAt || new Date(),
      },
    });
  });
}

async function handlePaykuFailed(paymentData: PaykuPaymentStatus) {
  const orderNumber = paymentData.orden || paymentData.order;
  if (!orderNumber) {
    return;
  }

  await prisma.order.updateMany({
    where: {
      orderNumber,
      status: {
        in: [OrderStatus.PENDING, OrderStatus.PROCESSING],
      },
    },
    data: {
      status: OrderStatus.FAILED,
    },
  });
}
