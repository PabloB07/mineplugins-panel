"use client";

import { useState, useEffect } from "react";
import { Server, RefreshCw, Users, Wifi, WifiOff, Crown } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

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
  const { t } = useTranslation();
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
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
              <Server className="w-8 h-8 text-emerald-400" />
              Server Status
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              View our Minecraft server status, player counts, and connect information.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <Server className="w-4 h-4 mr-2" />
                {servers.length} Server{servers.length !== 1 ? "s" : ""}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                {servers.filter(s => s.online).length > 0 ? (
                  <Wifi className="w-4 h-4 mr-2" />
                ) : (
                  <WifiOff className="w-4 h-4 mr-2" />
                )}
                {servers.filter(s => s.online).length} Online
              </div>
            </div>
          </div>

          <button
            onClick={refreshServers}
            disabled={refreshing}
            className="bg-[#1a1a1a] hover:bg-[#222] text-white px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 border border-[#333]"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : servers.length === 0 ? (
        <div className="bg-[#111] border border-[#222] rounded-xl p-12 text-center">
          <Server className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Servers Available</h3>
          <p className="text-gray-400">There are no public servers configured at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {servers.map((server) => (
            <div
              key={server.id}
              className={`relative rounded-2xl overflow-hidden border transition-all ${
                server.online
                  ? "bg-gradient-to-br from-[#0f1a0f] to-[#111] border-emerald-500/30"
                  : "bg-gradient-to-br from-[#1a0f0f] to-[#111] border-red-500/30"
              }`}
            >
              <div className="p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex items-center gap-4">
                    {server.icon ? (
                      <div className="relative">
                        <img
                          src={server.icon.startsWith('data:') ? server.icon : `data:image/png;base64,${server.icon}`}
                          alt={server.name}
                          className="w-20 h-20 rounded-xl border-2 border-[#333] shadow-lg"
                        />
                        {server.online && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#111] flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center ${
                        server.online ? "border-emerald-500/50 bg-emerald-500/10" : "border-red-500/50 bg-red-500/10"
                      }`}>
                        <Server className={`w-10 h-10 ${server.online ? "text-emerald-400" : "text-red-400"}`} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{server.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        server.online
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
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
                        <Crown className="w-4 h-4" />
                        <code className="bg-[#0a0a0a] px-2 py-1 rounded border border-[#333]">
                          {server.ip}:{server.port}
                        </code>
                      </div>
                      
                      {server.version && (
                        <div className="text-gray-500">
                          {server.version}
                        </div>
                      )}
                    </div>
                  </div>

                  {server.online && server.players && (
                    <div className="text-center lg:text-right">
                      <div className="flex items-center justify-center lg:justify-end gap-2 mb-1">
                        <Users className="w-5 h-5 text-emerald-400" />
                        <span className="text-3xl font-bold text-white">
                          {server.players.online}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        / {server.players.max} players
                      </div>
                      <div className="mt-2 w-full lg:w-32 h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
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
                    <div className="text-center lg:text-right">
                      <WifiOff className="w-10 h-10 text-red-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">Server is offline</div>
                      {server.lastChecked && (
                        <div className="text-xs text-gray-600 mt-1">
                          Last checked: {new Date(server.lastChecked).toLocaleString()}
                        </div>
                      )}
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
