import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlowPaymentStatus, FlowPaymentStatusCodes } from "@/lib/flow";

/**
 * Payment return URL - user is redirected here after payment
 * GET/POST /api/payment/return?token=xxx
 *
 * This redirects user to appropriate page based on payment status
 */
export async function GET(request: NextRequest) {
  return handlePaymentReturn(request);
}

export async function POST(request: NextRequest) {
  console.log("POST request to payment return");
  return handlePaymentReturn(request);
}

async function handlePaymentReturn(request: NextRequest) {
  console.log(`Payment return ${request.method} request received`);
  
  // Handle both GET query params and POST body
  let token: string | null;
  
  if (request.method === "GET") {
    const searchParams = request.nextUrl.searchParams;
    token = searchParams.get("token");
    console.log("GET request - token from query params:", token);
  } else {
    // For POST requests, token might be in form data or JSON body
    const contentType = request.headers.get("content-type");
    console.log("POST request - content-type:", contentType);
    
    if (contentType?.includes("application/json")) {
      const body = await request.json();
      token = body.token;
      console.log("POST request - token from JSON body:", token);
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      token = formData.get("token") as string;
      console.log("POST request - token from form data:", token);
    } else {
      // Try to get from search params as fallback
      const searchParams = request.nextUrl.searchParams;
      token = searchParams.get("token");
      console.log("POST request - token from query params fallback:", token);
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://blancocl.vercel.app";

  if (!token) {
    // No token - redirect to dashboard with error
    return NextResponse.redirect(`${baseUrl}/dashboard?error=missing_token`);
  }

  try {
    // Get payment status from Flow.cl
    const paymentStatus = await getFlowPaymentStatus(token);

    // Find order
    const order = await prisma.order.findUnique({
      where: { flowToken: token },
      include: {
        items: {
          include: {
            license: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=order_not_found`);
    }

    // Redirect based on status
    switch (paymentStatus.status) {
      case FlowPaymentStatusCodes.PAID:
        // Payment successful - redirect to success page or license view
        const licenseId = order.items[0]?.license?.id;
        if (licenseId) {
          return NextResponse.redirect(
            `${baseUrl}/dashboard/licenses/${licenseId}?success=true`
          );
        }
        return NextResponse.redirect(
          `${baseUrl}/dashboard/orders/${order.id}?success=true`
        );

      case FlowPaymentStatusCodes.REJECTED:
        return NextResponse.redirect(
          `${baseUrl}/dashboard/orders/${order.id}?error=payment_rejected`
        );

      case FlowPaymentStatusCodes.CANCELLED:
        return NextResponse.redirect(
          `${baseUrl}/dashboard/orders/${order.id}?error=payment_cancelled`
        );

      case FlowPaymentStatusCodes.PENDING:
      default:
        // Still pending - redirect to order page
        return NextResponse.redirect(
          `${baseUrl}/dashboard/orders/${order.id}?status=pending`
        );
    }
  } catch (error) {
    console.error("Payment return error:", {
      error: error instanceof Error ? error.message : String(error),
      token,
      method: request.method
    });
    return NextResponse.redirect(`${baseUrl}/dashboard?error=payment_error`);
  }
}
