"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { useIcon } from "@/hooks/useIcon";

const steps = [
  {
    icon: "ShoppingCart",
    key: "browse",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: "CreditCard",
    key: "purchase",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: "Download",
    key: "download",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: "Server",
    key: "activate",
    color: "from-orange-500 to-orange-600",
  },
];

export default function HowItWorks() {
  const { t } = useTranslation();
  const ShoppingCart = useIcon("ShoppingCart");
  const CreditCard = useIcon("CreditCard");
  const Download = useIcon("Download");
  const Server = useIcon("Server");

  const iconMap: Record<string, any> = {
    ShoppingCart,
    CreditCard,
    Download,
    Server,
  };

  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
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
          {steps.map((step, index) => {
            const Icon = iconMap[step.icon];
            return (
              <div key={index} className="relative group">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#222] to-transparent" />
                )}

                <div className="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                  {/* Step Number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#0a0a0a] border-2 border-[#222] rounded-full flex items-center justify-center text-sm font-bold text-emerald-400 group-hover:border-emerald-500 transition-colors">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} p-3 mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-full h-full text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                    {t(`home.howItWorks.steps.${step.key}.title`)}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {t(`home.howItWorks.steps.${step.key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
