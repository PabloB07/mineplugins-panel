import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlowPaymentStatus, FlowPaymentStatusCodes } from "@/lib/flow";
import { generatePaperLicenseKey } from "@/lib/license";
import { OrderStatus } from "@prisma/client";

/**
 * Helper function to get readable status label
 */
function getFlowStatusLabel(status: number): string {
  switch (status) {
    case 1:
      return "Pending";
    case 2:
      return "Paid";
    case 3:
      return "Rejected";
    case 4:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

/**
 * Payment confirmation webhook from Flow.cl
 * POST /api/payment/confirm
 */
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

    const paymentStatus = await getFlowPaymentStatus(token);

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

    if (paymentStatus.status === FlowPaymentStatusCodes.PAID) {
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
          where: {
            id: order.id,
            status: {
              in: [OrderStatus.PENDING, OrderStatus.PROCESSING],
            },
          },
          data: { status: OrderStatus.PROCESSING },
        });

        if (claimed.count === 0) {
          return;
        }

        const freshOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            items: {
              include: { product: true },
            },
          },
        });

        if (!freshOrder) {
          return;
        }

        for (const item of freshOrder.items) {
          if (item.licenseId) {
            continue;
          }

          const licenseKey = generatePaperLicenseKey(item.product.slug);
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
          data: {
            status: OrderStatus.COMPLETED,
            paidAt: new Date(),
          },
        });
      });

      return NextResponse.json({
        received: true,
        status: "completed",
        orderNumber: order.orderNumber,
      });
    }

    if (paymentStatus.status === FlowPaymentStatusCodes.REJECTED) {
      await prisma.order.updateMany({
        where: {
          id: order.id,
          status: {
            in: [OrderStatus.PENDING, OrderStatus.PROCESSING],
          },
        },
        data: { status: OrderStatus.FAILED },
      });

      return NextResponse.json({
        received: true,
        status: "rejected",
        orderNumber: order.orderNumber,
      });
    }

    if (paymentStatus.status === FlowPaymentStatusCodes.CANCELLED) {
      await prisma.order.updateMany({
        where: {
          id: order.id,
          status: {
            in: [OrderStatus.PENDING, OrderStatus.PROCESSING],
          },
        },
        data: { status: OrderStatus.CANCELLED },
      });

      return NextResponse.json({
        received: true,
        status: "cancelled",
        orderNumber: order.orderNumber,
      });
    }

    return NextResponse.json({
      received: true,
      status: "pending",
      statusLabel: getFlowStatusLabel(paymentStatus.status),
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);

    return NextResponse.json(
      {
        error: "CONFIRMATION_ERROR",
        message: "Failed to process payment confirmation",
      },
      { status: 500 }
    );
  }
}
