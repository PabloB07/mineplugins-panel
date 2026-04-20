import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { generateSimpleLicenseKey } from "@/lib/license";
import { UserRole } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;
  return isAdmin ? session : null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    });

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    if (order.status === OrderStatus.COMPLETED) {
      return NextResponse.json({ error: "ALREADY_COMPLETED" }, { status: 400 });
    }

    // Complete order with license
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PROCESSING }
      });

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
        data: { status: OrderStatus.COMPLETED, paidAt: new Date() },
      });
    });

    return NextResponse.json({ success: true, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("[CompletePayku] Error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}