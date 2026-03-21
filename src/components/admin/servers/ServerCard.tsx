"use client";

import { ServerStatus } from "./types";
import { CheckCircle, XCircle, RefreshCw, Globe, Trash2, Edit2 } from "lucide-react";

interface ServerCardProps {
  server: ServerStatus;
  isRefreshing: boolean;
  onRefresh: (id: string) => void;
  onTogglePublic: (id: string, currentPublic: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (server: ServerStatus) => void;
}

export default function ServerCard({
  server,
  isRefreshing,
  onRefresh,
  onTogglePublic,
  onDelete,
  onEdit,
}: ServerCardProps) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden hover:border-blue-500/30 transition-all group">
      <div className="p-6 border-b border-[#222] bg-[#151515]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              server.isOnline 
                ? "bg-green-500/20 text-green-400" 
                : "bg-red-500/20 text-red-400"
            }`}>
              {server.isOnline ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{server.name}</h3>
              <p className="text-sm text-gray-400 font-mono">{server.ip}:{server.port}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            server.isOnline 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            {server.isOnline ? "Online" : "Offline"}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          {server.version && (
            <div className="bg-[#0a0a0a] rounded-lg px-2 py-1.5">
              <span className="text-gray-500">Version:</span>
              <span className="text-white ml-1 font-medium">{server.version}</span>
            </div>
          )}
          {server.playersOnline !== undefined && (
            <div className="bg-[#0a0a0a] rounded-lg px-2 py-1.5">
              <span className="text-gray-500">Players:</span>
              <span className="text-white ml-1 font-medium">
                {server.playersOnline}/{server.playersMax}
              </span>
            </div>
          )}
        </div>
        
        {server.motd && (
          <div className="mt-2 text-xs text-gray-400 bg-[#0a0a0a] rounded-lg px-2 py-1.5 truncate" title={server.motd}>
            {server.motd}
          </div>
        )}
        
        {server.lastChecked && (
          <div className="text-xs text-gray-500 mt-2">
            Last checked: {new Date(server.lastChecked).toLocaleString()}
          </div>
        )}
      </div>

      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRefresh(server.id)}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-[#222] text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
            title="Check Status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          
          <button
            onClick={() => onTogglePublic(server.id, server.isPublic)}
            className={`p-2 rounded-lg transition-colors ${
              server.isPublic 
                ? "hover:bg-green-500/10 text-green-400" 
                : "hover:bg-gray-500/10 text-gray-500"
            }`}
            title={server.isPublic ? "Public (shown on homepage)" : "Private (hidden)"}
          >
            <Globe className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(server)}
            className="p-2 rounded-lg hover:bg-[#222] text-gray-400 hover:text-yellow-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Edit Server"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onDelete(server.id)}
          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
          title="Delete Server"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
