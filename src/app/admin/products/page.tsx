"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useIcon } from "@/hooks/useIcon";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { formatCLPValue } from "@/lib/pricing";
import ProductVersionSelector from "@/components/admin/ProductVersionSelector";
import CopyButton from "@/components/admin/CopyButton";
import ApiTokenButton from "@/components/admin/ApiTokenButton";

interface ProductVersion {
  id: string;
  version: string;
  publishedAt: Date;
  isBeta: boolean;
  isLatest: boolean;
  isMandatory: boolean;
  downloadUrl: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  priceUSD: number;
  priceCLP: number;
  salePriceUSD: number | null;
  salePriceCLP: number | null;
  defaultDurationDays: number;
  maxActivations: number;
  isActive: boolean;
  apiToken: string | null;
  versions: ProductVersion[];
  _count: {
    licenses: number;
    orders: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminProductsPage() {
  const Plus = useIcon("Plus");
  const Package = useIcon("Package");
  const Edit = useIcon("Edit");
  const Eye = useIcon("Eye");
  const EyeOff = useIcon("EyeOff");
  const DollarSign = useIcon("DollarSign");
  const Server = useIcon("Server");
  const TrendingUp = useIcon("TrendingUp");
  const Search = useIcon("Search");
  const Filter = useIcon("Filter");
  const ChevronLeft = useIcon("ChevronLeft");
  const ChevronRight = useIcon("ChevronRight");
  const Loader2 = useIcon("Loader2");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "active") params.append("active", "true");
      if (filter === "inactive") params.append("showAll", "true");
      if (search) params.append("search", search);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, search, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filter, search]);

  const totalStats = {
    total: pagination.total,
    active: products.filter((p) => p.isActive).length,
    licenses: products.reduce((acc, p) => acc + p._count.licenses, 0),
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Package className="w-7 h-7 text-[#f59e0b]" />
              Products
            </h1>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-sm">
                <Package className="w-3 h-3 mr-1.5" />
                {totalStats.total} Total
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
                <TrendingUp className="w-3 h-3 mr-1.5" />
                {totalStats.active} Active
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <DollarSign className="w-3 h-3 mr-1.5" />
                {totalStats.licenses} Licenses
              </span>
            </div>
          </div>
          <Link
            href="/admin/products/new"
            className="bg-[#f59e0b] text-black hover:bg-[#d97706] px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#f59e0b]/20"
          >
            <Plus className="w-5 h-5" />
            New Product
          </Link>
        </div>
      </div>

      <div className="bg-[#111] rounded-xl border border-[#222] p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm font-medium">Status:</span>
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === status
                  ? "bg-[#f59e0b] text-black border border-[#f59e0b]/50"
                  : "bg-[#1a1a1a] text-gray-300 border border-[#333] hover:bg-[#222]"
              }`}
            >
              {status === "all" ? "All" : status === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
        <div className="flex-1 w-full md:max-w-xs relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#f59e0b]/50"
          />
        </div>
        <div className="text-sm text-gray-400">
          Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#f59e0b] animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-[#111] rounded-xl border border-[#222] p-16 text-center">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Products Found</h3>
          <p className="text-gray-400 mb-6">
            {search ? "Try adjusting your search or filters." : "Create your first store product."}
          </p>
          {!search && (
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 bg-[#f59e0b] text-black hover:bg-[#d97706] font-bold py-2 px-5 rounded-xl"
            >
              <Plus className="w-5 h-5" />
              Create Product
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-[#111] rounded-xl border border-[#222] p-5 hover:border-[#f59e0b]/30 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white truncate">{product.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                        product.isActive
                          ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                          : "bg-[#181818] text-gray-400 border border-[#333]"
                      }`}
                    >
                      {product.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description || "No description"}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-xs text-gray-500 bg-[#0a0a0a] px-2 py-1 rounded border border-[#222]">
                      /{product.slug}
                    </div>
                    <CopyButton text={product.slug} />
                    <div className="text-xs text-gray-500 bg-[#0a0a0a] px-2 py-1 rounded border border-[#222]">
                      v{product.versions.find((v) => v.isLatest)?.version || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                  <div className="text-center min-w-[100px]">
                    <div className="text-xs text-gray-500 mb-1">Price</div>
                    <div className="text-lg font-bold text-white">
                      ${product.salePriceUSD ? product.salePriceUSD.toFixed(2) : product.priceUSD.toFixed(2)} USD
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatCLPValue(product.salePriceCLP || product.priceCLP)}
                    </div>
                  </div>

                  <div className="flex gap-4 text-center min-w-[100px]">
                    <div>
                      <div className="text-xs text-gray-500">Licenses</div>
                      <div className="text-lg font-bold text-[#22c55e]">{product._count.licenses}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Orders</div>
                      <div className="text-lg font-bold text-blue-400">{product._count.orders}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ApiTokenButton productId={product.id} apiToken={product.apiToken} />
                    <ProductVersionSelector
                      versions={product.versions.map((v) => ({
                        id: v.id,
                        version: v.version,
                        isLatest: v.isLatest,
                        isBeta: v.isBeta,
                        isMandatory: v.isMandatory,
                        downloadUrl: v.downloadUrl,
                      }))}
                      productId={product.id}
                    />
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="p-2 hover:bg-blue-500/10 rounded-lg transition-all text-blue-400 hover:text-blue-300"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}/versions`}
                      className="p-2 hover:bg-[#f59e0b]/10 rounded-lg transition-all text-[#f59e0b] hover:text-[#d97706]"
                      title="Versions"
                    >
                      <Package className="w-4 h-4" />
                    </Link>
                    <DeleteProductButton
                      productId={product.id}
                      deleteAction={async () => {
                        await fetch(`/api/admin/products?id=${product.id}`, { method: "DELETE" });
                        fetchProducts();
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (pagination.totalPages > 5) {
                if (pagination.page > 3) {
                  pageNum = pagination.page - 2 + i;
                }
                if (pageNum > pagination.totalPages) {
                  return null;
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    pagination.page === pageNum
                      ? "bg-[#f59e0b] text-black"
                      : "bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
