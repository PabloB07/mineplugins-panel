import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { displayProductPrice } from "@/lib/pricing";
import Header from "@/components/ui/Header";
import { ShoppingCart, Check, Zap, Server, Shield } from "lucide-react";

export default async function BuyPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  // Get products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      versions: {
        where: { isLatest: true },
        select: { version: true, minMcVersion: true, minJavaVersion: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <div className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-28">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">Minecraft</span> Solutions
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Enhance your server with TownyFaiths. Secure, reliable, and feature-rich plugins designed for modern communities.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-[#111] rounded-2xl border border-[#222]">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Store Empty</h2>
              <p className="text-neutral-400">No products are currently available for purchase.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => {
                const latestVersion = product.versions[0];
                const priceDisplay = displayProductPrice(product);
                const isOnSale = product.salePriceUSD && product.salePriceUSD < product.priceUSD;

                return (
                  <div key={product.id} className="group relative bg-[#111] hover:bg-[#151515] rounded-2xl border border-[#222] hover:border-green-500/50 overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(34,197,94,0.2)] flex flex-col hover:-translate-y-1">

                    {/* Header Image/Icon Section can go here if we had images */}
                    <div className="p-8 pb-0">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-900/20 border border-green-500/30 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform duration-300">
                          <Zap className="w-7 h-7" />
                        </div>
                        {isOnSale && (
                          <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30">
                            SALE
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed mb-6 h-10 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    {/* Features / Details */}
                    <div className="px-8 space-y-3 mb-8">
                      {latestVersion && (
                        <div className="flex items-center text-sm text-gray-300">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>Latest Version: <span className="font-mono text-green-400">v{latestVersion.version}</span></span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-300">
                        <Server className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{product.maxActivations} Server Activation{product.maxActivations > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <Shield className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>Fast Support & Updates</span>
                      </div>
                    </div>

                    {/* Spacer to push footer down */}
                    <div className="flex-1"></div>

                    {/* Footer / Price / Button */}
                    <div className="p-8 pt-0 mt-4">
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-white">
                            {priceDisplay.USD}
                          </span>
                          {isOnSale && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.priceUSD.toFixed(2)} USD
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {priceDisplay.CLP} (Chile only)
                        </div>
                      </div>

                      {session ? (
                        <Link
                          href={`/checkout?productId=${product.id}`}
                          className="block w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-3.5 rounded-xl text-center transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40"
                        >
                          Purchase License
                        </Link>
                      ) : (
                        <Link
                          href={`/login?callbackUrl=${encodeURIComponent(`/buy?productId=${product.id}`)}`}
                          className="block w-full bg-[#222] hover:bg-[#333] text-gray-300 hover:text-white font-semibold py-3.5 rounded-xl text-center transition-all border border-[#333] hover:border-gray-600"
                        >
                          Login to Purchase
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}