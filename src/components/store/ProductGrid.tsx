"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { 
  Check, 
  Zap, 
  Server as ServerIcon, 
  Shield, 
  ShoppingCart, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ArrowRight,
  Loader2,
  MessageCircle,
  HelpCircle,
  RefreshCw,
  Users
} from "lucide-react";
import { Product, Session } from "./types";

interface ProductGridProps {
  session: Session | null;
}

const FAQ_DATA_ES = [
  {
    question: "¿Cómo funciona el sistema de licencias?",
    answer: "Nuestras licencias utilizan tokens JWT con bloqueo de hardware. Cada licencia puede activarse en un número limitado de servidores según tu compra. El plugin valida la licencia automáticamente al iniciar."
  },
  {
    question: "¿Puedo transferir mi licencia a otro servidor?",
    answer: "Sí, puedes desactivar un servidor y activar uno nuevo desde tu panel, siempre que no excedas tu límite de activaciones. El proceso es instantáneo."
  },
  {
    question: "¿Las actualizaciones son gratuitas?",
    answer: "¡Sí! Todas las actualizaciones lanzadas durante tu período de licencia son gratuitas. Tu licencia seguirá funcionando con las últimas versiones del plugin."
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos PayPal, Payku (Chile) y Tebex. Todos los pagos se procesan de forma segura a través de nuestros proveedores de pago."
  },
  {
    question: "¿Qué pasa si tengo problemas con el plugin?",
    answer: "Ofrecemos soporte premium incluido con tu licencia. Puedes contactarnos a través de Discord o email y te ayudaremos lo antes posible."
  },
  {
    question: "¿Puedo obtener un reembolso?",
    answer: "Ofrecemos reembolso dentro de los primeros 7 días si el plugin no funciona como se describió. Consulta nuestros términos para más detalles."
  }
];

const FAQ_DATA_EN = [
  {
    question: "How does the license system work?",
    answer: "Our licenses use JWT tokens with hardware locking. Each license can be activated on a limited number of servers based on your purchase. The plugin validates the license automatically on startup."
  },
  {
    question: "Can I transfer my license to another server?",
    answer: "Yes, you can deactivate a server and activate a new one from your panel, as long as you don't exceed your activation limit. The process is instant."
  },
  {
    question: "Are updates free?",
    answer: "Yes! All updates released during your license period are free. Your license will continue to work with the latest versions of the plugin."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept PayPal, Payku (Chile), and Tebex. All payments are processed securely through our payment providers."
  },
  {
    question: "What if I have issues with the plugin?",
    answer: "We offer premium support included with your license. You can contact us through Discord or email and we'll help you as soon as possible."
  },
  {
    question: "Can I get a refund?",
    answer: "We offer refunds within the first 7 days if the plugin doesn't work as described. Check our terms for more details."
  }
];

const FAQ_CATEGORIES_ES = [
  { icon: HelpCircle, label: "General", questions: [0, 3, 5] },
  { icon: RefreshCw, label: "Licencias", questions: [1, 2] },
  { icon: MessageCircle, label: "Soporte", questions: [4] },
];

const FAQ_CATEGORIES_EN = [
  { icon: HelpCircle, label: "General", questions: [0, 3, 5] },
  { icon: RefreshCw, label: "Licenses", questions: [1, 2] },
  { icon: MessageCircle, label: "Support", questions: [4] },
];

export default function ProductGrid({ session }: ProductGridProps) {
  const { formatPrice, t, locale } = useTranslation();
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

  const faqData = useMemo(() => locale === 'es' ? FAQ_DATA_ES : FAQ_DATA_EN, [locale]);
  const faqCategories = useMemo(() => locale === 'es' ? FAQ_CATEGORIES_ES : FAQ_CATEGORIES_EN, [locale]);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page]);

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
        setPagination(prev => ({
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

  const filteredFaqs = selectedCategory === null
    ? faqData
    : faqData.filter((_, i) => faqCategories[selectedCategory].questions.includes(i));

  if (products.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#111] rounded-2xl border border-[#222]">
        <ShoppingCart className="w-16 h-16 text-gray-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{t("store.empty")}</h2>
        <p className="text-neutral-400">{t("store.emptyDesc")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center py-16 lg:py-24">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          {t("store.premiumMinecraftPlugins")}
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
          {t("store.pluginPremium")}
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          {t("store.instantLicenses")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#111] rounded-xl border border-[#222]">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-300">{t("store.secureLicenses")}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#111] rounded-xl border border-[#222]">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-300">{t("store.freeUpdates")}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#111] rounded-xl border border-[#222]">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-300">{t("store.premiumSupport")}</span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">{t("store.pluginsAvailable")}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {t("store.productsAvailable").replace("{count}", pagination.total.toString())}
            </p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const latestVersion = product.versions[0];
                const isOnSale = product.salePriceUSD && product.salePriceUSD < product.priceUSD;
                const displayPriceUSD = isOnSale && product.salePriceUSD ? product.salePriceUSD : product.priceUSD;
                const displayPriceCLP = isOnSale && product.salePriceCLP ? product.salePriceCLP : product.priceCLP;

                return (
                  <div key={product.id} className="group bg-[#111] hover:bg-[#151515] rounded-2xl border border-[#222] hover:border-green-500/40 overflow-hidden transition-all duration-300 flex flex-col">
                    <div className="relative h-40 overflow-hidden bg-[#0a0a0a]">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : product.icon ? (
                        <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-[#0f0f0f] flex items-center justify-center">
                          <span className={`icon-minecraft ${product.icon}`}></span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-[#0f0f0f] flex items-center justify-center">
                          <Zap className="w-16 h-16 text-green-500/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
                      
                      {isOnSale && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-red-500/30 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {t("store.sale")}
                          </span>
                        </div>
                      )}
                      {latestVersion && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-mono px-2 py-1 rounded-lg">v{latestVersion.version}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors">{product.name}</h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{product.description}</p>

                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center text-sm text-gray-300">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span>{t("store.version")} {latestVersion?.version || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-300">
                          <ServerIcon className="w-4 h-4 text-green-500 mr-2" />
                          <span>{product.maxActivations} {product.maxActivations > 1 ? t("store.servers") : t("store.server")}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-300">
                          <Shield className="w-4 h-4 text-green-500 mr-2" />
                          <span>{t("store.premiumSupportText")}</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-2xl font-bold text-white">{formatPrice(displayPriceUSD, displayPriceCLP)}</span>
                          {isOnSale && (
                            <span className="text-sm text-gray-500 line-through">{formatPrice(product.priceUSD, product.priceCLP)}</span>
                          )}
                        </div>

                        {session ? (
                          <Link href={`/checkout?productId=${product.id}`} className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-3 rounded-xl transition-all">
                            <CreditCard className="w-4 h-4" />
                            {t("store.buyNow")}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <Link href={`/login?callbackUrl=${encodeURIComponent(`/store?productId=${product.id}`)}`} className="flex items-center justify-center gap-2 w-full bg-[#1a1a1a] hover:bg-[#222] text-gray-300 hover:text-white font-semibold py-3 rounded-xl transition-all border border-[#333] hover:border-green-500/50">
                            {t("store.loginToPurchase")}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
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
                      if (pageNum > pagination.totalPages) return null;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          pagination.page === pageNum
                            ? "bg-green-500 text-black"
                            : "bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-3">{t("store.faq")}</h2>
          <p className="text-gray-400 max-w-xl mx-auto">{t("store.faqSubtitle")}</p>
        </div>

        {/* FAQ Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-green-500 text-black"
                : "bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222]"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            {t("store.all")}
          </button>
          {faqCategories.map((cat, i) => {
            const labelKey = ['store.general', 'store.licenses', 'store.support'][i] || cat.label;
            return (
              <button
                key={i}
                onClick={() => setSelectedCategory(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === i
                    ? "bg-green-500 text-black"
                    : "bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222]"
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        {/* FAQ Items */}
        <div className="space-y-3 max-w-3xl mx-auto">
          {filteredFaqs.map((faq, i) => (
            <div key={i} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
              <button 
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} 
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#151515] transition-colors"
              >
                <span className="font-medium text-white pr-4">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {expandedFaq === i && (
                <div className="px-4 pb-4">
                  <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">{t("store.noAnswer")}</p>
          <Link 
            href="https://discord.gg/townyfaith" 
            target="_blank"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium rounded-xl transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            {t("store.contactDiscord")}
          </Link>
        </div>
      </div>
    </div>
  );
}
