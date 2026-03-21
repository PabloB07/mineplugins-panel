import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Shield, Clock, Server, Check, CreditCard, Lock, Zap, Star } from "lucide-react";
import { CheckoutClient } from "@/app/checkout/CheckoutClient";
import { formatUSD, formatCLP } from "@/lib/pricing";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

interface PageProps {
  searchParams: Promise<{ productId?: string }>;
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/store");
  }

  const { productId } = await searchParams;

  if (!productId) {
    redirect("/store");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    include: {
      versions: {
        where: { isLatest: true },
        select: { version: true, minMcVersion: true, minJavaVersion: true },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const latestVersion = product.versions[0];
  const displayPriceUSD = product.salePriceUSD || product.priceUSD;
  const displayPriceCLP = product.salePriceCLP || product.priceCLP;
  const hasDiscount = !!product.salePriceUSD || !!product.salePriceCLP;

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 relative overflow-hidden">
      <DashboardNavbar user={session.user} isAdmin={isAdmin} />
      {/* Ambient Background */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none"></div>
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">

        {/* Back Link */}
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Store</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

          {/* Left Column: Product Details */}
          <div className="lg:col-span-7 space-y-8">

            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Checkout</h1>
              <p className="text-gray-400 text-lg">Complete your purchase securely to unlock your license.</p>
            </div>

            {/* Product Card */}
            <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden shadow-2xl shadow-black/50">
              <div className="p-8 border-b border-[#222] bg-gradient-to-r from-[#111] to-[#151515]">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-900/40 to-green-900/10 border border-green-500/20 flex items-center justify-center text-green-500 shadow-inner shadow-green-500/10">
                      <Zap className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{product.name}</h2>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="bg-[#222] text-gray-300 px-2 py-0.5 rounded border border-[#333]">Legacy</span>
                        {latestVersion && (
                          <span className="text-green-500 font-mono">v{latestVersion.version}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{formatUSD(displayPriceUSD)}</div>
                    {hasDiscount && (
                      <div className="text-sm text-gray-500 line-through">${product.priceUSD.toFixed(2)} USD</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[#111]">
                <div className="prose prose-invert prose-sm max-w-none mb-8 text-gray-400">
                  <p>{product.description}</p>
                </div>

                {/* Key Features Grid */}
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Included in this license</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
                    <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">{product.defaultDurationDays} Days Access</div>
                      <div className="text-xs text-gray-500">Full access period</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
                    <Server className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">{product.maxActivations} Server IP(s)</div>
                      <div className="text-xs text-gray-500">Simultaneous activations</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
                    <Shield className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">Priority Support</div>
                      <div className="text-xs text-gray-500">Fast discord support</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#222]">
                    <Package className="w-5 h-5 text-orange-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">Instant Delivery</div>
                      <div className="text-xs text-gray-500">Automated processing</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Satisfaction / Trust */}
            <div className="flex flex-col sm:flex-row gap-6 py-6 border-t border-b border-[#222]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-white text-sm">Secure Payment</div>
                  <div className="text-xs text-gray-500">256-bit SSL Encrypted</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-white text-sm">Trusted Quality</div>
                  <div className="text-xs text-gray-500">Used by 200+ servers</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Payment & Summary */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-8 space-y-6">

              {/* User Info (Mini) */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#111] border border-[#222]">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt="Discord avatar"
                    className="w-10 h-10 rounded-full border border-[#333]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold text-sm">
                    {session.user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500">Purchasing as</div>
                  <div className="text-sm font-medium text-white truncate max-w-[220px]">{session.user.email}</div>
                </div>
              </div>

              {/* Total Summary Card */}
              <div className="bg-[#111] rounded-2xl border border-[#222] p-7 sm:p-8 shadow-xl relative overflow-hidden">
                {/* Glow effect inside card */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full pointer-events-none"></div>

                <h2 className="text-lg font-semibold text-white mb-7 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  Order Summary
                </h2>

                <div className="space-y-4 mb-7">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCLP(displayPriceCLP)}</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount</span>
                      <span>Save {formatCLP(product.priceCLP - displayPriceCLP)}</span>
                    </div>
                  )}
                  <div className="h-px bg-[#222] my-3"></div>
                  <div className="flex justify-between items-end">
                    <span className="text-white font-medium">Total</span>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">{formatCLP(displayPriceCLP)}</div>
                      <div className="text-xs text-gray-500 mb-1">({formatUSD(displayPriceUSD)})</div>
                    </div>
                  </div>
                </div>

                <div className="mb-7 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300 flex items-start gap-2">
                  <div className="mt-0.5"><Check className="w-3 h-3" /></div>
                  You will be redirected to the payment provider to complete your purchase securely.
                </div>

                <div className="relative z-10 pt-1">
                  <CheckoutClient
                    product={product}
                  />
                </div>
              </div>

              <p className="text-center text-xs text-gray-600">
                By confirming this purchase, you agree to our Terms of Service and Refund Policy.
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
