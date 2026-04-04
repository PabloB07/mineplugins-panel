import { prisma } from "@/lib/prisma";

export interface ClientNotificationPayload {
  unreadTotal: number;
  counts: {
    ticketsToReply: number;
    pendingOrders: number;
    expiringLicenses: number;
  };
}

export interface AdminNotificationPayload {
  unreadTotal: number;
  counts: {
    ticketsToRespond: number;
    pendingOrders: number;
    processingOrders: number;
  };
}

export async function getClientNotificationPayload(userId: string): Promise<ClientNotificationPayload> {
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

  return {
    unreadTotal,
    counts: {
      ticketsToReply,
      pendingOrders,
      expiringLicenses,
    },
  };
}

export async function getAdminNotificationPayload(): Promise<AdminNotificationPayload> {
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

  return {
    unreadTotal,
    counts: {
      ticketsToRespond,
      pendingOrders,
      processingOrders,
    },
  };
}
