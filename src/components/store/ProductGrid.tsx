"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { 
  Check, 
  Zap, 
  Server as ServerIcon, 
  Shield, 
  ShoppingCart, 
  ChevronDown,
  Users,
  Download,
  RefreshCw,
  Star,
  Heart,
  Globe,
  ShieldCheck,
  Clock,
  CreditCard,
  ArrowRight
} from "lucide-react";
import { Product, Session, ServerStatus } from "./types";

interface ProductGridProps {
  products: Product[];
  session: Session | null;
}

function CreeperVoxelIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className={className}>
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

function ServerStatusCard({ server }: { server: ServerStatus }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#0f0f0f] rounded-xl border border-[#222] hover:border-green-500/30 transition-all">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        server.isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
      }`}>
        {server.isOnline ? <Check className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{server.name}</div>
        <div className="text-xs text-gray-500 font-mono">{server.ip}:{server.port}</div>
      </div>
      <div className="text-right">
        <div className={`text-xs font-medium ${server.isOnline ? "text-green-400" : "text-red-400"}`}>
          {server.isOnline ? "Online" : "Offline"}
        </div>
        {server.isOnline && server.playersOnline !== undefined && (
          <div className="text-xs text-gray-500">{server.playersOnline}/{server.playersMax}</div>
        )}
      </div>
    </div>
  );
}

export default function ProductGrid({ products, session }: ProductGridProps) {
  const { t, formatPrice } = useTranslation();
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  async function fetchServers() {
    try {
      const res = await fetch("/api/public/servers");
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
      }
    } catch (error) {
      console.error("Failed to fetch servers:", error);
    }
  }

  const features = [
    { icon: Shield, title: "Secure Licensing", description: "JWT-based licenses with hardware locking" },
    { icon: RefreshCw, title: "Lifetime Updates", description: "Free updates for your entire license period" },
    { icon: Download, title: "Instant Delivery", description: "Download immediately after purchase" },
    { icon: Users, title: "Multi-server Support", description: "Activate on multiple servers" }
  ];

  const faqs = [
    { question: "How does the license system work?", answer: "Our licenses use JWT tokens with hardware locking. Each license can be activated on a limited number of servers based on your purchase." },
    { question: "Can I transfer my license to another server?", answer: "Yes, you can deactivate a server and activate a new one from your dashboard, as long as you don't exceed your activation limit." },
    { question: "Do I get free updates?", answer: "Yes! All updates released during your license period are free. Your license will continue to work with the latest versions." },
    { question: "What payment methods do you accept?", answer: "We accept PayPal, Payku (Chile), and Tebex. All payments are processed securely through our payment providers." }
  ];

  if (products.length === 0) {
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
          Premium Minecraft Plugins
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
          {t("store.title")}
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          {t("store.subtitle")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#111] rounded-xl border border-[#222]">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-300">Secure Licensing</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#111] rounded-xl border border-[#222]">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-300">Free Updates</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#111] rounded-xl border border-[#222]">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-300">Instant Delivery</span>
          </div>
        </div>
      </div>

      {/* Server Status */}
      {servers.length > 0 && (
        <div className="bg-gradient-to-br from-[#111] to-[#0f0f0f] rounded-2xl border border-[#222] p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Server Status</h3>
                <p className="text-sm text-gray-500">{servers.length} server{servers.length > 1 ? 's' : ''} configured</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-400">{servers.filter(s => s.isOnline).length} online</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {servers.slice(0, 6).map(server => (
              <ServerStatusCard key={server.id} server={server} />
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Available Plugins</h2>
            <p className="text-gray-400 text-sm mt-1">{products.length} product{products.length > 1 ? 's' : ''} available</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Star className="w-4 h-4 text-yellow-400" />
            Rated 5/5 by customers
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const latestVersion = product.versions[0];
            const isOnSale = product.salePriceUSD && product.salePriceUSD < product.priceUSD;
            const displayPriceUSD = isOnSale && product.salePriceUSD ? product.salePriceUSD : product.priceUSD;
            const displayPriceCLP = isOnSale && product.salePriceCLP ? product.salePriceCLP : product.priceCLP;

            return (
              <div key={product.id} className="group bg-[#111] hover:bg-[#151515] rounded-2xl border border-[#222] hover:border-green-500/40 overflow-hidden transition-all duration-300 flex flex-col">
                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
                        SALE
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
                      <span>Version {latestVersion?.version || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <ServerIcon className="w-4 h-4 text-green-500 mr-2" />
                      <span>{product.maxActivations} server{product.maxActivations > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <Shield className="w-4 h-4 text-green-500 mr-2" />
                      <span>Premium support</span>
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
                        Purchase Now
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link href={`/login?callbackUrl=${encodeURIComponent(`/store?productId=${product.id}`)}`} className="flex items-center justify-center gap-2 w-full bg-[#1a1a1a] hover:bg-[#222] text-gray-300 hover:text-white font-semibold py-3 rounded-xl transition-all border border-[#333] hover:border-green-500/50">
                        Login to Purchase
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-3">Why Choose MinePlugins?</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Get the best Minecraft plugin experience with our premium features.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-5 hover:border-green-500/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-3">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3 max-w-3xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
              <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#151515] transition-colors">
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
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-green-900/20 to-[#111] rounded-2xl border border-green-500/20 p-10 text-center mb-12">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to Get Started?</h2>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">Purchase your license today and start using premium Minecraft plugins.</p>
        <Link href="#products" className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold px-8 py-3 rounded-xl transition-all">
          Browse Products
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
