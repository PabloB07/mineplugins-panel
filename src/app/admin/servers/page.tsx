"use client";

import { useState, useEffect } from "react";
import { 
  Server, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Globe,
  Shield,
  Loader2
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

interface ServerStatus {
  id: string;
  name: string;
  ip: string;
  port: number;
  isOnline: boolean;
  lastChecked: string | null;
  status: string;
  isPublic: boolean;
}

export default function AdminServersPage() {
  const { t } = useTranslation();
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServer, setNewServer] = useState({ name: "", ip: "", port: "25565", isPublic: true });
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  async function fetchServers() {
    try {
      const res = await fetch("/api/admin/servers");
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

  async function addServer(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/admin/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newServer),
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setNewServer({ name: "", ip: "", port: "25565", isPublic: true });
        fetchServers();
      }
    } catch (error) {
      console.error("Failed to add server:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteServer(id: string) {
    if (!confirm("Are you sure you want to delete this server?")) return;
    
    try {
      const res = await fetch(`/api/admin/servers/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchServers();
      }
    } catch (error) {
      console.error("Failed to delete server:", error);
    }
  }

  async function togglePublic(id: string, currentPublic: boolean) {
    try {
      const res = await fetch(`/api/admin/servers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !currentPublic }),
      });
      
      if (res.ok) {
        fetchServers();
      }
    } catch (error) {
      console.error("Failed to update server:", error);
    }
  }

  async function checkServer(id: string) {
    setRefreshing(id);
    try {
      const res = await fetch(`/api/admin/servers/${id}/check`, {
        method: "POST",
      });
      
      if (res.ok) {
        fetchServers();
      }
    } catch (error) {
      console.error("Failed to check server:", error);
    } finally {
      setRefreshing(null);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
              <Server className="w-8 h-8 text-blue-400" />
              Server Status
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Manage and monitor your Minecraft server status. Display live server information on your store.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <Server className="w-4 h-4 mr-2" />
                {servers.length} Servers
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                {servers.filter(s => s.isOnline).length} Online
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            Add Server
          </button>
        </div>
      </div>

      {/* Servers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : servers.length === 0 ? (
          <div className="col-span-full bg-[#111] border border-[#222] rounded-xl p-12 text-center">
            <Server className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Servers Added</h3>
            <p className="text-gray-400 mb-6">Add your first server to display status on the homepage.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-medium transition-all"
            >
              Add First Server
            </button>
          </div>
        ) : (
          servers.map((server) => (
            <div key={server.id} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden hover:border-blue-500/30 transition-all">
              {/* Server Header */}
              <div className="p-6 border-b border-[#222] bg-[#151515]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
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
                
                {server.lastChecked && (
                  <div className="text-xs text-gray-500">
                    Last checked: {new Date(server.lastChecked).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Server Actions */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => checkServer(server.id)}
                    disabled={refreshing === server.id}
                    className="p-2 rounded-lg hover:bg-[#222] text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                    title="Check Status"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing === server.id ? "animate-spin" : ""}`} />
                  </button>
                  
                  <button
                    onClick={() => togglePublic(server.id, server.isPublic)}
                    className={`p-2 rounded-lg transition-colors ${
                      server.isPublic 
                        ? "hover:bg-green-500/10 text-green-400" 
                        : "hover:bg-gray-500/10 text-gray-500"
                    }`}
                    title={server.isPublic ? "Public (shown on homepage)" : "Private (hidden)"}
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => deleteServer(server.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete Server"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Server Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111] rounded-xl border border-[#222] w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              Add New Server
            </h2>

            <form onSubmit={addServer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Server Name *
                </label>
                <input
                  type="text"
                  required
                  value={newServer.name}
                  onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  placeholder="Main Server"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    IP Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={newServer.ip}
                    onChange={(e) => setNewServer({ ...newServer, ip: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                    placeholder="play.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={newServer.port}
                    onChange={(e) => setNewServer({ ...newServer, port: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                    placeholder="25565"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newServer.isPublic}
                  onChange={(e) => setNewServer({ ...newServer, isPublic: e.target.checked })}
                  className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-blue-500 focus:ring-blue-500/50"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-300">
                  Show on homepage (publicly visible)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-lg font-medium transition-colors border border-[#333]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Server"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
