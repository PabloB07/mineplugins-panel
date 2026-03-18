"use client";

import { useState } from "react";
import Image from "next/image";
import { CombinedCheckoutButton } from "@/components/CombinedCheckoutButton";
import {
  PAYMENT_METHODS,
  getAvailablePaymentMethods,
  PaymentMethodId,
} from "@/lib/payment-methods";

interface CheckoutClientProps {
  product: {
    slug: string;
  };
}

export function CheckoutClient({ product }: CheckoutClientProps) {
  const availableMethods = getAvailablePaymentMethods();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>(
    availableMethods.length > 0 ? availableMethods[0].id : "PAYKU"
  );

  const selected = PAYMENT_METHODS.find((m) => m.id === selectedMethod) || PAYMENT_METHODS[0];

  if (availableMethods.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-center text-red-400">
            No payment methods configured. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {availableMethods.length > 1 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300">
            Select Payment Method
          </label>
          <div className="grid grid-cols-1 gap-3">
            {availableMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                  selectedMethod === method.id
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-[#2a2a2a] bg-[#121212] hover:border-[#333]"
                }`}
              >
                <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-[#303030] bg-[#0d0d0d]">
                  <Image
                    src={method.logo}
                    alt={method.name}
                    width={96}
                    height={28}
                    className="h-5 w-auto object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{method.name}</p>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
                {selectedMethod === method.id && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableMethods.length === 1 && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#121212] p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-[#303030] bg-[#0d0d0d]">
              <Image
                src={selected.logo}
                alt={selected.name}
                width={96}
                height={28}
                className="h-5 w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Payment Method: {selected.name}</p>
              <p className="text-xs text-gray-500">{selected.description}</p>
            </div>
          </div>
        </div>
      )}

      <div className="pt-1">
        <CombinedCheckoutButton
          productSlug={product.slug}
          paymentMethod={selectedMethod}
          className="mt-1"
        />
      </div>

      <div className="rounded-xl border border-[#222] bg-[#0f0f0f] p-3">
        <p className="text-center text-[11px] uppercase tracking-[0.12em] text-gray-500">
          Powered by {selected.name}
        </p>
      </div>
    </div>
  );
}
