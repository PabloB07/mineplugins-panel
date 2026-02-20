import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCLP } from "@/lib/pricing";
import { ShoppingBag, Package, ArrowRight } from "lucide-react";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-zinc-950 text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400">Please login to view your orders.</p>
      </div>
    );
  }

  // Get user's orders with license information
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: { name: true },
          },
          license: {
            select: { 
              id: true, 
              status: true, 
              expiresAt: true,
              licenseKey: true 
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardNavbar user={session.user} isAdmin={isAdmin} />

      <div className="space-y-8 animate-fade-in pb-10">
        {/* Welcome Hero - Gradient Background */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                  Order History
                </h1>
                <p className="text-gray-400 max-w-lg text-lg">
                  View your purchase history and track your licenses and downloads.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {orders.length} Total Orders
                  </div>
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                    <Package className="w-4 h-4 mr-2" />
                    {orders.reduce((acc, order) => acc + order.items.length, 0)} Products
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <Link
                  href="/store"
                  className="bg-[#22c55e] text-black hover:bg-[#16a34a] px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#22c55e]/20"
                >
                  <Package className="w-5 h-5" />
                  Buy New Plugin
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {orders.length === 0 ? (
            <div className="relative bg-[#111] rounded-xl border border-[#222] p-16 text-center overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10 max-w-md mx-auto">
                <div className="w-16 h-16 bg-[#181818] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#2a2a2a]">
                  <ShoppingBag className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
                <p className="text-gray-400 mb-6">You haven&apos;t purchased any plugins yet. Start by browsing our available products.</p>
                <Link
                  href="/store"
                  className="inline-flex items-center gap-2 bg-[#22c55e] text-black hover:bg-[#16a34a] font-bold py-3 px-6 rounded-xl transition-transform hover:scale-105 shadow-lg shadow-[#22c55e]/20"
                >
                  Browse Products
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222] bg-[#151515]">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                  Order History
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#222] bg-[#111]">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Order #</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Products</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Total</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">License</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="font-mono text-sm text-white bg-[#222] px-2 py-1 rounded">
                              {order.orderNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#22c55e] rounded-full"></span>
                                <span className="text-sm text-gray-300">{item.product.name}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-[#22c55e]">
                            {formatCLP(order.total || 199900)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="mb-2 last:mb-0">
                              {item.license ? (
                                <div className="flex flex-col gap-1">
                                  <Link
                                    href={`/dashboard/licenses/${item.license.id}`}
                                    className="text-sm font-medium text-[#22c55e] hover:text-[#16a34a] transition-colors flex items-center gap-1"
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                    View License
                                  </Link>
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                      item.license.status === "ACTIVE"
                                        ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                                        : item.license.status === "EXPIRED"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-[#181818] text-gray-400 border border-[#333]"
                                    }`}>
                                      {item.license.status}
                                    </span>
                                    {item.license.expiresAt && (
                                      <span className="text-xs text-gray-500">
                                        Expires: {new Date(item.license.expiresAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">No license</span>
                              )}
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                              order.status === "COMPLETED"
                                ? "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30"
                                : order.status === "PENDING"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : order.status === "FAILED"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-[#181818] text-gray-400 border-[#333]"
                            }`}
                          >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                              order.status === "COMPLETED"
                                ? "bg-[#22c55e]"
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
                            {new Date(order.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
