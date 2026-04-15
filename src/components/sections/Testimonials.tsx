"use client";

import { useTranslation } from "@/i18n/useTranslation";

const testimonials = [
  {
    name: "Carlos M.",
    role: "Server Owner",
    content: "home.testimonials.carlos.content",
    rating: 5,
  },
  {
    name: "Alex R.",
    role: "Network Admin",
    content: "home.testimonials.alex.content",
    rating: 5,
  },
  {
    name: "Maria S.",
    role: "Community Manager",
    content: "home.testimonials.maria.content",
    rating: 5,
  },
];

export default function Testimonials() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">
            {t("home.testimonials.label")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            {t("home.testimonials.title")}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t("home.testimonials.subtitle")}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300 group relative"
            >
              {/* Minecraft Quote Icon */}
              <div className="absolute top-6 right-6">
                <div className="icon-minecraft icon-minecraft-player-head scale-150 opacity-20"></div>
              </div>

              {/* Rating - Minecraft Hearts */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <div key={i} className="icon-minecraft-sm icon-minecraft-heart scale-150"></div>
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                {t(testimonial.content)}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#222]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                  {testimonial.name[0]}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-500 text-xs">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
