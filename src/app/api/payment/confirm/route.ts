import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlowPaymentStatus, FlowPaymentStatusCodes } from "@/lib/flow";
import { generatePaperLicenseKey } from "@/lib/license";

/**
 * Helper function to get readable status label
 */
function getFlowStatusLabel(status: number): string {
  switch (status) {
    case 1: return "Pending";
    case 2: return "Paid";
    case 3: return "Rejected";
    case 4: return "Cancelled";
    default: return "Unknown";
  }
}

/**
 * Payment confirmation webhook from Flow.cl
 * POST /api/payment/confirm
 *
 * Flow.cl sends a POST request with form data containing a 'token' parameter
 * when a payment is completed (success, rejected, or cancelled)
 */
export async function POST(request: NextRequest) {
  try {
    // Flow.cl sends form-urlencoded data
    const formData = await request.formData();
    const token = formData.get("token") as string;

    if (!token) {
      console.error("Payment confirmation: Missing token");
      return NextResponse.json(
        { error: "MISSING_TOKEN", message: "Token is required" },
        { status: 400 }
      );
    }

    console.log(`Processing payment confirmation for token: ${token}`);

    // Get payment status from Flow.cl
    const paymentStatus = await getFlowPaymentStatus(token);
    console.log("Flow payment status:", {
      flowOrder: paymentStatus.flowOrder,
      commerceOrder: paymentStatus.commerceOrder,
      status: paymentStatus.status,
      amount: paymentStatus.amount,
      currency: paymentStatus.currency,
      payer: paymentStatus.payer,
    });

    // Find order by token
    const order = await prisma.order.findUnique({
      where: { flowToken: token },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      console.error(`Order not found for token: ${token}`);
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND", message: "Order not found" },
        { status: 404 }
      );
    }

    // Check if already processed
    if (order.status === "COMPLETED") {
      console.log(`ℹ️ Order ${order.orderNumber} already completed - skipping`);
      return NextResponse.json({ received: true, status: "already_processed" });
    }

    // Process based on payment status
    if (paymentStatus.status === FlowPaymentStatusCodes.PAID) {
      // Payment successful - create license(s)
      console.log(`✅ Payment successful for order ${order.orderNumber} - Creating licenses`);

      for (const item of order.items) {
        // Generate license key
        const licenseKey = generatePaperLicenseKey(item.product.slug);

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + item.durationDays);

        // Create license
        const license = await prisma.license.create({
          data: {
            licenseKey,
            userId: order.userId,
            productId: item.productId,
            status: "ACTIVE",
            expiresAt,
            maxActivations: item.product.maxActivations,
          },
        });

        // Link license to order item
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { licenseId: license.id },
        });

        console.log(
          `✅ Created license ${license.id} (key: ${licenseKey}) for order ${order.orderNumber}`
        );
      }

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          paidAt: new Date(),
        },
      });

      // TODO: Send email with license key
      // await sendLicenseEmail(order.customerEmail, licenses);

      return NextResponse.json({
        received: true,
        status: "completed",
        orderNumber: order.orderNumber,
      });
    } else if (paymentStatus.status === FlowPaymentStatusCodes.REJECTED) {
      // Payment rejected
      console.log(`❌ Payment rejected for order ${order.orderNumber}`);

      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json({
        received: true,
        status: "rejected",
        orderNumber: order.orderNumber,
      });
    } else if (paymentStatus.status === FlowPaymentStatusCodes.CANCELLED) {
      // Payment cancelled
      console.log(`⏹️ Payment cancelled for order ${order.orderNumber}`);

      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({
        received: true,
        status: "cancelled",
        orderNumber: order.orderNumber,
      });
    } else {
      // Still pending or unknown status
      console.log(
        `⏳ Payment status ${paymentStatus.status} (${getFlowStatusLabel(paymentStatus.status)}) for order ${order.orderNumber}`
      );

      return NextResponse.json({
        received: true,
        status: "pending",
        orderNumber: order.orderNumber,
      });
    }
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
