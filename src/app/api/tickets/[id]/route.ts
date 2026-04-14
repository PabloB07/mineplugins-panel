import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;

    const ticket = await prisma.supportTicket.findFirst({
      where: isAdmin 
        ? { OR: [{ id }, { ticketNumber: id }] }
        : { OR: [{ id }, { ticketNumber: id }], userId: session.user.id },
      include: {
        user: { select: { id: true, email: true, name: true, image: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        messages: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Get ticket error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, priority, assignedToId } = body;

    const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;

    const ticket = await prisma.supportTicket.findFirst({
      where: isAdmin
        ? { OR: [{ id }, { ticketNumber: id }] }
        : { OR: [{ id }, { ticketNumber: id }], userId: session.user.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (isAdmin) {
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;
      if (assignedToId !== undefined) {
        updateData.assignedToId = assignedToId || null;
        if (assignedToId && status === "OPEN") {
          updateData.status = "IN_PROGRESS";
        }
      }
      if (status === "CLOSED" || status === "RESOLVED") {
        updateData.closedAt = new Date();
      }
    } else {
      if (status === "CLOSED") {
        updateData.status = "CLOSED";
        updateData.closedAt = new Date();
      }
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
