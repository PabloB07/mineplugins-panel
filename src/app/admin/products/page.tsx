import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Plus, Package, Edit, Eye, EyeOff, DollarSign, Calendar } from "lucide-react";
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
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-gray-400 mt-1">Manage your plugin products and versions</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Products Yet</h3>
          <p className="text-gray-400 mb-4">Start by creating your first plugin product.</p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Product
          </Link>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Latest Version</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Pricing</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Stats</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {products.map((product: ProductItem) => {
                  const latestVersion = product.versions[0];
                  const licenseCount = product.licenses.length;
                  const orderCount = product.orders.length;

                  return (
                    <tr key={product.id} className="hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{product.name}</div>
                          <div className="text-sm text-gray-400">{product.slug}</div>
                          {product.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {product.description}
                            </div>
                          )}
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
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-300">{licenseCount} licenses</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-300">{orderCount} orders</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-300">
                              {product.maxActivations} server(s)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive
                              ? "bg-green-900 text-green-300"
                              : "bg-gray-700 text-gray-300"
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
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-blue-400 hover:text-blue-300 p-1 hover:bg-gray-600/50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/versions`}
                            className="text-green-400 hover:text-green-300 p-1 hover:bg-gray-600/50 rounded transition-colors"
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