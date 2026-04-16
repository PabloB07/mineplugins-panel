"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { useIcon } from "@/hooks/useIcon";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  total: number;
  totalUSD: number | null;
  totalCLP: number;
  subtotal: number;
  discount: number;
  createdAt: string;
  paidAt: string | null;
  customerEmail: string;
  customerName: string | null;
  flowToken: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  items: Array<{
    id: string;
    productId: string;
    durationDays: number;
    unitPriceUSD: number;
    unitPriceCLP: number;
    product: {
      id: string;
      name: string;
      slug: string;
      icon: string | null;
    };
    license: {
      id: string;
      licenseKey: string;
      status: string;
      expiresAt: string;
    } | null;
  }>;
}

function formatOrderPrice(order: Order): string {
  const currency = order.currency || 'CLP';
  switch (currency) {
    case 'USD':
      const usd = order.totalUSD || order.total;
      return `$${usd.toFixed(2)} USD`;
    case 'EUR':
      const eur = order.totalUSD ? order.totalUSD * 0.92 : order.total * 0.92;
      return `€${eur.toFixed(2)} EUR`;
    case 'CAD':
      const cad = order.totalUSD ? order.totalUSD * 1.36 : order.total * 1.36;
      return `$${cad.toFixed(2)} CAD`;
    case 'CLP':
    default:
      return `$${Math.round(order.total).toLocaleString('es-CL')} CLP`;
  }
}

function formatItemPrice(order: Order, unitPriceUSD: number, unitPriceCLP: number): string {
  const currency = order.currency || 'CLP';
  switch (currency) {
    case 'USD':
      return `$${unitPriceUSD.toFixed(2)} USD`;
    case 'EUR':
      const eur = unitPriceUSD * 0.92;
      return `€${eur.toFixed(2)} EUR`;
    case 'CAD':
      const cad = unitPriceUSD * 1.36;
      return `$${cad.toFixed(2)} CAD`;
    case 'CLP':
    default:
      return `$${Math.round(unitPriceCLP).toLocaleString('es-CL')} CLP`;
  }
}

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const Trash2 = useIcon("Trash2");
  const ShoppingCart = useIcon("ShoppingCart");
  const User = useIcon("User");
  const Package = useIcon("Package");
  const DollarSign = useIcon("DollarSign");
  const CheckCircle = useIcon("CheckCircle");
  const AlertCircle = useIcon("AlertCircle");
  const Search = useIcon("Search");
  const Filter = useIcon("Filter");
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [excludedStatuses, setExcludedStatuses] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      excludedStatuses.forEach((status) => params.append("excludeStatus", status));
      if (search) params.append("search", search);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [excludedStatuses, filter, pagination.limit, pagination.page, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function deleteOrder(orderId: string) {
    if (!confirm(t("admin.deleteOrderConfirm"))) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert(t("admin.orderDeleted"));
        fetchOrders();
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to delete order:", error);
      alert(t("common.error"));
    }
  }

  async function bulkDeletePendingAndCancelled() {
    const ok = confirm(t("admin.deleteAllPendingCancelled"));
    if (!ok) return;

    try {
      setBulkDeleting(true);
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statuses: ["PENDING", "CANCELLED"] }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to bulk delete orders");
      }

      alert(data.message || t("admin.ordersDeleted"));
      fetchOrders();
    } catch (error) {
      console.error("Failed to bulk delete orders:", error);
      alert(error instanceof Error ? error.message : "Failed to bulk delete orders");
    } finally {
      setBulkDeleting(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30";
      case "PENDING":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
      case "FAILED":
        return "bg-red-500/15 text-red-400 border-red-500/30";
      case "CANCELLED":
         return "bg-[#181818] text-gray-300 border-[#333]";
      default:
         return "bg-[#181818] text-gray-300 border-[#333]";
    }
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30";
      case "EXPIRED":
        return "bg-red-500/15 text-red-400 border border-red-500/30";
      case "SUSPENDED":
        return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30";
      case "REVOKED":
        return "bg-[#181818] text-gray-300 border border-[#333]";
      default:
        return "bg-[#181818] text-gray-300 border border-[#333]";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Hero - Gradient Background */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-[#f59e0b]" />
              {t("admin.orders")}
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              {t("admin.ordersDesc")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {orders.length} {t("admin.totalOrders")}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                {orders.filter(o => o.status === 'COMPLETED').length} {t("admin.completed")}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {orders.filter(o => o.status === 'PENDING').length} {t("admin.pending")}
              </div>
            </div>
          </div>

          <div className="hidden md:block" />
        </div>
      </div>

      {/* Filters */}
      <div className="pixel-frame pixel-frame-neutral bg-[#111] rounded-xl border border-[#222] p-6 mb-6 shadow-lg space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-white font-semibold">{t("admin.filters")}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <span className="text-gray-400 text-sm font-medium block">{t("admin.status")}:</span>
            <div className="flex flex-wrap gap-2">
              {["all", "PENDING", "COMPLETED", "FAILED", "CANCELLED"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filter === status
                        ? "bg-[#f59e0b] text-white border border-[#f59e0b]/50 shadow-lg shadow-[#f59e0b]/20"
                        : "bg-[#1a1a1a] text-gray-300 border border-[#333] hover:bg-[#222] hover:border-[#444]"
                    }`}
                  >
                    {status === "all" ? t("admin.all") : status}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Exclude Filter */}
          <div className="space-y-2">
            <span className="text-gray-400 text-sm font-medium block">{t("admin.exclude")}:</span>
            <div className="flex flex-wrap gap-2">
              {["PENDING", "COMPLETED", "FAILED", "CANCELLED"].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setExcludedStatuses((prev) =>
                      prev.includes(status)
                        ? prev.filter((value) => value !== status)
                        : [...prev, status]
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    excludedStatuses.includes(status)
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : "bg-[#1a1a1a] text-gray-300 border border-[#333] hover:bg-[#222] hover:border-[#444]"
                  }`}
                  type="button"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2 lg:col-span-2">
            <span className="text-gray-400 text-sm font-medium block">{t("admin.search")}:</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("admin.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#222]">
          <button
            onClick={bulkDeletePendingAndCancelled}
            disabled={bulkDeleting}
            className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-[#3f3f46] disabled:text-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            type="button"
            title={t("admin.deletePendingCancelled")}
          >
            <Trash2 className="w-4 h-4" />
            {bulkDeleting ? t("common.deleting") : t("admin.deletePendingCancelled")}
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="pixel-frame pixel-frame-neutral bg-[#111] rounded-xl border border-[#222] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] border-b border-[#222]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t("admin.order")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t("admin.customer")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t("admin.items")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t("admin.total")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t("admin.license")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t("common.status")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t("common.date")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-400 border-t-transparent mx-auto"></div>
                      <span>{t("admin.loadingOrders")}</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-4">
                      <ShoppingCart className="w-12 h-12 text-gray-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{t("admin.noOrdersFound")}</h3>
                        <p className="text-gray-500">{t("admin.noOrdersMatch")}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-sm text-white bg-[#0a0a0a] border border-[#333] px-3 py-2 rounded-lg">
                            {order.orderNumber}
                          </div>
                          {order.flowToken && (
                            <button
                              onClick={() => copyToClipboard(order.flowToken!)}
                              className="text-gray-400 hover:text-amber-400 p-2 rounded-lg hover:bg-[#333] transition-colors"
                              title={t("admin.copyFlowToken")}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                          <User className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">
                            {order.customerEmail || order.user.email}
                          </div>
                          {order.customerName && (
                            <div className="text-gray-400 text-xs">
                              {order.customerName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div className="space-y-1">
                          <div className="text-sm text-gray-300 font-medium">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                              {item.product.icon ? (
                                <span className={`icon-minecraft-sm ${item.product.icon}`} />
                              ) : (
                                <Package className="w-3 h-3" />
                              )}
                              <span className="truncate max-w-[120px]">{item.product.name}</span>
                              <span className="text-emerald-400/70">({formatItemPrice(order, item.unitPriceUSD, item.unitPriceCLP)})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <div className="text-sm font-semibold text-emerald-400">
                          {formatOrderPrice(order)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="mb-1 last:mb-0">
                          {item.license ? (
                            <div className="flex flex-col gap-1">
                              <Link
                                href={`/admin/licenses/${item.license.id}`}
                                className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                              >
                                {item.license.licenseKey.substring(0, 12)}...
                              </Link>
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getLicenseStatusColor(item.license.status)}`}>
                                {item.license.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-red-400">{t("admin.noLicense")}</span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${order.status === "COMPLETED"
                          ? "bg-green-400"
                          : order.status === "PENDING"
                            ? "bg-yellow-400"
                            : order.status === "FAILED"
                              ? "bg-red-400"
                              : "bg-gray-500"
                          }`}></span>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      {order.paidAt && (
                        <div className="text-xs text-green-400">
                          {t("admin.paid")}: {new Date(order.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-400/10 transition-colors"
                          >
                            {t("common.view")}
                          </Link>
                        {(order.status === "PENDING" || order.status === "FAILED" || order.status === "CANCELLED") && (
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-red-400 hover:text-red-300 ml-2"
                            title={t("common.delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
      {
        pagination.totalPages > 1 && (
          <div className="bg-[#111] rounded-xl border border-[#222] p-6 mt-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {t("admin.showing")} {((pagination.page - 1) * pagination.limit) + 1} {t("admin.to")}{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} {t("admin.of")} {pagination.total} {t("admin.ordersLower")}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#222] border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {t("common.previous")}
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
                            ? "bg-[#f59e0b] text-white border border-[#f59e0b]/50 shadow-lg shadow-[#f59e0b]/20"
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
                            ? "bg-[#f59e0b] text-white border border-[#f59e0b]/50 shadow-lg shadow-[#f59e0b]/20"
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
                  {t("common.next")}
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}
