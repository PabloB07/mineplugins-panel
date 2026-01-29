import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Shield, Clock, Server } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { formatUSD, formatCLP } from "@/lib/pricing";

interface PageProps {
  searchParams: Promise<{ productId?: string }>;
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/buy");
  }

  const { productId } = await searchParams;

  if (!productId) {
    redirect("/buy");
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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/buy"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
          <p className="text-gray-400 mt-1">Complete your purchase</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Product Summary */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Summary
          </h2>

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">{product.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{product.description}</p>

              {latestVersion && (
                <div className="text-xs text-gray-500 mt-2">
                  Latest: v{latestVersion.version}
                  {latestVersion.minMcVersion && ` | MC ${latestVersion.minMcVersion}+`}
                  {latestVersion.minJavaVersion && ` | Java ${latestVersion.minJavaVersion}+`}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {formatUSD(displayPriceUSD)}
              </div>
              <div className="text-sm text-gray-300">
                {formatCLP(displayPriceCLP)}
              </div>
              {hasDiscount && (
                <div className="text-sm text-gray-500 line-through">
                  {formatUSD(product.priceUSD)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* License Details */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            License Details
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-300">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-sm text-gray-400">Duration</div>
                <div className="font-medium">{product.defaultDurationDays} days</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-300">
              <Server className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-sm text-gray-400">Server Activations</div>
                <div className="font-medium">{product.maxActivations} server(s)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Payment</h2>

          <div className="text-sm text-gray-400 mb-4">
            You will be redirected to Flow.cl to complete your payment securely.
            We accept credit cards, debit cards, and bank transfers.
          </div>

          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-300">Total</span>
              <div className="text-right">
                <div className="text-xl font-bold text-white">
                  {formatCLP(displayPriceCLP)}
                </div>
                <div className="text-sm text-gray-400">
                  ({formatUSD(displayPriceUSD)})
                </div>
              </div>
            </div>

            <CheckoutButton productSlug={product.slug} />
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-gray-700/30 rounded-lg p-4 text-sm text-gray-400">
          <p>
            Purchasing as: <span className="text-white">{session.user.email}</span>
          </p>
          <p className="mt-1">
            Your license will be automatically linked to your account after payment.
          </p>
        </div>
      </div>
    </div>
  );
}
