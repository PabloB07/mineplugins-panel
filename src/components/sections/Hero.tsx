"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { MinecraftIcon } from "@/components/ui/MinecraftIcon";

function PixelParticles() {
  const particles = [
    { x: 10, y: 20, delay: "0s" },
    { x: 25, y: 15, delay: "0.2s" },
    { x: 40, y: 25, delay: "0.4s" },
    { x: 60, y: 10, delay: "0.1s" },
    { x: 75, y: 20, delay: "0.3s" },
    { x: 85, y: 15, delay: "0.5s" },
    { x: 15, y: 60, delay: "0.6s" },
    { x: 35, y: 70, delay: "0.8s" },
    { x: 55, y: 55, delay: "0.7s" },
    { x: 70, y: 65, delay: "0.9s" },
    { x: 90, y: 50, delay: "1s" },
    { x: 5, y: 40, delay: "1.1s" },
    { x: 50, y: 35, delay: "1.2s" },
    { x: 80, y: 35, delay: "1.3s" },
  ];

  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: i % 3 === 0 ? "#22c55e" : i % 3 === 1 ? "#74BE58" : "#5D9E52",
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  );
}

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Pixel Background Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #22c55e11 1px, transparent 1px),
            linear-gradient(to bottom, #22c55e11 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Animated Minecraft Icons Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] animate-pulse-slow">
          <MinecraftIcon sprite="grass-block" scale={1.5} className="opacity-20" />
        </div>
        <div className="absolute top-40 right-[15%] animate-pulse-slow" style={{ animationDelay: "0.5s" }}>
          <MinecraftIcon sprite="diamond-ore" scale={1.2} className="opacity-15" />
        </div>
        <div className="absolute bottom-40 left-[20%] animate-pulse-slow" style={{ animationDelay: "1s" }}>
          <MinecraftIcon sprite="diamond-sword" scale={1.5} className="opacity-20 rotate-45" />
        </div>
        <div className="absolute top-[60%] right-[25%] animate-pulse-slow" style={{ animationDelay: "1.5s" }}>
          <MinecraftIcon sprite="creeper-head" scale={2} className="opacity-10" />
        </div>
        <div className="absolute bottom-20 right-[10%] animate-pulse-slow" style={{ animationDelay: "2s" }}>
          <MinecraftIcon sprite="emerald-block" scale={2.5} className="opacity-10" />
        </div>
        <PixelParticles />
      </div>

      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center z-10">
        {/* Animated Minecraft Logo */}
        <div className="mb-10 flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 animate-ping group-hover:animate-none bg-green-500/20 blur-2xl rounded-full"></div>
            <div className="relative bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl shadow-2xl group-hover:border-emerald-500/50 transition-colors duration-500">
              <MinecraftIcon 
                sprite="grass-block" 
                scale={2} 
                glow={true} 
                glowColor="rgba(34, 197, 94, 0.4)"
                className="animate-bounce-subtle"
              />
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#111] border border-[#222] rounded-full px-4 py-1.5 mb-8 shadow-lg shadow-green-900/10 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-gray-300 text-sm font-medium">{t("home.badge")}</span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight tracking-tight drop-shadow-2xl">
          Premium Paper 1.21 <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Plugins Store</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          {t("home.subtitle")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
          <Link
            href="/store"
            className="group relative w-full sm:w-auto bg-[#22c55e] hover:bg-[#16a34a] text-white px-10 py-5 rounded-2xl text-xl font-bold transition-all transform hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(34,197,94,0.6)] flex items-center justify-center gap-4"
          >
            <MinecraftIcon sprite="creeper-head" isSmall scale={2} className="group-hover:rotate-12 transition-transform" />
            <span>{t("home.cta")}</span>
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-green-300 rounded-full animate-ping opacity-30"></span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-[#222] pt-16">
          {[
            { value: "1.21+", label: t("home.stats.versions"), icon: "paper", color: "from-green-500 to-emerald-600" },
            { value: "Premium", label: t("home.stats.quality"), icon: "diamond", color: "from-blue-500 to-cyan-600" },
            { value: "99.9%", label: t("home.stats.satisfaction"), icon: "heart", color: "from-purple-500 to-pink-600" },
            { value: "24/7", label: t("home.stats.support"), icon: "clock", color: "from-orange-500 to-yellow-600" },
          ].map((stat, index) => (
            <div key={index} className="text-center group flex flex-col items-center">
              <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                <MinecraftIcon sprite={stat.icon} isSmall scale={1.5} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
