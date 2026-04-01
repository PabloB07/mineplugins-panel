"use client";

import { PriceDisplay, PriceSummary } from "@/components/ui/PriceDisplay";
import { useTranslation } from "@/i18n/useTranslation";

interface CheckoutPriceProps {
  priceUSD: number;
  priceCLP?: number;
  salePriceUSD?: number | null;
  salePriceCLP?: number | null;
  defaultDurationDays: number;
  maxActivations: number;
}

export function CheckoutPrices({ 
  priceUSD, 
  priceCLP, 
  salePriceUSD, 
  salePriceCLP,
  defaultDurationDays,
  maxActivations
}: CheckoutPriceProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Product Card Header Price */}
      <div className="text-right">
        <PriceDisplay 
          priceUSD={priceUSD}
          priceCLP={priceCLP}
          salePriceUSD={salePriceUSD}
          salePriceCLP={salePriceCLP}
          size="lg"
        />
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-medium text-white">{defaultDurationDays} {t("checkout.daysAccess")}</div>
            <div className="text-xs text-gray-500">{t("checkout.fullAccessPeriod")}</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
          <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
          <div>
            <div className="font-medium text-white">{maxActivations} {t("checkout.serverIps")}</div>
            <div className="text-xs text-gray-500">{t("checkout.simultaneousActivations")}</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
          <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <div>
            <div className="font-medium text-white">{t("checkout.prioritySupport")}</div>
            <div className="text-xs text-gray-500">{t("checkout.fastDiscordSupport")}</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
          <svg className="w-5 h-5 text-orange-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <div className="font-medium text-white">{t("checkout.instantDelivery")}</div>
            <div className="text-xs text-gray-500">{t("checkout.automatedProcessing")}</div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <PriceSummary
        priceUSD={priceUSD}
        priceCLP={priceCLP}
        salePriceUSD={salePriceUSD}
        salePriceCLP={salePriceCLP}
      />
    </>
  );
}
