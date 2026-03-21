import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get public server status
 * GET /api/public/servers
 */
export async function GET() {
  try {
    const servers = await prisma.serverStatus.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        ip: true,
        port: true,
        isOnline: true,
        status: true,
        lastChecked: true,
      },
    });

    return NextResponse.json({ servers });
  } catch (error) {
    console.error("Get public servers error:", error);
    return NextResponse.json({ servers: [] });
  }
}
