import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLicenseKey } from "@/lib/license";
import { UserRole } from "@prisma/client";
import { getFlowPaymentStatus, FlowPaymentStatusCodes } from "@/lib/flow";

/**
 * Manual payment confirmation / debug endpoint
 * POST /api/payment/manual-confirm
 * 
 * This endpoint allows admins to manually trigger license activation
 * for orders that are stuck in PENDING status
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please log in" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === UserRole.ADMIN ||
      session.user.role === UserRole.SUPER_ADMIN;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, orderNumber, token } = body;

    if (!orderId && !orderNumber && !token) {
      return NextResponse.json(
        { error: "MISSING_IDENTIFIER", message: "orderId, orderNumber, or token is required" },
        { status: 400 }
      );
    }

    // Find order
    let order;
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: { product: true },
          },
        },
      });
    } else if (orderNumber) {
      order = await prisma.order.findFirst({
        where: { orderNumber },
        include: {
          user: true,
          items: {
            include: { product: true },
          },
        },
      });
    } else if (token) {
      order = await prisma.order.findUnique({
        where: { flowToken: token },
        include: {
          user: true,
          items: {
            include: { product: true },
          },
        },
      });
    }

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND", message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "Order already completed",
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
        },
      });
    }

    // Get current payment status from Flow if we have a token
    let paymentStatus;
    if (order.flowToken) {
      try {
        paymentStatus = await getFlowPaymentStatus(order.flowToken);
        console.log(`Payment status for ${order.orderNumber}:`, paymentStatus);
      } catch (error) {
        console.error("Failed to get Flow payment status:", error);
        return NextResponse.json(
          { error: "FLOW_ERROR", message: "Failed to get payment status from Flow" },
          { status: 500 }
        );
      }
    }

    // Only proceed if payment is actually paid, or if admin is forcing it
    const isPaid = paymentStatus?.status === FlowPaymentStatusCodes.PAID;
    const forceActivation = body.force === true;

    if (!isPaid && !forceActivation) {
      return NextResponse.json({
        error: "PAYMENT_NOT_PAID",
        message: "Payment is not marked as paid in Flow. Use force: true to override.",
        flowStatus: paymentStatus?.status,
        flowStatusLabel: paymentStatus ? getFlowStatusLabel(paymentStatus.status) : null,
      });
    }

    // Create licenses for all order items
    const createdLicenses = [];
    for (const item of order.items) {
      // Skip if license already exists
      if (item.licenseId) {
        const existingLicense = await prisma.license.findUnique({
          where: { id: item.licenseId },
        });
        if (existingLicense) {
          createdLicenses.push(existingLicense);
          continue;
        }
      }

      // Generate license key
      const licenseKey = generateLicenseKey({
        productId: item.product.id,
        email: order.customerEmail,
        durationDays: item.durationDays,
      });

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

      createdLicenses.push(license);
      console.log(`Created license ${license.id} for order ${order.orderNumber}`);
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "COMPLETED",
        paidAt: order.paidAt || new Date(),
      },
    });

    console.log(`Manually completed order ${order.orderNumber} with ${createdLicenses.length} licenses`);

    return NextResponse.json({
      success: true,
      message: `Order ${order.orderNumber} completed successfully`,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: "COMPLETED",
        paidAt: new Date(),
      },
      licenses: createdLicenses.map(license => ({
        id: license.id,
        licenseKey: license.licenseKey,
        status: license.status,
        expiresAt: license.expiresAt,
      })),
      flowStatus: paymentStatus?.status,
      flowStatusLabel: paymentStatus ? getFlowStatusLabel(paymentStatus.status) : null,
      forced: !isPaid,
    });

  } catch (error) {
    console.error("Manual payment confirmation error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to manually confirm payment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Get debug information for an order
 * GET /api/payment/manual-confirm?orderId=xxx&orderNumber=xxx&token=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please log in" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === UserRole.ADMIN ||
      session.user.role === UserRole.SUPER_ADMIN;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber");
    const token = searchParams.get("token");

    if (!orderId && !orderNumber && !token) {
      return NextResponse.json(
        { error: "MISSING_IDENTIFIER", message: "orderId, orderNumber, or token is required" },
        { status: 400 }
      );
    }

    // Find order
    let order;
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          items: {
            include: { 
              product: {
                select: { name: true, maxActivations: true },
              },
              license: {
                select: { 
                  id: true, 
                  licenseKey: true, 
                  status: true, 
                  expiresAt: true,
                  maxActivations: true
                },
              },
            },
          },
        },
      });
    } else if (orderNumber) {
      order = await prisma.order.findFirst({
        where: { orderNumber },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          items: {
            include: { 
              product: {
                select: { name: true, maxActivations: true },
              },
              license: {
                select: { 
                  id: true, 
                  licenseKey: true, 
                  status: true, 
                  expiresAt: true,
                  maxActivations: true
                },
              },
            },
          },
        },
      });
    } else if (token) {
      order = await prisma.order.findUnique({
        where: { flowToken: token },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          items: {
            include: { 
              product: {
                select: { name: true, maxActivations: true },
              },
              license: {
                select: { 
                  id: true, 
                  licenseKey: true, 
                  status: true, 
                  expiresAt: true,
                  maxActivations: true
                },
              },
            },
          },
        },
      });
    }

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND", message: "Order not found" },
        { status: 404 }
      );
    }

    // Get current payment status from Flow if we have a token
    let paymentStatus;
    if (order.flowToken) {
      try {
        paymentStatus = await getFlowPaymentStatus(order.flowToken);
      } catch (error) {
        console.error("Failed to get Flow payment status:", error);
        paymentStatus = { error: error instanceof Error ? error.message : String(error) };
      }
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        flowToken: order.flowToken,
        user: order.user,
        items: order.items,
      },
      flowStatus: paymentStatus,
      flowStatusLabel: paymentStatus && typeof paymentStatus.status === 'number' 
        ? getFlowStatusLabel(paymentStatus.status) 
        : null,
    });

  } catch (error) {
    console.error("Manual payment debug error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to get debug information",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

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