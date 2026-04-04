"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Key,
    Users,
    BarChart3,
    Wallet,
    ArrowRight,
    LogOut,
    Menu,
    X,
    User,
    Server,
} from "lucide-react";
import { useState } from "react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "@/i18n/useTranslation";

interface AdminNavbarProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
}

export function AdminNavbar({ user }: AdminNavbarProps) {
    const pathname = usePathname();
    const { t } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [productsOpen, setProductsOpen] = useState(false);

    const navItems = [
        { href: "/admin", label: t("admin.dashboard"), icon: LayoutDashboard },
        { href: "/admin/servers", label: t("admin.servers"), icon: Server },
        { href: "/admin/licenses", label: t("admin.licenses"), icon: Key },
        { href: "/admin/transfers", label: t("admin.transfers"), icon: ArrowRight },
        { href: "/admin/users", label: t("admin.users"), icon: Users },
        { href: "/admin/analytics", label: t("admin.analytics"), icon: BarChart3 },
        { href: "/admin/payments", label: t("admin.payments"), icon: Wallet },
    ];

    const productsItems = [
        { href: "/admin/products", label: t("admin.products"), icon: Package },
        { href: "/admin/orders", label: t("admin.orders"), icon: ShoppingCart },
        { href: "/admin/servers", label: t("admin.servers"), icon: Server },
    ];

    const isActive = (path: string) => {
        if (path === "/admin" && pathname === "/admin") return true;
        if (path !== "/admin" && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#f59e0b]/20 sticky top-0 z-50 shadow-lg shadow-black/20">
            <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-[4.5rem]">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="icon-minecraft icon-minecraft-grass-block"></div>
                        <Link href="/admin" className="text-lg font-bold text-white flex items-center gap-2 hover:text-[#f59e0b] transition-colors">
                            MinePlugins
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden xl:flex items-center gap-1">
                        <Link
                            href="/admin"
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${isActive("/admin")
                                ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                }`}
                        >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            {t("admin.dashboard")}
                        </Link>

                        {/* Products Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProductsOpen(!productsOpen)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                                    pathname?.startsWith("/admin/products") || pathname?.startsWith("/admin/orders")
                                        ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                        : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                }`}
                            >
                                <Package className="w-3.5 h-3.5" />
                                {t("admin.products")}
                                <svg className={`w-3 h-3 transition-transform ${productsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {productsOpen && (
                                <div className="absolute top-full left-0 mt-1 bg-[#111] border border-[#333] rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                                    {productsItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setProductsOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
                                        >
                                            <item.icon className="w-3.5 h-3.5" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {navItems.slice(2).map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${active
                                        ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                        : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                        }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${active ? "text-[#f59e0b]" : "text-gray-500 group-hover:text-gray-300"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        <div className="h-5 w-px bg-white/10 mx-1" />

                        <Link
                            href="/dashboard"
                            className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-blue-400/10 border border-blue-400/20 whitespace-nowrap"
                            title={t("admin.switchToCustomer")}
                        >
                            {t("admin.customerView")}
                        </Link>
                    </div>

                    {/* User Menu & Mobile Toggle */}
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <div className="hidden md:flex items-center gap-3 pl-3 border-l border-white/10">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-medium text-white">{user.name || "Admin"}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                            </div>

                            {user.image ? (
                                <img
                                    src={user.image}
                                    alt="Profile"
                                    className="w-9 h-9 rounded-full border-2 border-[#f59e0b]/30 hover:border-[#f59e0b]/50 transition-colors"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-gray-400">
                                    <User className="w-4 h-4" />
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                                title={t("admin.signOut")}
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="xl:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-gray-400 hover:text-[#f59e0b] p-2 rounded-lg hover:bg-[#111] transition-all duration-200"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-md">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${active
                                        ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                        : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${active ? "text-[#f59e0b]" : "text-gray-500"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        <div className="pt-4 mt-4 border-t border-white/5">
                            <Link
                                href="/dashboard"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-blue-400 font-medium hover:bg-blue-400/10 rounded-xl transition-all duration-200"
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                {t("admin.customerView")}
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    signOut({ callbackUrl: "/" });
                                }}
                                className="flex items-center gap-3 px-4 py-3 text-red-400 font-medium hover:bg-red-500/10 rounded-xl transition-all duration-200"
                            >
                                <LogOut className="w-5 h-5" />
                                {t("admin.signOut")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
