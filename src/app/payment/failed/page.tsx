"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MinecraftIcon } from "@/components/ui/MinecraftIcon";
import { useTranslation } from "@/i18n/useTranslation";

function PaymentFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const orderNumber = searchParams.get("orderNumber");
  const reason = searchParams.get("reason");

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent_85%)] opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-red-500/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-red-900/10 relative overflow-hidden">
          {/* TNT / Error Icon with Glow */}
          <div className="relative flex justify-center mb-10 group">
            <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-50 group-hover:scale-75 transition-transform duration-700"></div>
            <div className="relative">
              <MinecraftIcon sprite="tnt" scale={5} className="mx-auto" />
              <div className="absolute -bottom-2 -right-2 bg-red-600 p-2 rounded-xl shadow-lg border-4 border-[#0a0a0a]">
                <MinecraftIcon sprite="barrier" scale={0.7} isSmall />
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {t("payment.failedTitle")}
            </h1>
            <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
              {t("payment.failedDesc")}
            </p>
          </div>

          {/* Error Details Box */}
          <div className="mt-10 p-6 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-start gap-5">
            <div className="p-2 rounded-lg bg-red-500/20 shrink-0">
               <MinecraftIcon sprite="tnt" scale={0.8} isSmall />
            </div>
            <div>
              <h3 className="font-bold text-red-500 text-sm uppercase tracking-wider">{t("payment.errorDetails")}</h3>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                {t("payment.orderLabel")} <span className="text-gray-200 font-mono">{orderNumber || t("admin.unknown")}</span>
                {reason && (
                  <>
                    <span className="mx-2 opacity-30">|</span>
                    {t("payment.reasonLabel")} <span className="text-gray-200">{reason}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 grid md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push("/store")}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
            >
              <MinecraftIcon sprite="clock" scale={0.7} isSmall className="group-hover:rotate-180 transition-transform duration-500" />
              {t("payment.tryAgain")}
            </button>
            <button
              onClick={() => router.push("/dashboard/tickets")}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-800/50 text-white font-bold rounded-2xl hover:bg-gray-800 border border-white/5 transition-all active:scale-95"
            >
              <MinecraftIcon sprite="writable-book" scale={0.7} isSmall />
              {t("payment.contactSupport")}
            </button>
          </div>

          {/* Secondary Nav */}
          <button 
            onClick={() => router.push("/")}
            className="mt-8 flex items-center justify-center gap-3 text-gray-500 hover:text-white transition-colors text-sm font-bold w-full"
          >
            <MinecraftIcon sprite="iron-sword" scale={0.5} isSmall className="-rotate-90" />
            {t("payment.backHome")}
          </button>
        </div>

        {/* Support Help Footer */}
        <div className="mt-8 flex items-center justify-center gap-6 text-gray-600">
          <div className="flex items-center gap-3 cursor-pointer hover:text-gray-400 transition-colors group">
            <span className="text-[10px] font-black uppercase tracking-tighter bg-gray-800 px-2 py-0.5 rounded text-gray-400">FAQ</span>
            <span className="text-xs font-bold">{t("payment.billingHelp")}</span>
            <MinecraftIcon sprite="gold-ingot" scale={0.3} isSmall className="opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
          <div className="flex items-center gap-3 cursor-pointer hover:text-gray-400 transition-colors group">
            <span className="text-[10px] font-black uppercase tracking-tighter bg-[#5865F2]/20 px-2 py-0.5 rounded text-[#5865F2]">Discord</span>
            <span className="text-xs font-bold">{t("payment.liveSupport")}</span>
            <MinecraftIcon sprite="gold-ingot" scale={0.3} isSmall className="opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-600/20 rounded-2xl"></div>
            <div className="h-4 w-32 bg-gray-800 rounded"></div>
          </div>
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}
