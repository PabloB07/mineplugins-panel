import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Overview of your TownyFaiths license system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-blue-400">{totalUsers}</div>
          <div className="text-gray-400 text-sm mt-1">Total Users</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-green-400">
            {activeLicenses}
          </div>
          <div className="text-gray-400 text-sm mt-1">Active Licenses</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-purple-400">
            {completedOrders}
          </div>
          <div className="text-gray-400 text-sm mt-1">Completed Orders</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-yellow-400">
            ${((totalRevenue._sum.total || 0) / 100).toLocaleString("es-CL")}
          </div>
          <div className="text-gray-400 text-sm mt-1">Total Revenue (CLP)</div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-white">{totalLicenses}</div>
          <div className="text-gray-400 text-sm">Total Licenses</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-white">{totalOrders}</div>
          <div className="text-gray-400 text-sm">Total Orders</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-white">
            {recentValidations}
          </div>
          <div className="text-gray-400 text-sm">Validations (24h)</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Licenses */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Recent Licenses</h2>
            <Link
              href="/admin/licenses"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-700">
            {recentLicenses.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">
                No licenses yet
              </div>
            ) : (
              recentLicenses.map((license: License) => (
                <div
                  key={license.id}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white text-sm">
                      {license.user.email}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {license.product.name} -{" "}
                      {new Date(license.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      license.status === "ACTIVE"
                        ? "bg-green-900 text-green-300"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {license.status}
                  </span>
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
              href="/admin/orders"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-700">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">
                No orders yet
              </div>
            ) : (
              recentOrders.map((order: Order) => (
                <div
                  key={order.id}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white text-sm font-mono">
                      {order.orderNumber}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {order.user.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
                      ${(order.total / 100).toLocaleString("es-CL")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Validations */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 mt-6">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            Recent Validation Attempts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Server ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {validationLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No validation logs yet
                  </td>
                </tr>
              ) : (
                validationLogs.map((log: ValidationLog) => (
                  <tr key={log.id}>
                    <td className="px-6 py-3 text-sm text-gray-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-300 font-mono">
                      {log.serverId.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-300">
                      {log.serverVersion || "N/A"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          log.isValid
                            ? "bg-green-900 text-green-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {log.isValid ? "Valid" : "Failed"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {log.failureReason || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
