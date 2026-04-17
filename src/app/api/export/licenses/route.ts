import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
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
    const productId = searchParams.get("productId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") where.status = status;
    if (productId) where.productId = productId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    const licenses = await prisma.license.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    if (format === "json") {
      return NextResponse.json({ licenses });
    }

    const headers = [
      "ID",
      "License Key",
      "Status",
      "Product",
      "User Email",
      "User Name",
      "Max Activations",
      "Created At",
      "Expires At",
      "Last Validated",
    ];

    const rows = licenses.map((l) => [
      l.id,
      l.licenseKey,
      l.status,
      l.product.name,
      l.user.email,
      l.user.name || "",
      l.maxActivations.toString(),
      l.createdAt.toISOString(),
      l.expiresAt.toISOString(),
      l.lastValidatedAt?.toISOString() || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="licenses-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export licenses error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
