import { NextRequest, NextResponse } from "next/server";
import { verifyPaykuPayment, parsePaykuCallbackRequest, mapPaykuStatus } from "@/lib/payku";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { generateSimpleLicenseKey } from "@/lib/license";

export async function GET(request: NextRequest) {
  return handlePaykuReturn(request);
}

export async function POST(request: NextRequest) {
  return handlePaykuReturn(request);
}

async function handlePaykuReturn(request: NextRequest) {
  try {
    const payload = await parsePaykuCallbackRequest(request);
    const orderNumber =
      payload.orderId ||
      request.nextUrl.searchParams.get("order") ||
      request.nextUrl.searchParams.get("order_id");

    if (!orderNumber) {
      return NextResponse.redirect(new URL("/dashboard?error=missing_order", request.url));
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.redirect(new URL("/dashboard?error=order_not_found", request.url));
    }

    const baseUrl = new URL("/", request.url).origin;

    if (order.status === OrderStatus.COMPLETED) {
      return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}`);
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
        return NextResponse.redirect(`${baseUrl}/dashboard?error=payment_error&order=${orderNumber}`);
      }

      await prisma.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
          where: {
            id: order.id,
            status: { in: [OrderStatus.PENDING, OrderStatus.PROCESSING] },
          },
          data: {
            status: OrderStatus.PROCESSING,
            flowOrderNumber: payload.transactionId ?? order.flowOrderNumber,
          },
        });

        if (claimed.count === 0) {
          return;
        }

        for (const item of order.items) {
          if (item.licenseId) continue;

          const licenseKey = generateSimpleLicenseKey();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + item.durationDays);

          const license = await tx.license.create({
            data: {
              licenseKey,
              userId: order.userId,
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
          where: { id: order.id },
          data: {
            status: OrderStatus.COMPLETED,
            paidAt: new Date(),
            flowOrderNumber: payload.transactionId ?? order.flowOrderNumber,
          },
        });
      });

      return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}`);
    }

    if (status === "failed" || status === "cancelled") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.FAILED,
          flowOrderNumber: payload.transactionId ?? order.flowOrderNumber,
        },
      });

      return NextResponse.redirect(`${baseUrl}/payment/failed?orderNumber=${orderNumber}&reason=${status}`);
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?payment=pending&order=${orderNumber}`);
  } catch (error) {
    console.error("[Payku Return] Error:", error);
    return NextResponse.redirect(new URL("/dashboard?error=payment_error", request.url));
  }
}
