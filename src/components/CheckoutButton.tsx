"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface CheckoutButtonProps {
  productSlug: string;
  durationDays?: number;
}

export function CheckoutButton({ productSlug, durationDays }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productSlug,
          durationDays,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create payment");
      }

      // Redirect to Flow.cl payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] disabled:from-[#3f3f46] disabled:to-[#3f3f46] text-white font-medium py-3 px-6 rounded-xl transition-all disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" color="white" />
            Processing...
          </>
        ) : (
          <>
            <Icon name="CreditCard" className="w-5 h-5" />
            Pay Now with Flow.cl
          </>
        )}
      </button>
    </div>
  );
}
