import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { displayProductPrice } from "@/lib/pricing";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

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

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <DashboardNavbar user={session?.user} isAdmin={isAdmin} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-white mb-2">No Products Available</h1>
          <p className="text-neutral-400">Check back later for available licenses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-12">
      <DashboardNavbar user={session?.user} isAdmin={isAdmin} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Buy License</h1>
          <p className="text-neutral-400 text-lg">
            Purchase a TownyFaiths license for your Minecraft server
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            const latestVersion = product.versions[0];
            const priceDisplay = displayProductPrice(product);
            const isOnSale = product.salePriceUSD && product.salePriceUSD < product.priceUSD;

            return (
              <div key={product.id} className="group relative bg-[#111] rounded-xl border border-neutral-800 overflow-hidden hover:border-green-600 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.15)] flex flex-col">
                {/* Sale Badge */}
                {isOnSale && (
                  <div className="absolute top-4 right-4 z-10 bg-red-600/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                    SALE
                  </div>
                )}

                <div className="p-8 flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-green-500 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-neutral-400 text-sm leading-relaxed">{product.description}</p>
                    </div>
                    <div className="p-3 bg-neutral-900 rounded-lg group-hover:bg-green-500/10 transition-colors">
                      <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-300">
                        ⛪
                      </span>
                    </div>
                  </div>

                  {latestVersion && (
                    <div className="bg-neutral-900/50 rounded-lg px-4 py-3 text-sm text-neutral-400 mb-6 border border-neutral-800">
                      <div className="flex items-center justify-between mb-2">
                        <span>Latest Version</span>
                        <span className="font-mono text-green-500 font-bold">v{latestVersion.version}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>MC Version</span>
                        <span className="text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded text-xs">{latestVersion.minMcVersion}+</span>
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <div className="flex flex-col gap-1 mb-4">
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-green-500 tracking-tight">
                          {priceDisplay.USD}
                        </span>
                        {isOnSale && (
                          <span className="text-lg text-neutral-500 line-through decoration-2 decoration-red-500/50">
                            ${product.priceUSD.toFixed(2)} USD
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-neutral-500">
                        {priceDisplay.CLP} (Chile only)
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-neutral-400 border-t border-neutral-800 pt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        <span>{product.defaultDurationDays} days</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                        <span>{product.maxActivations} server{product.maxActivations > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 mt-auto">
                  {session ? (
                    <Link
                      href={`/checkout?productId=${product.id}`}
                      className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-lg text-center transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-green-900/20"
                    >
                      Buy Now
                    </Link>
                  ) : (
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent(`/buy?productId=${product.id}`)}`}
                      className="block w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-4 px-6 rounded-lg text-center transition-all border border-neutral-700 hover:border-neutral-600"
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
    </div>
  );
}