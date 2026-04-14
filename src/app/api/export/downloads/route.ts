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
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (productId) {
      where.version = {
        productId,
      };
    }
    if (startDate || endDate) {
      where.downloadedAt = {};
      if (startDate) (where.downloadedAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.downloadedAt as Record<string, Date>).lte = new Date(endDate);
    }

    const downloads = await prisma.download.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        version: {
          select: {
            version: true,
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { downloadedAt: "desc" },
      take: 10000,
    });

    if (format === "json") {
      return NextResponse.json({ downloads });
    }

    const headers = [
      "Download ID",
      "Date",
      "User ID",
      "User Email",
      "User Name",
      "Product ID",
      "Product Name",
      "Product Slug",
      "Version",
      "IP Address",
      "User Agent",
    ];

    const rows = downloads.map((d) => [
      d.id,
      d.downloadedAt.toISOString(),
      d.user.id,
      d.user.email,
      d.user.name || "",
      d.version.product.id,
      d.version.product.name,
      d.version.product.slug,
      d.version.version,
      d.ipAddress || "",
      d.userAgent || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="downloads-history-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export downloads error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
