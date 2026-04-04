import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const [pendingOrders, expiringLicenses, activeTickets] = await Promise.all([
      prisma.order.count({
        where: {
          userId,
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
      }),
      prisma.license.count({
        where: {
          userId,
          status: "ACTIVE",
          expiresAt: {
            gte: now,
            lte: inSevenDays,
          },
        },
      }),
      prisma.supportTicket.findMany({
        where: {
          userId,
          status: {
            in: ["OPEN", "IN_PROGRESS", "WAITING_REPLY"],
          },
        },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { isAdmin: true },
          },
        },
      }),
    ]);

    const ticketsToReply = activeTickets.filter((ticket) => ticket.messages[0]?.isAdmin).length;
    const unreadTotal = pendingOrders + expiringLicenses + ticketsToReply;

    return NextResponse.json({
      unreadTotal,
      counts: {
        ticketsToReply,
        pendingOrders,
        expiringLicenses,
      },
    });
  } catch (error) {
    console.error("Client notifications error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
