"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Key,
    Download,
    ShieldAlert,
    Menu,
    X,
    User,
    LogOut,
    Server,
} from "lucide-react";
import { useState } from "react";

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/licenses", label: "My Plugins", icon: Key },
        { href: "/dashboard/downloads", label: "Downloads", icon: Download },
        { href: "/dashboard/servers", label: "Servers", icon: Server },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#222] shadow-lg shadow-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">⛏️</div>
                        <Link href="/dashboard" className="text-xl font-bold text-white tracking-tight hover:text-green-400 transition-colors">
                            MinePlugins
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10"
                                        : "text-gray-400 hover:text-white hover:bg-[#111] hover:border-[#333] border border-transparent"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${active ? "text-green-400" : "text-gray-500"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        {isAdmin && (
                            <>
                                <div className="h-6 w-px bg-[#222] mx-3" />
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/30 transition-all duration-200"
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    Admin Panel
                                </Link>
                            </>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
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
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                                    title="Sign out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-[#222]">
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-white bg-green-600 hover:bg-green-500 px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-green-600/20"
                                >
                                    Sign In
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-gray-400 hover:text-green-400 p-2 rounded-lg hover:bg-[#111] transition-all duration-200"
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
                <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#222]">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

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
                                    <Icon className={`w-5 h-5 ${active ? "text-green-400" : "text-gray-500"}`} />
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
                                <ShieldAlert className="w-5 h-5" />
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
                                                <User className="w-5 h-5 text-gray-400" />
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
                                        <LogOut className="w-5 h-5" />
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="flex items-center gap-3 px-4 py-3 text-green-400 font-medium hover:bg-green-500/10 rounded-xl transition-all duration-200"
                                >
                                    <User className="w-5 h-5" />
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
