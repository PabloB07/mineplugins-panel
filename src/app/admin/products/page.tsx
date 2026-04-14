"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/i18n/useTranslation";
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
  icon: string | null;
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
  createdAt: string;
}

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const Package = useIcon("Package");
  const Plus = useIcon("Plus");
  const Search = useIcon("Search");
  const Filter = useIcon("Filter");
  const Eye = useIcon("Eye");
  const EyeOff = useIcon("EyeOff");
  const Download = useIcon("Download");
  const Key = useIcon("Key");
  const BarChart3 = useIcon("BarChart3");
  const Edit = useIcon("Edit");
  const Loader2 = useIcon("Loader2");
  const ChevronLeft = useIcon("ChevronLeft");
  const ChevronRight = useIcon("ChevronRight");
  const DollarSign = useIcon("DollarSign");
  const ShoppingCart = useIcon("ShoppingCart");
  const Trash2 = useIcon("Trash2");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("active", filter === "active" ? "true" : "false");
      if (search) params.set("search", search);
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
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
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filter, search]);

  const totalProducts = pagination.total;
  const activeProducts = products.filter(p => p.isActive).length;
  const totalLicenses = products.reduce((acc, p) => acc + p._count.licenses, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-[#f59e0b]" />
              {t("admin.productManagementTitle")}
            </h1>
            <p className="text-gray-400 mt-1">{t("admin.manageProducts")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400 bg-[#1a1a1a] px-3 py-2 rounded-lg border border-[#333]">
              {t("admin.totalProductsCount").replace("{count}", totalProducts.toString())}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111] rounded-xl border border-[#222] p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          {/* Search */}
          <form onSubmit={(e) => { e.preventDefault(); setPagination(prev => ({ ...prev, page: 1 })); }} className="flex-1 lg:flex-initial lg:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.searchProduct")}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-[#f59e0b]/50 transition-colors"
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{t("admin.filterByStatus")}</span>
            <div className="flex flex-wrap gap-2">
              {["all", "active", "inactive"].map((status) => {
                const icons = {
                  all: <Package className="w-4 h-4" />,
                  active: <Eye className="w-4 h-4" />,
                  inactive: <EyeOff className="w-4 h-4" />,
                };
                const labels = {
                  all: t("admin.allStatus"),
                  active: t("admin.activeStatus"),
                  inactive: t("admin.inactiveStatus"),
                };
                return (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      filter === status
                        ? "bg-[#f59e0b] text-black shadow-lg shadow-[#f59e0b]/30"
                        : "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
                    }`}
                  >
                    {icons[status as keyof typeof icons]}
                    {labels[status as keyof typeof labels]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] border-b border-[#222]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                  <Key className="w-4 h-4 inline" /> Licenses
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                  <ShoppingCart className="w-4 h-4 inline" /> Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#f59e0b]" />
                      {t("admin.loadingProducts")}
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    {t("admin.noProductsFound")}
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const latestVersion = product.versions.find(v => v.isLatest);
                  return (
                    <tr key={product.id} className="hover:bg-[#1a1a1a]/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                              <Image src={product.image} alt={product.name} fill className="object-cover" />
                            </div>
                          ) : product.icon ? (
                            <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] border border-[#333] flex items-center justify-center shrink-0">
                              <span className={`icon-minecraft-sm ${product.icon}`} />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/20 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-[#f59e0b]" />
                            </div>
                          )}
                          <div>
                            <div className="text-white text-sm font-medium flex items-center gap-2">
                              {product.name}
                              <CopyButton text={product.slug} />
                            </div>
                            <div className="text-gray-500 text-xs flex items-center gap-2">
                              /{product.slug} · v{latestVersion?.version || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          product.isActive
                            ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                            : "bg-[#181818] text-gray-400 border border-[#333]"
                        }`}>
                          {product.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white text-sm font-medium">
                          ${product.salePriceUSD ? product.salePriceUSD.toFixed(2) : product.priceUSD.toFixed(2)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatCLPValue(product.salePriceCLP || product.priceCLP)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-[#22c55e] text-sm font-medium">{product._count.licenses}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-blue-400 text-sm font-medium">{product._count.orders}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300 text-sm">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
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
                            <Download className="w-4 h-4" />
                          </Link>
                          <DeleteProductButton
                            productId={product.id}
                            deleteAction={async () => {
                              await fetch(`/api/admin/products?id=${product.id}`, { method: "DELETE" });
                              fetchProducts();
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-[#111] rounded-xl border border-[#222] p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {t("admin.showPagination")} {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} {t("admin.to")}{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} {t("admin.of")} {pagination.total} {t("admin.productsLower")}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-[#1a1a1a] text-gray-300 rounded hover:bg-[#222] border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("common.previous")}
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
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`px-3 py-1 text-sm rounded ${
                        pagination.page === pageNum
                          ? "bg-[#f59e0b] text-black"
                          : "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {pagination.totalPages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                      className={`px-3 py-1 text-sm rounded ${
                        pagination.page === pagination.totalPages
                          ? "bg-[#f59e0b] text-black"
                          : "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
                      }`}
                    >
                      {pagination.totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-[#1a1a1a] text-gray-300 rounded hover:bg-[#222] border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("common.next")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}