"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "@/i18n/useTranslation";
import { ClientNotifications } from "@/components/notifications/ClientNotifications";

interface DashboardNavbarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    } | null;
    isAdmin?: boolean;
}

export function DashboardNavbar({ user, isAdmin }: DashboardNavbarProps) {
    const pathname = usePathname();
    const { t } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { href: "/dashboard", label: t("dashboard.title"), icon: "BarChart3" },
        { href: "/dashboard/licenses", label: t("dashboard.yourPlugins"), icon: "Key" },
        { href: "/dashboard/downloads", label: t("dashboard.downloads"), icon: "Download" },
        { href: "/dashboard/servers", label: t("admin.servers"), icon: "Server" },
        { href: "/dashboard/tickets", label: t("tickets.navLabel"), icon: "LifeBuoy" },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#222] shadow-lg shadow-black/20 relative z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="icon-minecraft icon-minecraft-grass-block"></div>
                        <Link href="/dashboard" className="text-xl font-bold text-white tracking-tight hover:text-green-400 transition-colors">
                            MinePlugins
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden xl:flex items-center gap-1">
                        {navItems.map((item) => {
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${active
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                        : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                        }`}
                                >
                                    <Icon name={item.icon as any} className={`w-3.5 h-3.5 ${active ? "text-green-400" : "text-gray-500"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        {isAdmin && (
                            <>
                                <div className="h-5 w-px bg-[#222] mx-1" />
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/20 transition-all duration-200 whitespace-nowrap"
                                >
                                    <Icon name="Shield" className="w-3.5 h-3.5" />
                                    Admin
                                </Link>
                            </>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        {user ? <ClientNotifications /> : null}
                        <LanguageSwitcher />
                        {user ? (
                            <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-[#222]">
                                <div className="text-right hidden md:block">
                                    <div className="text-sm font-medium text-gray-200">{user.name || "User"}</div>
                                    <div className="text-xs text-gray-500">Dashboard</div>
                                </div>
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt="Profile"
                                        className="w-9 h-9 rounded-full border-2 border-green-500/30 hover:border-green-500/50 transition-colors"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-gray-400">
                                        <Icon name="User" className="w-4 h-4" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                                    title="Sign out"
                                >
                                    <Icon name="LogOut" className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-[#222]">
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-gray-400 hover:text-green-400 p-2 rounded-lg hover:bg-[#111] transition-all duration-200"
                            >
                                {isMobileMenuOpen ? (
                                    <Icon name="X" className="w-6 h-6" />
                                ) : (
                                    <Icon name="ChevronDown" className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#222]">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${active
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                        : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                        }`}
                                >
                                    <Icon name={item.icon as any} className={`w-5 h-5 ${active ? "text-green-400" : "text-gray-500"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        {isAdmin && (
                            <Link
                                href="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-yellow-500 font-medium hover:bg-yellow-500/10 rounded-xl border border-yellow-500/20 hover:border-yellow-500/30 transition-all duration-200"
                            >
                                <Icon name="Shield" className="w-5 h-5" />
                                Admin Panel
                            </Link>
                        )}

                        <div className="mt-4 pt-4 border-t border-[#222]">
                            {user ? (
                                <>
                                    <div className="px-4 flex items-center gap-3 mb-3">
                                        {user.image ? (
                                            <img src={user.image} alt="Profile" className="w-10 h-10 rounded-full border-2 border-green-500/30" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center">
                                                <Icon name="User" className="w-5 h-5 text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-white font-medium">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            signOut({ callbackUrl: "/" });
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 text-red-400 font-medium hover:bg-red-500/10 rounded-xl transition-all duration-200"
                                    >
                                        <Icon name="LogOut" className="w-5 h-5" />
                                        Sign out
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
