import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSimpleLicenseKey } from "@/lib/license";
import { OrderStatus } from "@prisma/client";
import { registerDiscountUsageOnCompletedOrder } from "@/lib/discounts";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = String(formData.get("token") || "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "MISSING_TOKEN", message: "Token is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { flowToken: token },
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND", message: "Order not found" },
        { status: 404 }
      );
    }

    await completeOrder(order.id);

    return NextResponse.json({
      received: true,
      status: "completed",
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "CONFIRMATION_ERROR", message: "Failed to process payment confirmation" },
      { status: 500 }
    );
  }
}

async function completeOrder(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: orderId,
        status: { in: [OrderStatus.PENDING, OrderStatus.PROCESSING] },
      },
      data: { status: OrderStatus.PROCESSING },
    });

    if (claimed.count === 0) return;

    const freshOrder = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
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
