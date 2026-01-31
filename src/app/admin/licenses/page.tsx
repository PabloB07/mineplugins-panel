"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Key,
  User,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter
} from "lucide-react";

interface License {
  id: string;
  licenseKey: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  lastValidatedAt: string | null;
  maxActivations: number;
  product: {
    name: string;
    slug: string;
  };
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  activations: Array<{
    id: string;
    isActive: boolean;
  }>;
  _count: {
    activations: number;
  };
}

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchLicenses();
  }, [filter, search, pagination.page]);

  async function fetchLicenses() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (search) params.append("search", search);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      
      const url = `/api/licenses?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setLicenses(data.licenses || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch licenses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function revokeLicense(id: string) {
    if (!confirm("Are you sure you want to revoke this license?")) return;

    try {
      const res = await fetch(`/api/licenses/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchLicenses();
      }
    } catch (error) {
      console.error("Failed to revoke license:", error);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Hero - Gradient Background */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
              <Key className="w-8 h-8 text-[#f59e0b]" />
              License Management
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Manage all licenses in the system. Monitor status, activations, and user assignments.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-sm">
                <Key className="w-4 h-4 mr-2" />
                {licenses.length} Total Licenses
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                {licenses.filter(l => l.status === 'ACTIVE').length} Active
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <User className="w-4 h-4 mr-2" />
                {new Set(licenses.map(l => l.user.id)).size} Users
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#f59e0b] text-black hover:bg-[#d97706] px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#f59e0b]/20"
            >
              <Shield className="w-5 h-5" />
              Create License
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111] rounded-xl border border-[#222] p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm font-medium">Status:</span>
          </div>
          <div className="flex gap-2">
            {["all", "ACTIVE", "EXPIRED", "SUSPENDED", "REVOKED"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filter === status
                      ? "bg-blue-500 text-white border border-blue-500/50 shadow-lg shadow-blue-500/20"
                      : "bg-[#1a1a1a] text-gray-300 border border-[#333] hover:bg-[#222] hover:border-[#444]"
                  }`}
                >
                  {status === "all" ? "All Licenses" : status}
                </button>
              )
            )}
          </div>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by license key, email, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] border-b border-[#222]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  License Key
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Activations
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent mx-auto"></div>
                      <span>Loading licenses...</span>
                    </div>
                  </td>
                </tr>
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-4">
                      <Key className="w-16 h-16 text-gray-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Licenses Found</h3>
                        <p className="text-gray-500">No licenses match your current filters.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                licenses.map((license) => {
                  const isExpired = new Date() > new Date(license.expiresAt);
                  const activeActivations = license.activations.filter(
                    (a) => a.isActive
                  ).length;

                  return (
                    <tr key={license.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                            <User className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">
                              {license.user.email}
                            </div>
                            {license.user.name && (
                              <div className="text-gray-400 text-xs">
                                {license.user.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white text-sm">
                          {license.user.email}
                        </div>
                        {license.user.name && (
                          <div className="text-gray-400 text-xs">
                            {license.user.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Key className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300 text-sm font-medium">{license.product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            license.status === "ACTIVE" && !isExpired
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : license.status === "EXPIRED" || isExpired
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : license.status === "SUSPENDED"
                              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                               : "bg-gray-700/50 text-gray-300 border border-[#333]"
                          }`}
                        >
                          {license.status === "ACTIVE" && !isExpired && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {license.status === "EXPIRED" || isExpired && (
                            <XCircle className="w-3 h-3" />
                          )}
                          {license.status === "SUSPENDED" && (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {isExpired && license.status === "ACTIVE"
                            ? "EXPIRED"
                            : license.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-gray-400" />
                          <div className="text-gray-300 text-sm font-medium">
                            {activeActivations} / {license.maxActivations}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div className="text-gray-300 text-sm">
                            {new Date(license.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/licenses/${license.id}`}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-400/10 transition-colors border border-transparent hover:border-blue-400/20"
                          >
                            View
                          </Link>
                          {license.status === "ACTIVE" && (
                            <button
                              onClick={() => revokeLicense(license.id)}
                              className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors border border-transparent hover:border-red-400/20"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-[#111] rounded-xl border border-[#222] p-6 mt-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} licenses
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#222] border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.page;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-blue-500 text-white border border-blue-500/50 shadow-lg shadow-blue-500/20"
                          : "bg-[#1a1a1a] text-gray-300 border border-[#333] hover:bg-[#222] hover:border-[#444]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {pagination.totalPages > 5 && (
                  <>
                    <span className="text-gray-500 px-2">...</span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                      className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                        pagination.page === pagination.totalPages
                          ? "bg-blue-500 text-white border border-blue-500/50 shadow-lg shadow-blue-500/20"
                          : "bg-[#1a1a1a] text-gray-300 border border-[#333] hover:bg-[#222] hover:border-[#444]"
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
                className="px-4 py-2 text-sm bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#222] border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create License Modal */}
      {showCreateModal && (
        <CreateLicenseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchLicenses();
          }}
        />
      )}
    </div>
  );
}

function CreateLicenseModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [durationDays, setDurationDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [products, setProducts] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    // Fetch users and products
    Promise.all([fetch("/api/users"), fetch("/api/products")])
      .then(async ([usersRes, productsRes]) => {
        const usersData = await usersRes.json();
        const productsData = await productsRes.json();
        setUsers(usersData.users || []);
        setProducts(productsData.products || []);
        if (productsData.products?.length > 0) {
          setSelectedProductId(productsData.products[0].id);
        }
      })
      .catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          productId: selectedProductId,
          durationDays,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create license");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111] rounded-xl border border-[#222] w-full max-w-md p-6 shadow-2xl shadow-black/50">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Create New License
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              required
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              required
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Duration (days)
            </label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value))}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              min={1}
              max={3650}
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t border-[#333]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedUserId || !selectedProductId}
              className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create License"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
