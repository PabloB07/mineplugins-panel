import { NextRequest, NextResponse } from "next/server";
import { getPaykuPaymentStatus, mapPaykuStatus } from "@/lib/payku";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderNumber = searchParams.get("order");

  if (!orderNumber) {
    return NextResponse.redirect(new URL("/dashboard?error=missing_order", request.url));
  }

  try {
    // Find the order to get the internal gateway ID if possible
    const order = await prisma.order.findUnique({
      where: { orderNumber }
    });

    // Use the stored transaction ID (flowOrderNumber) if available, 
    // otherwise fallback to the orderNumber
    const queryId = order?.flowOrderNumber || orderNumber;
    
    // Check status with Payku
    const paykuStatus = await getPaykuPaymentStatus(queryId);
    
    const baseUrl = new URL("/", request.url).origin;

    // Use the robust status mapper
    const status = mapPaykuStatus(paykuStatus.status);

    if (status === "success") {
      return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}`);
    } else if (status === "failed" || status === "cancelled") {
      // In Sandbox, some "failures" might just be cancelled redirects
      return NextResponse.redirect(`${baseUrl}/payment/failed?orderNumber=${orderNumber}&reason=${status}`);
    } else {
      // Default to success page for "pending", "register", or unknown statuses.
      // The success page will poll until the true status is confirmed.
      return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}&status=pending`);
    }
  } catch (error) {
    console.error("Payku return error:", error);
    // Fallback to success page which will retry or poll if needed
    return NextResponse.redirect(new URL(`/payment/success?orderNumber=${orderNumber}`, request.url));
  }
}
