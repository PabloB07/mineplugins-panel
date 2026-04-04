import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const isAdmin = session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv";
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
        items: {
          include: {
            product: { select: { name: true } },
            license: { select: { licenseKey: true } },
          },
        },
        discountCode: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    if (format === "json") {
      return NextResponse.json({ orders });
    }

    const headers = [
      "Order Number",
      "Status",
      "Payment Method",
      "Customer Email",
      "Customer Name",
      "Subtotal",
      "Discount",
      "Total",
      "Currency",
      "Created At",
      "Paid At",
      "Discount Code",
      "Products",
      "License Keys",
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      o.status,
      o.paymentMethod,
      o.customerEmail,
      o.customerName || "",
      o.subtotal.toString(),
      o.discount.toString(),
      o.total.toString(),
      o.currency,
      o.createdAt.toISOString(),
      o.paidAt?.toISOString() || "",
      o.discountCode?.code || "",
      o.items.map((i) => i.product.name).join("; "),
      o.items.map((i) => i.license?.licenseKey || "").join("; "),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export orders error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
