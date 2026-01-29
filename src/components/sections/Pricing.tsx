import Link from "next/link";

const plans = [
  {
    name: "TownyFaith Premium",
    price: "$5.00",
    period: "/1year",
    description: "For established servers with active communities",
    features: [
      "1 license per Server",
      "All Religion Features",
      "24/7 Support",
      "All future updates",
      "100% plugin Costumization",
    ],
    cta: "Buy Now",
    ctaLink: "/login",
    popular: true,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Pricing</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Purchase license, lifetime updates. No subscriptions, no hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="flex justify-center gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 w-full max-w-sm ${
                plan.popular
                  ? "bg-gradient-to-b from-emerald-900/50 to-zinc-900 border-2 border-emerald-500"
                  : "bg-zinc-900 border border-zinc-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                  NEW Release
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-400">{plan.period}</span>
                </div>
                <p className="text-zinc-400 text-sm mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3 text-zinc-300">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaLink}
                className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
