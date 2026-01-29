import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/50 via-zinc-950 to-purple-950/30" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-full px-4 py-2 mb-8">
          <span className="text-emerald-400 text-sm font-medium">New Release</span>
          <span className="text-zinc-400 text-sm">v1.0.0 is now available</span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          <span className="text-emerald-400">Religion System</span>
          <br />
          for Towny Servers
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Bring immersive faith mechanics to your Minecraft server. Create religions,
          build temples, gain followers, and unlock divine powers with TownyFaiths.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/login"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
          >
            Get Started!
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {[
            { value: "1.21+", label: "MC Versions" },
            { value: "2+", label: "Active Servers" },
            { value: "99.9%", label: "Uptime" },
            { value: "24/7", label: "Support" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-zinc-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}
