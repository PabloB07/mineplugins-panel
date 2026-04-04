import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSimpleLicenseKey } from "@/lib/license";
import { OrderStatus } from "@prisma/client";
import { capturePaypalPayment } from "@/lib/paypal";
import { registerDiscountUsageOnCompletedOrder } from "@/lib/discounts";

async function handlePaypalReturn(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://mineplugins.vercel.app";

  const token = request.nextUrl.searchParams.get("token");
  // PayPal sends `PayerID`, but capture doesn't strictly require it in REST.
  const payerId = request.nextUrl.searchParams.get("PayerID");

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/downloads?error=missing_paypal_token`);
  }

  try {
    const capture = await capturePaypalPayment(token);
    const internalOrderNumber =
      capture.purchase_units?.[0]?.invoice_id ||
      capture.purchase_units?.[0]?.reference_id ||
      null;

    if (!internalOrderNumber) {
      return NextResponse.redirect(`${baseUrl}/downloads?error=paypal_missing_invoice`);
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: internalOrderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.redirect(`${baseUrl}/downloads?error=paypal_order_not_found`);
    }

    if (order.status === OrderStatus.COMPLETED) {
      return NextResponse.redirect(`${baseUrl}/downloads?success=true`);
    }

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING,
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
        data: {
          status: OrderStatus.COMPLETED,
          paidAt: new Date(),
        },
      });

      await registerDiscountUsageOnCompletedOrder(tx, freshOrder.id);
    });

    // Find the created license to redirect properly
    const completedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            license: true,
          },
        },
      },
    });

    const licenseId = completedOrder?.items?.[0]?.license?.id;
    
    // Redirect to the license detail or downloads page
    if (licenseId) {
      return NextResponse.redirect(`${baseUrl}/dashboard/licenses/${licenseId}?success=true`);
    }
    return NextResponse.redirect(`${baseUrl}/downloads?success=true&order=${order.id}`);
  } catch (error) {
    console.error("PayPal return/capture error:", {
      token,
      payerId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(`${baseUrl}/downloads?error=paypal_capture_failed`);
  }
}

export async function GET(request: NextRequest) {
  return handlePaypalReturn(request);
}

export async function POST(request: NextRequest) {
  return handlePaypalReturn(request);
}
