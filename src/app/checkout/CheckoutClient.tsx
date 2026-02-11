"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { CombinedCheckoutButton } from "@/components/CombinedCheckoutButton";
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHODS,
  type PaymentMethodId,
} from "@/lib/payment-methods";

interface CheckoutClientProps {
  product: {
    slug: string;
  };
}

export function CheckoutClient({ product }: CheckoutClientProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>(DEFAULT_PAYMENT_METHOD);

  const selectedMethodData = useMemo(
    () => PAYMENT_METHODS.find((method) => method.id === selectedMethod),
    [selectedMethod],
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
          Select Payment Method
        </label>
        <PaymentMethodSelector
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
        />
      </div>

      {selectedMethodData && (
        <div className="rounded-lg border border-[#262626] bg-[#121212] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-12 items-center justify-center rounded-md border border-[#303030] bg-[#0d0d0d]">
              <Image
                src={selectedMethodData.logo}
                alt={selectedMethodData.name}
                width={84}
                height={24}
                className="h-[18px] w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Paying with {selectedMethodData.checkoutLabel}</p>
              <p className="text-xs text-gray-500">You can switch methods before confirming payment.</p>
            </div>
          </div>
        </div>
      )}

      <div className="pt-1">
        <CombinedCheckoutButton
          productSlug={product.slug}
          paymentMethod={selectedMethod}
        />
      </div>

      <div className="pt-2">
        <p className="mb-2 text-center text-[11px] uppercase tracking-[0.12em] text-gray-500">Accepted Partners</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PAYMENT_METHODS.map((method) => (
            <div
              key={method.id}
              className={[
                "flex h-10 items-center rounded-lg border px-3 transition-colors",
                method.id === selectedMethod
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-[#2b2b2b] bg-[#111111]",
              ].join(" ")}
            >
              <Image
                src={method.logo}
                alt={method.name}
                width={96}
                height={28}
                className="h-[18px] w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
