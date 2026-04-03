"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { useIcon } from "@/hooks/useIcon";

interface Product {
  id: string;
  name: string;
  slug: string;
  apiToken: string | null;
}

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
    apiToken: string | null;
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
  const { t } = useTranslation();
  const Key = useIcon("Key");
  const User = useIcon("User");
  const CheckCircle = useIcon("CheckCircle");
  const XCircle = useIcon("XCircle");
  const AlertCircle = useIcon("AlertCircle");
  const Search = useIcon("Search");
  const Filter = useIcon("Filter");
  const ChevronLeft = useIcon("ChevronLeft");
  const ChevronRight = useIcon("ChevronRight");
  const Loader2 = useIcon("Loader2");
  const Eye = useIcon("Eye");
  const ShieldX = useIcon("ShieldX");
  const AlertTriangle = useIcon("AlertTriangle");
  
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<License | null>(null);
  const [revokeConfirmText, setRevokeConfirmText] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);
      if (productFilter !== "all") params.append("productId", productFilter);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const url = `/api/licenses?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setLicenses(data.licenses || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch licenses:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, productFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  useEffect(() => {
    fetch("/api/products?showAll=true")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [statusFilter, search, productFilter]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  async function revokeLicense(id: string) {
    try {
      setRevoking(true);
      setRevokeError(null);
      const res = await fetch(`/api/licenses/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to revoke license");
      }

      setRevokeTarget(null);
      setRevokeConfirmText("");
      fetchLicenses();
    } catch (error) {
      console.error("Failed to revoke license:", error);
      setRevokeError(
        error instanceof Error ? error.message : "Failed to revoke license"
      );
    } finally {
      setRevoking(false);
    }
  }

  const stats = {
    total: pagination.total,
    active: licenses.filter((l) => l.status === "ACTIVE").length,
    expired: licenses.filter((l) => l.status === "EXPIRED").length,
    revoked: licenses.filter((l) => l.status === "REVOKED").length,
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Key className="w-7 h-7 text-[#f59e0b]" />
              Licenses
            </h1>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-sm">
                <Key className="w-3 h-3 mr-1.5" />
                {stats.total} Total
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <CheckCircle className="w-3 h-3 mr-1.5" />
                {stats.active} Active
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <XCircle className="w-3 h-3 mr-1.5" />
                {stats.expired} Expired
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#f59e0b] text-black hover:bg-[#d97706] px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <Key className="w-5 h-5" />
            Create License
          </button>
        </div>
      </div>

      <div className="bg-[#111] rounded-xl border border-[#222] p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm font-medium">Status:</span>
        </div>
        <div className="flex gap-2">
          {["all", "ACTIVE", "EXPIRED", "SUSPENDED", "REVOKED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-[#f59e0b] text-black border border-[#f59e0b]/50"
                  : "bg-[#1a1a1a] text-gray-300 border border-[#333] hover:bg-[#222]"
              }`}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm font-medium">Product:</span>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f59e0b]/50"
          >
            <option value="all">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 w-full md:max-w-xs relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search license, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]/50"
          />
        </div>
        <div className="text-sm text-gray-400">
          {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#f59e0b] animate-spin" />
        </div>
      ) : licenses.length === 0 ? (
        <div className="bg-[#111] rounded-xl border border-[#222] p-16 text-center">
          <Key className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Licenses Found</h3>
          <p className="text-gray-400">
            {search ? "Try adjusting your search or filters." : "Create your first license."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {licenses.map((license) => {
            const isExpired = new Date() > new Date(license.expiresAt);
            const activeActivations = license.activations.filter(
              (a) => a.isActive
            ).length;

            return (
              <div
                key={license.id}
                className="bg-[#111] rounded-xl border border-[#222] p-5 hover:border-[#f59e0b]/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="cursor-pointer hover:bg-[#1a1a1a]/30 p-2 rounded-lg transition-colors"
                        onClick={() =>
                          copyToClipboard(
                            license.licenseKey,
                            `license-${license.id}`
                          )
                        }
                      >
                        <Key className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-mono text-sm truncate">
                          {copiedId === `license-${license.id}`
                            ? "Copied!"
                            : license.licenseKey}
                        </div>
                        {license.product.apiToken && (
                          <div
                            className="flex items-center gap-1 text-xs text-yellow-500 cursor-pointer hover:text-yellow-400"
                            onClick={() =>
                              copyToClipboard(
                                license.product.apiToken!,
                                `apikey-${license.id}`
                              )
                            }
                          >
                            API:{" "}
                            {copiedId === `apikey-${license.id}`
                              ? "Copied!"
                              : `${license.product.apiToken.substring(
                                  0,
                                  8
                                )}...${license.product.apiToken.slice(-4)}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-green-400" />
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

                    <div className="text-center min-w-[80px]">
                      <div className="text-xs text-gray-500">Product</div>
                      <div className="text-sm font-medium text-gray-200 flex items-center justify-center gap-2">
                        {(license.product as any).icon ? (
                          <span className={`icon-minecraft-sm ${(license.product as any).icon}`} />
                        ) : null}
                        {license.product.name}
                      </div>
                    </div>

                    <div className="text-center min-w-[80px]">
                      <div className="text-xs text-gray-500">Activations</div>
                      <div className="text-sm font-bold text-[#22c55e]">
                        {activeActivations}/{license.maxActivations}
                      </div>
                    </div>

                    <div className="text-center min-w-[100px]">
                      <div className="text-xs text-gray-500">Expires</div>
                      <div
                        className={`text-sm font-medium ${
                          isExpired ? "text-red-400" : "text-gray-200"
                        }`}
                      >
                        {new Date(license.expiresAt).toLocaleDateString()}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        license.status === "ACTIVE" && !isExpired
                          ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                          : license.status === "EXPIRED" || isExpired
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : license.status === "SUSPENDED"
                          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                          : "bg-[#181818] text-gray-300 border border-[#333]"
                      }`}
                    >
                      {license.status === "ACTIVE" && !isExpired && (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {(license.status === "EXPIRED" || isExpired) && (
                        <XCircle className="w-3 h-3" />
                      )}
                      {license.status === "SUSPENDED" && (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {isExpired && license.status === "ACTIVE"
                        ? "EXPIRED"
                        : license.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/licenses/${license.id}`}
                        className="p-2 hover:bg-blue-500/10 rounded-lg transition-all text-blue-400 hover:text-blue-300"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {license.status === "ACTIVE" && (
                        <button
                          onClick={() => {
                            setRevokeTarget(license);
                            setRevokeConfirmText("");
                            setRevokeError(null);
                          }}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-red-400 hover:text-red-300"
                          title="Revoke"
                        >
                          <ShieldX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
            className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (pagination.totalPages > 5) {
                if (pagination.page > 3) {
                  pageNum = pagination.page - 2 + i;
                }
                if (pageNum > pagination.totalPages) {
                  return null;
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: pageNum }))
                  }
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    pagination.page === pageNum
                      ? "bg-[#f59e0b] text-black"
                      : "bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={pagination.page === pagination.totalPages}
            className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {showCreateModal && (
        <CreateLicenseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchLicenses();
          }}
        />
      )}

      {revokeTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121212] border border-red-900/70 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-red-900/70 bg-red-950/20">
              <h3 className="text-lg font-semibold text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Revoke License
              </h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="text-sm text-gray-300">
                <div>
                  License:{" "}
                  <span className="font-mono text-white">
                    {revokeTarget.licenseKey.slice(0, 24)}...
                  </span>
                </div>
                <div>
                  Customer: <span className="text-white">{revokeTarget.user.email}</span>
                </div>
              </div>
              <div className="text-sm text-red-100/80">
                Type "REVOKE" to confirm:
              </div>
              <input
                value={revokeConfirmText}
                onChange={(e) => setRevokeConfirmText(e.target.value)}
                placeholder="REVOKE"
                disabled={revoking}
                className="w-full bg-[#0d0d0d] border border-red-900/70 rounded-xl px-3 py-2 text-white placeholder-red-300/40 focus:outline-none focus:border-red-500"
              />
              {revokeError && (
                <div className="text-sm text-red-300 bg-red-950/40 border border-red-900/70 rounded-xl px-3 py-2">
                  {revokeError}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setRevokeTarget(null);
                    setRevokeConfirmText("");
                    setRevokeError(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-300 border border-[#333] rounded-xl hover:bg-[#1a1a1a]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => revokeLicense(revokeTarget.id)}
                  disabled={revoking || revokeConfirmText !== "REVOKE"}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-700 hover:bg-red-600 rounded-xl disabled:bg-red-900/50"
                >
                  {revoking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldX className="w-4 h-4" />
                  )}
                  {revoking ? "Revoking..." : "Revoke License"}
                </button>
              </div>
            </div>
          </div>
        </div>
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
  const { t } = useTranslation();
  const Key = useIcon("Key");
  const Loader2 = useIcon("Loader2");
  const ShieldX = useIcon("ShieldX");
  
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
    Promise.all([fetch("/api/users"), fetch("/api/products?showAll=true")])
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
      <div className="bg-[#111] rounded-xl border border-[#222] w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-400" />
          Create License
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Customer
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
              required
            >
              <option value="">Select customer</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
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
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
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

          <div className="flex justify-end gap-4 pt-4 border-t border-[#333]">
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
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create License"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
