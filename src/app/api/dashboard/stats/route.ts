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

    const licenses = await prisma.license.findMany({
      where: { userId: session.user.id },
      include: {
        product: { select: { name: true, icon: true } },
        _count: { select: { activations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      licenses: licenses.map(l => ({
        id: l.id,
        status: l.status,
        expiresAt: l.expiresAt.toISOString(),
        createdAt: l.createdAt.toISOString(),
        product: { name: l.product.name, icon: l.product.icon },
        _count: { activations: l._count.activations },
      })),
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
        items: o.items.map(i => ({
          product: { name: i.product.name },
        })),
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}