import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCLP } from "@/lib/pricing";

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

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Orders</h1>
          <p className="text-gray-400 mt-1">View your purchase history</p>
        </div>
        <Link
          href="/buy"
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-600/25"
        >
          Buy New License
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
          <div className="max-w-md mx-auto">
            <div className="text-5xl mb-4 opacity-20">📦</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
            <p className="text-gray-400 mb-6">You haven't purchased any licenses yet. Start by browsing our available products.</p>
            <Link
              href="/buy"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-2 px-6 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-600/25"
            >
              Browse Products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 bg-gray-700/30">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Order History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-700/20">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Order #</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Products</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Total</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">License</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm text-white bg-gray-700/50 px-2 py-1 rounded">
                          {order.orderNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                            <span className="text-sm text-gray-300">{item.product.name}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                     <div className="text-sm font-semibold text-emerald-400">
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
                                className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                                View License
                              </Link>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                  item.license.status === "ACTIVE"
                                    ? "bg-green-900/50 text-green-300"
                                    : item.license.status === "EXPIRED"
                                    ? "bg-red-900/50 text-red-300"
                                    : "bg-gray-700 text-gray-300"
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
                            ? "bg-green-900/50 text-green-300 border-green-700"
                            : order.status === "PENDING"
                            ? "bg-yellow-900/50 text-yellow-300 border-yellow-700"
                            : order.status === "FAILED"
                            ? "bg-red-900/50 text-red-300 border-red-700"
                            : "bg-gray-700 text-gray-300 border-gray-600"
                        }`}
                      >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                          order.status === "COMPLETED"
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
  );
}