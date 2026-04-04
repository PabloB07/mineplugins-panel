import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const [ticketsToRespond, pendingOrders, processingOrders] = await Promise.all([
      prisma.supportTicket.count({
        where: {
          status: {
            in: ["OPEN", "WAITING_REPLY"],
          },
        },
      }),
      prisma.order.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.order.count({
        where: {
          status: "PROCESSING",
        },
      }),
    ]);

    const unreadTotal = ticketsToRespond + pendingOrders + processingOrders;

    return NextResponse.json({
      unreadTotal,
      counts: {
        ticketsToRespond,
        pendingOrders,
        processingOrders,
      },
    });
  } catch (error) {
    console.error("Admin notifications error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
