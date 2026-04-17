import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { registerDiscountUsageOnCompletedOrder } from "@/lib/discounts";

/**
 * Find and fix stuck orders
 * POST /api/payment/fix-stuck-orders
 * 
 * This endpoint finds orders that are PENDING
 * and automatically fixes them by creating licenses
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
    const { dryRun = false, maxOrders = 10 } = body;

    console.log(`Looking for stuck PENDING orders (dryRun: ${dryRun}, maxOrders: ${maxOrders})`);

    // Find all PENDING orders
    const pendingOrders = await prisma.order.findMany({
      where: { status: "PENDING" },
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

    console.log(`Found ${pendingOrders.length} PENDING orders`);

    const stuckOrders = [];
    const fixedOrders = [];

    for (const order of pendingOrders) {
      try {
        stuckOrders.push({ order });

        if (!dryRun) {
          const { generateSimpleLicenseKey } = await import("@/lib/license");
          
          for (const item of order.items) {
            if (item.licenseId) continue;

            const licenseKey = generateSimpleLicenseKey();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + item.durationDays);

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

            await prisma.orderItem.update({
              where: { id: item.id },
              data: { licenseId: license.id },
            });

            console.log(`Created license ${license.id} for order ${order.orderNumber}`);
          }

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

          fixedOrders.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            licensesCreated: order.items.filter(item => !item.licenseId).length,
          });
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
      stuckOrders: stuckOrders.map(({ order }) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        total: order.total,
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

    // Count orders by status
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const pendingCount = await prisma.order.count({
      where: { status: "PENDING" },
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
        pendingCount,
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
