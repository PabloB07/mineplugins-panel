"use client";

import { useState, useEffect } from "react";
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
  const [autoRefresh, setAutoRefresh] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("serverAutoRefresh") === "true";
    }
    return false;
  });
  const [lastLicenseValidation, setLastLicenseValidation] = useState<string | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    localStorage.setItem("serverAutoRefresh", String(autoRefresh));
  }, [autoRefresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      checkAllServers();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, servers]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    function connectSSE() {
      eventSource = new EventSource("/api/admin/events");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "license_validated") {
            if (data.licenseId !== lastLicenseValidation) {
              setLastLicenseValidation(data.licenseId);
              if (!autoRefresh) {
                setAutoRefresh(true);
              }
              checkAllServers();
            }
          }
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        setTimeout(connectSSE, 5000);
      };
    }

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, [autoRefresh, lastLicenseValidation]);

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
    <div className="space-y-6 pb-10">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <span className="icon-minecraft icon-minecraft-grass-block scale-125"></span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Server Status
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Manage and monitor your Minecraft servers
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-400">{servers.filter(s => s.isOnline).length} Online</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-sm text-gray-400">{servers.filter(s => !s.isOnline).length} Offline</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-[#222]">
          <button
            onClick={checkAllServers}
            disabled={loading || servers.length === 0}
            className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-lg font-medium transition-all flex items-center gap-2 border border-[#333] disabled:opacity-50"
          >
            <span className="icon-minecraft-sm icon-minecraft-clock"></span>
            Check All
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 border ${
              autoRefresh 
                ? "bg-green-500/10 border-green-500/30 text-green-400" 
                : "bg-[#1a1a1a] border-[#333] text-gray-300 hover:bg-[#222]"
            }`}
          >
            <span className={`icon-minecraft-sm ${autoRefresh ? 'icon-minecraft-clock' : 'icon-minecraft-clock'}`} style={{ opacity: autoRefresh ? 1 : 0.3 }}></span>
            Auto {autoRefresh ? "ON" : "OFF"}
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-all flex items-center gap-2 ml-auto"
          >
            <span className="icon-minecraft-sm icon-minecraft-green-stone-button"></span>
            Add Server
          </button>
        </div>
      </div>

      {selectedServers.size > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
          <span className="text-blue-400 font-medium">
            {selectedServers.size} server(s) selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedServers(new Set())}
              className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] text-white text-sm rounded-lg transition-colors border border-[#333]"
            >
              Clear
            </button>
            <button
              onClick={deleteSelectedServers}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors border border-red-500/30 flex items-center gap-1"
            >
              <span className="icon-minecraft-sm icon-minecraft-barrel"></span>
              Delete
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : servers.length === 0 ? (
        <div className="bg-[#111] border border-[#222] rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#0a0a0a] border border-[#222] flex items-center justify-center">
            <span className="icon-minecraft icon-minecraft-grass-block opacity-50"></span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Servers Added</h3>
          <p className="text-gray-400 text-sm mb-6">Add your first server to display status.</p>
          <button
            onClick={openAddModal}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            Add First Server
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              isRefreshing={refreshing === server.id}
              onRefresh={checkServer}
              onTogglePublic={togglePublic}
              onDelete={deleteServer}
              onEdit={openEditModal}
              showCheckbox
              selected={selectedServers.has(server.id)}
              onSelect={() => toggleSelectServer(server.id)}
            />
          ))}
        </div>
      )}

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
