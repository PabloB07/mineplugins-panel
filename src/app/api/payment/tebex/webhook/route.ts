import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processTebexWebhook, verifyTebexWebhookSignature } from "@/lib/tebex";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-signature") || "";

    if (!(await verifyTebexWebhookSignature(payload, signature))) {
      console.warn("Invalid Tebex webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(payload);

    const result = await processTebexWebhook(
      data,
      async (payment) => {
        if (payment.status !== "completed") {
          console.log("Tebex payment not completed:", payment.status);
          return;
        }

        const order = await prisma.order.findFirst({
          where: { orderNumber: payment.transactionId },
          include: { items: true },
        });

        if (!order) {
          console.error("Order not found for Tebex transaction:", payment.transactionId);
          return;
        }

        if (order.status !== "PENDING") {
          console.log("Order already processed:", order.id);
          return;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });

        for (const item of order.items) {
          await prisma.license.create({
            data: {
              userId: order.userId,
              productId: item.productId,
              order: { connect: { id: order.id } },
              licenseKey: `TBX-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
              status: "ACTIVE",
              expiresAt: new Date(Date.now() + (item.durationDays || 365) * 24 * 60 * 60 * 1000),
              maxActivations: 1,
            },
          });
        }

        console.log("Tebex payment completed for order:", order.id);
      },
      async (payment) => {
        const order = await prisma.order.findFirst({
          where: { orderNumber: payment.transactionId },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "FAILED" },
          });
        }
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tebex webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
