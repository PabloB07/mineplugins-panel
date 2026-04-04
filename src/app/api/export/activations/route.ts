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
    const licenseId = searchParams.get("licenseId");
    const productId = searchParams.get("productId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    if (licenseId) where.licenseId = licenseId;
    if (productId) where.license = { productId };
    if (startDate || endDate) {
      where.firstSeenAt = {};
      if (startDate) (where.firstSeenAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.firstSeenAt as Record<string, Date>).lte = new Date(endDate);
    }

    const activations = await prisma.licenseActivation.findMany({
      where,
      include: {
        license: {
          include: {
            user: { select: { email: true, name: true } },
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { firstSeenAt: "desc" },
      take: 10000,
    });

    if (format === "json") {
      return NextResponse.json({ activations });
    }

    const headers = [
      "ID",
      "Server ID",
      "Server IP",
      "Server Name",
      "Minecraft Version",
      "Server Version",
      "Online Mode",
      "Max Players",
      "Online Players",
      "TPS",
      "Memory (MB)",
      "First Seen",
      "Last Seen",
      "Validation Count",
      "License Key",
      "Product",
      "User Email",
      "License Status",
      "License Expires",
    ];

    const rows = activations.map((a) => [
      a.id,
      a.serverId,
      a.serverIp || "",
      a.serverName || "",
      a.minecraftVersion || "",
      a.serverVersion || "",
      a.onlineMode?.toString() || "",
      a.maxPlayers?.toString() || "",
      a.onlinePlayers?.toString() || "",
      a.tps?.toString() || "",
      a.memoryUsage?.toString() || "",
      a.firstSeenAt.toISOString(),
      a.lastSeenAt.toISOString(),
      a.validationCount.toString(),
      a.license.licenseKey,
      a.license.product.name,
      a.license.user.email,
      a.license.status,
      a.license.expiresAt.toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="activations-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export activations error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
