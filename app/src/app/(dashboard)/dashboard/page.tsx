"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuthStore, useEditorStore, useAdminStore } from "@/lib/stores";
import { FeatureGate } from "@/components/guards";
import { useEffect } from "react";
import {
    Plus,
    FileText,
    Palette,
    TrendingUp,
    Clock,
    Sparkles,
    ArrowRight,
    Zap,
    Image,
    BarChart3,
} from "lucide-react";

const quickActions = [
    {
        title: "Create from URL",
        description: "Paste any article link",
        icon: Zap,
        href: "/editor/new?mode=url",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        title: "Create from Text",
        description: "Write your own content",
        icon: FileText,
        href: "/editor/new?mode=text",
        gradient: "from-purple-500 to-pink-500",
    },
    {
        title: "Use Template",
        description: "Start with a template",
        icon: Palette,
        href: "/templates",
        gradient: "from-amber-500 to-orange-500",
    },
    {
        title: "Batch Create",
        description: "Multiple posts at once",
        icon: Image,
        href: "/editor/batch",
        gradient: "from-green-500 to-emerald-500",
        tier: "pro" as const,
    },
];

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { recentPosts, syncUserStats } = useEditorStore();
    const { settings } = useAdminStore();

    useEffect(() => {
        if (user?.id) {
            syncUserStats(user.id);
        }
    }, [user, syncUserStats]);

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome back, {user?.displayName?.split(" ")[0] || "Creator"}! 👋
                    </h1>
                    <p className="text-indigo-100 text-lg">
                        Ready to create some amazing content today?
                    </p>

                    <div className="flex items-center gap-6 mt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold">{user?.usage?.postsCreated || 0}</p>
                            <p className="text-indigo-200 text-sm">Posts Created</p>
                        </div>
                        <div className="w-px h-12 bg-white/20" />
                        <div className="text-center">
                            <p className="text-3xl font-bold">
                                {user?.usage?.aiGenerationsThisMonth || 0}
                            </p>
                            <p className="text-indigo-200 text-sm">AI Generations</p>
                        </div>
                        <div className="w-px h-12 bg-white/20" />
                        <div className="text-center">
                            <p className="text-3xl font-bold">
                                {user?.usage?.exportsThisMonth || 0}
                            </p>
                            <p className="text-indigo-200 text-sm">Exports</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                        <FeatureGate
                            key={action.title}
                            tier={action.tier}
                            showUpgrade={false}
                            fallback={
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative group"
                                >
                                    <div className="p-6 bg-white rounded-xl border border-gray-200 opacity-60">
                                        <div
                                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4`}
                                        >
                                            <action.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="font-semibold mb-1">{action.title}</h3>
                                        <p className="text-sm text-gray-500">{action.description}</p>
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                            Pro
                                        </div>
                                    </div>
                                </motion.div>
                            }
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link
                                    href={action.href}
                                    className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 transition group"
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition`}
                                    >
                                        <action.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-semibold mb-1 group-hover:text-indigo-600 transition">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-gray-500">{action.description}</p>
                                </Link>
                            </motion.div>
                        </FeatureGate>
                    ))}
                </div>
            </section>



            {/* AI Feature Section */}
            <FeatureGate feature="aiGeneration" showUpgrade={false}>
                <section className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold mb-2">AI Content Assistant</h2>
                            <p className="text-gray-600 mb-4">
                                Let AI help you create engaging content. Just paste a URL or describe
                                your topic, and watch the magic happen.
                            </p>
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/editor/new?mode=ai"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition font-medium"
                                >
                                    <Zap className="w-4 h-4" />
                                    Try AI Assistant
                                </Link>
                                <span className="text-sm text-gray-500">
                                    {settings.ai.dailyLimitPerUser - (user?.usage?.aiGenerationsThisMonth || 0)} credits remaining
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </FeatureGate>
        </div>
    );
}
