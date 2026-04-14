"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { type PaymentMethodId } from "@/lib/payment-methods";
import { useTranslation } from "@/i18n/useTranslation";

interface CombinedCheckoutButtonProps {
  productSlug: string;
  durationDays?: number;
  discountCode?: string;
  paymentMethod: PaymentMethodId;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onSuccess?: (paymentData: Record<string, unknown>) => void;
  onError?: (error: string) => void;
}

export function CombinedCheckoutButton({
  productSlug,
  durationDays,
  discountCode,
  paymentMethod,
  className = "",
  children,
  disabled = false,
  onSuccess,
  onError,
}: CombinedCheckoutButtonProps) {
  const { currency } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create payment order
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productSlug,
          durationDays,
          discountCode,
          paymentMethod,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create payment");
      }

      // Redirect to payment URL
      window.location.href = data.paymentUrl;

      onSuccess?.(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Processing...";
    if (children) return children;
    if (paymentMethod === "TEBEX") return "Pay with Tebex";
    if (paymentMethod === "PAYPAL") return "Pay with PayPal";
    return "Pay with Payku";
  };

  const getButtonColor = () => {
    if (paymentMethod === "TEBEX") return "bg-[#8b5cf6] hover:bg-[#7c3aed]";
    if (paymentMethod === "PAYPAL") return "bg-[#0070e0] hover:bg-[#005bb5]";
    return "bg-[#3b82f6] hover:bg-[#2563eb]";
  };

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isLoading || disabled}
        className={`w-full inline-flex items-center justify-center gap-2 ${getButtonColor()} disabled:bg-[#3f3f46] text-white font-medium py-3 px-6 rounded-xl transition-all disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_12px_rgba(34,197,94,0.3)]`}
      >
        {isLoading ? (
          <>
            <Icon name="Loader2" className="w-5 h-5 animate-spin" />
            {getButtonText()}
          </>
        ) : (
          <>
            <Icon name="CreditCard" className="w-5 h-5" />
            {getButtonText()}
          </>
        )}
      </button>
    </div>
  );
}
