import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatUSD, formatCLP } from "@/lib/pricing";

export default async function BuyPage() {
  const session = await getServerSession(authOptions);

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

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-4">No Products Available</h1>
        <p className="text-gray-400">Check back later for available licenses.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Buy License</h1>
        <p className="text-[#a3a3a3] mt-1">
          Purchase a TownyFaiths license for your Minecraft server
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const latestVersion = product.versions[0];
          const displayPriceUSD = product.salePriceUSD || product.priceUSD;
          const displayPriceCLP = product.salePriceCLP || product.priceCLP;
          const isOnSale = product.salePriceUSD && product.salePriceUSD < product.priceUSD;

          return (
            <div key={product.id} className="group relative bg-[#1a1a1a] rounded-lg border border-[#333333] overflow-hidden hover:border-[#22c55e] transition-all duration-300 hover:shadow-[0_8px_30px_-10px_rgba(34,197,94,0.2)] hover:transform hover:-translate-y-1">
              {/* Sale Badge */}
              {isOnSale && (
                <div className="absolute top-3 right-3 z-10 bg-[#ef4444] text-white text-xs font-bold px-3 py-1 rounded-full border border-[#ef4444]/20">
                  SALE
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#22c55e] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[#737373] text-sm leading-relaxed">{product.description}</p>
                  </div>
                  <div className="ml-3 text-3xl opacity-20 group-hover:opacity-30 transition-opacity">
                    ⛪
                  </div>
                </div>

                {latestVersion && (
                  <div className="bg-[#262626] rounded-lg px-4 py-3 text-xs text-[#a3a3a3] mb-4 border border-[#404040]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373]">Latest Version:</span>
                      <span className="font-mono text-[#22c55e]">v{latestVersion.version}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[#737373]">MC Version:</span>
                      <span className="text-[#3b82f6]">{latestVersion.minMcVersion}+</span>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex flex-col gap-2 mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#22c55e]">
                      ${displayPriceUSD.toFixed(2)}
                    </span>
                    {isOnSale && (
                      <span className="text-sm text-[#737373] line-through">
                        ${product.priceUSD.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[#a3a3a3]">
                    ${displayPriceCLP.toLocaleString('es-CL')} CLP
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#737373]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#22c55e] rounded-full"></div>
                    <span>{product.defaultDurationDays} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#3b82f6] rounded-full"></div>
                    <span>{product.maxActivations} server{product.maxActivations > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {session ? (
                <Link
                  href={`/checkout?productId=${product.id}`}
                  className="block w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium py-3 px-4 rounded-lg text-center transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
                >
                  Buy Now
                </Link>
              ) : (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/buy?productId=${product.id}`)}`}
                  className="block w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-3 px-4 rounded-lg text-center transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                >
                  Login to Buy
                </Link>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}