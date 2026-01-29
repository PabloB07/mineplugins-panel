"use client";

import { useState } from "react";
import { Package, Shield, Clock, Server } from "lucide-react";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { CombinedCheckoutButton } from "@/components/CombinedCheckoutButton";

interface CheckoutClientProps {
  product: any;
  displayPriceUSD: number;
  displayPriceCLP: number;
  user: any;
}

export function CheckoutClient({ product, displayPriceUSD, displayPriceCLP, user }: CheckoutClientProps) {
  const [selectedMethod, setSelectedMethod] = useState<"FLOW_CL" | "PAYKU">("FLOW_CL");

  return (
    <div className="space-y-6">
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

            {product.versions && product.versions[0] && (
              <div className="text-xs text-gray-500 mt-2">
                Latest: v{product.versions[0].version}
                {product.versions[0].minMcVersion && ` | MC ${product.versions[0].minMcVersion}+`}
                {product.versions[0].minJavaVersion && ` | Java ${product.versions[0].minJavaVersion}+`}
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              ${displayPriceUSD.toFixed(2)}
            </div>
            <div className="text-sm text-gray-300">
              ${displayPriceCLP.toLocaleString('es-CL')} CLP
            </div>
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

      {/* Payment Method Selection */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <PaymentMethodSelector
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
        />
      </div>

      {/* Payment Info */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Payment</h2>

        <div className="text-sm text-gray-400 mb-4">
          You will be redirected to {selectedMethod === "FLOW_CL" ? "Flow.cl" : "Payku"} 
          to complete your payment securely.
          We accept credit cards, debit cards, and bank transfers.
        </div>

        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-300">Total</span>
            <div className="text-right">
              <div className="text-xl font-bold text-white">
                ${displayPriceCLP.toLocaleString('es-CL')} CLP
              </div>
              <div className="text-sm text-gray-400">
                (${displayPriceUSD.toFixed(2)} USD)
              </div>
            </div>
          </div>

          <CombinedCheckoutButton
            productSlug={product.slug}
            paymentMethod={selectedMethod}
          />
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-gray-700/30 rounded-lg p-4 text-sm text-gray-400">
        <p>
          Purchasing as: <span className="text-white">{user.email}</span>
        </p>
        <p className="mt-1">
          Your license will be automatically linked to your account after payment.
        </p>
      </div>
    </div>
  );
}