"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { MinecraftIcon } from "@/components/ui/MinecraftIcon";

export default function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[#222] rounded-3xl p-12 md:p-16 text-center shadow-2xl relative overflow-hidden group">
          {/* Decorative Corner Icons */}
          <div className="absolute -top-6 -left-6 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
            <MinecraftIcon sprite="diamond-ore" scale={4} />
          </div>
          <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
            <MinecraftIcon sprite="emerald-ore" scale={4} />
          </div>

          {/* Main Icon */}
          <div className="inline-flex items-center justify-center mb-8">
            <MinecraftIcon 
              sprite="nether-star" 
              scale={3} 
              glow={true} 
              glowColor="rgba(52, 211, 153, 0.4)"
              className="animate-pulse-slow"
            />
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 relative z-10">
            {t("home.ctaSection.title")}
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed relative z-10">
            {t("home.ctaSection.description")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
            <Link
              href="/store"
              className="group/btn bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] flex items-center gap-3"
            >
              <span>{t("home.ctaSection.primaryButton")}</span>
              <MinecraftIcon sprite="arrow" isSmall scale={1.5} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="bg-[#1a1a1a] hover:bg-[#222] text-white px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 border border-[#333] hover:border-[#444]"
            >
              {t("home.ctaSection.secondaryButton")}
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 pt-8 border-t border-[#222] flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400 relative z-10">
            <div className="flex items-center gap-3 group/badge">
              <MinecraftIcon sprite="clock" isSmall scale={1.25} className="group-hover/badge:rotate-12 transition-transform" />
              <span className="group-hover:text-emerald-400 transition-colors">{t("home.ctaSection.badges.instant")}</span>
            </div>
            <div className="flex items-center gap-3 group/badge">
              <MinecraftIcon sprite="shield" isSmall scale={1.25} className="group-hover/badge:rotate-12 transition-transform" />
              <span className="group-hover:text-emerald-400 transition-colors">{t("home.ctaSection.badges.secure")}</span>
            </div>
            <div className="flex items-center gap-3 group/badge">
              <MinecraftIcon sprite="heart" isSmall scale={1.25} className="group-hover/badge:rotate-12 transition-transform" />
              <span className="group-hover:text-emerald-400 transition-colors">{t("home.ctaSection.badges.support")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
