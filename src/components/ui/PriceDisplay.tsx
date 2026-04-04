"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { formatUSD, formatCLPValue } from "@/lib/pricing";

interface PriceDisplayProps {
  priceUSD: number;
  priceCLP?: number;
  salePriceUSD?: number | null;
  salePriceCLP?: number | null;
  showOriginal?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({ 
  priceUSD, 
  priceCLP, 
  salePriceUSD, 
  salePriceCLP,
  showOriginal = true,
  size = "md",
  className = ""
}: PriceDisplayProps) {
  const { formatPrice, currency } = useTranslation();
  
  const displayPriceUSD = salePriceUSD || priceUSD;
  const displayPriceCLP = salePriceCLP || priceCLP || Math.round(priceUSD * 920);
  const hasDiscount = !!salePriceUSD && salePriceUSD < priceUSD;
  
  const currentPrice = formatPrice(displayPriceUSD, displayPriceCLP);
  const originalPrice = formatPrice(priceUSD, priceCLP);
  
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-baseline gap-2">
        <div className="icon-minecraft-sm icon-minecraft-diamond-block"></div>
        <span className={`font-bold text-white ${sizeClasses[size]}`}>
          {currentPrice}
        </span>
        {hasDiscount && showOriginal && (
          <span className="text-sm text-gray-500 line-through">
            {originalPrice}
          </span>
        )}
      </div>
      {currency === 'CLP' && (
        <div className="text-xs text-gray-500">
          Aproximado: {formatUSD(displayPriceUSD)}
        </div>
      )}
      {currency !== 'CLP' && (
        <div className="text-xs text-gray-500">
          ≈ {formatCLPValue(displayPriceCLP)}
        </div>
      )}
    </div>
  );
}

interface PriceSummaryProps {
  priceUSD: number;
  priceCLP?: number;
  salePriceUSD?: number | null;
  salePriceCLP?: number | null;
}

export function PriceSummary({ 
  priceUSD, 
  priceCLP, 
  salePriceUSD, 
  salePriceCLP 
}: PriceSummaryProps) {
  const { formatPrice, currency } = useTranslation();
  
  const displayPriceUSD = salePriceUSD || priceUSD;
  const displayPriceCLP = salePriceCLP || priceCLP || Math.round(priceUSD * 920);
  const hasDiscount = !!salePriceUSD && salePriceUSD < priceUSD;
  const savingsCLP = priceCLP && salePriceCLP ? priceCLP - salePriceCLP : Math.round((priceUSD - displayPriceUSD) * 920);

  const currentPrice = formatPrice(displayPriceUSD, displayPriceCLP);

  return (
    <div className="space-y-4 mb-7">
      <div className="flex justify-between text-gray-400">
        <span>Subtotal</span>
        <span>{currency === 'CLP' ? formatCLPValue(displayPriceCLP) : formatUSD(displayPriceUSD)}</span>
      </div>
      {hasDiscount && (
        <div className="flex justify-between text-green-500">
          <span>Discount</span>
          <span>Save {currency === 'CLP' ? formatCLPValue(savingsCLP) : formatUSD(priceUSD - displayPriceUSD)}</span>
        </div>
      )}
      <div className="h-px bg-[#222] my-3"></div>
      <div className="flex justify-between items-end">
        <span className="text-white font-medium">Total</span>
        <div className="text-right flex items-center gap-2">
          <div className="icon-minecraft-sm icon-minecraft-emerald-block"></div>
          <div className={`font-bold text-white ${currency === 'CLP' ? 'text-2xl' : 'text-3xl'}`}>
            {currentPrice}
          </div>
          <div className="text-xs text-gray-500 mb-1">
            ({currency === 'CLP' ? formatUSD(displayPriceUSD) : formatCLPValue(displayPriceCLP)})
          </div>
        </div>
      </div>
    </div>
  );
}
