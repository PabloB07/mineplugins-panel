"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface PaykuStandaloneButtonProps {
  productSlug: string;
  durationDays?: number;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  onSuccess?: (paymentData: Record<string, unknown>) => void;
  onError?: (error: string) => void;
}

export function PaykuStandaloneButton({
  productSlug,
  durationDays,
  className = "",
  children,
  variant = "default",
  size = "md",
  onSuccess,
  onError,
}: PaykuStandaloneButtonProps) {
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

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to create payment");
      }

      console.log("[PaykuStandalone] paymentUrl:", data.paymentUrl);

      // Use setTimeout to avoid React hydration issue
      setTimeout(() => {
        window.location.href = data.paymentUrl;
      }, 100);

      onSuccess?.(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "outline":
        return "border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white";
      case "ghost":
        return "text-blue-600 hover:bg-blue-600/10";
      default:
        return "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "py-2 px-4 text-sm";
      case "lg":
        return "py-4 px-8 text-lg";
      default:
        return "py-3 px-6 text-base";
    }
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
        disabled={isLoading}
        className={`
          inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all
          ${getVariantStyles()}
          ${getSizeStyles()}
          ${isLoading ? 'cursor-not-allowed opacity-50' : 'transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-blue-600/25'}
        `}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" color="white" />
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
