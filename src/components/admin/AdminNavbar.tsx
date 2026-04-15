"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/Icon";
import { useEffect, useRef, useState } from "react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "@/i18n/useTranslation";
import { AdminNotifications } from "@/components/notifications/AdminNotifications";

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
    const [licensesOpen, setLicensesOpen] = useState(false);
    const [usersOpen, setUsersOpen] = useState(false);
    const [mobileUsersOpen, setMobileUsersOpen] = useState(false);
    const [mobileLicensesOpen, setMobileLicensesOpen] = useState(false);
    const productsDropdownRef = useRef<HTMLDivElement | null>(null);
    const licensesDropdownRef = useRef<HTMLDivElement | null>(null);
    const usersDropdownRef = useRef<HTMLDivElement | null>(null);

    const navItems = [
        { href: "/admin", label: t("admin.dashboard"), icon: "BarChart3" },
        { href: "/admin/servers", label: t("admin.servers"), icon: "Server" },
    ];

    const productsItems = [
        { href: "/admin/products", label: t("admin.products"), icon: "Package" },
        { href: "/admin/products/new", label: t("admin.newProduct"), icon: "Plus" },
        { href: "/admin/orders", label: t("admin.orders"), icon: "ShoppingCart" },
    ];

    const licensesItems = [
        { href: "/admin/licenses", label: t("admin.licenses"), icon: "Key" },
        { href: "/admin/discounts", label: t("admin.discounts"), icon: "Tag" },
        { href: "/admin/tickets", label: t("admin.tickets"), icon: "Ticket" },
        { href: "/admin/export", label: t("admin.export"), icon: "Download" },
    ];

    const usersItems = [
        { href: "/admin/users", label: t("admin.users"), icon: "Users" },
        { href: "/admin/analytics", label: t("admin.analytics"), icon: "BarChart3" },
        { href: "/admin/payments", label: t("admin.payments"), icon: "Wallet" },
    ];

    const isActive = (path: string) => {
        if (path === "/admin" && pathname === "/admin") return true;
        if (path !== "/admin" && pathname?.startsWith(path)) return true;
        return false;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                productsDropdownRef.current &&
                !productsDropdownRef.current.contains(target)
            ) {
                setProductsOpen(false);
            }

            if (
                licensesDropdownRef.current &&
                !licensesDropdownRef.current.contains(target)
            ) {
                setLicensesOpen(false);
            }

            if (
                usersDropdownRef.current &&
                !usersDropdownRef.current.contains(target)
            ) {
                setUsersOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setProductsOpen(false);
                setLicensesOpen(false);
                setUsersOpen(false);
                setMobileLicensesOpen(false);
                setMobileUsersOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

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
                            <Icon name="BarChart3" className="w-3.5 h-3.5" />
                            {t("admin.dashboard")}
                        </Link>

                        {/* Products Dropdown */}
                        <div className="relative group/nav-item" ref={productsDropdownRef}>
                            <div className="flex items-center">
                                <Link
                                    href="/admin/products"
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-l-lg text-xs font-medium transition-all duration-200 whitespace-nowrap border-r border-white/5 ${
                                        pathname?.startsWith("/admin/products")
                                            ? "bg-[#f59e0b]/20 text-[#f59e0b] border-y border-l border-[#f59e0b]/30"
                                            : "text-gray-400 hover:text-white hover:bg-[#111] border-transparent"
                                    }`}
                                >
                                    <Icon name="Package" className="w-3.5 h-3.5" />
                                    {t("admin.products")}
                                </Link>
                                <button
                                    onClick={() => setProductsOpen(!productsOpen)}
                                    className={`px-2 py-2 rounded-r-lg transition-all duration-200 ${
                                        pathname?.startsWith("/admin/products") || pathname?.startsWith("/admin/orders")
                                            ? "bg-[#f59e0b]/20 text-[#f59e0b] border-y border-r border-[#f59e0b]/30"
                                            : "text-gray-400 hover:text-white hover:bg-[#111]"
                                    }`}
                                    aria-label="Toggle Products Submenu"
                                >
                                    <svg className={`w-3 h-3 transition-transform ${productsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                            {productsOpen && (
                                <div className="absolute top-full left-0 mt-1 bg-[#111] border border-[#333] rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                                    {productsItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setProductsOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
                                        >
                                            <Icon name={item.icon as any} className="w-3.5 h-3.5" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Licenses Dropdown */}
                        <div className="relative" ref={licensesDropdownRef}>
                            <button
                                onClick={() => setLicensesOpen(!licensesOpen)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                                    pathname?.startsWith("/admin/licenses") || pathname?.startsWith("/admin/discounts") || pathname?.startsWith("/admin/tickets") || pathname?.startsWith("/admin/export")
                                        ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                        : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                }`}
                            >
                                <Icon name="Key" className="w-3.5 h-3.5" />
                                {t("admin.licenses")}
                                <svg className={`w-3 h-3 transition-transform ${licensesOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {licensesOpen && (
                                <div className="absolute top-full left-0 mt-1 bg-[#111] border border-[#333] rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                                    {licensesItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setLicensesOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
                                        >
                                            <Icon name={item.icon as any} className="w-3.5 h-3.5" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Users Dropdown */}
                        <div className="relative" ref={usersDropdownRef}>
                            <button
                                onClick={() => setUsersOpen(!usersOpen)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                                    pathname?.startsWith("/admin/users") || pathname?.startsWith("/admin/analytics") || pathname?.startsWith("/admin/payments")
                                        ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                        : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                }`}
                            >
                                <Icon name="Users" className="w-3.5 h-3.5" />
                                {t("admin.users")}
                                <svg className={`w-3 h-3 transition-transform ${usersOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {usersOpen && (
                                <div className="absolute top-full left-0 mt-1 bg-[#111] border border-[#333] rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                                    {usersItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setUsersOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
                                        >
                                            <Icon name={item.icon as any} className="w-3.5 h-3.5" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {navItems.slice(2).map((item) => {
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${active
                                        ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                        : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                        }`}
                                >
                                    <Icon name={item.icon as any} className={`w-3.5 h-3.5 ${active ? "text-[#f59e0b]" : "text-gray-500 group-hover:text-gray-300"}`} />
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
                        <AdminNotifications />
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
                                    <Icon name="User" className="w-4 h-4" />
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                                title={t("admin.signOut")}
                            >
                                <Icon name="LogOut" className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="xl:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-gray-400 hover:text-[#f59e0b] p-2 rounded-lg hover:bg-[#111] transition-all duration-200"
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
                <div className="lg:hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-md">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => {
                            const active = isActive(item.href);

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
                                    <Icon name={item.icon as any} className={`w-5 h-5 ${active ? "text-[#f59e0b]" : "text-gray-500"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => setMobileLicensesOpen(!mobileLicensesOpen)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                                pathname?.startsWith("/admin/licenses") || pathname?.startsWith("/admin/discounts") || pathname?.startsWith("/admin/tickets") || pathname?.startsWith("/admin/export")
                                    ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                    : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <Icon name="Key" className={`w-5 h-5 ${pathname?.startsWith("/admin/licenses") || pathname?.startsWith("/admin/discounts") || pathname?.startsWith("/admin/tickets") || pathname?.startsWith("/admin/export") ? "text-[#f59e0b]" : "text-gray-500"}`} />
                                {t("admin.licenses")}
                            </span>
                            <svg className={`w-4 h-4 transition-transform ${mobileLicensesOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {mobileLicensesOpen && (
                            <div className="space-y-1 pl-4">
                                {licensesItems.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                                active
                                                    ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                                    : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                            }`}
                                        >
                                            <Icon name={item.icon as any} className={`w-4 h-4 ${active ? "text-[#f59e0b]" : "text-gray-500"}`} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setMobileUsersOpen(!mobileUsersOpen)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                                pathname?.startsWith("/admin/users") || pathname?.startsWith("/admin/analytics") || pathname?.startsWith("/admin/payments")
                                    ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                    : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <Icon name="Users" className={`w-5 h-5 ${pathname?.startsWith("/admin/users") || pathname?.startsWith("/admin/analytics") || pathname?.startsWith("/admin/payments") ? "text-[#f59e0b]" : "text-gray-500"}`} />
                                {t("admin.users")}
                            </span>
                            <svg className={`w-4 h-4 transition-transform ${mobileUsersOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {mobileUsersOpen && (
                            <div className="space-y-1 pl-4">
                                {usersItems.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                                active
                                                    ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                                    : "text-gray-400 hover:text-white hover:bg-[#111] border border-transparent"
                                            }`}
                                        >
                                            <Icon name={item.icon as any} className={`w-4 h-4 ${active ? "text-[#f59e0b]" : "text-gray-500"}`} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        <div className="pt-4 mt-4 border-t border-white/5">
                            <Link
                                href="/dashboard"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-blue-400 font-medium hover:bg-blue-400/10 rounded-xl transition-all duration-200"
                            >
                                <Icon name="BarChart3" className="w-5 h-5" />
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
                                <Icon name="LogOut" className="w-5 h-5" />
                                {t("admin.signOut")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
