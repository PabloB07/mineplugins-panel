"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/i18n/useTranslation";
import { CombinedCheckoutButton } from "@/components/CombinedCheckoutButton";
import { Icon } from "@/components/ui/Icon";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import {
  getAvailablePaymentMethods,
  PaymentMethodId,
} from "@/lib/payment-methods";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

interface ProductData {
  id: string;
  slug: string;
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

interface AppliedDiscount {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  discountCLP: number;
  discountUSD: number;
}

export function CheckoutContent({ product }: CheckoutClientProps) {
  const { t, formatPrice, formatPriceValue, currency } = useTranslation();
  const [enabledMethods, setEnabledMethods] = useState<Array<{id: PaymentMethodId; enabled: boolean}>>([
    { id: "PAYKU", enabled: true },
    { id: "TEBEX", enabled: true },
    { id: "PAYPAL", enabled: true },
  ]);

  const availableMethods = getAvailablePaymentMethods().filter(m => 
    enabledMethods.some(em => em.id === m.id && em.enabled)
  );
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>(
    availableMethods.length > 0 ? availableMethods[0].id : "PAYKU"
  );
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

  const latestVersion = product.versions[0];
  const displayPriceUSD = product.salePriceUSD || product.priceUSD;
  const displayPriceCLP = product.salePriceCLP || product.priceCLP;
  const hasDiscount = !!product.salePriceUSD || !!product.salePriceCLP;
  const appliedDiscountCLP = appliedDiscount?.discountCLP || 0;
  const appliedDiscountUSD = appliedDiscount?.discountUSD || 0;
  const totalCLPWithDiscount = Math.max(0, displayPriceCLP - appliedDiscountCLP);
  const totalUSDWithDiscount = Math.max(0, displayPriceUSD - appliedDiscountUSD);

  useEffect(() => {
    fetch("/api/payment/methods")
      .then(res => res.json())
      .then(data => {
        if (data.methods) {
          setEnabledMethods(data.methods.map((m: {id: PaymentMethodId; enabled: boolean}) => ({
            id: m.id,
            enabled: m.enabled,
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedMethod && !enabledMethods.some(em => em.id === selectedMethod && em.enabled)) {
      const firstEnabled = enabledMethods.find(em => em.enabled);
      if (firstEnabled) {
        setSelectedMethod(firstEnabled.id as PaymentMethodId);
      }
    }
  }, [enabledMethods, selectedMethod]);

  const applyDiscount = async () => {
    const normalizedCode = discountCodeInput.trim().toUpperCase();
    if (!normalizedCode) {
      setDiscountError(t("checkout.discountCodeRequired"));
      return;
    }

    setIsApplyingDiscount(true);
    setDiscountError(null);

    try {
      const params = new URLSearchParams({
        code: normalizedCode,
        productId: product.id,
        currency,
        subtotal: String(formatPriceValue(displayPriceUSD, displayPriceCLP).value),
      });

      const res = await fetch(`/api/discounts?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data?.valid || !data?.discount) {
        const errorKey = String(data?.error || "");
        const errorMap: Record<string, string> = {
          MISSING_CODE: "checkout.discountErrors.missingCode",
          INVALID_CODE: "checkout.discountErrors.invalidCode",
          INACTIVE_CODE: "checkout.discountErrors.inactiveCode",
          EXPIRED_CODE: "checkout.discountErrors.expiredCode",
          NOT_STARTED: "checkout.discountErrors.notStarted",
          LIMIT_REACHED: "checkout.discountErrors.limitReached",
          INVALID_PRODUCT: "checkout.discountErrors.invalidProduct",
          USER_LIMIT_REACHED: "checkout.discountErrors.userLimitReached",
          MIN_PURCHASE_NOT_REACHED: "checkout.discountErrors.minPurchaseNotReached",
        };
        throw new Error(errorMap[errorKey] ? t(errorMap[errorKey]) : (data?.message || t("checkout.discountErrors.invalidCode")));
      }

      const discountValue = Number(data.discount.value || 0);

      setAppliedDiscount({
        code: data.discount.code,
        type: data.discount.type,
        value: discountValue,
        discountCLP: Math.max(0, Math.min(Math.round(data.amounts?.discountCLP || 0), Math.round(displayPriceCLP))),
        discountUSD: Math.max(0, Math.min(Number(data.amounts?.discountUSD || 0), displayPriceUSD)),
      });
    } catch (error) {
      setAppliedDiscount(null);
      setDiscountError(error instanceof Error ? error.message : t("checkout.discountApplyFailed"));
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  if (availableMethods.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-center text-red-400">
            {t("checkout.noPaymentMethods")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pixel-frame bg-[#111] rounded-2xl border border-[#222] overflow-hidden shadow-2xl shadow-black/50 group">
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
                <span className="icon-minecraft-sm icon-minecraft-clock"></span>
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{product.defaultDurationDays} {t("checkout.daysAccess")}</div>
                <div className="text-xs text-gray-500">{t("checkout.fullAccessPeriod")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1a1a1a] border border-[#222] hover:border-purple-500/30 hover:bg-[#1f1f1f] transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <span className="icon-minecraft-sm icon-minecraft-compass"></span>
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{product.maxActivations} {t("checkout.serverIps")}</div>
                <div className="text-xs text-gray-500">{t("checkout.simultaneousActivations")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1a1a1a] border border-[#222] hover:border-green-500/30 hover:bg-[#1f1f1f] transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <span className="icon-minecraft-sm icon-minecraft-player-head-2-sm-textures-sm" style={{ opacity: 0.5 }}></span>
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{t("checkout.prioritySupport")}</div>
                <div className="text-xs text-gray-500">{t("checkout.fastDiscordSupport")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1a1a1a] border border-[#222] hover:border-orange-500/30 hover:bg-[#1f1f1f] transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <span className="icon-minecraft-sm icon-minecraft-paper"></span>
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
                <Icon name="Sparkles" className="h-4 w-4 text-green-400" />
                <span className="text-green-400 font-medium text-sm">{t("checkout.discountApplied")}</span>
              </div>
              <span className="text-green-300 font-bold text-sm bg-green-500/20 px-3 py-1 rounded-lg">
                -{formatPrice(product.priceUSD - displayPriceUSD, product.priceCLP - displayPriceCLP)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="pixel-frame bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
        <div className="p-4 border-b border-[#222] bg-[#0f0f0f]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Icon name="CreditCard" className="w-4 h-4 text-green-500" />
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
                  <Icon name="Check" className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-1">
        <div className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t("checkout.discountCodeLabel")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCodeInput}
              onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
              placeholder={t("checkout.discountCodePlaceholder")}
              className="w-full rounded-lg border border-[#2f2f2f] bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50"
            />
            <button
              type="button"
              onClick={applyDiscount}
              disabled={isApplyingDiscount}
              className="rounded-lg bg-[#1f6feb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a5fcc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApplyingDiscount ? t("checkout.validatingDiscount") : t("checkout.applyDiscount")}
            </button>
          </div>
          {appliedDiscount ? (
            <p className="mt-2 text-xs text-green-400">
              {t("checkout.discountCodeApplied")}: {appliedDiscount.code} (-{formatPrice(appliedDiscountUSD, appliedDiscountCLP)})
            </p>
          ) : null}
          {discountError ? <p className="mt-2 text-xs text-red-400">{discountError}</p> : null}
          <p className="mt-3 text-xs text-gray-500">
            {t("checkout.finalTotal")}: {formatPrice(totalUSDWithDiscount, totalCLPWithDiscount)}
          </p>
        </div>
        <CombinedCheckoutButton
          productSlug={product.slug}
          discountCode={appliedDiscount?.code}
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
  const { t, formatPrice } = useTranslation();
  const isAdmin = product.session.role === "ADMIN" || product.session.role === "SUPER_ADMIN";
  const displayPriceUSD = product.salePriceUSD || product.priceUSD;
  const displayPriceCLP = product.salePriceCLP || product.priceCLP;

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
          <Icon name="ArrowRight" className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" />
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
              <Icon name="Check" className="w-3.5 h-3.5 text-white" />
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
                  <Icon name="ShoppingBag" className="w-4 h-4 text-green-500" />
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
                  <span className="text-green-400 font-bold text-lg">
                    {formatPrice(displayPriceUSD, displayPriceCLP)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
              <div className="p-4 border-b border-[#222] bg-gradient-to-r from-[#151515] to-[#111]">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Icon name="CheckCircle" className="w-4 h-4 text-green-500" />
                  {t("checkout.includes")}
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Icon name="Check" className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <span className="text-gray-300">{t("checkout.instantDelivery")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Icon name="Check" className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <span className="text-gray-300">{t("checkout.freeUpdates")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Icon name="Check" className="w-3.5 h-3.5 text-green-400" />
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
