import { prisma } from "@/lib/prisma";
import { formatCLP } from "@/lib/pricing";
import Link from "next/link";
import {
  Users,
  Key,
  ShoppingCart,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowRight,
  Package,
  Clock
} from "lucide-react";

type License = {
  id: string;
  status: string;
  createdAt: Date;
  product: {
    name: string;
  };
  user: {
    email: string;
    name: string | null;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  user: {
    email: string;
    name: string | null;
  };
};

type ValidationLog = {
  id: string;
  createdAt: Date;
  serverId: string;
  serverVersion: string | null;
  isValid: boolean;
  failureReason: string | null;
};

export default async function AdminDashboardPage() {
  // Get stats
  const [
    totalUsers,
    totalLicenses,
    activeLicenses,
    totalOrders,
    completedOrders,
    recentValidations,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.license.count(),
    prisma.license.count({ where: { status: "ACTIVE" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.validationLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { total: true },
    }),
  ]);

  // Recent licenses
  const recentLicenses = await prisma.license.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      product: { select: { name: true } },
    },
  });

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  // Recent validations
  const validationLogs = await prisma.validationLog.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Hero - Gradient Background */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              Store Admin
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Manage your MinePlugins store. Monitor sales, licenses, customers, and system performance.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-sm">
                <Users className="w-4 h-4 mr-2" />
                {totalUsers} Total Customers
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <Activity className="w-4 h-4 mr-2" />
                {recentValidations} Validations Today
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <DollarSign className="w-4 h-4 mr-2" />
                ${((totalRevenue._sum.total || 0) / 100).toLocaleString("es-CL")} Revenue
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <Link
              href="/admin/products/new"
              className="bg-[#f59e0b] text-black hover:bg-[#d97706] px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#f59e0b]/20"
            >
              <Package className="w-5 h-5" />
              New Product
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-green-500" />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-gray-400 mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-white">
              ${((totalRevenue._sum.total || 0) / 100).toLocaleString("es-CL")}
            </div>
            <div className="mt-2 flex items-center text-xs text-green-400 bg-green-900/20 w-fit px-2 py-1 rounded-full border border-green-900/30">
              <Activity className="w-3 h-3 mr-1" />
              Lifetime Earnings
            </div>
          </div>
        </div>

        {/* Active Licenses */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Key className="w-16 h-16 text-blue-500" />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-gray-400 mb-1">Active Licenses</div>
            <div className="text-3xl font-bold text-white">{activeLicenses}</div>
            <div className="mt-2 text-xs text-gray-500">
              out of {totalLicenses} total created
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-purple-500" />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-gray-400 mb-1">Total Customers</div>
            <div className="text-3xl font-bold text-white">{totalUsers}</div>
            <div className="mt-2 text-xs text-gray-500">
              Registered accounts
            </div>
          </div>
        </div>

        {/* Validations (24h) */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-orange-500" />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-gray-400 mb-1">Validations (24h)</div>
            <div className="text-3xl font-bold text-white">{recentValidations}</div>
            <div className="mt-2 text-xs text-gray-500">
              Server checks today
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Recent Activity Column (Larger) */}
        <div className="xl:col-span-2 space-y-8">

          {/* Recent Orders Table */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#151515]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-400" />
                Recent Orders
              </h2>
              <Link href="/admin/orders" className="text-sm text-[#22c55e] hover:text-[#16a34a] flex items-center gap-1 transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="max-h-[400px] overflow-auto">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No orders found</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-500 font-medium sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Order</th>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {order.user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                                                ${order.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400 border-green-900/50' :
                              order.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50' :
                                'bg-red-900/30 text-red-400 border-red-900/50'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white text-right font-medium">
                          {formatCLP(order.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Validations Chart/List */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#151515]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-400" />
                Live Validations
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Server Hash</th>
                    <th className="px-6 py-3">Result</th>
                    <th className="px-6 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {validationLogs.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-500">No logs recently</td></tr>
                  ) : (
                    validationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="px-6 py-3 text-xs text-gray-400 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-300 font-mono">
                          {log.serverId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-3">
                          {log.isValid ? (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                              Valid
                            </span>
                          ) : (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-500">
                          {log.failureReason || "OK"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-8">
          {/* Quick Stats or Status */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Database</span>
                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-900/50">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">License API</span>
                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-900/50">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Payments</span>
                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-900/50">Active</span>
              </div>
            </div>
          </div>

          {/* Recent Licenses List */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#151515]">
              <h2 className="text-base font-semibold text-white">Latest Licenses</h2>
              <Link href="/admin/licenses" className="p-1 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-[#222]">
              {recentLicenses.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No licenses yet</div>
              ) : (
                recentLicenses.map((lic) => (
                  <div key={lic.id} className="p-4 hover:bg-[#1a1a1a] transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-white group-hover:text-[#22c55e] transition-colors line-clamp-1">
                        {lic.product.name}
                      </span>
                       <span className={`text-[10px] px-1.5 py-0.5 rounded border ${lic.status === 'ACTIVE' ? 'bg-green-900/20 text-green-400 border-green-900/30' : 'bg-gray-800 text-gray-400 border-[#333]'
                        }`}>
                        {lic.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-between">
                      <span>{lic.user.email}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(lic.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
