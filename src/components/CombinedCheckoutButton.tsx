"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { type PaymentMethodId } from "@/lib/payment-methods";

interface CombinedCheckoutButtonProps {
  productSlug: string;
  durationDays?: number;
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
  paymentMethod,
  className = "",
  children,
  disabled = false,
  onSuccess,
  onError,
}: CombinedCheckoutButtonProps) {
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
          paymentMethod,
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
    return children || `Pay with ${paymentMethod === "FLOW_CL" ? "Flow.cl" : "Payku"}`;
  };

  const getButtonColor = () => {
    if (paymentMethod === "FLOW_CL") {
      return "bg-[#22c55e] hover:bg-[#16a34a]";
    }
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
            <Loader2 className="w-5 h-5 animate-spin" />
            {getButtonText()}
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {getButtonText()}
          </>
        )}
      </button>
    </div>
  );
}
