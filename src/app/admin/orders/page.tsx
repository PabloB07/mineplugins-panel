"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCLP } from "@/lib/pricing";
import { 
  Trash2, 
  ShoppingCart, 
  User, 
  Package, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
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
    };
    license: {
      id: string;
      licenseKey: string;
      status: string;
      expiresAt: string;
    } | null;
  }>;
}

export default function AdminOrdersPage() {
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

  useEffect(() => {
    fetchOrders();
  }, [filter, excludedStatuses, search, pagination.page]);

  async function fetchOrders() {
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
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder(orderId: string) {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Order deleted successfully");
        fetchOrders();
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to delete order:", error);
      alert("Failed to delete order");
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-900/50 text-green-300 border-green-700";
      case "PENDING":
        return "bg-yellow-900/50 text-yellow-300 border-yellow-700";
      case "FAILED":
        return "bg-red-900/50 text-red-300 border-red-700";
      case "CANCELLED":
         return "bg-gray-700 text-gray-300 border-[#333]";
      default:
         return "bg-gray-700 text-gray-300 border-[#333]";
    }
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-900/50 text-green-300";
      case "EXPIRED":
        return "bg-red-900/50 text-red-300";
      case "SUSPENDED":
        return "bg-yellow-900/50 text-yellow-300";
      case "REVOKED":
        return "bg-gray-700 text-gray-300";
      default:
        return "bg-gray-700 text-gray-300";
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
              Order Management
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Manage all customer orders and payments. Track sales, process transactions, and handle customer support.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {orders.length} Total Orders
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                {orders.filter(o => o.status === 'COMPLETED').length} Completed
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {orders.filter(o => o.status === 'PENDING').length} Pending
              </div>
            </div>
          </div>

          <div className="hidden md:block" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111] rounded-xl border border-[#222] p-6 mb-6 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm font-medium">Status:</span>
          </div>
          <div className="flex gap-2">
            {["all", "PENDING", "COMPLETED", "FAILED", "CANCELLED"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filter === status
                      ? "bg-[#f59e0b] text-white border border-[#f59e0b]/50 shadow-lg shadow-[#f59e0b]/20"
                      : "bg-[#1a1a1a] text-gray-300 border border-[#333] hover:bg-[#222] hover:border-[#444]"
                  }`}
                >
                  {status === "all" ? "All Orders" : status}
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm font-medium">Exclude:</span>
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
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] border-b border-[#222]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  License
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-400 border-t-transparent mx-auto"></div>
                      <span>Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-4">
                      <ShoppingCart className="w-12 h-12 text-gray-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Orders Found</h3>
                        <p className="text-gray-500">No orders match your current filters.</p>
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
                              title="Copy Flow token"
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
                        <div>
                          <div className="text-sm text-gray-300 font-medium">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.items.map(item => item.product.name).join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <div className="text-sm font-semibold text-emerald-400">
                          {formatCLP(order.total)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
                            <span className="text-xs text-red-400">No license</span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${order.status === "COMPLETED"
                          ? "bg-green-400"
                          : order.status === "PENDING"
                            ? "bg-yellow-400"
                            : order.status === "FAILED"
                              ? "bg-red-400"
                              : "bg-gray-400"
                          }`}></span>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-300">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      {order.paidAt && (
                        <div className="text-xs text-green-400">
                          Paid: {new Date(order.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-400/10 transition-colors"
                          >
                            View
                          </Link>
                        {(order.status === "PENDING" || order.status === "FAILED" || order.status === "CANCELLED") && (
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-red-400 hover:text-red-300 ml-2"
                            title="Delete Order"
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
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
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
                  Next
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}
