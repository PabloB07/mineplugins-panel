import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");
    const orderId = searchParams.get("orderId");

    const order = orderNumber
      ? await prisma.order.findUnique({
          where: { orderNumber },
          select: { id: true, orderNumber: true, status: true },
        })
      : orderId
        ? await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, orderNumber: true, status: true },
          })
        : null;

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND", message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Payment confirm error:", error);
    return NextResponse.json(
      { error: "CONFIRMATION_ERROR", message: "Failed to get order status" },
      { status: 500 }
    );
  }
}
