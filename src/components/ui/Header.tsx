"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { useTranslation } from "@/i18n/useTranslation";

function CreeperVoxelIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      className="drop-shadow-[0_0_6px_rgba(124,252,0,0.9)]"
    >
      <rect x="0" y="0" width="16" height="16" fill="#1f7a2e" />
      <rect x="1" y="1" width="14" height="14" fill="#2fbf3f" />
      <rect x="2" y="2" width="12" height="12" fill="#7CFC00" />
      <rect x="2" y="3" width="2" height="2" fill="#56d84e" />
      <rect x="10" y="2" width="3" height="2" fill="#56d84e" />
      <rect x="5" y="5" width="3" height="2" fill="#56d84e" />
      <rect x="11" y="9" width="2" height="3" fill="#56d84e" />
      <rect x="3" y="4" width="3" height="3" fill="#0f2112" />
      <rect x="10" y="4" width="3" height="3" fill="#0f2112" />
      <rect x="6" y="7" width="4" height="3" fill="#0f2112" />
      <rect x="5" y="9" width="2" height="4" fill="#0f2112" />
      <rect x="9" y="9" width="2" height="4" fill="#0f2112" />
    </svg>
  );
}

export default function Header() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoading = status === "loading";

  const navLinks = [
    { href: "/store", label: t("nav.store") },
    { href: "#features", label: t("nav.features") },
    { href: "https://zgaming.host/", label: t("nav.hosting"), external: true },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#222]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src="/mineplugins-logo.svg"
              alt="MinePlugins logo"
              className="h-9 w-9 rounded-full object-cover border border-[#22c55e]/20"
            />
            <span className="text-xl font-bold text-white">MinePlugins</span>
          </Link>

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

          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="w-20 h-10 bg-[#181818] border border-[#333] rounded-xl animate-pulse"></div>
            ) : session ? (
              <div className="flex items-center gap-4">
                <CurrencySwitcher />
                <LanguageSwitcher />
                <Link href="/dashboard" className="text-[#a3a3a3] hover:text-white transition-colors text-sm font-medium px-4 py-2">
                  {t("nav.dashboard")}
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-[#222]">
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-medium text-gray-200">{session.user?.name || "User"}</div>
                    <div className="text-xs text-gray-500">
                      {session.user?.role === "ADMIN" || session.user?.role === "SUPER_ADMIN" ? t("nav.admin") : "Customer"}
                    </div>
                  </div>
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Profile" className="w-9 h-9 rounded-full border-2 border-green-500/30 hover:border-green-500/50 transition-colors" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200" title={t("nav.signOut")}>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <CurrencySwitcher />
                <LanguageSwitcher />
                <Link href="/login" className="text-[#a3a3a3] hover:text-white transition-colors text-sm font-medium px-4 py-2">
                  {t("nav.signIn")}
                </Link>
                <Link href="/login" className="group bg-[#22c55e] hover:bg-[#16a34a] text-white px-6 py-2 rounded-xl text-sm font-medium transition-all hover:transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(34,197,94,0.3)] inline-flex items-center gap-2">
                  <span>{t("nav.getStarted")}</span>
                  <span className="max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-w-6 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1">
                    <CreeperVoxelIcon />
                  </span>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
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

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#222]">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined} className="text-gray-400 hover:text-white transition-colors text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-[#222]">
                {isLoading ? (
                  <div className="w-full h-20 bg-[#181818] border border-[#333] rounded-xl animate-pulse mb-3"></div>
                ) : session ? (
                  <>
                    <div className="flex items-center gap-3 mb-3 px-2">
                      {session.user?.image ? (
                        <img src={session.user.image} alt="Profile" className="w-10 h-10 rounded-full border-2 border-green-500/30" />
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
                    <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                      {t("nav.dashboard")}
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium text-left">
                      {t("nav.signOut")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                      {t("nav.signIn")}
                    </Link>
                    <Link href="/login" className="group bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors text-center inline-flex items-center justify-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                      <span>{t("nav.getStarted")}</span>
                      <span className="max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-w-6 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1">
                        <CreeperVoxelIcon />
                      </span>
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
