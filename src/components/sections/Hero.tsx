import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0f0f0f]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05)_0%,transparent_70%)]" />

      {/* Geometric pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(255,255,255,0.01)_25%,rgba(255,255,255,0.01)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.01)_75%,rgba(255,255,255,0.01)_76%,transparent_77%),linear-gradient(-45deg,transparent_24%,rgba(255,255,255,0.01)_25%,rgba(255,255,255,0.01)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.01)_75%,rgba(255,255,255,0.01)_76%,transparent_77%)] bg-[size:60px_60px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333333] rounded-full px-6 py-3 mb-8">
          <div className="w-2 h-2 bg-[#22c55e] rounded-full"></div>
          <span className="text-[#22c55e] text-sm font-medium">New Release</span>
          <span className="text-[#a3a3a3] text-sm">v1.0.0 is now available</span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          <span className="text-[#22c55e]">Religion System</span>
          <br />
          for Towny Servers
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-[#a3a3a3] max-w-2xl mx-auto mb-10 leading-relaxed">
          Bring immersive faith mechanics to your Minecraft server. Create religions,
          build temples, gain followers, and unlock divine powers with TownyFaiths.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/login"
            className="w-full sm:w-auto bg-[#22c55e] hover:bg-[#16a34a] text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:transform hover:-translate-y-1 hover:shadow-[0_8px_25px_-8px_rgba(34,197,94,0.3)]"
          >
            Get Started!
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {[
            { value: "1.21+", label: "MC Versions", color: "#22c55e" },
            { value: "2+", label: "Active Servers", color: "#3b82f6" },
            { value: "99.9%", label: "Uptime", color: "#10b981" },
            { value: "24/7", label: "Support", color: "#8b5cf6" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-[#737373] text-sm font-medium">{stat.label}</div>
              <div className="w-12 h-1 mx-auto mt-2 rounded-full" style={{ backgroundColor: stat.color }}></div>
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
