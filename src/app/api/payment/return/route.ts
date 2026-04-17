import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  return handlePaymentReturn(request);
}

export async function POST(request: NextRequest) {
  return handlePaymentReturn(request);
}

async function handlePaymentReturn(request: NextRequest) {
  let token: string | null;
  
  if (request.method === "GET") {
    const searchParams = request.nextUrl.searchParams;
    token = searchParams.get("token");
  } else {
    const contentType = request.headers.get("content-type");
    
    if (contentType?.includes("application/json")) {
      const body = await request.json();
      token = body.token;
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      token = formData.get("token") as string;
    } else {
      const searchParams = request.nextUrl.searchParams;
      token = searchParams.get("token");
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://mineplugins.vercel.app";
  token = typeof token === "string" ? token.trim().slice(0, 255) : null;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/dashboard?error=missing_token`);
  }

  try {
    const order = await prisma.order.findUnique({
      where: { flowToken: token },
      include: {
        items: { include: { license: true } },
      },
    });

    if (!order) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=order_not_found`);
    }

    if (order.status === "COMPLETED") {
      const licenseId = order.items[0]?.license?.id;
      if (licenseId) {
        return NextResponse.redirect(`${baseUrl}/dashboard/licenses/${licenseId}?success=true`);
      }
      return NextResponse.redirect(`${baseUrl}/dashboard/orders/${order.id}?success=true`);
    }

    if (order.status === "FAILED") {
      return NextResponse.redirect(`${baseUrl}/dashboard/orders/${order.id}?error=payment_rejected`);
    }

    if (order.status === "CANCELLED") {
      return NextResponse.redirect(`${baseUrl}/dashboard/orders/${order.id}?error=payment_cancelled`);
    }

    return NextResponse.redirect(`${baseUrl}/dashboard/orders/${order.id}?status=pending`);
  } catch (error) {
    console.error("Payment return error:", error);
    return NextResponse.redirect(`${baseUrl}/dashboard?error=payment_error`);
  }
}
