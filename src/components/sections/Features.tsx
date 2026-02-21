const features = [
  {
    icon: "📦",
    title: "Official Premium plugins",
    description: "Browse official plugins with versions, changelogs, and details optimized for Paper 1.21.",
  },
  {
    icon: "🔐",
    title: "With private license for your server",
    description: "Receive a license per server with activation tracking and status controls.",
  },
  {
    icon: "⚡",
    title: "Instant Delivery",
    description: "Get immediate downloads after purchase with version history and secure access.",
  },
  {
    icon: "🧾",
    title: "Secure Checkout",
    description: "Pay securely with a clean purchase flow built for digital goods. All payments are processed by Payku.cl a Chilean payment processor with WebPay support",
  },
  {
    icon: "🧩",
    title: "Paper 1.21+ Focus",
    description: "Everything is tailored for Minecraft Paper 1.21 compatibility and support.",
  },
  {
    icon: "🤝",
    title: "Customer Portal",
    description: "Access your plugins, updates, and license details in one place.",
  },
  {
    icon: "🎨",
    title: "Clear Details",
    description: "Transparent product pages with pricing, version notes, and requirements.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Features</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            Everything you need to
            <br />
            <span className="text-emerald-400">buy Paper 1.21+ plugins</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            MinePlugins is the official store to buy, plugins with licenses, and download Minecraft Paper 1.21 plugins.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 hover:bg-zinc-800 hover:border-emerald-500/50 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
