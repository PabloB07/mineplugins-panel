import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { 
  Plus, 
  Package, 
  Edit, 
  Eye, 
  EyeOff, 
  DollarSign, 
  Calendar,
  Server,
  TrendingUp,
  Search
} from "lucide-react";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { formatCLP } from "@/lib/pricing";

type ProductVersion = {
  version: string;
  publishedAt: Date;
  isBeta: boolean;
  isLatest: boolean;
};

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceUSD: number;
  priceCLP: number;
  salePriceUSD: number | null;
  salePriceCLP: number | null;
  defaultDurationDays: number;
  maxActivations: number;
  isActive: boolean;
  versions: ProductVersion[];
  licenses: { id: string }[];
  orders: { id: string }[];
};

async function deleteProduct(productId: string) {
  "use server";
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/products");
}

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      versions: {
        orderBy: { publishedAt: "desc" },
        take: 1,
      },
      licenses: {
        select: { id: true },
      },
      orders: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-emerald-400" />
            Products
          </h1>
          <p className="text-gray-400 mt-1">Manage your plugin products and versions</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium py-3 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-[#111] rounded-xl border border-[#222] shadow-xl">
          <Package className="w-20 h-20 text-gray-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-3">No Products Yet</h3>
          <p className="text-gray-400 mb-6 text-lg">Start by creating your first plugin product.</p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium py-3 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5" />
            Create Product
          </Link>
        </div>
      ) : (
        <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-[#222]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Latest Version</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Pricing</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {products.map((product: ProductItem) => {
                  const latestVersion = product.versions[0];
                  const licenseCount = product.licenses.length;
                  const orderCount = product.orders.length;

                  return (
                    <tr key={product.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-[#333]">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-gray-400">Price</span>
                          </div>
                          {product.salePriceUSD ? (
                            <div>
                              <div className="text-emerald-400 font-bold text-lg">
                                ${(product.salePriceUSD / 100).toFixed(2)} USD
                              </div>
                              <div className="text-sm text-gray-400">
                                {product.salePriceCLP && formatCLP(product.salePriceCLP)}
                              </div>
                              <div className="text-xs text-gray-500 line-through mt-1">
                                ${(product.priceUSD / 100).toFixed(2)} USD
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-white font-bold text-lg">
                                ${(product.priceUSD / 100).toFixed(2)} USD
                              </div>
                              <div className="text-sm text-gray-400">
                                {formatCLP(product.priceCLP)}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">
                            {product.defaultDurationDays} days
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {latestVersion ? (
                          <div>
                            <div className="text-white text-sm font-medium">
                              v{latestVersion.version}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(latestVersion.publishedAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {latestVersion.isBeta && (
                                <span className="px-1.5 py-0.5 bg-yellow-900 text-yellow-300 text-xs rounded">
                                  Beta
                                </span>
                              )}
                              {latestVersion.isLatest && (
                                <span className="px-1.5 py-0.5 bg-blue-900 text-blue-300 text-xs rounded">
                                  Latest
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No versions</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {product.salePriceUSD ? (
                            <div>
                              <div className="text-white font-medium">
                                ${(product.salePriceUSD / 100).toFixed(2)} USD
                              </div>
                              <div className="text-sm text-gray-400">
                                {product.salePriceCLP && formatCLP(product.salePriceCLP)}
                              </div>
                              <div className="text-sm text-gray-500 line-through mt-1">
                                ${(product.priceUSD / 100).toFixed(2)} USD
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-white font-medium">
                                ${(product.priceUSD / 100).toFixed(2)} USD
                              </div>
                              <div className="text-sm text-gray-400">
                                {formatCLP(product.priceCLP)}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {product.defaultDurationDays} days
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                            <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-lg p-2">
                              <Package className="w-3 h-3 text-emerald-400" />
                              <span className="text-gray-300">{licenseCount} licenses</span>
                            </div>
                            <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-lg p-2">
                              <DollarSign className="w-3 h-3 text-blue-400" />
                              <span className="text-gray-300">{orderCount} orders</span>
                            </div>
                            <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-lg p-2">
                              <Server className="w-3 h-3 text-purple-400" />
                              <span className="text-gray-300">{product.maxActivations} servers</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            product.isActive
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-gray-700/50 text-gray-300 border border-gray-600"
                          }`}
                        >
                          {product.isActive ? (
                            <>
                              <Eye className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-400/10 rounded-lg transition-colors border border-transparent hover:border-blue-400/20"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/versions`}
                            className="text-emerald-400 hover:text-emerald-300 p-2 hover:bg-emerald-400/10 rounded-lg transition-colors border border-transparent hover:border-emerald-400/20"
                            title="Manage Versions"
                          >
                            <Package className="w-4 h-4" />
                          </Link>
                          <DeleteProductButton
                            productId={product.id}
                            deleteAction={deleteProduct}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}