"use client";

import { useEffect, useState } from "react";
import { Users, Crown, Shield, Search, UserPlus, Link as LinkIcon, Ban } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  accounts: Array<{
    provider: string;
    providerAccountId: string;
  }>;
  _count: {
    licenses: number;
    orders: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search, pagination.page]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (search) params.set("search", search);
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());

      const url = `/api/users?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
  };

  async function updateUserRole(userId: string, newRole: string) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole.replace('_', ' ')}?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchUsers(); // Refresh the list
      } else {
        const data = await res.json();
        alert(`Error: ${data.message || 'Failed to update user role'}`);
      }
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert('Failed to update user role');
    }
  }

  async function revokeDiscord(userId: string) {
    if (!confirm("Are you sure you want to revoke this user's Discord connection?")) return;

    try {
      const res = await fetch(`/api/users/${userId}/discord`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`Error: ${data.message || "Failed to revoke Discord access"}`);
      }
    } catch (error) {
      console.error("Failed to revoke Discord access:", error);
      alert("Failed to revoke Discord access");
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-[#f59e0b]" />
            Customer Management
          </h1>
          <p className="text-gray-400 mt-1">View and manage all customers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400 bg-[#1a1a1a] px-3 py-2 rounded-lg border border-[#333]">
            Total: {pagination.total} customers
          </div>
        </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111] rounded-xl border border-[#222] p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 lg:flex-initial lg:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or name..."
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#f59e0b]/50 transition-colors"
              />
            </div>
          </form>

          {/* Role Filter */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Filter by role:</span>
            <div className="flex flex-wrap gap-2">
              {["all", "CUSTOMER", "ADMIN", "SUPER_ADMIN"].map((role) => {
                const icons = {
                  "all": <Users className="w-4 h-4" />,
                  "CUSTOMER": <UserPlus className="w-4 h-4" />,
                  "ADMIN": <Shield className="w-4 h-4" />,
                  "SUPER_ADMIN": <Crown className="w-4 h-4" />,
                };
                
                return (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      roleFilter === role
                        ? "bg-[#f59e0b] text-black shadow-lg shadow-[#f59e0b]/30"
                        : "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
                    }`}
                  >
                    {icons[role as keyof typeof icons]}
                    {role === "all" ? "All" : role.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] border-b border-[#222]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Licenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const discordAccount = user.accounts.find((account) => account.provider === "discord");
                  return (
                  <tr key={user.id} className="hover:bg-[#1a1a1a]/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || user.email}
                            className="w-10 h-10 rounded-full border-2 border-[#333]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
                            {user.email[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-white text-sm font-medium flex items-center gap-2">
                            {user.email}
                            {discordAccount && (
                              <span className="text-[10px] uppercase tracking-wide bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                                Discord
                              </span>
                            )}
                          </div>
                          {user.name && (
                            <div className="text-gray-400 text-xs">
                              {user.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.role === "SUPER_ADMIN" ? (
                          <Crown className="w-4 h-4 text-red-400" />
                        ) : user.role === "ADMIN" ? (
                          <Shield className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <UserPlus className="w-4 h-4 text-gray-400" />
                        )}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            user.role === "SUPER_ADMIN"
                              ? "bg-red-900/50 text-red-300 border border-red-700/50"
                              : user.role === "ADMIN"
                              ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700/50"
                              : "bg-[#1a1a1a] text-gray-300 border border-[#333]"
                          }`}
                        >
                          {user.role.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <div className="text-white text-sm font-medium">{user._count.licenses}</div>
                        <div className="text-xs text-gray-500">licenses</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <div className="text-white text-sm font-medium">{user._count.orders}</div>
                        <div className="text-xs text-gray-500">orders</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.role !== "SUPER_ADMIN" && (
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="bg-[#1a1a1a] border border-[#333] rounded text-xs px-2 py-1 text-white focus:border-[#f59e0b]/50 focus:outline-none"
                          >
                            <option value="CUSTOMER">Customer</option>
                            <option value="ADMIN">Admin</option>
                            {user.role === "ADMIN" && <option value="SUPER_ADMIN">Super Admin</option>}
                          </select>
                        )}
                        {discordAccount && (
                          <div className="flex items-center gap-2">
                            {discordAccount.providerAccountId && (
                              <a
                                href={`https://discord.com/users/${discordAccount.providerAccountId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-400/10 transition-colors"
                              >
                                <LinkIcon className="w-3 h-3" />
                                Manage
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => revokeDiscord(user.id)}
                              className="text-red-400 hover:text-red-300 text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <Ban className="w-3 h-3" />
                              Revoke
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-[#111] rounded-xl border border-[#222] p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-[#1a1a1a] text-gray-300 rounded hover:bg-[#222] border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.page;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`px-3 py-1 text-sm rounded ${
                        isActive
                          ? "bg-[#f59e0b] text-black"
                          : "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {pagination.totalPages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                      className={`px-3 py-1 text-sm rounded ${
                        pagination.page === pagination.totalPages
                          ? "bg-[#f59e0b] text-black"
                          : "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
                      }`}
                    >
                      {pagination.totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-[#1a1a1a] text-gray-300 rounded hover:bg-[#222] border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
