import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCLP } from "@/lib/pricing";

type License = {
  id: string;
  status: string;
  _count: {
    activations: number;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: Array<{
    product: {
      name: string;
    };
  }>;
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
    (acc: number, l: License) => acc + l._count.activations,
    0
  );

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {session.user.name || "User"}!
        </h1>
        <p className="text-gray-400 mt-1">
          Manage your TownyFaiths licenses and downloads
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-green-400">
            {activeLicenses}
          </div>
          <div className="text-gray-400 text-sm mt-1">Active Licenses</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-blue-400">
            {totalActivations}
          </div>
          <div className="text-gray-400 text-sm mt-1">Server Activations</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-purple-400">
            {orders.length}
          </div>
          <div className="text-gray-400 text-sm mt-1">Total Orders</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/buy"
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-lg p-6 text-center transition-all"
        >
          <div className="text-xl font-semibold text-white">Buy License</div>
          <p className="text-green-200 mt-1">
            Purchase a new TownyFaiths license
          </p>
        </Link>
        <Link
          href="/dashboard/downloads"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg p-6 text-center transition-all"
        >
          <div className="text-xl font-semibold text-white">Download Plugin</div>
          <p className="text-blue-200 mt-1">
            Get the latest version of TownyFaiths
          </p>
        </Link>
      </div>

      {/* Recent Licenses */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 mb-8">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Your Licenses</h2>
          <Link
            href="/dashboard/licenses"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-700">
          {licenses.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">
              No licenses yet.{" "}
              <Link href="/buy" className="text-blue-400 hover:text-blue-300">
                Purchase your first license
              </Link>
            </div>
          ) : (
            licenses.map((license: any) => (
              <div
                key={license.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-white">
                    {license.product.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    Expires:{" "}
                    {new Date(license.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      license.status === "ACTIVE"
                        ? "bg-green-900 text-green-300"
                        : license.status === "EXPIRED"
                        ? "bg-red-900 text-red-300"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {license.status}
                  </span>
                  <Link
                    href={`/dashboard/licenses/${license.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
          <Link
            href="/dashboard/orders"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-700">
          {orders.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">
              No orders yet.
            </div>
          ) : (
            orders.map((order: Order) => (
              <div
                key={order.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-white">
                    {order.orderNumber}
                  </div>
                  <div className="text-sm text-gray-400">
                    {order.items.map((i: Order['items'][0]) => i.product.name).join(", ")}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      order.status === "COMPLETED"
                        ? "bg-green-900 text-green-300"
                        : order.status === "PENDING"
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {formatCLP(order.total)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
