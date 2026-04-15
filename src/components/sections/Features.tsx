"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { useIcon } from "@/hooks/useIcon";

const features = [
  {
    icon: "ShoppingCart",
    key: "official",
  },
  {
    icon: "Key",
    key: "license",
  },
  {
    icon: "Download",
    key: "instant",
  },
  {
    icon: "Shield",
    key: "secure",
  },
  {
    icon: "Server",
    key: "paper",
  },
  {
    icon: "User",
    key: "portal",
  },
  {
    icon: "FileText",
    key: "details",
  },
];

export default function Features() {
  const { t } = useTranslation();
  const ShoppingCart = useIcon("ShoppingCart");
  const Key = useIcon("Key");
  const Download = useIcon("Download");
  const Shield = useIcon("Shield");
  const Server = useIcon("Server");
  const User = useIcon("User");
  const FileText = useIcon("FileText");

  const iconMap: Record<string, any> = {
    ShoppingCart,
    Key,
    Download,
    Shield,
    Server,
    User,
    FileText,
  };

  return (
    <section id="features" className="py-24 bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">{t("features.label")}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            {t("features.title")}
            <br />
            <span className="text-emerald-400">{t("features.subtitleHighlight")}</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon];
            return (
              <div
                key={index}
                className="pixel-frame pixel-frame-neutral group bg-[#111] border border-[#222] rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {t(`features.items.${feature.key}.title`)}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {t(`features.items.${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
