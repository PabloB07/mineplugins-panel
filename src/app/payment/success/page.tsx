"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/i18n/useTranslation";

function PaymentSuccessContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");

  const [checking, setChecking] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [manuallyCompleting, setManuallyCompleting] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
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
          router.replace("/dashboard?error=order_not_found");
          return;
        }

        setOrderData(data.order);

        if (data.order.status === "COMPLETED") {
          setPaymentVerified(true);
          setChecking(false);
        } else if (data.order.status === "PROCESSING" || data.order.status === "PENDING") {
          setChecking(false);
        } else if (data.order.status === "FAILED") {
          router.replace(`/payment/failed?orderNumber=${orderNumber || data.order.orderNumber}&reason=rejected`);
        } else {
          setChecking(false);
        }
      } catch (err) {
        console.error("Status check error:", err);
        setChecking(false);
      }
    };

    checkStatus();
  }, [orderNumber, orderId, router]);

  const handleManualComplete = async () => {
    if (!orderNumber) return;
    
    setManuallyCompleting(true);
    try {
      const res = await fetch("/api/payment/manual-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber })
      });
      const data = await res.json();
      
      if (data.success) {
        window.location.href = `/payment/success?orderNumber=${orderNumber}`;
      } else {
        alert(data.error || "Error completing payment");
        setManuallyCompleting(false);
      }
    } catch (err) {
      console.error("Manual complete error:", err);
      alert("Error");
      setManuallyCompleting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!paymentVerified && orderData?.status !== "COMPLETED") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 text-center space-y-6">
          <h2 className="text-3xl font-black text-white">Payment Pending</h2>
          <p className="text-gray-400">
            Did you complete payment in Webpay? Click below:
          </p>
          <button
            onClick={handleManualComplete}
            disabled={manuallyCompleting}
            className="w-full py-4 bg-green-500 text-black font-bold rounded-2xl hover:bg-green-400 transition-all disabled:opacity-50"
          >
            {manuallyCompleting ? "Completing..." : "I Completed Payment"}
          </button>
          <div>
            <button
               onClick={() => router.push("/dashboard/orders")}
               className="text-gray-500 hover:text-white text-sm"
            >
              Go to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-[#0a0a0a]/70 border border-emerald-500/20 rounded-[3rem] p-8 md:p-14 text-center">
        <h1 className="text-5xl md:text-6xl font-black text-white">
          {t("payment.successTitle") || "Payment Successful!"}
        </h1>
        <p className="text-gray-400 text-xl mt-4">
          {t("payment.orderConfirmed")?.replace("{orderNumber}", orderNumber || "") || `Order: ${orderNumber}`}
        </p>
        <button
          onClick={() => router.push("/dashboard/licenses")}
          className="mt-8 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-[2rem]"
        >
          {t("payment.getPlugins") || "Get Plugins"}
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
