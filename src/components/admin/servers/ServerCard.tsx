"use client";

import { ServerStatus } from "./types";

interface ServerCardProps {
  server: ServerStatus;
  isRefreshing: boolean;
  onRefresh: (id: string) => void;
  onTogglePublic: (id: string, currentPublic: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (server: ServerStatus) => void;
  showCheckbox?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export default function ServerCard({
  server,
  isRefreshing,
  onRefresh,
  onTogglePublic,
  onDelete,
  onEdit,
  showCheckbox,
  selected,
  onSelect,
}: ServerCardProps) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden hover:border-blue-500/30 transition-all group relative">
      {showCheckbox && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="w-4 h-4 rounded border-[#333] bg-[#1a1a1a] text-blue-500 focus:ring-blue-500/50"
          />
        </div>
      )}
      
      <div className="p-5 border-b border-[#222] bg-[#151515]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              server.isOnline 
                ? "bg-green-500/20 text-green-400" 
                : "bg-red-500/20 text-red-400"
            }`}>
              {server.isOnline ? (
                <span className="icon-minecraft-sm icon-minecraft-emerald-block"></span>
              ) : (
                <span className="icon-minecraft-sm icon-minecraft-barrel"></span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{server.name}</h3>
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
        
        <div className="flex flex-wrap gap-2 text-xs">
          {server.version && (
            <div className="bg-[#0a0a0a] rounded px-2 py-1">
              <span className="text-gray-500">v</span>
              <span className="text-white ml-1 font-medium">{server.version}</span>
            </div>
          )}
          {server.playersOnline !== undefined && (
            <div className="bg-[#0a0a0a] rounded px-2 py-1">
              <span className="icon-minecraft-sm icon-minecraft-player-head-2-sm-textures-sm" style={{ opacity: 0.5 }}></span>
              <span className="text-white ml-1 font-medium">
                {server.playersOnline}/{server.playersMax}
              </span>
            </div>
          )}
        </div>
        
        {server.lastChecked && (
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <span className="icon-minecraft-sm icon-minecraft-clock" style={{ opacity: 0.5 }}></span>
            {new Date(server.lastChecked).toLocaleString()}
          </div>
        )}
      </div>

      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onRefresh(server.id)}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-[#222] text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
            title="Check Status"
          >
            <span className={`icon-minecraft-sm icon-minecraft-clock ${isRefreshing ? 'animate-spin' : ''}`} style={{ filter: isRefreshing ? 'invert(1)' : 'none' }}></span>
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
            <span className="icon-minecraft-sm icon-minecraft-compass"></span>
          </button>

          <button
            onClick={() => onEdit(server)}
            className="p-2 rounded-lg hover:bg-[#222] text-gray-400 hover:text-yellow-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Edit Server"
          >
            <span className="icon-minecraft-sm icon-minecraft-anvil"></span>
          </button>
        </div>

        <button
          onClick={() => onDelete(server.id)}
          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
          title="Delete Server"
        >
          <span className="icon-minecraft-sm icon-minecraft-tnt"></span>
        </button>
      </div>
    </div>
  );
}
