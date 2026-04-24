import { NextRequest, NextResponse } from "next/server";
import { parsePaykuCallbackRequest, verifyPaykuPayment, mapPaykuStatus, type PaykuCallbackPayload } from "@/lib/payku";
import { prisma } from "@/lib/prisma";
import { generateSimpleLicenseKey } from "@/lib/license";
import { OrderStatus } from "@prisma/client";
import { registerDiscountUsageOnCompletedOrder } from "@/lib/discounts";

export async function POST(request: NextRequest) {
  try {
    const payload = await parsePaykuCallbackRequest(request);
    const orderNumber = payload.orderId;

    if (!orderNumber) {
      return NextResponse.json({ error: "MISSING_ORDER_ID" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    const status = mapPaykuStatus(payload.status);

    if (status === "success") {
      const verification = await verifyPaykuPayment(payload, {
        orderId: order.orderNumber,
        amount: Math.round(order.totalCLP),
        email: order.customerEmail,
        currency: order.currency,
      });

      if (verification !== "VALID") {
        return NextResponse.json({ error: "INVALID_VERIFICATION" }, { status: 400 });
      }

      await handlePaykuSuccess(order.id, payload);
      return NextResponse.json({ success: true });
    }

    if (status === "failed" || status === "cancelled") {
      await handlePaykuFailed(order.id, payload);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, status: "pending" });
  } catch (error) {
    console.error("[Payku Webhook] Error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

async function handlePaykuSuccess(orderId: string, payload: PaykuCallbackPayload) {
  await prisma.$transaction(async (tx) => {
    const orderRecord = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!orderRecord || orderRecord.status === OrderStatus.COMPLETED) {
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
        flowOrderNumber: payload.transactionId ?? orderRecord.flowOrderNumber,
      },
    });

    if (claimed.count === 0) {
      return;
    }

    for (const item of orderRecord.items) {
      if (item.licenseId) continue;

      const licenseKey = generateSimpleLicenseKey();
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
        flowOrderNumber: payload.transactionId ?? orderRecord.flowOrderNumber,
      },
    });

    await registerDiscountUsageOnCompletedOrder(tx, orderRecord.id);
  });
}

async function handlePaykuFailed(orderId: string, payload: PaykuCallbackPayload) {
  await prisma.order.updateMany({
    where: {
      id: orderId,
      status: {
        in: [OrderStatus.PENDING, OrderStatus.PROCESSING],
      },
    },
    data: {
      status: OrderStatus.FAILED,
      flowOrderNumber: payload.transactionId,
    },
  });
}
