"use client";

import { useEffect, useState } from "react";
import { Users, Crown, Shield, Search, UserPlus } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-400" />
            User Management
          </h1>
          <p className="text-gray-400 mt-1">View and manage all users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400 bg-gray-700/50 px-3 py-2 rounded-lg">
            Total: {pagination.total} users
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
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
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:border-blue-500 transition-colors"
              />
            </div>
          </form>

          {/* Role Filter */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Filter by role:</span>
            <div className="flex gap-2">
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
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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

       {/* Users Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  User
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
            <tbody className="divide-y divide-gray-700">
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
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || user.email}
                            className="w-10 h-10 rounded-full border-2 border-gray-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {user.email[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-white text-sm font-medium">{user.email}</div>
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
                              : "bg-gray-700/50 text-gray-300 border border-gray-600/50"
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
                            className="bg-gray-700 border border-gray-600 rounded text-xs px-2 py-1 text-white focus:border-blue-500 focus:outline-none"
                          >
                            <option value="CUSTOMER">Customer</option>
                            <option value="ADMIN">Admin</option>
                            {user.role === "ADMIN" && <option value="SUPER_ADMIN">Super Admin</option>}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
