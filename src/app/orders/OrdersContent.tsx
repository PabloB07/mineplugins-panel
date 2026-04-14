"use client";

import Link from "next/link";
import { formatCLPValue } from "@/lib/pricing";
import { useIcon } from "@/hooks/useIcon";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { useTranslation } from "@/i18n/useTranslation";

type OrderItem = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  total: number | null;
  status: string;
  items: {
    id: string;
    product: { name: string; icon: string | null };
    license: {
      id: string;
      status: string;
      expiresAt: Date | null;
      licenseKey: string;
    } | null;
  }[];
};

type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
};

type Props = {
  session: { user: User } | null;
  orders: OrderItem[];
};

export default function OrdersContent({ session, orders }: Props) {
  const { t } = useTranslation();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const ShoppingBag = useIcon("ShoppingBag");
  const Package = useIcon("Package");
  const ArrowRight = useIcon("ArrowRight");

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-zinc-950 text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-4">{t("orders.accessDenied")}</h1>
        <p className="text-gray-400">{t("orders.loginToView")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardNavbar user={session.user} isAdmin={isAdmin} />

      <div className="space-y-8 animate-fade-in pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="pixel-frame pixel-frame-blue relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                  {t("orders.title")}
                </h1>
                <p className="text-gray-400 max-w-lg text-lg">
                  {t("orders.subtitle")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {orders.length} {t("orders.totalOrders")}
                  </div>
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                    <Package className="w-4 h-4 mr-2" />
                    {orders.reduce((acc, order) => acc + order.items.length, 0)} {t("orders.products")}
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <Link
                  href="/store"
                  className="bg-[#22c55e] text-black hover:bg-[#16a34a] px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#22c55e]/20"
                >
                  <Package className="w-5 h-5" />
                  {t("orders.buyNewPlugin")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {orders.length === 0 ? (
            <div className="pixel-frame relative bg-[#111] rounded-xl border border-[#222] p-16 text-center overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10 max-w-md mx-auto">
                <div className="w-16 h-16 bg-[#181818] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#2a2a2a]">
                  <ShoppingBag className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{t("orders.noOrders")}</h3>
                <p className="text-gray-400 mb-6">{t("orders.noOrdersDesc")}</p>
                <Link
                  href="/store"
                  className="inline-flex items-center gap-2 bg-[#22c55e] text-black hover:bg-[#16a34a] font-bold py-3 px-6 rounded-xl transition-transform hover:scale-105 shadow-lg shadow-[#22c55e]/20"
                >
                  {t("orders.browseProducts")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="pixel-frame pixel-frame-blue bg-[#111] rounded-xl border border-[#222] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222] bg-[#151515]">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                  {t("orders.orderHistory")}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#222] bg-[#111]">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">{t("orders.orderNumber")}</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">{t("orders.products")}</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">{t("common.total")}</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">{t("orders.license")}</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">{t("orders.status")}</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">{t("orders.date")}</th>
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
                                {item.product.icon ? (
                                  <span className={`icon-minecraft-sm ${item.product.icon}`} />
                                ) : (
                                  <span className="w-2 h-2 bg-[#22c55e] rounded-full"></span>
                                )}
                                <span className="text-sm text-gray-300">{item.product.name}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-[#22c55e]">
                            {formatCLPValue(order.total ?? 0)}
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
                                    {t("orders.viewLicense")}
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
                                        {t("orders.expires")}: {new Date(item.license.expiresAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">{t("orders.noLicense")}</span>
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
