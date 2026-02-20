import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#111] border border-[#222] rounded-full px-4 py-1.5 mb-8 shadow-lg shadow-green-900/10 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-gray-300 text-sm font-medium">MinePlugins for Paper 1.21</span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight tracking-tight">
          Download <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">Premium</span>
          <br />
          Paper Plugins
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          The official MinePlugins store for Minecraft Paper 1.21 plugins with instant downloads and update tracking.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
          <Link
            href="/store"
            className="w-full sm:w-auto bg-[#22c55e] hover:bg-[#16a34a] text-white px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(34,197,94,0.5)] flex items-center justify-center gap-2"
          >
            Get Started Now
          </Link>
          <Link
            href="/documentation"
            className="w-full sm:w-auto bg-[#1a1a1a] hover:bg-[#222] text-white px-8 py-4 rounded-xl text-lg font-bold transition-all border border-[#333] hover:border-gray-600 flex items-center justify-center gap-2"
          >
            Read Documentation
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-[#222] pt-12">
          {[
            { value: "1.21+", label: "Supported Versions", color: "text-green-500" },
            { value: "Premium", label: "Quality Code", color: "text-blue-500" },
            { value: "99.9%", label: "Satisfaction", color: "text-purple-500" },
            { value: "24/7", label: "Expert Support", color: "text-orange-500" },
          ].map((stat, index) => (
            <div key={index} className="text-center group">
              <div className={`text-3xl sm:text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300`}>{stat.value}</div>
              <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
