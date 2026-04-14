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

    const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;

    const ticket = await prisma.supportTicket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
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
    console.error("Get admin ticket error:", error);
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

    const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, priority, assignedToId, subject, category } = body;

    const ticket = await prisma.supportTicket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
    });

    if (!ticket) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === "CLOSED" || status === "RESOLVED") {
        updateData.closedAt = new Date();
      }
    }
    if (priority) updateData.priority = priority;
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null;
      if (assignedToId && ticket.status === "OPEN") {
        updateData.status = "IN_PROGRESS";
      }
    }
    if (subject) updateData.subject = subject;
    if (category) updateData.category = category;

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error("Update admin ticket error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;

    const ticket = await prisma.supportTicket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
    });

    if (!ticket) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    await prisma.supportTicket.delete({ where: { id: ticket.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete admin ticket error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
