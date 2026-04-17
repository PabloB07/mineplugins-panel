"use client";

import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface ServerInfo {
  id: string;
  name: string;
  ip: string;
  port: number;
  isOnline: boolean;
  status: string;
  lastChecked: string | null;
  online: boolean;
  players: { online: number; max: number } | null;
  version: string | null;
  motd: string | null;
  icon: string | null;
}

function parseMinecraftColors(text: string): React.ReactNode {
  const colorMap: Record<string, string> = {
    "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA",
    "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA",
    "8": "#555555", "9": "#5555FF", "a": "#55FF55", "b": "#55FFFF",
    "c": "#FF5555", "d": "#FF55FF", "e": "#FFFF55", "f": "#FFFFFF",
  };
  
  const formatMap: Record<string, string> = {
    "l": "font-bold",
    "o": "italic",
    "n": "underline",
    "m": "line-through",
    "k": "random",
    "r": "reset",
  };

  const parts: React.ReactNode[] = [];
  let currentText = "";
  let currentColor = "text-white";
  let currentFormats: string[] = [];

  const regex = /§([0-9a-fklmnor])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      currentText += text.slice(lastIndex, match.index);
    }

    if (currentText) {
      const formatClasses = currentFormats.map(f => formatMap[f] || "").join(" ");
      parts.push(
        <span key={parts.length} className={`${currentColor} ${formatClasses}`}>
          {currentText}
        </span>
      );
      currentText = "";
    }

    const code = match[1].toLowerCase();
    
    if (code === "r") {
      currentColor = "text-white";
      currentFormats = [];
    } else if (colorMap[code]) {
      currentColor = colorMap[code];
    } else if (formatMap[code]) {
      if (!currentFormats.includes(formatMap[code])) {
        currentFormats.push(formatMap[code]);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    currentText += text.slice(lastIndex);
  }

  if (currentText) {
    const formatClasses = currentFormats.map(f => formatMap[f] || "").join(" ");
    parts.push(
      <span key={parts.length} className={`${currentColor} ${formatClasses}`}>
        {currentText}
      </span>
    );
  }

  return parts.length > 0 ? parts : text;
}

export default function DashboardServersPage() {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchServers() {
    try {
      const res = await fetch("/api/public/servers");
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
      }
    } catch (error) {
      console.error("Failed to fetch servers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshServers() {
    setRefreshing(true);
    await fetchServers();
    setRefreshing(false);
  }

  useEffect(() => {
    fetchServers();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <span className="icon-minecraft icon-minecraft-grass-block scale-125"></span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Server Status
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                View our Minecraft server status and connect info
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <span className="icon-minecraft-sm icon-minecraft-emerald-block"></span>
              <span className="text-sm text-gray-400">{servers.filter(s => s.online).length} Online</span>
            </div>
            <button
              onClick={refreshServers}
              disabled={refreshing}
              className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] text-white text-sm rounded-lg font-medium transition-all flex items-center gap-2 border border-[#333] disabled:opacity-50"
            >
              <span className={`icon-minecraft-sm icon-minecraft-clock ${refreshing ? 'animate-spin' : ''}`} style={refreshing ? { filter: 'invert(1)' } : {}}></span>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : servers.length === 0 ? (
        <div className="pixel-frame pixel-frame-neutral bg-[#111] border border-[#222] rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#0a0a0a] border border-[#222] flex items-center justify-center">
            <span className="icon-minecraft icon-minecraft-grass-block opacity-50"></span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Servers Available</h3>
          <p className="text-gray-400 text-sm">There are no public servers configured.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {servers.map((server) => (
            <div
              key={server.id}
              className={`bg-[#111] border rounded-2xl overflow-hidden transition-all ${
                server.online
                  ? "bg-gradient-to-br from-[#0f1a0f] to-[#111] border-green-500/30"
                  : "bg-gradient-to-br from-[#1a0f0f] to-[#111] border-red-500/30"
              }`}
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex items-center gap-4">
                    {server.icon ? (
                      <div className="relative">
                        <img
                          src={server.icon.startsWith('data:') ? server.icon : `data:image/png;base64,${server.icon}`}
                          alt={server.name}
                          className="w-16 h-16 rounded-xl border-2 border-[#333]"
                        />
                        {server.online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#111] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center ${
                        server.online ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"
                      }`}>
                        <span className={`icon-minecraft ${server.online ? 'icon-minecraft-grass-block' : 'icon-minecraft-barrel'}`}></span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{server.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        server.online
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}>
                        {server.online ? "Online" : "Offline"}
                      </span>
                    </div>

                    {server.motd && (
                      <div className="mb-3 text-lg leading-relaxed">
                        {parseMinecraftColors(server.motd)}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="icon-minecraft-sm icon-minecraft-compass" style={{ opacity: 0.5 }}></span>
                        <code className="bg-[#0a0a0a] px-2 py-1 rounded border border-[#333]">
                          {server.ip}:{server.port}
                        </code>
                      </div>
                      
                      {server.version && (
                        <div className="text-gray-500 flex items-center gap-1">
                          <span className="icon-minecraft-sm icon-minecraft-paper" style={{ opacity: 0.5 }}></span>
                          {server.version}
                        </div>
                      )}
                    </div>
                  </div>

                  {server.online && server.players && (
                    <div className="text-center lg:text-right min-w-[100px]">
                      <div className="flex items-center justify-center lg:justify-end gap-1 mb-1">
                        <span className="icon-minecraft-sm icon-minecraft-player-head-2-sm-textures-sm" style={{ opacity: 0.5 }}></span>
                        <span className="text-2xl font-bold text-white">
                          {server.players.online}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        / {server.players.max}
                      </div>
                      <div className="mt-2 w-20 h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                          style={{
                            width: `${server.players.max > 0 
                              ? Math.min((server.players.online / server.players.max) * 100, 100) 
                              : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {!server.online && (
                    <div className="text-center lg:text-right min-w-[100px]">
                      <span className="icon-minecraft icon-minecraft-barrel opacity-50"></span>
                      <div className="text-xs text-gray-500 mt-1">Offline</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
