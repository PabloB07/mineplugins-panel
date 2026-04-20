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
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: true } } }
    });

    console.log("[Payku Return] orderNumber:", orderNumber);
    console.log("[Payku Return] order found:", order?.id);
    console.log("[Payku Return] flowOrderNumber:", order?.flowOrderNumber);
    console.log("[Payku Return] order status:", order?.status);

    if (!order) {
      return NextResponse.redirect(new URL("/dashboard?error=order_not_found", request.url));
    }

    // If order is already completed, go to success
    if (order.status === OrderStatus.COMPLETED) {
      return NextResponse.redirect(`${new URL("/", request.url).origin}/payment/success?orderNumber=${orderNumber}`);
    }

    const queryId = order.flowOrderNumber || orderNumber;
    console.log("[Payku Return] queryId being used:", queryId);
    console.log("[Payku Return] order.flowOrderNumber from DB:", order.flowOrderNumber);
    
    const paykuStatus = await getPaykuPaymentStatus(queryId);
    console.log("[Payku Return] paykuStatus raw:", JSON.stringify(paykuStatus));
    console.log("[Payku Return] Raw API response - checking...");
    
    // If pending in sandbox, wait 2s and retry once
    if (paykuStatus.status === "pending") {
      console.log("[Payku Return] First check was pending, waiting and retrying...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retryStatus = await getPaykuPaymentStatus(queryId);
      console.log("[Payku Return] Retry status:", JSON.stringify(retryStatus));
      if (retryStatus.status !== "pending") {
        console.log("[Payku Return] Retry succeeded, using new status");
        paykuStatus.status = retryStatus.status;
      }
    }
    console.log("[Payku Return] paykuStatus.status:", paykuStatus.status);
    console.log("[Payku Return] paykuStatus.amount:", paykuStatus.amount);
    console.log("[Payku Return] paykuStatus.currency:", paykuStatus.currency);
    
    const baseUrl = new URL("/", request.url).origin;
    const status = mapPaykuStatus(paykuStatus.status);

    console.log("[Payku Return] Mapped status:", status);

    if (status === "success") {
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

      console.log("[Payku Return] Order completed successfully");
      return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}`);
    } 
    
    if (status === "failed" || status === "cancelled") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED }
      });
      return NextResponse.redirect(`${baseUrl}/payment/failed?orderNumber=${orderNumber}&reason=${status}`);
    }

    // Pending - show pending UI
    return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}&status=pending`);
    
  } catch (error) {
    console.error("Payku return error:", error);
    return NextResponse.redirect(new URL(`/payment/success?orderNumber=${orderNumber}`, request.url));
  }
}
