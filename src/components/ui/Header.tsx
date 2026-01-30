"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "https://zgaming.host/", label: " ¿You want a MC Host?", external: true },
];

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoading = status === "loading";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#222]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-3xl">⛪</div>
            <span className="text-xl font-bold text-white">TownyFaiths</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-[#a3a3a3] hover:text-white transition-colors text-sm font-medium hover:text-[#22c55e]"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              // Loading state
              <div className="w-20 h-10 bg-gray-700 rounded-lg animate-pulse"></div>
            ) : session ? (
              // User is logged in - show user menu
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-[#a3a3a3] hover:text-white transition-colors text-sm font-medium px-4 py-2"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-[#222]">
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-medium text-gray-200">{session.user?.name || "User"}</div>
                    <div className="text-xs text-gray-500">
                      {session.user?.role === "ADMIN" || session.user?.role === "SUPER_ADMIN" ? "Admin" : "Customer"}
                    </div>
                  </div>
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-9 h-9 rounded-full border-2 border-green-500/30 hover:border-green-500/50 transition-colors"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              // User is not logged in - show login buttons
              <>
                <Link
                  href="/login"
                  className="text-[#a3a3a3] hover:text-white transition-colors text-sm font-medium px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-6 py-2 rounded-lg text-sm font-medium transition-all hover:transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-800">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-zinc-800">
                {isLoading ? (
                  <div className="w-full h-20 bg-gray-700 rounded-lg animate-pulse mb-3"></div>
                ) : session ? (
                  // Mobile user menu
                  <>
                    <div className="flex items-center gap-3 mb-3 px-2">
                      {session.user?.image ? (
                        <img src={session.user.image} className="w-10 h-10 rounded-full border-2 border-green-500/30" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-white font-medium">{session.user?.name || "User"}</div>
                        <div className="text-xs text-gray-500">{session.user?.email}</div>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  // Mobile login buttons
                  <>
                    <Link
                      href="/login"
                      className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/login"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
