"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useIcon } from "@/hooks/useIcon";
import { ServerStatus as ServerStatusType, ServerFormData } from "@/components/admin/servers/types";
import ServerCard from "@/components/admin/servers/ServerCard";
import ServerModal from "@/components/admin/servers/ServerModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdminServersPage() {
  const { t } = useTranslation();
  
  // Icons
  const Server = useIcon("Server");
  const Search = useIcon("Search");
  const Plus = useIcon("Plus");
  const RefreshCw = useIcon("RefreshCw");
  const Trash2 = useIcon("Trash2");
  const Clock = useIcon("Clock");
  const Eye = useIcon("Eye");
  const EyeOff = useIcon("EyeOff");

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
  
  // Search and filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline" | "public">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("serverViewMode") as "grid" | "table") || "grid";
    }
    return "grid";
  });

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    localStorage.setItem("serverAutoRefresh", String(autoRefresh));
  }, [autoRefresh]);

  useEffect(() => {
    localStorage.setItem("serverViewMode", viewMode);
  }, [viewMode]);

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

  const filteredServers = servers.filter(server => {
    const matchesSearch = search === "" || 
      server.name.toLowerCase().includes(search.toLowerCase()) ||
      server.ip.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = statusFilter === "all" ||
      (statusFilter === "online" && server.isOnline) ||
      (statusFilter === "offline" && !server.isOnline) ||
      (statusFilter === "public" && server.isPublic);
    
    return matchesSearch && matchesFilter;
  });

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
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Server className="w-8 h-8 text-[#f59e0b]" />
              {t("admin.serverManagement")}
            </h1>
            <p className="text-gray-400 mt-1">{t("admin.manageServers")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <div className="w-2 h-2 bg-[#22c55e] rounded-full mr-2"></div>
                {servers.filter(s => s.isOnline).length} {t("admin.serverOnline")}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                {servers.filter(s => !s.isOnline).length} {t("admin.serverOffline")}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <Eye className="w-4 h-4 mr-2" />
                {servers.filter(s => s.isPublic).length} {t("common.public")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="pixel-frame pixel-frame-neutral bg-[#111] rounded-xl border border-[#222] p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 lg:flex-initial lg:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.searchPlaceholder")}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#f59e0b]/50 transition-colors"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{t("admin.filterByStatus")}</span>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: t("admin.all"), icon: Server },
                { key: "online", label: t("admin.serverOnline"), icon: Eye },
                { key: "offline", label: t("admin.serverOffline"), icon: EyeOff },
                { key: "public", label: t("common.public"), icon: Eye },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key as typeof statusFilter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    statusFilter === key
                      ? "bg-[#f59e0b] text-black shadow-lg shadow-[#f59e0b]/30"
                      : "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
              className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] text-gray-300 rounded-lg text-sm font-medium transition-all border border-[#333]"
            >
              {viewMode === "grid" ? t("admin.tableView") : t("admin.gridView")}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#222]">
          <button
            onClick={checkAllServers}
            disabled={loading || servers.length === 0}
            className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-lg font-medium transition-all flex items-center gap-2 border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            {t("admin.checkAll")}
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 border ${
              autoRefresh
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-[#1a1a1a] border-[#333] text-gray-300 hover:bg-[#222]"
            }`}
          >
            <Clock className={`w-4 h-4 ${autoRefresh ? '' : 'opacity-30'}`} />
            {autoRefresh ? t("admin.autoRefreshOn") : t("admin.autoRefreshOff")}
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-[#f59e0b] hover:bg-[#d4800a] text-black rounded-lg font-bold transition-all flex items-center gap-2 ml-auto"
          >
            <Plus className="w-4 h-4" />
            {t("admin.addServer")}
          </button>
        </div>
      </div>

      {/* Selected Servers Bar */}
      {selectedServers.size > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between animate-fade-in">
          <span className="text-blue-400 font-medium flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            {t("admin.serverSelected").replace("{count}", selectedServers.size.toString())}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedServers(new Set())}
              className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] text-white text-sm rounded-lg transition-colors border border-[#333]"
            >
              {t("admin.clear")}
            </button>
            <button
              onClick={deleteSelectedServers}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors border border-red-500/30 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              {t("common.delete")}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-[#111] border border-[#222] rounded-xl p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner color="amber" />
            <p className="text-gray-400">{t("admin.loading")}</p>
          </div>
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="bg-[#111] border border-[#222] rounded-xl p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <Server className="w-16 h-16 text-gray-500" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {search || statusFilter !== "all" ? t("admin.noServersFound") : t("admin.noServersAdded")}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {search || statusFilter !== "all" ? t("admin.noServersMatch") : t("admin.noServersYet")}
              </p>
              {!search && statusFilter === "all" && (
                <button
                  onClick={openAddModal}
                  className="bg-[#f59e0b] hover:bg-[#d4800a] text-black px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t("admin.addServer")}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredServers.map((server) => (
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
      ) : (
        /* Table View */
        <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-[#222]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    <input
                      type="checkbox"
                      checked={selectedServers.size === filteredServers.length && filteredServers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-[#f59e0b] focus:ring-[#f59e0b]/50"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    {t("admin.serverName")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    {t("admin.serverAddress")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    {t("common.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    {t("admin.players")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    {t("admin.version")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    {t("admin.lastChecked")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {filteredServers.map((server) => (
                  <tr key={server.id} className="hover:bg-[#1a1a1a]/40 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedServers.has(server.id)}
                        onChange={() => toggleSelectServer(server.id)}
                        className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-[#f59e0b] focus:ring-[#f59e0b]/50"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${server.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <div className="text-white text-sm font-medium">{server.name}</div>
                          {server.isPublic && (
                            <span className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                              <Eye className="w-3 h-3" />
                              {t("common.public")}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-gray-300 bg-[#0a0a0a] border border-[#333] px-3 py-1.5 rounded-lg inline-block">
                        {server.ip}:{server.port}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        server.isOnline
                          ? "bg-green-500/15 text-green-400 border border-green-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                      }`}>
                        {server.isOnline ? t("admin.serverOnline") : t("admin.serverOffline")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {server.playersOnline ?? 0}/{server.playersMax ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {server.version || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        {server.lastChecked
                          ? new Date(server.lastChecked).toLocaleString()
                          : t("admin.never")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => checkServer(server.id)}
                          disabled={refreshing === server.id}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium px-2 py-1 rounded-lg hover:bg-blue-400/10 transition-colors disabled:opacity-50"
                          title={t("admin.checkNow")}
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshing === server.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => togglePublic(server.id, server.isPublic)}
                          className="text-yellow-400 hover:text-yellow-300 text-sm font-medium px-2 py-1 rounded-lg hover:bg-yellow-400/10 transition-colors"
                          title={server.isPublic ? t("admin.makePrivate") : t("admin.makePublic")}
                        >
                          {server.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(server)}
                          className="text-green-400 hover:text-green-300 text-sm font-medium px-2 py-1 rounded-lg hover:bg-green-400/10 transition-colors"
                          title={t("common.edit")}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteServer(server.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium px-2 py-1 rounded-lg hover:bg-red-400/10 transition-colors"
                          title={t("common.delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
