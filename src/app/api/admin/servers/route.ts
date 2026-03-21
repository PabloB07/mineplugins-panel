import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * Get all servers
 * GET /api/admin/servers
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const servers = await prisma.serverStatus.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ servers });
  } catch (error) {
    console.error("Get servers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Create new server
 * POST /api/admin/servers
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, ip, port, isPublic } = body;

    if (!name || !ip) {
      return NextResponse.json({ error: "Name and IP are required" }, { status: 400 });
    }

    const server = await prisma.serverStatus.create({
      data: {
        name,
        ip,
        port: port ? parseInt(port) : 25565,
        isPublic: isPublic !== false,
      },
    });

    return NextResponse.json({ server });
  } catch (error) {
    console.error("Create server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
