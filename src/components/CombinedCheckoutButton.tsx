"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

interface CombinedCheckoutButtonProps {
  productSlug: string;
  durationDays?: number;
  paymentMethod: "FLOW_CL" | "PAYKU";
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onSuccess?: (paymentData: any) => void;
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

  const getButtonGradient = () => {
    if (paymentMethod === "FLOW_CL") {
      return "from-green-600 to-green-700 hover:from-green-500 hover:to-green-600";
    }
    return "from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600";
  };

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isLoading || disabled}
        className={`w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${getButtonGradient()} disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-600/25`}
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