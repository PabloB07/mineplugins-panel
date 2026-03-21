"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { Check, Zap, Server, Shield, ShoppingCart } from "lucide-react";

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
  maxActivations: number;
  versions: { version: string }[];
}

interface ProductGridProps {
  products: Product[];
  session: Session | null;
}

interface Session {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

function CreeperVoxelIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      className="drop-shadow-[0_0_6px_rgba(124,252,0,0.9)]"
    >
      <rect x="0" y="0" width="16" height="16" fill="#1f7a2e" />
      <rect x="1" y="1" width="14" height="14" fill="#2fbf3f" />
      <rect x="2" y="2" width="12" height="12" fill="#7CFC00" />
      <rect x="2" y="3" width="2" height="2" fill="#56d84e" />
      <rect x="10" y="2" width="3" height="2" fill="#56d84e" />
      <rect x="5" y="5" width="3" height="2" fill="#56d84e" />
      <rect x="11" y="9" width="2" height="3" fill="#56d84e" />
      <rect x="3" y="4" width="3" height="3" fill="#0f2112" />
      <rect x="10" y="4" width="3" height="3" fill="#0f2112" />
      <rect x="6" y="7" width="4" height="3" fill="#0f2112" />
      <rect x="5" y="9" width="2" height="4" fill="#0f2112" />
      <rect x="9" y="9" width="2" height="4" fill="#0f2112" />
    </svg>
  );
}

export default function ProductGrid({ products, session }: ProductGridProps) {
  const { t, formatPrice, currency } = useTranslation();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#111] rounded-2xl border border-[#222]">
        <div className="w-16 h-16 bg-[#181818] border border-[#333] rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8 text-gray-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{t("store.empty")}</h2>
        <p className="text-neutral-400">{t("store.emptyDesc")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => {
        const latestVersion = product.versions[0];
        const isOnSale = product.salePriceUSD && product.salePriceUSD < product.priceUSD;
        const displayPriceUSD = isOnSale && product.salePriceUSD ? product.salePriceUSD : product.priceUSD;
        const displayPriceCLP = isOnSale && product.salePriceCLP ? product.salePriceCLP : product.priceCLP;
        const originalPriceUSD = product.priceUSD;
        const currentPriceFormatted = formatPrice(displayPriceUSD, displayPriceCLP);
        const originalPriceFormatted = formatPrice(originalPriceUSD, product.priceCLP);

        return (
          <div key={product.id} className="group relative bg-[#111] hover:bg-[#151515] rounded-2xl border border-[#222] hover:border-green-500/50 overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(34,197,94,0.2)] flex flex-col hover:-translate-y-1">
            {/* Header Image Section */}
            <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Zap className="w-16 h-16 text-green-500/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
            </div>

            <div className="p-6 pb-0">
              <div className="flex justify-between items-start mb-4">
                {isOnSale && (
                  <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30">
                    {t("store.sale")}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
                {product.name}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4 h-10 line-clamp-2">
                {product.description}
              </p>
            </div>

            {/* Features / Details */}
            <div className="px-6 space-y-2 mb-6">
              {latestVersion && (
                <div className="flex items-center text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>{t("store.latestVersion")}: <span className="font-mono text-green-400">v{latestVersion.version}</span></span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-300">
                <Server className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>{product.maxActivations} {product.maxActivations > 1 ? t("store.activations_plural") : t("store.activations")}</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <Shield className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>{t("store.support")}</span>
              </div>
            </div>

            {/* Spacer to push footer down */}
            <div className="flex-1"></div>

            {/* Footer / Price / Button */}
            <div className="p-6 pt-0 mt-2">
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">
                    {currentPriceFormatted}
                  </span>
                  {isOnSale && (
                    <span className="text-sm text-gray-500 line-through">
                      {originalPriceFormatted}
                    </span>
                  )}
                </div>
                {currency === 'CLP' && (
                  <div className="text-xs text-gray-500">
                    {t("store.chileOnly")}
                  </div>
                )}
              </div>

              {session ? (
                <Link
                  href={`/checkout?productId=${product.id}`}
                  className="group block w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-3 rounded-xl text-center transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 inline-flex items-center justify-center gap-2"
                >
                  <span>{t("store.purchase")}</span>
                  <span className="max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-w-6 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1">
                    <CreeperVoxelIcon />
                  </span>
                </Link>
              ) : (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/store?productId=${product.id}`)}`}
                  className="block w-full bg-[#181818] hover:bg-[#222] text-gray-300 hover:text-white font-semibold py-3 rounded-xl text-center transition-all border border-[#333] hover:border-[#444]"
                >
                  {t("store.loginToPurchase")}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
