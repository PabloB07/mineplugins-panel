import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toSafeInt } from "@/lib/security";

function generateTicketNumber() {
  const prefix = "TKT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = toSafeInt(searchParams.get("page"), { defaultValue: 1, min: 1, max: 1000 });
    const limit = toSafeInt(searchParams.get("limit"), { defaultValue: 10, min: 1, max: 50 });
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (status && status !== "all") where.status = status;

    const [total, tickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        include: {
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description, category, priority } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const ticketNumber = generateTicketNumber();

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: session.user.id,
        subject,
        description,
        category: category || "GENERAL",
        priority: priority || "MEDIUM",
        status: "OPEN",
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        userId: session.user.id,
        content: description,
        isAdmin: false,
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
