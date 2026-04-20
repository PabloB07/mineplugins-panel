import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSimpleLicenseKey } from "@/lib/license";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { registerDiscountUsageOnCompletedOrder } from "@/lib/discounts";
import { getPaykuPaymentStatus, mapPaykuStatus } from "@/lib/payku";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");
    const orderId = searchParams.get("orderId");

    let order = null;

    if (orderNumber) {
      order = await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: { include: { product: true } } }
      });
    } else if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } }
      });
    }

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND", message: "Order not found" },
        { status: 404 }
      );
    }

    // Proactive check: If order is still pending, check with the gateway
    if (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING) {
      if (order.paymentMethod === PaymentMethod.PAYKU) {
        try {
          const queryId = order.flowOrderNumber || order.orderNumber;
          const paykuStatus = await getPaykuPaymentStatus(queryId);
          const status = mapPaykuStatus(paykuStatus.status);

          if (status === "success") {
            await completeOrder(order.id);
            // Refresh order data after completion
            const updatedOrder = await prisma.order.findUnique({
              where: { id: order.id },
              select: { id: true, orderNumber: true, status: true }
            });
            return NextResponse.json({ order: updatedOrder });
          } else if (status === "failed" || status === "cancelled") {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: OrderStatus.FAILED }
            });
            return NextResponse.json({ order: { ...order, status: OrderStatus.FAILED } });
          }
        } catch (gateError) {
          console.error("[ConfirmCheck] Payku check failed:", gateError);
        }
      }
      // Add other gateways here if needed (PayPal, Tebex, etc.)
    }

    return NextResponse.json({ 
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status
      } 
    });
  } catch (error) {
    console.error("Payment confirm error:", error);
    return NextResponse.json(
      { error: "CONFIRMATION_ERROR", message: "Failed to get order status" },
      { status: 500 }
    );
  }
}

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
