"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Key,
    Users,
    Activity,
    BarChart3,
    CreditCard,
    ArrowRight,
    LogOut,
    Menu,
    X,
    User,
} from "lucide-react";
import { useState } from "react";

interface AdminNavbarProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function AdminNavbar({ user }: AdminNavbarProps) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
        { href: "/admin/licenses", label: "Licenses", icon: Key },
        { href: "/admin/transfers", label: "Transfers", icon: ArrowRight },
        { href: "/admin/users", label: "Customers", icon: Users },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/admin/payku", label: "Payku", icon: CreditCard },
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
                    <div className="flex items-center gap-2.5">
                        <div className="text-2xl">⛏️</div>
                        <Link href="/admin" className="text-xl font-bold text-white flex items-center gap-2 hover:text-[#f59e0b] transition-colors">
                            MinePlugins
                        </Link>
                        <span className="hidden xl:inline-flex bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] px-2 py-0.5 rounded border border-[#f59e0b]/20 font-mono tracking-wide uppercase">
                            Store Admin
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden xl:flex items-center gap-1.5 px-3">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 group whitespace-nowrap flex-shrink-0 ${active
                                        ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 shadow-lg shadow-[#f59e0b]/10"
                                        : "text-gray-400 hover:text-white hover:bg-[#111] hover:border-[#333] border border-transparent"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${active ? "text-[#f59e0b]" : "text-gray-500 group-hover:text-gray-300"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        <div className="h-6 w-px bg-white/10 mx-2" />

                        <Link
                            href="/dashboard"
                            className="text-blue-400 hover:text-blue-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-400/10 border border-blue-400/20 hover:border-blue-400/30 whitespace-nowrap flex-shrink-0"
                            title="Switch to customer dashboard"
                        >
                            Customer View
                        </Link>
                    </div>

                    {/* User Menu & Mobile Toggle */}
                    <div className="flex items-center gap-3">
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

                            <Link
                                href="/api/auth/signout"
                                className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </Link>
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
                                Client Dashboard
                            </Link>
                            <Link
                                href="/api/auth/signout"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-red-400 font-medium hover:bg-red-500/10 rounded-xl transition-all duration-200"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign out
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
