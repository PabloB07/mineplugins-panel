"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn("discord", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #22c55e22 1px, transparent 1px),
            linear-gradient(to bottom, #22c55e22 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-green-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative max-w-md mx-auto px-4 py-20 w-full z-10">
        <div className="inline-flex items-center gap-2 bg-[#111] border border-[#222] rounded-full px-4 py-1.5 mb-6 mx-auto block w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-gray-300 text-sm">Customer Access</span>
        </div>

        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 border-2 border-green-500/30 flex items-center justify-center shadow-lg shadow-green-500/20">
            <span className="icon-minecraft icon-minecraft-grass-block scale-150"></span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {t("login.title")}
          </h1>
          <p className="text-gray-400">
            {t("login.subtitle")}
          </p>
        </div>

        <div className="bg-[#111] rounded-2xl p-6 border border-[#222]">
          <h2 className="text-lg font-semibold text-white mb-5 text-center">
            {t("login.chooseMethod")}
          </h2>

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            )}
            {t("login.continueWithDiscord")}
          </button>

          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 h-px bg-[#222]"></div>
            <span className="text-xs text-gray-500">{t("login.secure")}</span>
            <div className="flex-1 h-px bg-[#222]"></div>
          </div>

          <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#222]">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="icon-minecraft-sm icon-minecraft-diamond-block"></span>
              <span>{t("login.benefits.instant")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <span className="icon-minecraft-sm icon-minecraft-paper"></span>
              <span>{t("login.benefits.manage")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <span className="icon-minecraft-sm icon-minecraft-clock"></span>
              <span>{t("login.benefits.updates")}</span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            {t("login.terms")}{" "}
            <Link href="/terms" className="text-green-400 hover:text-green-300">
              Terms
            </Link>{" "}
            <Link href="/privacy" className="text-green-400 hover:text-green-300">
              Privacy
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-green-400 text-sm inline-flex items-center gap-2 transition-colors"
          >
            <span className="icon-minecraft-sm icon-minecraft-arrow"></span>
            {t("login.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}