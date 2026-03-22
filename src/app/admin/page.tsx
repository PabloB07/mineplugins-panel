import { prisma } from "@/lib/prisma";
import { formatCLPValue } from "@/lib/pricing";
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
  Clock,
  Server,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus
} from "lucide-react";

export default async function AdminDashboardPage() {
  const validationWindowStart = new Date();
  validationWindowStart.setUTCDate(validationWindowStart.getUTCDate() - 1);

  const revenueWindowStart = new Date();
  revenueWindowStart.setDate(revenueWindowStart.getDate() - 30);

  const [
    totalUsers,
    totalLicenses,
    activeLicenses,
    recentValidations,
    servers,
    recentRevenueData,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.license.count(),
    prisma.license.count({ where: { status: "ACTIVE" } }),
    prisma.validationLog.count({
      where: { createdAt: { gte: validationWindowStart } },
    }),
    prisma.serverStatus.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.aggregate({
      where: { 
        status: "COMPLETED",
        paidAt: { gte: revenueWindowStart },
      },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { total: true },
    }),
  ]);

  const recentLicenses = await prisma.license.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      product: { select: { name: true } },
    },
  });

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const validationLogs = await prisma.validationLog.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  const onlineServers = servers.filter(s => s.isOnline).length;
  const todayOrders = await prisma.order.count({
    where: {
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  const completedTodayOrders = await prisma.order.count({
    where: {
      status: "COMPLETED",
      paidAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#111] via-[#0f0f0f] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/15 via-transparent to-transparent rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>
        
        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">System Online</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                Store Admin
              </h1>
              <p className="text-gray-400 max-w-xl text-lg">
                Monitor sales, manage licenses, and track server status from one dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/products/new"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02]"
              >
                <Package className="w-5 h-5" />
                New Product
              </Link>
              <Link
                href="/admin/servers"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02]"
              >
                <Server className="w-5 h-5" />
                Manage Servers
              </Link>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                <Users className="w-3 h-3" /> Customers
              </div>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                <Key className="w-3 h-3" /> Active Licenses
              </div>
              <div className="text-2xl font-bold text-white">{activeLicenses}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                <ShoppingCart className="w-3 h-3" /> Orders Today
              </div>
              <div className="text-2xl font-bold text-white">{todayOrders}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-green-400 text-xs font-medium mb-1">
                <DollarSign className="w-3 h-3" /> Monthly Revenue
              </div>
              <div className="text-2xl font-bold text-green-400">
                ${((recentRevenueData._sum.total || 0)).toLocaleString("es-CL", { maximumFractionDigits: 0 })} CLP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column - Stats & Tables */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111] border border-[#222] rounded-xl p-5 relative overflow-hidden group hover:border-green-500/30 transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-green-500/10 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" /> Total Revenue
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  ${((totalRevenue._sum.total || 0)).toLocaleString("es-CL", { maximumFractionDigits: 0 })} CLP
                </div>
                <div className="text-xs text-gray-500">Lifetime earnings</div>
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                  <Activity className="w-4 h-4 text-blue-500" /> Validations (24h)
                </div>
                <div className="text-2xl font-bold text-white mb-1">{recentValidations}</div>
                <div className="text-xs text-gray-500">Server checks</div>
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                  <Key className="w-4 h-4 text-purple-500" /> All Licenses
                </div>
                <div className="text-2xl font-bold text-white mb-1">{totalLicenses}</div>
                <div className="text-xs text-gray-500">{totalLicenses - activeLicenses} expired</div>
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-xl p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                  <CheckCircle className="w-4 h-4 text-amber-500" /> Completed Today
                </div>
                <div className="text-2xl font-bold text-white mb-1">{completedTodayOrders}</div>
                <div className="text-xs text-gray-500">of {todayOrders} orders</div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#222] flex justify-between items-center bg-gradient-to-r from-[#151515] to-transparent">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-400" />
                Recent Orders
              </h2>
              <Link href="/admin/orders" className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-500 font-medium">
                  <tr>
                    <th className="px-5 py-3 text-left">Order</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500">No orders found</td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="text-sm font-medium text-white">{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-300">{order.user.email}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                            ${order.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400 border-green-900/50' :
                              order.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50' :
                              'bg-red-900/30 text-red-400 border-red-900/50'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-white text-right font-medium">
                          {formatCLPValue(order.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Validations */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#222] flex justify-between items-center bg-gradient-to-r from-[#151515] to-transparent">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-400" />
                Live Validations
                <span className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-500 font-medium">
                  <tr>
                    <th className="px-5 py-3 text-left">Time</th>
                    <th className="px-5 py-3 text-left">Server ID</th>
                    <th className="px-5 py-3 text-left">Result</th>
                    <th className="px-5 py-3 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {validationLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500">No recent validations</td>
                    </tr>
                  ) : (
                    validationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                        <td className="px-5 py-3 text-xs text-gray-400 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-300 font-mono">
                          {log.serverId.substring(0, 10)}...
                        </td>
                        <td className="px-5 py-3">
                          {log.isValid ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
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

        {/* Right Column - Sidebar */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Server Status Card */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#222] bg-gradient-to-r from-[#151515] to-transparent">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-400" />
                  Server Status
                </h2>
                <Link href="/admin/servers" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Manage
                </Link>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {servers.length === 0 ? (
                <div className="text-center py-6">
                  <Server className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No servers configured</p>
                  <Link href="/admin/servers" className="text-xs text-blue-400 hover:underline">
                    Add a server
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span>{onlineServers} of {servers.length} online</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Public</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {servers.slice(0, 4).map((server) => (
                      <div key={server.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#222] hover:border-[#333] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            server.isOnline 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {server.isOnline ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{server.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{server.ip}:{server.port}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          server.isOnline 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {server.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {servers.length > 4 && (
                    <Link href="/admin/servers" className="block text-center text-xs text-gray-400 hover:text-white py-2 transition-colors">
                      +{servers.length - 4} more servers
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Latest Licenses */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#222] bg-gradient-to-r from-[#151515] to-transparent">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  Latest Licenses
                </h2>
                <Link href="/admin/licenses" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  View All
                </Link>
              </div>
            </div>
            <div className="divide-y divide-[#222]">
              {recentLicenses.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No licenses yet</div>
              ) : (
                recentLicenses.map((lic) => (
                  <div key={lic.id} className="p-4 hover:bg-[#1a1a1a]/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-white line-clamp-1">{lic.product.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        lic.status === 'ACTIVE' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-gray-800 text-gray-400 border-[#333]'
                      }`}>
                        {lic.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate">{lic.user.email}</span>
                      <span className="flex items-center gap-1 ml-2">
                        <Clock className="w-3 h-3" />
                        {new Date(lic.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/admin/products/new" className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#151515] border border-[#222] hover:border-amber-500/30 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/30">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Add New Product</span>
              </Link>
              <Link href="/admin/licenses?status=REVOKED" className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#151515] border border-[#222] hover:border-red-500/30 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover:bg-red-500/30">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Review Revoked Licenses</span>
              </Link>
              <Link href="/admin/transfers" className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#151515] border border-[#222] hover:border-purple-500/30 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/30">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">License Transfers</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
