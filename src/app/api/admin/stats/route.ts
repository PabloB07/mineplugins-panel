import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const validationWindowStart = new Date();
    validationWindowStart.setUTCDate(validationWindowStart.getUTCDate() - 1);

    const revenueWindowStart = new Date();
    revenueWindowStart.setDate(revenueWindowStart.getDate() - 30);

    const [
      totalUsers,
      totalLicenses,
      activeLicenses,
      recentValidations,
      recentRevenueData,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.license.count(),
      prisma.license.count({ where: { status: "ACTIVE" } }),
      prisma.validationLog.count({
        where: { createdAt: { gte: validationWindowStart } },
      }),
      prisma.order.aggregate({
        where: { 
          status: "COMPLETED",
          paidAt: { gte: revenueWindowStart },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { total: true },
      }),
    ]);

    const servers = await prisma.serverStatus.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
    });

    const onlineServers = servers.filter(s => s.isOnline).length;
    
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    const completedTodayOrders = await prisma.order.count({
      where: {
        status: "COMPLETED",
        paidAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    const recentLicenses = await prisma.license.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        product: {
          select: {
            name: true,
            icon: true
          }
        },
      },
    });

    const validationLogs = await prisma.validationLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalLicenses,
        activeLicenses,
        recentValidations,
        totalRevenue: totalRevenue._sum.total || 0,
        recentRevenue: recentRevenueData._sum.total || 0,
        todayOrders,
        completedTodayOrders,
        onlineServers,
        totalServers: servers.length,
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
        user: { email: o.user.email },
      })),
      recentLicenses: recentLicenses.map(l => ({
        id: l.id,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
        product: { name: l.product.name, icon: l.product.icon },
        user: { email: l.user.email },
      })),
      validationLogs: validationLogs.map(v => ({
        id: v.id,
        serverId: v.serverId,
        isValid: v.isValid,
        failureReason: v.failureReason,
        createdAt: v.createdAt.toISOString(),
      })),
      servers: servers.map(s => ({
        id: s.id,
        name: s.name,
        ip: s.ip,
        port: s.port,
        isOnline: s.isOnline,
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}