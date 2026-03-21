import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ServerInfo {
  online: boolean;
  players: { online: number; max: number } | null;
  version: string | null;
  motd: string | null;
  icon: string | null;
}

async function checkMinecraftServer(ip: string, port: number): Promise<ServerInfo> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(`https://api.mcsrvstat.us/3/${ip}:${port}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { online: false, players: null, version: null, motd: null, icon: null };
    }

    const data = await response.json();

    if (!data.online) {
      return { online: false, players: null, version: null, motd: null, icon: null };
    }

    return {
      online: true,
      players: data.players ? {
        online: data.players.online || 0,
        max: data.players.max || 0,
      } : null,
      version: data.version || null,
      motd: data.motd?.clean?.[0] || data.motd?.html?.[0] || null,
      icon: data.icon || null,
    };
  } catch (error) {
    console.error("Minecraft server check error:", error);
    return { online: false, players: null, version: null, motd: null, icon: null };
  }
}

/**
 * Get public server status with live data
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

    const serversWithLiveData = await Promise.all(
      servers.map(async (server) => {
        const liveData = await checkMinecraftServer(server.ip, server.port);
        return {
          ...server,
          ...liveData,
        };
      })
    );

    return NextResponse.json({ servers: serversWithLiveData });
  } catch (error) {
    console.error("Get public servers error:", error);
    return NextResponse.json({ servers: [] });
  }
}
