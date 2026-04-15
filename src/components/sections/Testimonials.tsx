"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { MinecraftIcon } from "@/components/ui/MinecraftIcon";

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
    <section className="py-24 bg-zinc-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
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
              className="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-500 group relative hover:-translate-y-1 shadow-lg overflow-hidden"
            >
              {/* Decorative Minecraft Head */}
              <div className="absolute -top-4 -right-4 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                <MinecraftIcon 
                  sprite="player-head" 
                  scale={3} 
                  className="opacity-5 grayscale group-hover:grayscale-0 group-hover:opacity-10 transition-all duration-500"
                />
              </div>

              {/* Rating - Minecraft Hearts */}
              <div className="flex gap-1.5 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <MinecraftIcon 
                    key={i} 
                    sprite="heart" 
                    isSmall={true} 
                    scale={1.5} 
                    className="animate-bounce-subtle"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 text-sm leading-relaxed mb-8 relative z-10 italic">
                "{t(testimonial.content)}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-[#222]">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20 transform group-hover:rotate-3 transition-transform">
                  {testimonial.name[0]}
                </div>
                <div>
                  <div className="text-white text-base font-semibold group-hover:text-emerald-400 transition-colors">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-500 text-xs uppercase tracking-widest">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
