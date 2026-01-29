"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">License Management</h1>
          <p className="text-gray-400 mt-1">
            Manage all licenses in the system
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create License
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-gray-400 text-sm">Filter by status:</span>
          <div className="flex gap-2">
            {["all", "ACTIVE", "EXPIRED", "SUSPENDED", "REVOKED"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {status === "all" ? "All" : status}
                </button>
              )
            )}
          </div>
          <div className="flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              placeholder="Search by license key, email, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  License Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Activations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No licenses found
                  </td>
                </tr>
              ) : (
                licenses.map((license) => {
                  const isExpired = new Date() > new Date(license.expiresAt);
                  const activeActivations = license.activations.filter(
                    (a) => a.isActive
                  ).length;

                  return (
                    <tr key={license.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-green-400 text-sm">
                            {license.licenseKey.substring(0, 16)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(license.licenseKey)}
                            className="text-gray-400 hover:text-white"
                            title="Copy license key"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
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
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {license.product.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            license.status === "ACTIVE" && !isExpired
                              ? "bg-green-900 text-green-300"
                              : license.status === "EXPIRED" || isExpired
                              ? "bg-red-900 text-red-300"
                              : license.status === "SUSPENDED"
                              ? "bg-yellow-900 text-yellow-300"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {isExpired && license.status === "ACTIVE"
                            ? "EXPIRED"
                            : license.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {activeActivations} / {license.maxActivations}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(license.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/licenses/${license.id}`}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View
                          </Link>
                          {license.status === "ACTIVE" && (
                            <button
                              onClick={() => revokeLicense(license.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
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
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} licenses
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Create New License
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
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
            <label className="block text-gray-400 text-sm mb-1">Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
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
            <label className="block text-gray-400 text-sm mb-1">
              Duration (days)
            </label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              min={1}
              max={3650}
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedUserId || !selectedProductId}
              className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? "Creating..." : "Create License"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
