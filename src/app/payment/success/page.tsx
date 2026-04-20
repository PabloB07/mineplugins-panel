"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MinecraftIcon } from "@/components/ui/MinecraftIcon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/i18n/useTranslation";

function PaymentSuccessContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();

  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");
  const initialStatus = searchParams.get("status");

  const [checking, setChecking] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

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
        // Don't auto-poll - user must complete manually in Payku dashboard
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
  }, [orderNumber, orderId, router]);

  useEffect(() => {
    checkStatus();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>
        
        <div className="max-w-md w-full relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
           <div className="relative inline-block">
              <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative p-6 bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-2xl">
                <LoadingSpinner size="lg" />
              </div>
           </div>
           <div className="space-y-3">
              <h1 className="text-3xl font-black text-white tracking-tight">{t("payment.verifying")}</h1>
              <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
                {t("payment.confirmingDesc")}
              </p>
           </div>
<div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.2em] ml-2">{t("payment.secureLink")}</span>
            </div>
        </div>
      </div>
    );
  }

  // If not completed but we stopped checking
  const [manuallyCompleting, setManuallyCompleting] = useState(false);

  const handleManualComplete = async () => {
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

  if (!paymentVerified && orderData?.status !== "COMPLETED") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl shadow-amber-900/10">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-3xl inline-block mx-auto">
             <MinecraftIcon sprite="clock" scale={1.5} className="animate-[spin_3s_linear_infinite]" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{t("payment.stillProcessing")}</h2>
          <p className="text-gray-400">
            Did you complete payment in Webpay? Click below:
          </p>
          <button
            onClick={handleManualComplete}
            disabled={manuallyCompleting}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-green-500 text-black font-bold rounded-2xl hover:bg-green-400 transition-all shadow-xl disabled:opacity-50"
          >
            <MinecraftIcon sprite="emerald" scale={0.6} isSmall />
            {manuallyCompleting ? "Completing..." : "I Completed Payment"}
          </button>
          <div className="pt-2">
            <button
               onClick={() => router.push("/dashboard/orders")}
               className="text-gray-500 hover:text-white text-sm font-medium"
            >
              Go to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-[#0a0a0a]/70 backdrop-blur-3xl border border-emerald-500/20 rounded-[3rem] p-8 md:p-14 text-center shadow-[0_20px_80px_rgba(16,185,129,0.1)] relative overflow-hidden border-t-white/10">
          
          {/* Decorative bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
          
          {/* Main Success Icon */}
          <div className="relative mb-10 group">
            <div className="absolute inset-x-0 top-0 -mt-16 flex justify-center opacity-50 group-hover:opacity-80 transition-opacity">
               <MinecraftIcon sprite="emerald-block" scale={4} className="blur-3xl opacity-30" />
            </div>
            <div className="relative inline-block">
               <MinecraftIcon sprite="emerald-block" scale={6} className="mx-auto drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]" />
               <div className="absolute -bottom-4 -right-4 bg-emerald-500 p-3 rounded-2xl shadow-2xl border-4 border-[#0a0a0a] animate-bounce">
                   <MinecraftIcon sprite="emerald" scale={1} />
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
              {t("payment.successTitle")}
            </h1>
            <p className="text-gray-400 text-xl font-medium max-w-md mx-auto leading-relaxed">
              {t("payment.orderConfirmed").replace("{orderNumber}", (orderNumber || orderData?.orderNumber || "").toString())}
            </p>
          </div>

          {/* Features / Success Badges */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3 group hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all duration-500">
               <MinecraftIcon sprite="experience-bottle" scale={1} className="mx-auto" />
               <div>
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t("payment.instant")}</p>
                  <h4 className="text-sm font-bold text-white">{t("payment.downloads")}</h4>
               </div>
            </div>
            <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3 group hover:bg-blue-500/5 hover:border-blue-500/20 transition-all duration-500">
               <MinecraftIcon sprite="shield" scale={1} className="mx-auto" />
               <div>
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t("payment.new")}</p>
                  <h4 className="text-sm font-bold text-white">{t("payment.licenseKey")}</h4>
               </div>
            </div>
            <div className="hidden md:block p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3 group hover:bg-amber-500/5 hover:border-amber-500/20 transition-all duration-500">
               <MinecraftIcon sprite="map" scale={1} className="mx-auto" />
               <div>
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t("payment.global")}</p>
                  <h4 className="text-sm font-bold text-white">{t("payment.activation")}</h4>
               </div>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="mt-12 flex flex-col md:flex-row gap-4">
            <button
              onClick={() => router.push("/dashboard/licenses")}
              className="flex-1 flex items-center justify-center gap-4 px-8 py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-[2rem] transition-all transform hover:-translate-y-1 shadow-[0_15px_40px_rgba(16,185,129,0.3)] active:scale-95"
            >
              {t("payment.getPlugins")} <MinecraftIcon sprite="iron-sword" scale={0.7} isSmall className="rotate-90" />
            </button>
            <button
               onClick={() => router.push("/dashboard/orders")}
               className="flex-1 flex items-center justify-center gap-4 px-8 py-5 bg-[#121212] border border-white/10 text-white font-bold text-lg rounded-[2rem] hover:bg-[#1a1a1a] transition-all transform hover:-translate-y-1 active:scale-95"
            >
              {t("payment.viewReceipt")} <MinecraftIcon sprite="paper" scale={0.7} isSmall className="opacity-50" />
            </button>
          </div>
          
          <div className="mt-10 flex items-center justify-center gap-3 text-gray-600 text-xs font-semibold uppercase tracking-widest">
            <MinecraftIcon sprite="emerald" scale={0.3} isSmall /> {t("payment.secureCheckout")}
          </div>
        </div>
        
        <button 
          onClick={() => router.push("/")}
          className="mt-10 text-gray-500 hover:text-white font-bold text-sm mx-auto flex items-center gap-3 transition-all px-6 py-2 rounded-full hover:bg-white/5"
        >
          <MinecraftIcon sprite="filled-map" scale={0.5} isSmall /> {t("payment.backStorefront")}
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}