"use client";

import { useState, useEffect } from "react";
import { 
  Server, 
  Plus, 
  Trash2, 
  CheckCircle,
  RefreshCw,
  Loader2,
  RotateCw,
  Power
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { ServerStatus as ServerStatusType, ServerFormData } from "@/components/admin/servers/types";
import ServerCard from "@/components/admin/servers/ServerCard";
import ServerModal from "@/components/admin/servers/ServerModal";

export default function AdminServersPage() {
  const { t } = useTranslation();
  const [servers, setServers] = useState<ServerStatusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerStatusType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      checkAllServers();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, servers]);

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

  async function handleSubmitForm(formData: ServerFormData) {
    setSubmitting(true);
    
    try {
      if (editingServer) {
        const res = await fetch(`/api/admin/servers/${editingServer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            ip: formData.ip,
            port: parseInt(formData.port),
            isPublic: formData.isPublic,
          }),
        });
        
        if (res.ok) {
          setShowModal(false);
          setEditingServer(null);
          fetchServers();
        }
      } else {
        const res = await fetch("/api/admin/servers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            ip: formData.ip,
            port: parseInt(formData.port),
            isPublic: formData.isPublic,
          }),
        });
        
        if (res.ok) {
          setShowModal(false);
          fetchServers();
        }
      }
    } catch (error) {
      console.error("Failed to save server:", error);
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
        setSelectedServers(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        fetchServers();
      }
    } catch (error) {
      console.error("Failed to delete server:", error);
    }
  }

  async function deleteSelectedServers() {
    if (selectedServers.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedServers.size} server(s)?`)) return;
    
    const deletePromises = Array.from(selectedServers).map(id =>
      fetch(`/api/admin/servers/${id}`, { method: "DELETE" })
    );
    
    await Promise.all(deletePromises);
    setSelectedServers(new Set());
    fetchServers();
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
        const data = await res.json();
        setServers(prev => prev.map(s => 
          s.id === id ? { 
            ...s, 
            isOnline: data.online,
            lastChecked: new Date().toISOString(),
            status: data.online ? "online" : "offline",
            playersOnline: data.players?.online,
            playersMax: data.players?.max,
            version: data.version,
            motd: data.motd,
          } : s
        ));
      }
    } catch (error) {
      console.error("Failed to check server:", error);
    } finally {
      setRefreshing(null);
    }
  }

  async function checkAllServers() {
    const checkPromises = servers.map(server => checkServer(server.id));
    await Promise.all(checkPromises);
  }

  function toggleSelectServer(id: string) {
    setSelectedServers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedServers.size === servers.length) {
      setSelectedServers(new Set());
    } else {
      setSelectedServers(new Set(servers.map(s => s.id)));
    }
  }

  function openEditModal(server: ServerStatusType) {
    setEditingServer(server);
    setShowModal(true);
  }

  function openAddModal() {
    setEditingServer(null);
    setShowModal(true);
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
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

          <div className="flex flex-wrap gap-3">
            <button
              onClick={checkAllServers}
              disabled={loading || servers.length === 0}
              className="bg-[#1a1a1a] hover:bg-[#222] text-white px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 border border-[#333]"
              title="Check all servers"
            >
              <RefreshCw className="w-5 h-5" />
              Check All
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 border ${
                autoRefresh 
                  ? "bg-green-500/10 border-green-500/30 text-green-400" 
                  : "bg-[#1a1a1a] border-[#333] text-gray-300 hover:bg-[#222]"
              }`}
              title="Auto-refresh every 30 seconds"
            >
              <Power className="w-5 h-5" />
              Auto {autoRefresh ? "ON" : "OFF"}
            </button>
            <button
              onClick={openAddModal}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              Add Server
            </button>
          </div>
        </div>
      </div>

      {selectedServers.size > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between animate-fade-in">
          <span className="text-blue-400 font-medium">
            {selectedServers.size} server(s) selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedServers(new Set())}
              className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-lg transition-colors border border-[#333]"
            >
              Clear Selection
            </button>
            <button
              onClick={deleteSelectedServers}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/30 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

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
              onClick={openAddModal}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-medium transition-all"
            >
              Add First Server
            </button>
          </div>
        ) : (
          <>
            <div className="col-span-full bg-[#0a0a0a] border border-[#222] rounded-lg p-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedServers.size === servers.length && servers.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-[#333] bg-[#1a1a1a] text-blue-500 focus:ring-blue-500/50"
              />
              <span className="text-sm text-gray-400">Select all servers</span>
            </div>
            {servers.map((server) => (
              <div key={server.id} className="relative">
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedServers.has(server.id)}
                    onChange={() => toggleSelectServer(server.id)}
                    className="w-4 h-4 rounded border-[#333] bg-[#1a1a1a] text-blue-500 focus:ring-blue-500/50"
                  />
                </div>
                <ServerCard
                  server={server}
                  isRefreshing={refreshing === server.id}
                  onRefresh={checkServer}
                  onTogglePublic={togglePublic}
                  onDelete={deleteServer}
                  onEdit={openEditModal}
                />
              </div>
            ))}
          </>
        )}
      </div>

      <ServerModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingServer(null);
        }}
        onSubmit={handleSubmitForm}
        editingServer={editingServer}
        isSubmitting={submitting}
      />
    </div>
  );
}
