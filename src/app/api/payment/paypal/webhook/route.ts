import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { generateSimpleLicenseKey } from "@/lib/license";
import { verifyPaypalWebhookSignature } from "@/lib/paypal";
import { registerDiscountUsageOnCompletedOrder } from "@/lib/discounts";

async function activateOrderFromPaypal(params: {
  orderNumber: string;
  targetStatus: OrderStatus;
}) {
  const { orderNumber, targetStatus } = params;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) return;
    if (order.status === OrderStatus.COMPLETED) return;

    if (targetStatus !== OrderStatus.COMPLETED) {
      await tx.order.updateMany({
        where: {
          id: order.id,
          status: { in: [OrderStatus.PENDING, OrderStatus.PROCESSING] },
        },
        data: { status: targetStatus },
      });
      return;
    }

    // Claim only once to avoid double license creation if both webhook and return race.
    const claimed = await tx.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PENDING,
      },
      data: { status: OrderStatus.PROCESSING },
    });

    if (claimed.count === 0) return;

    const freshOrder = await tx.order.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!freshOrder) return;

    for (const item of freshOrder.items) {
      if (item.licenseId) continue;

      const licenseKey = generateSimpleLicenseKey();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + item.durationDays);

      const license = await tx.license.create({
        data: {
          licenseKey,
          userId: freshOrder.userId,
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
      where: { id: freshOrder.id },
      data: { status: OrderStatus.COMPLETED, paidAt: new Date() },
    });

    await registerDiscountUsageOnCompletedOrder(tx, freshOrder.id);
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    const isValid = await verifyPaypalWebhookSignature(rawBody, request.headers);
    if (!isValid) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as Record<string, unknown>;
    const eventType = String(event?.event_type || "");

    // PayPal webhook payload contains `resource` with purchase_units[].invoice_id (we set it to orderNumber)
    const resource = (event?.resource || {}) as Record<string, unknown>;
    const purchaseUnits = resource?.purchase_units as Array<Record<string, unknown>> | undefined;

    const orderNumber =
      (purchaseUnits?.[0]?.invoice_id as string | undefined) ||
      (purchaseUnits?.[0]?.reference_id as string | undefined);

    if (!orderNumber) {
      return NextResponse.json({ received: true });
    }

    if (eventType.includes("PAYMENT.CAPTURE.COMPLETED")) {
      await activateOrderFromPaypal({ orderNumber, targetStatus: OrderStatus.COMPLETED });
      return NextResponse.json({ received: true });
    }

    if (eventType.includes("PAYMENT.CAPTURE.DENIED") || eventType.includes("PAYMENT.CAPTURE.REFUSED")) {
      await activateOrderFromPaypal({ orderNumber, targetStatus: OrderStatus.FAILED });
      return NextResponse.json({ received: true });
    }

    if (eventType.includes("PAYMENT.CAPTURE.VOIDED") || eventType.includes("PAYMENT.CAPTURE.CANCELLED")) {
      await activateOrderFromPaypal({ orderNumber, targetStatus: OrderStatus.CANCELLED });
      return NextResponse.json({ received: true });
    }

    // Unhandled event types are ignored.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: "WEBHOOK_ERROR" }, { status: 500 });
  }
}
