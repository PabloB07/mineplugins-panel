"use client";

import Image from "next/image";
import { CombinedCheckoutButton } from "@/components/CombinedCheckoutButton";
import {
  PAYMENT_METHODS,
} from "@/lib/payment-methods";

interface CheckoutClientProps {
  product: {
    slug: string;
  };
}

export function CheckoutClient({ product }: CheckoutClientProps) {
  const paykuMethod = PAYMENT_METHODS[0];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#2a2a2a] bg-[#121212] p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-[#303030] bg-[#0d0d0d]">
            <Image
              src={paykuMethod.logo}
              alt={paykuMethod.name}
              width={96}
              height={28}
              className="h-5 w-auto object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Payment Method: Payku</p>
            <p className="text-xs text-gray-500">Secure checkout via Payku gateway.</p>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <CombinedCheckoutButton
          productSlug={product.slug}
          paymentMethod="PAYKU"
          className="mt-1"
        />
      </div>

      <div className="rounded-xl border border-[#222] bg-[#0f0f0f] p-3">
        <p className="text-center text-[11px] uppercase tracking-[0.12em] text-gray-500">Powered by Payku</p>
      </div>
    </div>
  );
}
