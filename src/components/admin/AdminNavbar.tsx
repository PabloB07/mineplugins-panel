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
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/activity", label: "Activity", icon: Activity },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/admin/payku", label: "Payku", icon: CreditCard },
    ];

    const isActive = (path: string) => {
        if (path === "/admin" && pathname === "/admin") return true;
        if (path !== "/admin" && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="bg-[#1a1a1a] border-b border-[#f59e0b]/20 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="text-xl font-bold text-white flex items-center gap-2">
                            TownyFaiths
                        </Link>
                        <span className="bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] px-2 py-0.5 rounded border border-[#f59e0b]/20 font-mono tracking-wide uppercase">
                            Admin
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-1 overflow-x-auto no-scrollbar">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group whitespace-nowrap flex-shrink-0 ${active
                                        ? "text-white bg-[#f59e0b]/10 border border-[#f59e0b]/20"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
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
                            className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-blue-400/10 whitespace-nowrap flex-shrink-0"
                            title="Switch to customer dashboard"
                        >
                            Client View
                        </Link>
                    </div>

                    {/* User Menu & Mobile Toggle */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/10">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-medium text-white">{user.name || "Admin"}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                            </div>

                            {user.image ? (
                                <img
                                    src={user.image}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full border border-white/10"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                                    <User className="w-4 h-4" />
                                </div>
                            )}

                            <Link
                                href="/api/auth/signout"
                                className="text-gray-500 hover:text-red-400 p-2 rounded-full hover:bg-white/5 transition-colors"
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-gray-400 hover:text-white p-2"
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
                <div className="lg:hidden border-t border-white/5 bg-[#1a1a1a]">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${active
                                        ? "bg-[#f59e0b]/10 text-white border-l-2 border-[#f59e0b]"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
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
                                className="flex items-center gap-3 px-3 py-3 text-blue-400 font-medium"
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                Client Dashboard
                            </Link>
                            <Link
                                href="/api/auth/signout"
                                className="flex items-center gap-3 px-3 py-3 text-red-400 font-medium"
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
