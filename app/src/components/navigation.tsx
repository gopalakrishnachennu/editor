"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore, useAdminStore } from "@/lib/stores";
import {
    LayoutDashboard,
    Palette,
    FolderOpen,
    Settings,
    Users,
    BarChart3,
    CreditCard,
    LogOut,
    Menu,
    X,
    Sparkles,
    Crown,
    ChevronDown,
    Bell,
    Search,
    Plus,
    Shield,
    FileText,
    Film,
    Wand2,
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Create Post", href: "/editor/new", icon: Plus },
    { name: "Smart Generator", href: "/smart-generator", icon: Wand2 },
    { name: "Video Editor", href: "/video-editor", icon: Film },
    { name: "My Posts", href: "/posts", icon: FolderOpen },
    { name: "Brand Kits", href: "/brand-kits", icon: Sparkles },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Templates", href: "/templates", icon: Palette },
];

const adminNavigation = [
    { name: "Admin Panel", href: "/admin", icon: Shield },
    { name: "System Logs", href: "/admin/logs", icon: FileText },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Billing", href: "/admin/billing", icon: CreditCard },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { user, signOut, isAdmin } = useAuthStore();
    const { settings } = useAdminStore();

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                <Link href="/dashboard" className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {settings.general?.appName || 'Post Designer'}
                        </span>
                    )}
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
                {/* Main nav */}
                <div className="space-y-1">
                    {!collapsed && (
                        <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Main
                        </span>
                    )}
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all",
                                    isActive
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200"
                                        : "text-gray-600 hover:bg-gray-100"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive && "text-white")} />
                                {!collapsed && <span className="font-medium">{item.name}</span>}
                            </Link>
                        );
                    })}
                </div>

                {/* Admin nav */}
                {isAdmin() && (
                    <div className="pt-6 space-y-1">
                        {!collapsed && (
                            <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Admin
                            </span>
                        )}
                        {adminNavigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all",
                                        isActive
                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-200"
                                            : "text-gray-600 hover:bg-gray-100"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", isActive && "text-white")} />
                                    {!collapsed && <span className="font-medium">{item.name}</span>}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </nav>

            {/* User section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user?.displayName}
                                className="w-10 h-10 rounded-full"
                            />
                        ) : (
                            <span className="text-lg font-semibold text-indigo-600">
                                {user?.displayName?.charAt(0) || "U"}
                            </span>
                        )}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user?.displayName}
                            </p>
                            <div className="flex items-center space-x-1">
                                {isAdmin() ? (
                                    <>
                                        <Shield className="w-3 h-3 text-red-500" />
                                        <span className="text-xs text-red-500 font-medium">
                                            Admin
                                        </span>
                                    </>
                                ) : user?.tier === "pro" || user?.tier === "enterprise" ? (
                                    <>
                                        <Crown className="w-3 h-3 text-amber-500" />
                                        <span className="text-xs text-amber-500 capitalize">
                                            {user?.tier} Plan
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-xs text-gray-500 capitalize">
                                        {user?.tier} Plan
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            onClick={() => signOut()}
                            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}

export function Header() {
    const [showSearch, setShowSearch] = useState(false);
    const { user, isAdmin } = useAuthStore();
    const { settings } = useAdminStore();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Search */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search templates, posts..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
                {/* Maintenance indicator */}
                {settings.maintenance.enabled && isAdmin() && (
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        <span>Maintenance Mode</span>
                    </div>
                )}

                {/* Notifications */}
                <button className="relative p-2 hover:bg-gray-100 rounded-xl transition">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Upgrade button - hide for admins */}
                {user?.tier === "free" && !isAdmin() && (
                    <Link
                        href="/pricing"
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition font-medium text-sm"
                    >
                        <Crown className="w-4 h-4" />
                        <span>Upgrade</span>
                    </Link>
                )}

                {/* Create button */}
                <Link
                    href="/editor/new"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Post</span>
                </Link>
            </div>
        </header>
    );
}

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user, signOut, isAdmin } = useAuthStore();

    return (
        <>
            {/* Mobile header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
                <Link href="/dashboard" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-lg">Post Designer</span>
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Mobile menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        className="lg:hidden fixed inset-0 bg-white z-40 pt-16"
                    >
                        <nav className="p-4 space-y-2">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center space-x-3 px-4 py-3 rounded-xl transition",
                                            isActive
                                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                                : "text-gray-600 hover:bg-gray-100"
                                        )}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                );
                            })}

                            {isAdmin() && (
                                <>
                                    <div className="border-t border-gray-200 my-4" />
                                    {adminNavigation.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className={cn(
                                                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition",
                                                    isActive
                                                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                                        : "text-gray-600 hover:bg-gray-100"
                                                )}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span className="font-medium">{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </>
                            )}
                        </nav>

                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    signOut();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 rounded-xl text-gray-700"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
