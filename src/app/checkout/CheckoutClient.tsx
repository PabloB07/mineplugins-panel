"use client";

import { useState } from "react";
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
    <div className="space-y-4">
      {/* Payment Method Selection - Compact Style */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Select Payment Method
        </label>
        <PaymentMethodSelector
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
        />
      </div>

      <div className="pt-2">
        <CombinedCheckoutButton
          productSlug={product.slug}
          paymentMethod={selectedMethod}
        />
      </div>
    </div>
  );
}