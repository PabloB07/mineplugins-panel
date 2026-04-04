import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: ticketId } = await params;
    const body = await request.json();
    const { content, isInternal } = body;

    if (!content) {
      return NextResponse.json({ error: "MISSING_CONTENT" }, { status: 400 });
    }

    const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;

    const ticket = await prisma.supportTicket.findFirst({
      where: isAdmin
        ? { OR: [{ id: ticketId }, { ticketNumber: ticketId }] }
        : { OR: [{ id: ticketId }, { ticketNumber: ticketId }], userId: session.user.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const message = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        userId: session.user.id,
        content,
        isAdmin,
        isInternal: isInternal && isAdmin ? true : false,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    if (ticket.status === "OPEN" || ticket.status === "WAITING_REPLY") {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: isAdmin ? "IN_PROGRESS" : "WAITING_REPLY",
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Create ticket message error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
