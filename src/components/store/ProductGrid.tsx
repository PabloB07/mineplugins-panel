"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/Icon";
import { Product, Session } from "./types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface ProductGridProps {
  session: Session | null;
}

const FAQ_DATA_ES = [
  {
    question: "¿Cómo funciona el sistema de licencias?",
    answer:
      "Nuestras licencias utilizan tokens JWT con bloqueo de hardware. Cada licencia puede activarse en un número limitado de servidores según tu compra. El plugin valida la licencia automáticamente al iniciar.",
  },
  {
    question: "¿Puedo transferir mi licencia a otro servidor?",
    answer:
      "Sí, puedes desactivar un servidor y activar uno nuevo desde tu panel, siempre que no excedas tu límite de activaciones. El proceso es instantáneo.",
  },
  {
    question: "¿Las actualizaciones son gratuitas?",
    answer:
      "Sí. Todas las actualizaciones lanzadas durante tu período de licencia son gratuitas. Tu licencia seguirá funcionando con las últimas versiones del plugin.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos PayPal, Payku (Chile) y Tebex. Todos los pagos se procesan de forma segura a través de nuestros proveedores de pago.",
  },
  {
    question: "¿Qué pasa si tengo problemas con el plugin?",
    answer:
      "Ofrecemos soporte premium incluido con tu licencia. Puedes contactarnos a través de Discord o email y te ayudaremos lo antes posible.",
  },
  {
    question: "¿Puedo obtener un reembolso?",
    answer:
      "Ofrecemos reembolso dentro de los primeros 7 días si el plugin no funciona como se describió. Consulta nuestros términos para más detalles.",
  },
];

const FAQ_DATA_EN = [
  {
    question: "How does the license system work?",
    answer:
      "Our licenses use JWT tokens with hardware locking. Each license can be activated on a limited number of servers based on your purchase. The plugin validates the license automatically on startup.",
  },
  {
    question: "Can I transfer my license to another server?",
    answer:
      "Yes, you can deactivate a server and activate a new one from your panel, as long as you do not exceed your activation limit. The process is instant.",
  },
  {
    question: "Are updates free?",
    answer:
      "Yes. All updates released during your license period are free. Your license will continue to work with the latest versions of the plugin.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept PayPal, Payku (Chile), and Tebex. All payments are processed securely through our payment providers.",
  },
  {
    question: "What if I have issues with the plugin?",
    answer:
      "We offer premium support included with your license. You can contact us through Discord or email and we will help you as soon as possible.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "We offer refunds within the first 7 days if the plugin does not work as described. Check our terms for more details.",
  },
];

const FAQ_CATEGORIES_ES = [
  { iconName: "Search" as const, label: "General", questions: [0, 3, 5] },
  { iconName: "RefreshCw" as const, label: "Licencias", questions: [1, 2] },
  { iconName: "Users" as const, label: "Soporte", questions: [4] },
];

const FAQ_CATEGORIES_EN = [
  { iconName: "Search" as const, label: "General", questions: [0, 3, 5] },
  { iconName: "RefreshCw" as const, label: "Licenses", questions: [1, 2] },
  { iconName: "Users" as const, label: "Support", questions: [4] },
];

export default function ProductGrid({ session }: ProductGridProps) {
  const { formatPrice, locale, t } = useTranslation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0,
  });

  const faqData = useMemo(() => (locale === "es" ? FAQ_DATA_ES : FAQ_DATA_EN), [locale]);
  const faqCategories = useMemo(
    () => (locale === "es" ? FAQ_CATEGORIES_ES : FAQ_CATEGORIES_EN),
    [locale]
  );

  const storeStats = useMemo(
    () =>
      locale === "es"
        ? [
            { value: `${pagination.total || 0}+`, label: "plugins listos para producción", iconName: "Sparkles" as const },
            { value: "24/7", label: "soporte premium", iconName: "Users" as const },
            { value: "1.21+", label: "compatibilidad Paper", iconName: "Server" as const },
          ]
        : [
            { value: `${pagination.total || 0}+`, label: "production-ready plugins", iconName: "Sparkles" as const },
            { value: "24/7", label: "premium support", iconName: "Users" as const },
            { value: "1.21+", label: "Paper compatibility", iconName: "Server" as const },
          ],
    [locale, pagination.total]
  );

  const featureHighlights = useMemo(
    () =>
      locale === "es"
        ? [
            { title: "Licencias seguras", description: "Bloqueo por hardware y validación automática." },
            { title: "Actualizaciones gratis", description: "Nuevas versiones sin pasos extra ni tickets." },
            { title: "Soporte premium", description: "Ayuda rápida para instalar, activar y escalar." },
          ]
        : [
            { title: "Secure licenses", description: "Hardware locking and automatic validation." },
            { title: "Free updates", description: "New versions without extra steps or tickets." },
            { title: "Premium support", description: "Fast help for setup, activation, and scaling." },
          ],
    [locale]
  );

  const heroBullets = useMemo(
    () =>
      locale === "es"
        ? ["Checkout rápido", "Entrega instantánea", "Gestión desde tu panel"]
        : ["Fast checkout", "Instant delivery", "Manage everything from your panel"],
    [locale]
  );

  const quickPitch = locale === "es" ? "Listo para comprar" : "Ready to ship";
  const featuredLabel = locale === "es" ? "Destacado" : "Featured";
  const licenseLabel = locale === "es" ? "Licencia incluida" : "License included";
  const ctaSecondary = locale === "es" ? "Explora la coleccion" : "Explore the collection";
  const heroDescription =
    locale === "es"
      ? "Una tienda pensada como ecommerce para plugins premium: visual clara, valor inmediato y compra sin fricción."
      : "A store designed like ecommerce for premium plugins: clear value, stronger merchandising, and frictionless buying.";
  const faqDataByCategory =
    selectedCategory === null
      ? faqData
      : faqData.filter((_, index) => faqCategories[selectedCategory].questions.includes(index));

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("page", pagination.page.toString());
        params.append("limit", pagination.limit.toString());

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        setProducts(data.products || []);
        if (data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [pagination.limit, pagination.page]);

  if (products.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#222] bg-[#111] p-12 text-center">
        <Icon name="ShoppingCart" className="mb-4 h-16 w-16 text-gray-500" />
        <h2 className="mb-2 text-xl font-bold text-white">{t("store.empty")}</h2>
        <p className="text-neutral-400">{t("store.emptyDesc")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[32px] border border-[#1f1f1f] bg-[#0b0b0b] px-6 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:px-8 lg:px-10 lg:py-12">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, #22c55e12 1px, transparent 1px), linear-gradient(to bottom, #22c55e12 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-green-500/12 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-green-400/8 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_320px] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
              <Icon name="Zap" className="h-4 w-4" />
              {t("store.premiumMinecraftPlugins")}
            </div>

            <h1 className="max-w-3xl text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              {t("store.pluginPremium")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
              {t("store.instantLicenses")}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">{heroDescription}</p>

            <div className="mt-7 flex flex-wrap gap-3">
            {heroBullets.map((bullet) => (
                <div
                  key={bullet}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#242424] bg-[#101010] px-4 py-2 text-sm text-gray-300"
                >
                  <Icon name="Check" className="h-4 w-4 text-green-400" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {storeStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#222] bg-[#101010]/90 p-4">
                  <div className="mb-4 flex items-center">
                    <Icon name={stat.iconName} className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="text-3xl leading-none text-white">{stat.value}</div>
                  <p className="mt-3 text-sm leading-6 text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[24px] border border-[#262626] bg-gradient-to-b from-[#141414] to-[#0d0d0d] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-[#101010] px-4 py-3">
                <div>
                  <p className="text-sm text-green-400">{quickPitch}</p>
                  <p className="mt-2 text-base leading-7 text-gray-400">{heroDescription}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {featureHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#222] bg-[#0f0f0f] px-4 py-3"
                  >
                    <p className="text-base text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="relative mt-4 p-[6px]">
                <div
                  className="absolute inset-0 bg-green-500/12"
                  style={{
                    clipPath:
                      "polygon(14px 0, calc(100% - 14px) 0, calc(100% - 14px) 6px, calc(100% - 6px) 6px, calc(100% - 6px) 14px, 100% 14px, 100% calc(100% - 14px), calc(100% - 6px) calc(100% - 14px), calc(100% - 6px) calc(100% - 6px), calc(100% - 14px) calc(100% - 6px), calc(100% - 14px) 100%, 14px 100%, 14px calc(100% - 6px), 6px calc(100% - 6px), 6px calc(100% - 14px), 0 calc(100% - 14px), 0 14px, 6px 14px, 6px 6px, 14px 6px)",
                    boxShadow: "0 0 20px rgba(34,197,94,0.12)",
                  }}
                />
                <div className="relative rounded-2xl border border-green-500/20 bg-green-500/8 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-green-400">{featuredLabel}</p>
                      <p className="mt-3 text-2xl leading-tight text-white">
                        {products[0]?.name || t("store.pluginsAvailable")}
                      </p>
                      <p className="mt-2 text-lg text-gray-300">
                        {products[0]
                          ? formatPrice(
                              products[0].salePriceUSD && products[0].salePriceUSD < products[0].priceUSD
                                ? products[0].salePriceUSD
                                : products[0].priceUSD,
                              products[0].salePriceCLP && products[0].salePriceCLP < products[0].priceCLP
                                ? products[0].salePriceCLP
                                : products[0].priceCLP
                            )
                          : t("store.subtitle")}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[#2e2e2e] bg-[#0c0c0c] px-3 py-2 text-center">
                      <p className="text-xs leading-5 text-gray-500">{licenseLabel}</p>
                      <p className="mt-2 text-lg text-white">{products[0]?.maxActivations || 1}x</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="rounded-[24px] border border-[#222] bg-[#101010] p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-green-400">{ctaSecondary}</p>
              <h2 className="mt-2 text-2xl leading-tight text-white">{t("store.pluginsAvailable")}</h2>
              <p className="mt-2 text-sm text-gray-400">
                {t("store.productsAvailable").replace("{count}", pagination.total.toString())}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:max-w-[620px]">
              <div className="rounded-2xl border border-[#222] bg-[#0d0d0d] px-4 py-3">
                <p className="text-sm text-gray-500">{t("store.secureLicenses")}</p>
                <p className="mt-2 text-base leading-6 text-white">{locale === "es" ? "Activación protegida" : "Protected activation"}</p>
              </div>
              <div className="rounded-2xl border border-[#222] bg-[#0d0d0d] px-4 py-3">
                <p className="text-sm text-gray-500">{t("store.freeUpdates")}</p>
                <p className="mt-2 text-base leading-6 text-white">{locale === "es" ? "Versiones al día" : "Always up to date"}</p>
              </div>
              <div className="rounded-2xl border border-[#222] bg-[#0d0d0d] px-4 py-3">
                <p className="text-sm text-gray-500">{t("store.premiumSupport")}</p>
                <p className="mt-2 text-base leading-6 text-white">{locale === "es" ? "Ayuda real" : "Human help"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#222] bg-[#101010] p-5">
          <p className="text-sm text-green-400">{locale === "es" ? "Compra segura" : "Secure purchase"}</p>
          <h3 className="mt-3 text-2xl leading-tight text-white">{locale === "es" ? "Flujo de compra simple" : "Simple buying flow"}</h3>
          <div className="mt-5 space-y-3">
            {[
              locale === "es" ? "Elige tu plugin" : "Choose your plugin",
              locale === "es" ? "Paga con tu método preferido" : "Pay with your preferred method",
              locale === "es" ? "Recibe licencia y descarga al instante" : "Receive license and download instantly",
            ].map((step, index) => (
              <div key={step} className="flex items-start gap-4 rounded-2xl border border-[#222] bg-[#0d0d0d] px-4 py-3.5">
                <div className="min-w-[16px] pt-0.5 text-lg leading-none text-green-400">
                  {index + 1}
                </div>
                <p className="text-base leading-6 text-gray-300">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 mb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => {
                const latestVersion = product.versions[0];
                const isOnSale = Boolean(product.salePriceUSD && product.salePriceUSD < product.priceUSD);
                const displayPriceUSD =
                  isOnSale && product.salePriceUSD ? product.salePriceUSD : product.priceUSD;
                const displayPriceCLP =
                  isOnSale && product.salePriceCLP ? product.salePriceCLP : product.priceCLP;

                return (
                  <div key={product.id} className="group relative p-[6px] transition-all duration-300 hover:-translate-y-1">
                    <div
                      className="absolute inset-0 bg-green-500/10 opacity-70 transition-all duration-300 group-hover:bg-green-500/16"
                      style={{
                        clipPath:
                          "polygon(14px 0, calc(100% - 14px) 0, calc(100% - 14px) 6px, calc(100% - 6px) 6px, calc(100% - 6px) 14px, 100% 14px, 100% calc(100% - 14px), calc(100% - 6px) calc(100% - 14px), calc(100% - 6px) calc(100% - 6px), calc(100% - 14px) calc(100% - 6px), calc(100% - 14px) 100%, 14px 100%, 14px calc(100% - 6px), 6px calc(100% - 6px), 6px calc(100% - 14px), 0 calc(100% - 14px), 0 14px, 6px 14px, 6px 6px, 14px 6px)",
                        boxShadow: "0 14px 40px rgba(34,197,94,0.08)",
                      }}
                    />
                    <article className="relative overflow-hidden rounded-[28px] border border-[#202020] bg-[#101010] transition-all duration-300 group-hover:border-green-500/35 group-hover:shadow-[0_18px_50px_rgba(34,197,94,0.12)]">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="relative h-52 overflow-hidden border-b border-[#1f1f1f] bg-[#0a0a0a]">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              const image = e.target as HTMLImageElement;
                              image.style.display = "none";
                              image.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div
                          className={`absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,#1f7a2e33,transparent_55%),linear-gradient(180deg,#101010_0%,#0a0a0a_100%)] ${
                            product.image ? "hidden" : ""
                          }`}
                        >
                          <span className="icon-minecraft icon-minecraft-paper scale-[1.8]" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-[#101010]/40 to-transparent" />

                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          {index === 0 && (
                            <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/15 px-3 py-1 text-xs text-yellow-300">
                              {featuredLabel}
                            </span>
                          )}
                          {isOnSale && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs text-white shadow-lg shadow-red-500/25">
                              <Icon name="Zap" className="h-3 w-3 text-white" />
                              {t("store.sale")}
                            </span>
                          )}
                        </div>

                        {latestVersion && (
                          <div className="absolute right-4 top-4 rounded-xl border border-white/10 bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                            v{latestVersion.version}
                          </div>
                        )}

                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-sm text-green-400">{licenseLabel}</p>
                            <p className="mt-2 text-base text-gray-300">
                              {product.maxActivations}{" "}
                              {product.maxActivations > 1 ? t("store.servers") : t("store.server")}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-[#2a2a2a] bg-[#0d0d0d]/90 px-3 py-2 text-right backdrop-blur-sm">
                            <p className="text-xs text-gray-500">{t("store.version")}</p>
                            <p className="mt-2 text-lg text-white">{latestVersion?.version || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex h-full flex-col p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl text-white transition-colors group-hover:text-green-400">
                              {product.name}
                            </h3>
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-400">
                              {product.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-2 sm:grid-cols-3">
                          <div className="rounded-2xl border border-[#202020] bg-[#0d0d0d] px-3 py-3">
                            <p className="text-sm text-gray-500">{t("store.secureLicenses")}</p>
                            <p className="mt-2 text-base leading-6 text-white">{locale === "es" ? "Activa al instante" : "Activate instantly"}</p>
                          </div>
                          <div className="rounded-2xl border border-[#202020] bg-[#0d0d0d] px-3 py-3">
                            <p className="text-sm text-gray-500">{t("store.freeUpdates")}</p>
                            <p className="mt-2 text-base leading-6 text-white">{locale === "es" ? "Sin costo extra" : "No extra cost"}</p>
                          </div>
                          <div className="rounded-2xl border border-[#202020] bg-[#0d0d0d] px-3 py-3">
                            <p className="text-sm text-gray-500">{t("store.premiumSupport")}</p>
                            <p className="mt-2 text-base leading-6 text-white">{locale === "es" ? "Respuesta rápida" : "Fast response"}</p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-[24px] border border-[#222] bg-[#0b0b0b] p-4">
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {locale === "es" ? "Precio final" : "Final price"}
                              </p>
                              <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl text-white">{formatPrice(displayPriceUSD, displayPriceCLP)}</span>
                                {isOnSale && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatPrice(product.priceUSD, product.priceCLP)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-right">
                              <p className="text-xs text-green-400">
                                {locale === "es" ? "Entrega" : "Delivery"}
                              </p>
                              <p className="mt-1 text-sm text-white">
                                {locale === "es" ? "Instantánea" : "Instant"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                            <Icon name="Server" className="h-4 w-4 text-green-400" />
                            <span>
                              {product.maxActivations}{" "}
                              {product.maxActivations > 1 ? t("store.servers") : t("store.server")} +{" "}
                              {t("store.premiumSupportText")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5">
                          {session ? (
                            <Link
                              href={`/checkout?productId=${product.id}`}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 px-4 py-3.5 text-white transition-all hover:from-green-500 hover:to-green-400"
                            >
                              <Icon name="CreditCard" className="h-4 w-4 text-white" />
                              {t("store.buyNow")}
                              <Icon name="ArrowRight" className="h-4 w-4 text-white" />
                            </Link>
                          ) : (
                            <Link
                              href={`/login?callbackUrl=${encodeURIComponent(`/store?productId=${product.id}`)}`}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#333] bg-[#171717] px-4 py-3.5 text-gray-300 transition-all hover:border-green-500/40 hover:bg-[#1d1d1d] hover:text-white"
                            >
                              {t("store.loginToPurchase")}
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="rounded-xl border border-[#333] bg-[#1a1a1a] p-2 text-gray-300 hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="ChevronLeft" className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
                    let pageNum = index + 1;
                    if (pagination.totalPages > 5 && pagination.page > 3) {
                      pageNum = pagination.page - 2 + index;
                    }
                    if (pageNum > pagination.totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                        className={`h-10 w-10 rounded-xl text-sm transition-all ${
                          pagination.page === pageNum
                            ? "bg-green-500 text-black"
                            : "border border-[#333] bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
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
                  className="rounded-xl border border-[#333] bg-[#1a1a1a] p-2 text-gray-300 hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="ChevronRight" className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="mb-16 rounded-[32px] border border-[#202020] bg-[#0e0e0e] p-6 sm:p-8">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-green-400">{t("store.faq")}</p>
          <h2 className="mt-3 text-3xl text-white">{locale === "es" ? "Preguntas antes de comprar" : "Questions before buying"}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-400">{t("store.faqSubtitle")}</p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition-all ${
              selectedCategory === null
                ? "bg-green-500 text-black"
                : "border border-[#333] bg-[#151515] text-gray-300 hover:bg-[#1d1d1d]"
            }`}
          >
            <Icon name="Search" className="h-4 w-4" />
            {t("store.all")}
          </button>
          {faqCategories.map((category, index) => {
            const labelKey = ["store.general", "store.licenses", "store.support"][index] || category.label;
            return (
              <button
                key={category.label}
                onClick={() => setSelectedCategory(index)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition-all ${
                  selectedCategory === index
                    ? "bg-green-500 text-black"
                    : "border border-[#333] bg-[#151515] text-gray-300 hover:bg-[#1d1d1d]"
                }`}
              >
                <Icon name={category.iconName} className="h-4 w-4" />
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        <div className="mx-auto grid max-w-4xl gap-3">
          {faqDataByCategory.map((faq, index) => (
            <div key={faq.question} className="overflow-hidden rounded-2xl border border-[#222] bg-[#111]">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#151515]"
              >
                <span className="text-sm text-white sm:text-base">{faq.question}</span>
                <Icon name="ChevronDown" className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${
                    expandedFaq === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedFaq === index && (
                <div className="border-t border-[#1d1d1d] px-5 py-4">
                  <p className="leading-7 text-gray-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="mb-4 text-gray-400">{t("store.noAnswer")}</p>
          <Link
            href="https://discord.gg/townyfaith"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#5865F2] px-6 py-3 text-white transition-all hover:bg-[#4752C4]"
          >
            <Icon name="Users" className="h-5 w-5 text-white" />
            {t("store.contactDiscord")}
          </Link>
        </div>
      </section>
    </div>
  );
}
