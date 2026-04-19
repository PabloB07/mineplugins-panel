"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MinecraftIcon } from "@/components/ui/MinecraftIcon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");
  const paymentStatus = searchParams.get("status");

  const [checking, setChecking] = useState(true);
  const [count, setCount] = useState(0);
  const [paymentVerified, setPaymentVerified] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!orderNumber && !orderId) {
      router.replace("/");
      return;
    }

    try {
      const params = new URLSearchParams();
      if (orderNumber) params.set("orderNumber", orderNumber);
      if (orderId) params.set("orderId", orderId);

      const res = await fetch(`/api/payment/confirm?${params.toString()}`);
      const data = await res.json();

      if (!data.order) {
        router.replace("/");
        return;
      }

      setPaymentVerified(true);

      if (data.order.status === "COMPLETED") {
        if (session?.user) {
          router.replace(`/dashboard?payment=success&order=${data.order.orderNumber}`);
        } else {
          router.replace(`/?payment=success&order=${data.order.orderNumber}`);
        }
      } else if (data.order.status === "PROCESSING") {
        if (count < 5) {
          setCount(c => c + 1);
          setTimeout(checkStatus, 3000);
        } else {
          router.replace(session?.user ? `/dashboard?payment=pending&order=${data.order.orderNumber}` : `/?payment=pending&order=${data.order.orderNumber}`);
        }
      } else if (data.order.status === "PENDING") {
        if (count < 5) {
          setCount(c => c + 1);
          setTimeout(checkStatus, 3000);
        } else {
          router.replace(session?.user ? `/dashboard?payment=checking&order=${data.order.orderNumber}` : `/?payment=checking&order=${data.order.orderNumber}`);
        }
      } else {
        router.replace("/");
      }
    } catch {
      router.replace("/");
    }
  }, [orderNumber, orderId, paymentStatus, count, router, session]);

  useEffect(() => {
    if (status === "loading") return;

    if (!orderNumber && !orderId) {
      router.replace("/");
      return;
    }

    checkStatus();
  }, [status, orderNumber, orderId, router, checkStatus]);

  if (checking || !paymentVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center">
          <div className="mb-6">
            <LoadingSpinner size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Verifying payment...
          </h1>
          <p className="text-gray-400">
            Please wait while we verify your payment status.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center">
        <div className="mb-6">
          <MinecraftIcon sprite="emerald-block" scale={4} className="mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-400 mb-6">
          Your payment has been processed. Your license has been activated.
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}