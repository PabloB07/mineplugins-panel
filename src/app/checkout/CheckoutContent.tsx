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
import { Zap, ArrowLeft } from "lucide-react";

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
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
      <div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          {t("checkout.title")}
        </h1>
        <p className="text-gray-400 text-lg">
          {t("checkout.subtitle")}
        </p>
      </div>

      <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden shadow-2xl shadow-black/50">
        <div className="p-8 border-b border-[#222] bg-gradient-to-r from-[#111] to-[#151515]">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-900/40 to-green-900/10 border border-green-500/20 flex items-center justify-center text-green-500 shadow-inner shadow-green-500/10">
                  <Zap className="w-8 h-8" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{product.name}</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-[#222] text-gray-300 px-2 py-0.5 rounded border border-[#333]">Legacy</span>
                  {latestVersion && (
                    <span className="text-green-500 font-mono">v{latestVersion.version}</span>
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

        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium text-white">{product.defaultDurationDays} {t("checkout.daysAccess")}</div>
                <div className="text-xs text-gray-500">{t("checkout.fullAccessPeriod")}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
              <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              <div>
                <div className="font-medium text-white">{product.maxActivations} {t("checkout.serverIps")}</div>
                <div className="text-xs text-gray-500">{t("checkout.simultaneousActivations")}</div>
              </div>
            </div>
          </div>

          {hasDiscount && (
            <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <span className="text-green-400 font-medium">{t("checkout.discountApplied")}</span>
              <span className="text-green-400 font-bold">
                -${Math.round(product.priceUSD - displayPriceUSD)} USD
              </span>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 mb-3 block">
          {t("checkout.selectPaymentMethod")}
        </label>
        <div className="grid grid-cols-1 gap-3">
          {availableMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                selectedMethod === method.id
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-[#2a2a2a] bg-[#121212] hover:border-[#333]"
              }`}
            >
              <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-[#303030] bg-[#0d0d0d]">
                <Image
                  src={method.logo}
                  alt={method.name}
                  width={96}
                  height={28}
                  className="h-5 w-auto object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{method.name}</p>
                <p className="text-xs text-gray-500">{method.description}</p>
              </div>
              {selectedMethod === method.id && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none"></div>
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t("checkout.backToStore")}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-7">
            <CheckoutContent product={product} />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#111] rounded-2xl border border-[#222] p-6">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src="https://mineatar.io/head/8667ba71-b85a-4004-af54-4a56a6a56d5e.png" 
                  alt="Player"
                  className="w-16 h-16 rounded-lg border-2 border-green-500/30"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">{t("checkout.orderSummary")}</h3>
                  <p className="text-sm text-gray-400">{product.session.name || product.session.email}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("checkout.product")}</span>
                  <span className="text-white">{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("checkout.duration")}</span>
                  <span className="text-white">{product.defaultDurationDays} {t("checkout.days")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("checkout.activations")}</span>
                  <span className="text-white">{product.maxActivations}</span>
                </div>
                <div className="border-t border-[#222] pt-3 flex justify-between">
                  <span className="text-gray-400">{t("checkout.total")}</span>
                  <span className="text-white font-bold">${Math.round(product.salePriceUSD || product.priceUSD).toLocaleString()} USD</span>
                </div>
              </div>
            </div>

            <div className="bg-[#111] rounded-2xl border border-[#222] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t("checkout.includes")}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">{t("checkout.instantDelivery")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">{t("checkout.freeUpdates")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
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