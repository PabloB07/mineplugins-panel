"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { PAYMENT_METHODS, type PaymentMethodId } from "@/lib/payment-methods";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodId;
  onMethodChange: (method: PaymentMethodId) => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {PAYMENT_METHODS.map((method) => {
        const isSelected = selectedMethod === method.id;
        const isAvailable = method.available ?? true;
        const isDisabled = disabled || !isAvailable;

        return (
          <button
            key={method.id}
            type="button"
            onClick={() => !isDisabled && onMethodChange(method.id)}
            disabled={isDisabled}
            className={[
              "relative rounded-xl border p-4 text-left transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
              isSelected
                ? "border-emerald-500/70 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(34,197,94,0.25)]"
                : "border-[#2a2a2a] bg-[#151515] hover:border-[#3a3a3a]",
              isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            ].join(" ")}
          >
            {isSelected && (
              <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Icon name="Check" className="w-3.5 h-3.5" />
              </span>
            )}

            <div className="flex items-start gap-3 pr-7">
              <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg border border-[#2f2f2f] bg-[#0d0d0d]">
                <Image
                  src={method.logo}
                  alt={method.name}
                  width={96}
                  height={28}
                  className="h-5 w-auto object-contain"
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{method.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">{method.description}</p>
                {!isAvailable && (
                  <p className="mt-1 text-xs text-orange-400">Temporarily unavailable</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
