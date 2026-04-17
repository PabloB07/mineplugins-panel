"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon, IconHeader } from "@/components/ui/Icon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface License {
  id: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  product: { name: string; icon: string | null };
  _count: { activations: number };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    product: { name: string };
  }>;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/dashboard/stats")
        .then(res => res.json())
        .then(data => {
          setLicenses(data.licenses || []);
          setOrders(data.orders || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  if (!session?.user?.id) {
    return null;
  }

  const activeLicenses = licenses.filter((l: License) => l.status === "ACTIVE").length;
  const totalActivations = licenses.reduce(
    (acc: number, l: License) => acc + l._count.activations,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-400 mt-4">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="pixel-frame relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              {t("dashboard.title")}
            </h1>
            <p className="text-gray-400 text-lg">
              {t("dashboard.welcome")}, {session.user.name?.split(" ")[0] || "User"}!
            </p>
          </div>
          <Link
            href="/store"
            className="bg-[#22c55e] text-black hover:bg-[#16a34a] px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#22c55e]/20"
          >
            <Icon name="Package" className="w-5 h-5" />
            {t("dashboard.buyNewPlugin")}
          </Link>
        </div>

        <div className="px-8 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="pixel-frame pixel-frame-neutral bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-green-500/20 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                  <Icon name="Key" className="w-3 h-3" /> {t("dashboard.activePlugins")}
                </div>
                <div className="text-2xl font-bold text-white">{activeLicenses}</div>
              </div>
            </div>
            <div className="pixel-frame pixel-frame-blue bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                  <Icon name="Clock" className="w-3 h-3" /> {t("dashboard.activeServers")}
                </div>
                <div className="text-2xl font-bold text-white">{totalActivations}</div>
              </div>
            </div>
            <div className="pixel-frame pixel-frame-blue bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-purple-500/20 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                  <Icon name="ShoppingCart" className="w-3 h-3" /> {t("dashboard.orders")}
                </div>
                <div className="text-2xl font-bold text-white">{orders.length}</div>
              </div>
            </div>
            <div className="pixel-frame pixel-frame-amber bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-amber-500/20 transition-all"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                  <Icon name="Package" className="w-3 h-3" /> {t("dashboard.yourPlugins")}
                </div>
                <div className="text-2xl font-bold text-white">{licenses.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="pixel-frame bg-[#111] border border-[#222] rounded-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="p-5 border-b border-[#222] flex justify-between items-center">
            <IconHeader name="Key" iconClassName="w-5 h-5 text-green-400">
              {t("dashboard.yourPlugins")}
            </IconHeader>
            <Link href="/dashboard/licenses" className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1">
              {t("dashboard.viewAll")} <Icon name="ArrowRight" className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-[#222]">
            {licenses.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="Key" className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">{t("dashboard.noPlugins")}</p>
                <Link
                  href="/store"
                  className="inline-flex items-center gap-2 bg-[#22c55e] text-black hover:bg-[#16a34a] px-4 py-2 rounded-lg font-medium"
                >
                  {t("dashboard.purchaseFirst")}
                </Link>
              </div>
            ) : (
              licenses.map((license) => (
                <div key={license.id} className="p-4 hover:bg-[#1a1a1a]/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      {license.product.icon ? (
                        <span className={`icon-minecraft-sm ${license.product.icon}`} />
                      ) : null}
                      {license.product.name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      license.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-gray-800 text-gray-400 border border-[#333]"
                    }`}>
                      {license.status === "ACTIVE" ? t("common.active") : t("dashboard.expired")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {license._count.activations} {license._count.activations === 1 ? t("dashboard.server") : t("dashboard.servers")}
                    </span>
                    <span>
                      {t("dashboard.expires")}: {new Date(license.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pixel-frame pixel-frame-blue bg-[#111] border border-[#222] rounded-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="p-5 border-b border-[#222] flex justify-between items-center">
            <IconHeader name="ShoppingCart" iconClassName="w-5 h-5 text-blue-400">
              {t("dashboard.recentOrders")}
            </IconHeader>
            <Link href="/orders" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              {t("dashboard.viewAll")} <Icon name="ArrowRight" className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-[#222]">
            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="ShoppingCart" className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t("dashboard.noOrders")}</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-[#1a1a1a]/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-white">#{order.orderNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      order.status === "COMPLETED"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    }`}>
                      {order.status === "COMPLETED" ? t("admin.completed") : t("admin.pending")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {order.items.length} {order.items.length === 1 ? t("store.server") : t("store.servers")}
                    </span>
                    <span className="text-white font-medium">
                      ${Math.round(order.total).toLocaleString("es-CL")} CLP
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="pixel-frame bg-[#111] border border-[#222] rounded-xl p-6 relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-lg font-semibold text-white mb-4">{t("dashboard.manageDescription")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/licenses" className="pixel-frame p-4 rounded-xl bg-[#0a0a0a] border border-[#222] hover:border-green-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-green-500/20 transition-all"></div>
              <div className="relative">
                <Icon name="Key" className="w-8 h-8 text-green-400 mb-3" />
                <h3 className="text-white font-medium mb-1">{t("dashboard.licenses")}</h3>
                <p className="text-sm text-gray-400">{t("dashboard.manageDescription")}</p>
              </div>
            </Link>
            <Link href="/dashboard/orders" className="pixel-frame pixel-frame-blue p-4 rounded-xl bg-[#0a0a0a] border border-[#222] hover:border-blue-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-all"></div>
              <div className="relative">
                <Icon name="ShoppingCart" className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-medium mb-1">{t("dashboard.orders")}</h3>
                <p className="text-sm text-gray-400">{t("dashboard.viewAll")}</p>
              </div>
            </Link>
            <Link href="/dashboard/downloads" className="pixel-frame pixel-frame-blue p-4 rounded-xl bg-[#0a0a0a] border border-[#222] hover:border-purple-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-purple-500/20 transition-all"></div>
              <div className="relative">
                <Icon name="Download" className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="text-white font-medium mb-1">{t("dashboard.downloads")}</h3>
                <p className="text-sm text-gray-400">{t("downloads.downloadLatest")}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
