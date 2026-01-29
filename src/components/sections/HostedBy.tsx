import Image from "next/image";

export default function HostedBy() {
  return (
    <section className="py-16 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800/50 to-zinc-900 border border-zinc-700/50 rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {/* Text Content */}
            <div className="text-center md:text-left">
              <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">
                Proudly Hosted By
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 mb-3">
                Our server runs on{" "}
                <span className="text-blue-400">ZGaming.host</span>
              </h3>
              <p className="text-zinc-400 max-w-md">
                High-performance Minecraft hosting with DDoS protection,
                instant setup, and 24/7 support. Get your server running today!
              </p>
              <a
                href="https://zgaming.host/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Visit ZGaming.host
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            {/* Logo */}
            <a
              href="https://zgaming.host/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 hover:scale-105 transition-transform duration-300"
            >
              <Image
                src="/zgaming-logo.webp"
                alt="ZGaming.host Logo"
                width={200}
                height={200}
                className="drop-shadow-2xl"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
