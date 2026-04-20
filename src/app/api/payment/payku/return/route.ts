import { NextRequest, NextResponse } from "next/server";
import { getPaykuPaymentStatus } from "@/lib/payku";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderNumber = searchParams.get("order");

  if (!orderNumber) {
    return NextResponse.redirect(new URL("/dashboard?error=missing_order", request.url));
  }

  try {
    // We check the status directly with Payku to give immediate feedback if possible
    // though the webhook is the source of truth for the database.
    const paykuStatus = await getPaykuPaymentStatus(orderNumber);
    
    const baseUrl = new URL("/", request.url).origin;

    if (paykuStatus.status === "success") {
      return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}`);
    } else if (paykuStatus.status === "failed" || paykuStatus.status === "cancelled") {
      return NextResponse.redirect(`${baseUrl}/payment/failed?orderNumber=${orderNumber}&reason=${paykuStatus.status}`);
    } else {
      // Still pending or unknown, go to success page which polls the status anyway
      return NextResponse.redirect(`${baseUrl}/payment/success?orderNumber=${orderNumber}&status=pending`);
    }
  } catch (error) {
    console.error("Payku return error:", error);
    // Fallback to success page which will retry if needed
    return NextResponse.redirect(new URL(`/payment/success?orderNumber=${orderNumber}`, request.url));
  }
}
