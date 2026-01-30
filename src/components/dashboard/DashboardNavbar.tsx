"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Key,
    Download,
    ShieldAlert,
    Menu,
    X,
    User,
    LogOut,
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
        { href: "/dashboard/licenses", label: "My Licenses", icon: Key },
        { href: "/dashboard/downloads", label: "Downloads", icon: Download },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-gray-800 border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="text-xl font-bold text-white tracking-tight">
                            TownyFaiths
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active
                                        ? "bg-gray-700 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${active ? "text-blue-400" : "text-gray-500"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        {isAdmin && (
                            <>
                                <div className="h-6 w-px bg-gray-700 mx-2" />
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
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
                            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-700">
                                <div className="text-right hidden md:block">
                                    <div className="text-sm font-medium text-gray-200">{user.name || "User"}</div>
                                </div>
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt="Profile"
                                        className="w-8 h-8 rounded-full border border-gray-600"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                                <Link
                                    href="/api/auth/signout"
                                    className="text-gray-500 hover:text-white transition-colors"
                                    title="Sign out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-700">
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-white bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md transition-colors"
                                >
                                    Sign In
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
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
                <div className="md:hidden bg-gray-800 border-t border-gray-700">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${active
                                        ? "bg-gray-700 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${active ? "text-blue-400" : "text-gray-500"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}

                        {isAdmin && (
                            <Link
                                href="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-3 text-yellow-500 font-medium hover:bg-yellow-500/10 rounded-md"
                            >
                                <ShieldAlert className="w-5 h-5" />
                                Admin Panel
                            </Link>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-700">
                            {user ? (
                                <>
                                    <div className="px-3 flex items-center gap-3 mb-3">
                                        {user.image ? (
                                            <img src={user.image} className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <User className="w-8 h-8 text-gray-400" />
                                        )}
                                        <div>
                                            <div className="text-white font-medium">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                    <Link
                                        href="/api/auth/signout"
                                        className="flex items-center gap-3 px-3 py-3 text-red-400 font-medium hover:bg-red-500/10 rounded-md"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Sign out
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="flex items-center gap-3 px-3 py-3 text-green-400 font-medium hover:bg-green-500/10 rounded-md"
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
