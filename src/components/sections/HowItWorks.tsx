"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { MinecraftIcon } from "@/components/ui/MinecraftIcon";

const steps = [
  {
    sprite: "emerald-block",
    key: "browse",
    color: "rgba(52, 211, 153, 0.3)", // emerald-400
  },
  {
    sprite: "gold-block",
    key: "purchase",
    color: "rgba(250, 204, 21, 0.3)", // yellow-400
  },
  {
    sprite: "diamond-block",
    key: "download",
    color: "rgba(34, 211, 238, 0.3)", // cyan-400
  },
  {
    sprite: "beacon",
    key: "activate",
    color: "rgba(168, 85, 247, 0.3)", // purple-400
  },
];

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-[#0a0a0a] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">
            {t("home.howItWorks.label")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            {t("home.howItWorks.title")}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t("home.howItWorks.subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-[4.5rem] left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#222] via-[#333] to-transparent z-0" />
              )}

              <div className="relative bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-emerald-500/5 z-10">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-[#0a0a0a] border-2 border-[#222] rounded-full flex items-center justify-center text-sm font-bold text-emerald-400 group-hover:border-emerald-500 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="mb-8 flex justify-center">
                  <div className="relative">
                    <div 
                      className="absolute inset-0 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ backgroundColor: step.color }}
                    ></div>
                    <MinecraftIcon
                      sprite={step.sprite}
                      scale={3}
                      glow
                      glowColor={step.color}
                      className="group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out"
                    />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors text-center">
                  {t(`home.howItWorks.steps.${step.key}.title`)}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed text-center">
                  {t(`home.howItWorks.steps.${step.key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
