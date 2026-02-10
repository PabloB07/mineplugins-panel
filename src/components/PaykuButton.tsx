"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createPaykuPayment, generatePaykuOrderNumber } from "@/lib/payku";

interface PaykuButtonProps {
  productSlug: string;
  durationDays?: number;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
}

export function PaykuButton({
  productSlug,
  durationDays,
  className = "",
  children,
  disabled = false,
  onSuccess,
  onError,
}: PaykuButtonProps) {
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
          paymentMethod: "PAYKU",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create payment");
      }

      // Redirect to Payku payment page
      window.location.href = data.paymentUrl;

      onSuccess?.(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
    }
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
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-blue-600/25"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <img
              src="/payku-logo.png"
              alt="Payku"
              className="h-5 w-auto"
            />
            {children || "Pay with Payku"}
          </>
        )}
      </button>
    </div>
  );
}
