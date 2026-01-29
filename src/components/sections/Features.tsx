const features = [
  {
    icon: "⛪",
    title: "Religion Creation",
    description: "Create unique religions with custom beliefs, rituals, and hierarchies. Each faith can have its own identity and culture.",
  },
  {
    icon: "🏛️",
    title: "Sacred Buildings",
    description: "Build temples, shrines, and holy sites. Define sacred regions where followers can worship and gain buffs.",
  },
  {
    icon: "👥",
    title: "Follower System",
    description: "Attract and manage followers with a reputation system. The more devoted your followers, the stronger your religion.",
  },
  {
    icon: "✨",
    title: "Divine Powers",
    description: "Unlock special abilities and buffs for your followers. From healing auras to combat bonuses, faith has its rewards.",
  },
  {
    icon: "📜",
    title: "Religious Events",
    description: "Host ceremonies, festivals, and holy days. Create custom events that bring your community together.",
  },
  {
    icon: "⚔️",
    title: "Holy Wars",
    description: "Defend your faith or wage crusades. Religious conflicts add depth and drama to your server politics.",
  },
  {
    icon: "🔧",
    title: "Towny Integration",
    description: "Seamlessly integrates with Towny. Religions can span multiple towns or be tied to specific nations.",
  },
  {
    icon: "🎨",
    title: "Full Customization",
    description: "Configure everything via YAML. Customize messages, permissions, cooldowns, and mechanics to fit your server.",
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
            Everything you need for
            <br />
            <span className="text-emerald-400">immersive faith gameplay</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            TownyFaiths provides a complete religion system that integrates perfectly with your existing Towny setup.
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

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            See pricing options
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
