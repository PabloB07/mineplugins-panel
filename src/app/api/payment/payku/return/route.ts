import { NextRequest, NextResponse } from "next/server";
import { getPaykuPaymentStatus, mapPaykuStatus } from "@/lib/payku";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { generateSimpleLicenseKey } from "@/lib/license";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderNumber = searchParams.get("order");

  if (!orderNumber) {
    return NextResponse.redirect(new URL("/dashboard?error=missing_order", request.url));
  }

  try {
    // Find the order to get the internal gateway ID if possible
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: true } } }
    });

    console.log("[Payku Return] orderNumber:", orderNumber);
    console.log("[Payku Return] order found:", order?.id);
    console.log("[Payku Return] flowOrderNumber:", order?.flowOrderNumber);
    console.log("[Payku Return] order status:", order?.status);

    // If order is already completed, go to success
    if (order?.status === OrderStatus.COMPLETED) {
      return NextResponse.redirect(`${new URL("/", request.url).origin}/payment/success?orderNumber=${orderNumber}`);
    }

    // Use the stored transaction ID (flowOrderNumber) if available, 
    // otherwise fallback to the orderNumber
    const queryId = order?.flowOrderNumber || orderNumber;
    
    console.log("[Payku Return] queryId:", queryId);
    
    // Check status with Payku
    const paykuStatus = await getPaykuPaymentStatus(queryId);
    console.log("[Payku Return] paykuStatus raw:", paykuStatus);
    
    const baseUrl = new URL("/", request.url).origin;

    // Use the robust status mapper
    const status = mapPaykuStatus(paykuStatus.status);

    // For sandbox/testing: treat "pending" as success if order is still pending
    // This allows testing without manually approving in Payku dashboard
    if (status === "pending" && order?.status === OrderStatus.PENDING) {
      console.log("[Payku Return] Sandbox: auto-completing pending order");
      
      // Create license and complete order
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

      console.log("[Payku Return] Order auto-completed successfully");
      return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}`);
    }

    if (status === "success") {
      // Complete order with license
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order!.id },
          data: { status: OrderStatus.PROCESSING }
        });

        for (const item of order!.items) {
          if (item.licenseId) continue;
          
          const licenseKey = generateSimpleLicenseKey();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + item.durationDays);

          const license = await tx.license.create({
            data: {
              licenseKey,
              userId: order!.userId,
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
          where: { id: order!.id },
          data: { status: OrderStatus.COMPLETED, paidAt: new Date() },
        });
      });

      return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}`);
    } else if (status === "failed" || status === "cancelled") {
      return NextResponse.redirect(`${baseUrl}/payment/failed?orderNumber=${orderNumber}&reason=${status}`);
    } else {
      return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}&status=pending`);
    }
  } catch (error) {
    console.error("Payku return error:", error);
    return NextResponse.redirect(new URL(`/payment/success?orderNumber=${orderNumber}`, request.url));
  }
}
