import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { getFlowPaymentStatus, FlowPaymentStatusCodes } from "@/lib/flow";

/**
 * Find and fix stuck orders
 * POST /api/payment/fix-stuck-orders
 * 
 * This endpoint finds orders that are PENDING but have been paid in Flow
 * and automatically fixes them by creating licenses
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
    const { dryRun = false, maxOrders = 10 } = body;

    console.log(`Looking for stuck PENDING orders (dryRun: ${dryRun}, maxOrders: ${maxOrders})`);

    // Find all PENDING orders with flow tokens
    const pendingOrders = await prisma.order.findMany({
      where: { 
        status: "PENDING",
        flowToken: { not: null }
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        items: {
          include: { 
            product: true,
            license: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: maxOrders,
    });

    console.log(`Found ${pendingOrders.length} PENDING orders with Flow tokens`);

    const stuckOrders = [];
    const fixedOrders = [];

    for (const order of pendingOrders) {
      try {
        // Check payment status in Flow
        const paymentStatus = await getFlowPaymentStatus(order.flowToken!);
        
        console.log(`Order ${order.orderNumber}: Flow status = ${paymentStatus.status}`);

        // If paid but order is still pending, it's stuck
        if (paymentStatus.status === FlowPaymentStatusCodes.PAID) {
          stuckOrders.push({
            order,
            flowStatus: paymentStatus,
          });

          if (!dryRun) {
            // Create licenses for this order
            const { generatePaperLicenseKey } = await import("@/lib/license");
            
            for (const item of order.items) {
              // Skip if license already exists
              if (item.licenseId) continue;

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

            fixedOrders.push({
              orderId: order.id,
              orderNumber: order.orderNumber,
              licensesCreated: order.items.filter(item => !item.licenseId).length,
            });
          }
        }
      } catch (error) {
        console.error(`Error checking order ${order.orderNumber}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalPendingOrders: pendingOrders.length,
        stuckOrdersFound: stuckOrders.length,
        ordersFixed: fixedOrders.length,
        dryRun,
      },
      stuckOrders: stuckOrders.map(({ order, flowStatus }) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        total: order.total,
        flowStatus: flowStatus.status,
        items: order.items.length,
        licensesAlreadyExist: order.items.filter(item => item.licenseId).length,
      })),
      fixedOrders,
    });

  } catch (error) {
    console.error("Fix stuck orders error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to fix stuck orders",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Get statistics about stuck orders
 * GET /api/payment/fix-stuck-orders
 */
export async function GET() {
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

    // Count orders by status
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Count pending orders with and without flow tokens
    const pendingWithToken = await prisma.order.count({
      where: { 
        status: "PENDING",
        flowToken: { not: null }
      },
    });

    const pendingWithoutToken = await prisma.order.count({
      where: { 
        status: "PENDING",
        flowToken: null
      },
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { status: "PENDING" },
      include: {
        items: {
          include: { license: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Format the recent orders for response
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      total: order.total,
      flowToken: order.flowToken,
      paidAt: order.paidAt,
      itemCount: order.items.length,
      licensesCreated: order.items.filter(item => item.licenseId).length,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        byStatus: orderStats.reduce((acc, { status, _count }) => {
          acc[status] = _count.id;
          return acc;
        }, {} as Record<string, number>),
        pendingWithToken,
        pendingWithoutToken,
      },
      recentPendingOrders: formattedRecentOrders,
    });

  } catch (error) {
    console.error("Get stuck orders stats error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to get stuck orders statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}