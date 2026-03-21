import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Check server status using external API
 * POST /api/admin/servers/[id]/check
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    const server = await prisma.serverStatus.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const status = await checkMinecraftServer(server.ip, server.port);

    await prisma.serverStatus.update({
      where: { id },
      data: {
        isOnline: status.online,
        lastChecked: new Date(),
        status: status.online ? "online" : "offline",
      },
    });

    return NextResponse.json({
      success: true,
      online: status.online,
      players: status.players,
      version: status.version,
      motd: status.motd,
    });
  } catch (error) {
    console.error("Check server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface ServerStatus {
  online: boolean;
  players: { online: number; max: number } | null;
  version: string | null;
  motd: string | null;
}

async function checkMinecraftServer(ip: string, port: number): Promise<ServerStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`https://api.mcsrvstat.us/3/${ip}:${port}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { online: false, players: null, version: null, motd: null };
    }

    const data = await response.json();

    if (!data.online) {
      return { online: false, players: null, version: null, motd: null };
    }

    return {
      online: true,
      players: data.players ? {
        online: data.players.online || 0,
        max: data.players.max || 0,
      } : null,
      version: data.version || null,
      motd: data.motd?.clean?.[0] || data.motd?.html?.[0] || null,
    };
  } catch (error) {
    console.error("Minecraft server check error:", error);
    return { online: false, players: null, version: null, motd: null };
  }
}

/**
 * Batch check all servers
 * POST /api/admin/servers/check-all
 */
export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const servers = await prisma.serverStatus.findMany({
      where: { isPublic: true },
    });

    const results = await Promise.all(
      servers.map(async (server) => {
        const status = await checkMinecraftServer(server.ip, server.port);
        await prisma.serverStatus.update({
          where: { id: server.id },
          data: {
            isOnline: status.online,
            lastChecked: new Date(),
            status: status.online ? "online" : "offline",
          },
        });
        return { id: server.id, name: server.name, ...status };
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Batch check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
