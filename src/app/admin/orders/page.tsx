"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCLP } from "@/lib/pricing";

import { Trash2 } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, [filter, search, pagination.page]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
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

    setDebugLoading(true);
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
    } finally {
      setDebugLoading(false);
    }
  }

  async function fixOrder(orderId: string, force = false) {
    setDebugLoading(true);
    try {
      const res = await fetch("/api/payment/manual-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          force,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Order ${data.order?.orderNumber} has been ${data.forced ? "forcefully " : ""}completed!`);
        fetchOrders(); // Refresh the list
        setShowDebugModal(false);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to fix order:", error);
      alert("Failed to fix order. Check console for details.");
    } finally {
      setDebugLoading(false);
    }
  }

  async function bulkFixStuckOrders() {
    setDebugLoading(true);
    try {
      const res = await fetch("/api/payment/fix-stuck-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false, maxOrders: 20 }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Fixed ${data.ordersFixed.length} stuck orders!`);
        fetchOrders();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to fix stuck orders:", error);
      alert("Failed to fix stuck orders. Check console for details.");
    } finally {
      setDebugLoading(false);
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
        return "bg-gray-700 text-gray-300 border-gray-600";
      default:
        return "bg-gray-700 text-gray-300 border-gray-600";
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
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Order Management</h1>
          <p className="text-gray-400 mt-1">Manage all customer orders and payments</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDebugModal(true)}
            className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Debug Tools
          </button>
          <button
            onClick={bulkFixStuckOrders}
            disabled={debugLoading}
            className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {debugLoading ? "Fixing..." : "Fix Stuck Orders"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Filter by status:</span>
          <div className="flex gap-2">
            {["all", "PENDING", "COMPLETED", "FAILED", "CANCELLED"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                >
                  {status === "all" ? "All" : status}
                </button>
              )
            )}
          </div>
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by order number, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Order #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  License
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm text-white bg-gray-700/50 px-2 py-1 rounded">
                          {order.orderNumber}
                        </div>
                        {order.flowToken && (
                          <button
                            onClick={() => copyToClipboard(order.flowToken!)}
                            className="text-gray-400 hover:text-white"
                            title="Copy Flow token"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm">
                        {order.customerEmail || order.user.email}
                      </div>
                      {order.customerName && (
                        <div className="text-gray-400 text-xs">
                          {order.customerName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-300">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items.map(item => item.product.name).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-emerald-400">
                        {formatCLP(order.total)}
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
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View
                        </Link>
                        {order.status === "PENDING" && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDebugModal(true);
                            }}
                            className="text-yellow-400 hover:text-yellow-300 text-sm"
                          >
                            Fix
                          </button>
                        )}
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
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
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
                        className={`px-3 py-1 text-sm rounded ${isActive
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
                        className={`px-3 py-1 text-sm rounded ${pagination.page === pagination.totalPages
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
        )
      }

      {/* Debug Modal */}
      {
        showDebugModal && (
          <DebugModal
            order={selectedOrder}
            onClose={() => {
              setShowDebugModal(false);
              setSelectedOrder(null);
            }}
            onFix={fixOrder}
            loading={debugLoading}
          />
        )
      }
    </div >
  );
}

function DebugModal({
  order,
  onClose,
  onFix,
  loading
}: {
  order: Order | null;
  onClose: () => void;
  onFix: (orderId: string, force?: boolean) => void;
  loading: boolean;
}) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  useEffect(() => {
    if (order?.id) {
      fetchDebugInfo();
    }
  }, [order?.id]);

  async function fetchDebugInfo() {
    setDebugLoading(true);
    try {
      const res = await fetch(`/api/payment/manual-confirm?orderId=${order?.id}`);
      const data = await res.json();
      setDebugInfo(data);
    } catch (error) {
      console.error("Failed to fetch debug info:", error);
    } finally {
      setDebugLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Order Debug: {order?.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {debugLoading ? (
          <div className="text-center py-8 text-gray-400">Loading debug info...</div>
        ) : debugInfo ? (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Order Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Order Number:</span>
                  <span className="text-white ml-2">{debugInfo.order.orderNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white ml-2">{debugInfo.order.status}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white ml-2">{formatCLP(debugInfo.order.total)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white ml-2">{new Date(debugInfo.order.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Flow Token:</span>
                  <span className="text-white ml-2 font-mono text-xs">{debugInfo.order.flowToken || 'None'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Paid At:</span>
                  <span className="text-white ml-2">{debugInfo.order.paidAt ? new Date(debugInfo.order.paidAt).toLocaleString() : 'Not paid'}</span>
                </div>
              </div>
            </div>

            {/* Flow Status */}
            {debugInfo.flowStatus && (
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Flow Payment Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Flow Status:</span>
                    <span className="text-white ml-2">{debugInfo.flowStatusLabel} ({debugInfo.flowStatus.status})</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Flow Order:</span>
                    <span className="text-white ml-2">{debugInfo.flowStatus.flowOrder}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white ml-2">{formatCLP(debugInfo.flowStatus.amount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Currency:</span>
                    <span className="text-white ml-2">{debugInfo.flowStatus.currency}</span>
                  </div>
                </div>
              </div>
            )}

            {/* License Info */}
            {debugInfo.order.items && (
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">License Information</h3>
                <div className="space-y-2">
                  {debugInfo.order.items.map((item: any, index: number) => (
                    <div key={index} className="text-sm border-b border-gray-600 pb-2 last:border-0">
                      <div className="text-white">{item.product.name}</div>
                      <div className="text-gray-400">
                        License: {item.license ? `${item.license.licenseKey.substring(0, 20)}... (${item.license.status})` : 'None'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Close
              </button>
              {debugInfo.order.status === "PENDING" && (
                <>
                  {debugInfo.flowStatus?.status !== 2 && (
                    <button
                      onClick={() => order && onFix(order.id, true)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {loading ? "Fixing..." : "Force Complete"}
                    </button>
                  )}
                  {debugInfo.flowStatus?.status === 2 && (
                    <button
                      onClick={() => order && onFix(order.id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {loading ? "Fixing..." : "Complete Order"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-red-400">Failed to load debug info</div>
        )}
      </div>
    </div>
  );
}