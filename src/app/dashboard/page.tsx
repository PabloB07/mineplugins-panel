import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCLPValue } from "@/lib/pricing";
import {
  Download,
  ShoppingCart,
  Key,
  ShieldCheck,
  Clock,
  ArrowRight,
  Zap,
  Package
} from "lucide-react";

type License = {
  id: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  product: {
    name: string;
  };
  _count: {
    activations: number;
  };
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  // Get user's licenses
  const licenses = await prisma.license.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: { name: true },
      },
      _count: {
        select: { activations: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get recent orders
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Stats
  const activeLicenses = licenses.filter((l: License) => l.status === "ACTIVE").length;
  const totalActivations = licenses.reduce(
    (acc: number, l: License & { _count: { activations: number } }) => acc + l._count.activations,
    0
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Hero - Gradient Background */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              Welcome back, {session.user.name?.split(' ')[0] || "User"}!
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Your customer dashboard. Manage licenses, orders, and downloads all in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <Key className="w-4 h-4 mr-2" />
                {activeLicenses} Active Licenses
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <ShieldCheck className="w-4 h-4 mr-2" />
                {totalActivations} Activated Servers
              </div>
            </div>
          </div>

          {/* Quick Action Button within Hero (Optional but nice) */}
          <div className="hidden md:block">
            <Link href="/downloads" className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-white/5">
              <Download className="w-5 h-5" />
              Go to Downloads
            </Link>
          </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/store"
          className="group relative bg-[#111] hover:bg-[#151515] rounded-xl p-8 border border-[#222] hover:border-[#22c55e]/50 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingCart className="w-32 h-32 text-green-500 -mr-8 -mt-8 transform rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-lg bg-[#22c55e]/10 mb-6 flex items-center justify-center text-[#22c55e] border border-[#22c55e]/20 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-[#22c55e] transition-colors">Purchase a Plugin</h2>
            <p className="text-gray-400 mb-6 max-w-sm group-hover:text-gray-300">
              And get a plugin with license key for your Minecraft server. Instant delivery and activation.
            </p>
            <span className="inline-flex items-center text-sm font-medium text-[#22c55e] group-hover:translate-x-1 transition-transform">
              Browse Store <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </div>
        </Link>

        <Link
          href="/downloads"
          className="group relative bg-[#111] hover:bg-[#151515] rounded-xl p-8 border border-[#222] hover:border-blue-500/50 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Download className="w-32 h-32 text-blue-500 -mr-8 -mt-8 transform -rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 mb-6 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Downloads & Updates</h2>
            <p className="text-gray-400 mb-6 max-w-sm group-hover:text-gray-300">
              Get the latest versions of your plugins. Access archived releases and documentation.
            </p>
            <span className="inline-flex items-center text-sm font-medium text-blue-400 group-hover:translate-x-1 transition-transform">
              Go to Downloads <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Licenses List */}
        <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#151515]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-gray-400" />
              Your Licenses
            </h2>
            <Link href="/dashboard/licenses" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All
            </Link>
          </div>
          <div className="flex-1">
            {licenses.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <Key className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-white font-medium mb-1">No licenses yet</h3>
                <p className="text-gray-500 text-sm mb-4">Start by purchasing a license for your server.</p>
                <Link href="/store" className="text-sm bg-[#22c55e] text-white px-4 py-2 rounded-lg hover:bg-[#16a34a] transition-colors">
                  Buy Now
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#222]">
                {licenses.map((license) => (
                  <div key={license.id} className="p-4 hover:bg-[#1a1a1a] transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-12 rounded-full ${license.status === 'ACTIVE' ? 'bg-[#22c55e]' : 'bg-gray-700'}`}></div>
                      <div>
                        <div className="font-medium text-white group-hover:text-[#22c55e] transition-colors">
                          {license.product.name}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {license._count.activations} Activations
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires: {new Date(license.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/licenses/${license.id}`}
                      className="bg-[#222] hover:bg-[#333] text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                      Manage
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#151515]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-400" />
              Recent Orders
            </h2>
            <Link href="/dashboard/orders" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All
            </Link>
          </div>
          <div className="flex-1">
            {orders.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-white font-medium mb-1">No orders yet</h3>
                <p className="text-gray-500 text-sm">Your purchase history will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#222]">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-[#1a1a1a] transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-white">{order.orderNumber}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${order.status === 'COMPLETED' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
                            order.status === 'PENDING' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
                              'bg-red-900/20 text-red-400 border-red-900/30'
                          }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCLPValue(order.total)} • {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-right max-w-[150px] truncate">
                      {order.items.map(i => i.product.name).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
