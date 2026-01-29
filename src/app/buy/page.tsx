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
    <div className="min-h-screen bg-zinc-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Buy License</h1>
        <p className="text-gray-400 mt-1">
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
            <div key={product.id} className="group relative bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-emerald-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/10">
              {/* Sale Badge */}
              {isOnSale && (
                <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SALE
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{product.description}</p>
                  </div>
                  <div className="ml-3 text-3xl opacity-20 group-hover:opacity-30 transition-opacity">
                    ⛪
                  </div>
                </div>

                {latestVersion && (
                  <div className="bg-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-300 mb-4 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Latest Version:</span>
                      <span className="font-mono text-emerald-400">v{latestVersion.version}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-400">MC Version:</span>
                      <span className="text-blue-400">{latestVersion.minMcVersion}+</span>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-emerald-400">
                        {formatUSD(displayPriceUSD)}
                      </span>
                      {isOnSale && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatUSD(product.priceUSD)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300">
                      {formatCLP(displayPriceCLP)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      {product.defaultDurationDays} days
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      {product.maxActivations} server{product.maxActivations > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {session ? (
                  <Link
                    href={`/checkout?productId=${product.id}`}
                    className="block w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-3 px-4 rounded-lg text-center transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-600/25"
                  >
                    Buy Now
                  </Link>
                ) : (
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(`/buy?productId=${product.id}`)}`}
                    className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-lg text-center transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-blue-600/25"
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