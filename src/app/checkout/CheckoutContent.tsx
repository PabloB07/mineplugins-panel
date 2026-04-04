"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/i18n/useTranslation";
import { CombinedCheckoutButton } from "@/components/CombinedCheckoutButton";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { formatUSD, formatCLPValue } from "@/lib/pricing";
import {
  getAvailablePaymentMethods,
  PaymentMethodId,
} from "@/lib/payment-methods";
import { useIcon } from "@/hooks/useIcon";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  priceUSD: number;
  priceCLP: number;
  salePriceUSD: number | null;
  salePriceCLP: number | null;
  defaultDurationDays: number;
  maxActivations: number;
  versions: Array<{
    version: string;
    minMcVersion: string | null;
    minJavaVersion: string | null;
  }>;
  session: {
    name: string | null;
    email: string;
    role: string;
  };
}

interface CheckoutClientProps {
  product: ProductData;
}

export function CheckoutContent({ product }: CheckoutClientProps) {
  const { t, formatPrice } = useTranslation();
  const availableMethods = getAvailablePaymentMethods();
  const Zap = useIcon("Zap");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>(
    availableMethods.length > 0 ? availableMethods[0].id : "PAYKU"
  );

  const latestVersion = product.versions[0];
  const displayPriceUSD = product.salePriceUSD || product.priceUSD;
  const displayPriceCLP = product.salePriceCLP || product.priceCLP;
  const hasDiscount = !!product.salePriceUSD || !!product.salePriceCLP;

  if (availableMethods.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-center text-red-400">
            No payment methods configured. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden shadow-2xl shadow-black/50 group">
        <div className="p-6 border-b border-[#222] bg-gradient-to-r from-[#111] to-[#151515] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex gap-4">
              {product.icon ? (
                <div className="w-20 h-20 rounded-xl bg-[#0a0a0a] border border-[#333] flex items-center justify-center overflow-hidden">
                  <span className={`icon-minecraft ${product.icon}`} />
                </div>
              ) : product.image ? (
                <div className="w-20 h-20 rounded-xl bg-[#0a0a0a] border border-[#333] flex items-center justify-center overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      img.nextElementSibling?.classList.remove('hidden');
                    }}
                    unoptimized
                  />
                  <span className="icon-minecraft icon-minecraft-paper hidden scale-125"></span>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#0a0a0a] border border-[#333] flex items-center justify-center overflow-hidden">
                  <span className="icon-minecraft icon-minecraft-paper scale-125"></span>
                </div>
              )}
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">{product.name}</h2>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="bg-[#222] text-gray-300 px-2.5 py-0.5 rounded-md border border-[#333] text-xs font-medium">Legacy</span>
                  {latestVersion && (
                    <span className="text-green-400 font-mono text-xs bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">v{latestVersion.version}</span>
                  )}
                  {latestVersion?.minMcVersion && (
                    <span className="text-gray-400 text-xs bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-[#2a2a2a]">MC {latestVersion.minMcVersion}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <PriceDisplay
                priceUSD={displayPriceUSD}
                priceCLP={displayPriceCLP}
                salePriceUSD={product.salePriceUSD}
                salePriceCLP={product.salePriceCLP}
                size="lg"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1a1a1a] border border-[#222] hover:border-green-500/30 hover:bg-[#1f1f1f] transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{product.defaultDurationDays} {t("checkout.daysAccess")}</div>
                <div className="text-xs text-gray-500">{t("checkout.fullAccessPeriod")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1a1a1a] border border-[#222] hover:border-purple-500/30 hover:bg-[#1f1f1f] transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{product.maxActivations} {t("checkout.serverIps")}</div>
                <div className="text-xs text-gray-500">{t("checkout.simultaneousActivations")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1a1a1a] border border-[#222] hover:border-green-500/30 hover:bg-[#1f1f1f] transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{t("checkout.prioritySupport")}</div>
                <div className="text-xs text-gray-500">{t("checkout.fastDiscordSupport")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1a1a1a] border border-[#222] hover:border-orange-500/30 hover:bg-[#1f1f1f] transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{t("checkout.instantDelivery")}</div>
                <div className="text-xs text-gray-500">{t("checkout.automatedProcessing")}</div>
              </div>
            </div>
          </div>

          {hasDiscount && (
            <div className="mt-5 flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-green-400 font-medium text-sm">{t("checkout.discountApplied")}</span>
              </div>
              <span className="text-green-300 font-bold text-sm bg-green-500/20 px-3 py-1 rounded-lg">
                -${Math.round(product.priceUSD - displayPriceUSD)} USD
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
        <div className="p-4 border-b border-[#222] bg-[#0f0f0f]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {t("checkout.selectPaymentMethod")}
          </h3>
        </div>
        <div className="p-4 grid grid-cols-1 gap-3">
          {availableMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                selectedMethod === method.id
                  ? "border-green-500/50 bg-green-500/5 ring-1 ring-green-500/20"
                  : "border-[#2a2a2a] bg-[#151515] hover:border-[#3a3a3a] hover:bg-[#181818]"
              }`}
            >
              <div className="flex h-12 w-14 items-center justify-center rounded-lg border border-[#303030] bg-[#0d0d0d]">
                <Image
                  src={method.logo}
                  alt={method.name}
                  width={96}
                  height={28}
                  className="h-6 w-auto object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{method.name}</p>
                <p className="text-xs text-gray-500">{method.description}</p>
              </div>
              {selectedMethod === method.id && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30">
                  <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-1">
        <CombinedCheckoutButton
          productSlug={product.id}
          paymentMethod={selectedMethod}
          className="mt-1"
        />
      </div>

      <div className="rounded-xl border border-[#222] bg-[#0f0f0f] p-3">
        <p className="text-center text-[11px] uppercase tracking-[0.12em] text-gray-500">
          {t("checkout.poweredBy")} {availableMethods.find(m => m.id === selectedMethod)?.name || 'Payment'}
        </p>
      </div>
    </div>
  );
}

interface CheckoutWrapperProps {
  product: ProductData;
}

export default function CheckoutWrapper({ product }: CheckoutWrapperProps) {
  const { t } = useTranslation();
  const isAdmin = product.session.role === "ADMIN" || product.session.role === "SUPER_ADMIN";
  const Zap = useIcon("Zap");
  const ArrowLeft = useIcon("ArrowLeft");

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 relative overflow-hidden">
      <DashboardNavbar 
        user={{ 
          name: product.session.name, 
          email: product.session.email, 
          image: null 
        }} 
        isAdmin={isAdmin} 
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(135deg, #0f0f0f 25%, #1a1a1a 25%, #1a1a1a 50%, #0f0f0f 50%, #0f0f0f 75%, #1a1a1a 75%),
            linear-gradient(to bottom, transparent 60%, rgba(80, 60, 40, 0.1) 100%)
          `,
          backgroundSize: '4px 4px, 100% 100%',
          backgroundColor: '#0a0a0a'
        }}
      />
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none z-10"></div>
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t("checkout.backToStore")}</span>
        </Link>

        <div className="flex justify-center mb-8">
          <div className="relative">
            <img 
              src="https://api.mineatar.io/face/8667ba71-b85a-4004-af54-4a56a6a56d5e" 
              alt="Player"
              className="w-24 h-24 rounded-2xl border-4 border-green-500/30 shadow-lg shadow-green-500/20"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[#111] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-7">
            <CheckoutContent product={product} />
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
              <div className="p-4 border-b border-[#222] bg-gradient-to-r from-[#151515] to-[#111]">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {t("checkout.orderSummary")}
                </h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t("checkout.product")}</span>
                  <span className="text-white font-medium">{product.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t("checkout.duration")}</span>
                  <span className="text-white">{product.defaultDurationDays} {t("checkout.days")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t("checkout.activations")}</span>
                  <span className="text-white">{product.maxActivations}</span>
                </div>
                <div className="border-t border-[#222] pt-3 flex justify-between items-center">
                  <span className="text-gray-300 font-medium">{t("checkout.total")}</span>
                  <span className="text-green-400 font-bold text-lg">${Math.round(product.salePriceUSD || product.priceUSD).toLocaleString()} USD</span>
                </div>
              </div>
            </div>

            <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
              <div className="p-4 border-b border-[#222] bg-gradient-to-r from-[#151515] to-[#111]">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t("checkout.includes")}
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">{t("checkout.instantDelivery")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">{t("checkout.freeUpdates")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">{t("checkout.premiumSupport")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}