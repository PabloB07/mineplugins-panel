import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { 
  Plus, 
  Package, 
  Edit, 
  Eye, 
  EyeOff, 
  DollarSign, 
  Server,
  TrendingUp
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
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Hero - Gradient Background */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
              <Package className="w-8 h-8 text-[#f59e0b]" />
              Products
            </h1>
            <p className="text-gray-400 max-w-lg text-lg">
              Manage your store products and versions. Control pricing, availability, and downloads.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-sm">
                <Package className="w-4 h-4 mr-2" />
                {products.length} Total Products
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                {products.filter(p => p.isActive).length} Active
              </div>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <DollarSign className="w-4 h-4 mr-2" />
                {products.reduce((acc, p) => acc + p.licenses.length, 0)} Total Licenses
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <Link
              href="/admin/products/new"
              className="bg-[#f59e0b] text-black hover:bg-[#d97706] px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#f59e0b]/20"
            >
              <Plus className="w-5 h-5" />
              New Product
            </Link>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="relative bg-[#111] rounded-xl border border-[#222] p-16 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f59e0b]/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-[#181818] border border-[#333] rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Products Yet</h3>
            <p className="text-gray-400 mb-6 text-lg">Start by creating your first store product.</p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 bg-[#f59e0b] text-black hover:bg-[#d97706] font-bold py-3 px-6 rounded-xl transition-transform hover:scale-105 shadow-lg shadow-[#f59e0b]/20"
            >
              <Plus className="w-5 h-5" />
              Create Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden hover:border-[#f59e0b]/20 transition-all duration-300">
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
                     <tr key={product.id} className="hover:bg-[#151515] transition-colors group">
                       <td className="px-6 py-4">
                         <div>
                           <div className="text-white font-bold text-lg mb-1 group-hover:text-[#f59e0b] transition-colors">
                             {product.name}
                           </div>
                           <div className="text-sm text-gray-400 mb-2 max-w-xs truncate">
                             {product.description}
                           </div>
                           <div className="text-xs text-gray-500">
                             Slug: {product.slug}
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         {latestVersion ? (
                           <div>
                             <div className="text-white text-sm font-medium group-hover:text-[#f59e0b] transition-colors">
                               v{latestVersion.version}
                             </div>
                             <div className="text-xs text-gray-400">
                               {new Date(latestVersion.publishedAt).toLocaleDateString()}
                             </div>
                             <div className="flex items-center gap-1 mt-1">
                               {latestVersion.isBeta && (
                                 <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs rounded">
                                   Beta
                                 </span>
                               )}
                               {latestVersion.isLatest && (
                                 <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs rounded">
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
                         <div className="bg-[#0a0a0a]/50 rounded-xl p-3 border border-[#222] hover:border-[#f59e0b]/30 transition-all min-w-[220px]">
                           <div className="flex items-center gap-2 mb-2">
                             <DollarSign className="w-4 h-4 text-[#f59e0b]" />
                             <span className="text-sm text-gray-400">Price</span>
                           </div>
                           {product.salePriceUSD ? (
                             <div>
                               <div className="text-[#f59e0b] font-bold text-lg">
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
                        <div className="space-y-3 min-w-[220px]">
                           <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                             <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-lg p-2 border border-[#222] hover:border-[#f59e0b]/30 transition-all">
                               <Package className="w-3 h-3 text-[#22c55e]" />
                               <span className="text-gray-300">{licenseCount} licenses</span>
                             </div>
                             <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-lg p-2 border border-[#222] hover:border-[#f59e0b]/30 transition-all">
                               <DollarSign className="w-3 h-3 text-blue-400" />
                               <span className="text-gray-300">{orderCount} orders</span>
                             </div>
                             <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-lg p-2 border border-[#222] hover:border-[#f59e0b]/30 transition-all">
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
                               ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                                : "bg-[#181818] text-gray-400 border border-[#333]"
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
                             className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-500/20"
                             title="Edit"
                           >
                             <Edit className="w-4 h-4" />
                           </Link>
                           <Link
                             href={`/admin/products/${product.id}/versions`}
                             className="text-[#f59e0b] hover:text-[#d97706] p-2 hover:bg-[#f59e0b]/10 rounded-lg transition-all duration-200 border border-transparent hover:border-[#f59e0b]/20"
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
