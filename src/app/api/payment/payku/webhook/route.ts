import { NextRequest, NextResponse } from "next/server";
import { verifyPaykuWebhookSignature, processPaykuWebhook, PaykuPaymentStatus } from "@/lib/payku";
import { prisma } from "@/lib/prisma";
import { generateLicenseKey } from "@/lib/license";

/**
 * Webhook endpoint for Payku payment notifications
 * POST /api/payment/payku/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-payku-signature");

    console.log("Payku webhook received:", {
      signature: signature,
      body: body
    });

    if (!signature) {
      console.error("Payku webhook: Missing signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    if (!verifyPaykuWebhookSignature(body, signature)) {
      console.error("Payku webhook: Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const { evento: event = body.evento, data = body.data || body } = body;

    // Process webhook events
    const result = await processPaykuWebhook(
      body,
      signature,
      async (paymentData) => {
        // Handle successful payment
        await handlePaykuSuccess(paymentData);
      },
      async (paymentData) => {
        // Handle failed payment
        await handlePaykuFailed(paymentData);
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payku webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handlePaykuSuccess(paymentData: PaykuPaymentStatus) {
  console.log("Handling Payku success webhook:", paymentData);

  const { orden: order = paymentData.orden || paymentData.order, estado: status = paymentData.estado || paymentData.status } = paymentData;

  if (!order) {
    console.error("No order number found in webhook data:", paymentData);
    return;
  }

  // Find the order
  const orderRecord = await prisma.order.findUnique({
    where: { orderNumber: order },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true, // Include user data for license creation
    },
  });

  if (!orderRecord) {
    console.error(`Payku success: Order ${order} not found`);
    return;
  }

  if (orderRecord.status === "COMPLETED") {
    console.log(`Payku success: Order ${order} already processed`);
    return;
  }

  // Create licenses for all order items
  for (const item of orderRecord.items) {
    // Generate license key
    const licenseKey = generateLicenseKey({
      productId: item.productId,
      email: orderRecord.user.email,
      durationDays: item.durationDays,
    });

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + item.durationDays);

    // Create license
    const license = await prisma.license.create({
      data: {
        licenseKey,
        userId: orderRecord.userId,
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
      `✅ Created license ${license.id} (key: ${licenseKey}) for order ${orderRecord.orderNumber}`
    );
  }

  // Update order status
  await prisma.order.update({
    where: { id: orderRecord.id },
    data: {
      status: "COMPLETED",
      paidAt: new Date(),
    },
  });

  console.log(`Payku success: Order ${order} processed successfully`);
}

async function handlePaykuFailed(paymentData: PaykuPaymentStatus) {
  const { order, status } = paymentData;

  // Find and update the order
  const orderRecord = await prisma.order.findUnique({
    where: { orderNumber: order },
  });

  if (!orderRecord) {
    console.error(`Payku failed: Order ${order} not found`);
    return;
  }

  if (orderRecord.status === "FAILED") {
    console.log(`Payku failed: Order ${order} already marked as failed`);
    return;
  }

  // Update order status to failed
  await prisma.order.update({
    where: { id: orderRecord.id },
    data: {
      status: "FAILED",
    },
  });

  console.log(`Payku failed: Order ${order} marked as failed`);
}