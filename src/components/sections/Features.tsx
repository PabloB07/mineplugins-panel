"use client";

import { useTranslation } from "@/i18n/useTranslation";

const features = [
  {
    icon: "📦",
    key: "official",
  },
  {
    icon: "🔐",
    key: "license",
  },
  {
    icon: "⚡",
    key: "instant",
  },
  {
    icon: "🧾",
    key: "secure",
  },
  {
    icon: "🧩",
    key: "paper",
  },
  {
    icon: "🤝",
    key: "portal",
  },
  {
    icon: "🎨",
    key: "details",
  },
];

export default function Features() {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24 bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Features</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            {t("features.title")}
            <br />
            <span className="text-emerald-400">buy Paper 1.21+ plugins</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="pixel-frame pixel-frame-neutral group bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 hover:bg-zinc-800 hover:border-emerald-500/50 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {t(`features.items.${feature.key}.title`)}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {t(`features.items.${feature.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
