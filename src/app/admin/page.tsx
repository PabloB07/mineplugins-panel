"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { FormattedPrice } from "@/components/ui/FormattedPrice";
import { Icon as IconComponent, IconHeader } from "@/components/ui/Icon";

interface DashboardStats {
  totalUsers: number;
  totalLicenses: number;
  activeLicenses: number;
  recentValidations: number;
  totalRevenue: number;
  recentRevenue: number;
  todayOrders: number;
  completedTodayOrders: number;
  onlineServers: number;
  totalServers: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: { email: string };
}

interface RecentLicense {
  id: string;
  status: string;
  createdAt: string;
  product: { name: string; icon: string | null };
  user: { email: string };
}

interface ValidationLog {
  id: string;
  serverId: string;
  isValid: boolean;
  failureReason: string | null;
  createdAt: string;
}

interface ServerStatus {
  id: string;
  name: string;
  ip: string;
  port: number;
  isOnline: boolean;
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentLicenses, setRecentLicenses] = useState<RecentLicense[]>([]);
  const [validationLogs, setValidationLogs] = useState<ValidationLog[]>([]);
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setRecentLicenses(data.recentLicenses || []);
        setValidationLogs(data.validationLogs || []);
        setServers(data.servers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="pixel-frame pixel-frame-amber relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#111] via-[#0f0f0f] to-[#0a0a0a] border border-[#222]">
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
                {t("admin.title")}
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
                <IconComponent name="Package" className="w-5 h-5" />
                {t("admin.newProduct")}
              </Link>
              <Link
                href="/admin/servers"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02]"
              >
                <IconComponent name="Server" className="w-5 h-5" />
                {t("admin.manageServers")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="pixel-frame pixel-frame-blue pixel-jagged-bottom pixel-jagged-blue bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                  <IconComponent name="Users" className="w-3 h-3" /> {t("admin.users")}
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              </div>
            </div>
            <div className="pixel-frame pixel-jagged-bottom pixel-jagged-green bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-green-500/20 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                  <IconComponent name="Key" className="w-3 h-3" /> {t("admin.activeLicenses")}
                </div>
                <div className="text-2xl font-bold text-white">{stats.activeLicenses}</div>
              </div>
            </div>
            <div className="pixel-frame pixel-frame-amber pixel-jagged-bottom pixel-jagged-amber bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-amber-500/20 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                  <IconComponent name="ShoppingCart" className="w-3 h-3" /> {t("admin.ordersToday")}
                </div>
                <div className="text-2xl font-bold text-white">{stats.todayOrders}</div>
              </div>
            </div>
            <div className="pixel-frame pixel-frame-amber pixel-jagged-bottom pixel-jagged-amber bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-purple-500/20 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-green-400 text-xs font-medium mb-1">
                  <IconComponent name="DollarSign" className="w-3 h-3" /> {t("admin.revenue")}
                </div>
                <div className="text-2xl font-bold text-green-400">
                  <FormattedPrice value={stats.recentRevenue} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="pixel-frame pixel-jagged-bottom pixel-jagged-green bg-[#111] border border-[#222] rounded-xl p-5 relative overflow-hidden group hover:border-green-500/30 transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-green-500/10 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                  <IconComponent name="TrendingUp" className="w-4 h-4 text-green-500" /> {t("admin.sales")}
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  <FormattedPrice value={stats.totalRevenue} />
                </div>
                <div className="text-xs text-gray-500">Lifetime earnings</div>
              </div>
            </div>

            <div className="pixel-frame pixel-frame-blue pixel-jagged-bottom pixel-jagged-blue bg-[#111] border border-[#222] rounded-xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                  <IconComponent name="Activity" className="w-4 h-4 text-blue-500" /> {t("admin.totalValidations")}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stats.recentValidations}</div>
                <div className="text-xs text-gray-500">Server checks</div>
              </div>
            </div>

            <div className="pixel-frame pixel-frame-blue pixel-jagged-bottom pixel-jagged-blue bg-[#111] border border-[#222] rounded-xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                  <IconComponent name="Key" className="w-4 h-4 text-purple-500" /> {t("admin.allLicenses")}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stats.totalLicenses}</div>
                <div className="text-xs text-gray-500">{stats.totalLicenses - stats.activeLicenses} {t("admin.expired")}</div>
              </div>
            </div>

            <div className="pixel-frame pixel-frame-amber pixel-jagged-bottom pixel-jagged-amber bg-[#111] border border-[#222] rounded-xl p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                  <IconComponent name="CheckCircle" className="w-4 h-4 text-amber-500" /> {t("admin.completed")}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stats.completedTodayOrders}</div>
                <div className="text-xs text-gray-500">{t("admin.ofOrders").replace("{total}", stats.todayOrders.toString())}</div>
              </div>
            </div>
          </div>

          <div className="pixel-frame pixel-jagged-bottom pixel-jagged-green bg-[#111] border border-[#222] rounded-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="p-5 border-b border-[#222] flex justify-between items-center bg-gradient-to-r from-[#151515] to-transparent">
              <IconHeader name="ShoppingCart">{t("admin.recentOrders")}</IconHeader>
              <Link href="/admin/orders" className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                {t("common.view")} <IconComponent name="ArrowRight" className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-500 font-medium">
                  <tr>
                    <th className="px-5 py-3 text-left">{t("admin.order")}</th>
                    <th className="px-5 py-3 text-left">{t("admin.customer")}</th>
                    <th className="px-5 py-3 text-left">{t("admin.status")}</th>
                    <th className="px-5 py-3 text-right">{t("admin.total")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500">{t("admin.noRecentOrders")}</td>
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
                          <FormattedPrice value={order.total} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pixel-frame pixel-frame-blue pixel-jagged-bottom pixel-jagged-blue bg-[#111] border border-[#222] rounded-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="p-5 border-b border-[#222] flex justify-between items-center bg-gradient-to-r from-[#151515] to-transparent">
              <IconHeader name="Activity" iconClassName="w-5 h-5 text-gray-400">
                {t("admin.recentValidations")}
                <span className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </IconHeader>
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

        <div className="xl:col-span-4 space-y-6">
          <div className="pixel-frame pixel-frame-blue pixel-jagged-bottom pixel-jagged-blue bg-[#111] border border-[#222] rounded-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="p-5 border-b border-[#222] bg-gradient-to-r from-[#151515] to-transparent relative z-10">
              <div className="flex justify-between items-center">
                <IconHeader name="Server" iconClassName="w-5 h-5 text-blue-400">{t("admin.servers")}</IconHeader>
                <Link href="/admin/servers" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  {t("common.view")}
                </Link>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {servers.length === 0 ? (
                <div className="text-center py-6">
                  <IconComponent name="Server" className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t("admin.noServersAdded")}</p>
                  <Link href="/admin/servers" className="text-xs text-blue-400 hover:underline">
                    {t("admin.addServer")}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span>{t("admin.serversOnline").replace("{online}", stats.onlineServers.toString()).replace("{total}", stats.totalServers.toString())}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Public</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {servers.slice(0, 4).map((server) => (
                      <div key={server.id} className="pixel-frame flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#222] hover:border-[#333] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            server.isOnline 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {server.isOnline ? (
                              <IconComponent name="CheckCircle" className="w-4 h-4" />
                            ) : (
                              <IconComponent name="XCircle" className="w-4 h-4" />
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
                          {server.isOnline ? t("admin.serverOnline") : t("admin.serverOffline")}
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

          <div className="pixel-frame pixel-frame-blue pixel-jagged-bottom pixel-jagged-blue bg-[#111] border border-[#222] rounded-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="p-5 border-b border-[#222] bg-gradient-to-r from-[#151515] to-transparent relative z-10">
              <div className="flex justify-between items-center">
                <IconHeader name="Key" iconClassName="w-5 h-5 text-purple-400">{t("admin.allLicenses")}</IconHeader>
                <Link href="/admin/licenses" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  {t("common.view")}
                </Link>
              </div>
            </div>
            <div className="divide-y divide-[#222]">
              {recentLicenses.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">{t("admin.noLicensesFoundAdmin")}</div>
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
                        <IconComponent name="Clock" className="w-3 h-3" />
                        {new Date(lic.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pixel-frame pixel-frame-amber bg-[#111] border border-[#222] rounded-xl p-5 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 relative z-10">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/admin/products/new" className="pixel-frame pixel-frame-amber flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#151515] border border-[#222] hover:border-amber-500/30 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/30">
                  <IconComponent name="Plus" className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{t("admin.newProduct")}</span>
              </Link>
              <Link href="/admin/licenses?status=REVOKED" className="pixel-frame flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#151515] border border-[#222] hover:border-red-500/30 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover:bg-red-500/30">
                  <IconComponent name="AlertTriangle" className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{t("admin.reviewRevoked")}</span>
              </Link>
              <Link href="/admin/transfers" className="pixel-frame pixel-frame-blue flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#151515] border border-[#222] hover:border-purple-500/30 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/30">
                  <IconComponent name="ArrowRight" className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{t("admin.licenseTransfers")}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
