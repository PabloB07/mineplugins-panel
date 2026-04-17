import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSimpleLicenseKey } from "@/lib/license";
import { UserRole } from "@prisma/client";
import { registerDiscountUsageOnCompletedOrder } from "@/lib/discounts";

/**
 * Manual payment confirmation / debug endpoint
 * POST /api/payment/manual-confirm
 * 
 * This endpoint allows admins to manually trigger license activation
 * for orders that are stuck in PENDING status
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
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
    const { orderId, orderNumber } = body;

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: "MISSING_IDENTIFIER", message: "orderId or orderNumber is required" },
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

    const forceActivation = body.force === true;

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
              const licenseKey = generateSimpleLicenseKey();

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

    await prisma.$transaction(async (tx) => {
      await registerDiscountUsageOnCompletedOrder(tx, order.id);
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
      forced: forceActivation,
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
 * GET /api/payment/manual-confirm?orderId=xxx&orderNumber=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
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

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: "MISSING_IDENTIFIER", message: "orderId or orderNumber is required" },
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
    }

    if (!order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND", message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        user: order.user,
        items: order.items,
      },
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


