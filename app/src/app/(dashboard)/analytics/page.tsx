"use client";

import { useEffect, useMemo } from "react";
import { useEditorStore, useAuthStore } from "@/lib/stores";
import { BarChart3, TrendingUp, Layers, HardDrive, Smartphone, Share2, Loader2, Crown } from "lucide-react";
import Link from "next/link";
import { Post } from "@/lib/types";

export default function AnalyticsPage() {
    const { user } = useAuthStore();
    const { posts, loadPosts, isLoading } = useEditorStore();

    useEffect(() => {
        if (user) loadPosts(user.id);
    }, [user, loadPosts]);

    // Calculate Stats
    const stats = useMemo(() => {
        const totalPosts = posts.length;
        const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
        const publishedPosts = posts.filter(p => p.status === 'published').length;

        // Platform distribution
        const platforms: Record<string, number> = {};
        posts.forEach(p => {
            const platform = p.platform || 'instagram';
            platforms[platform] = (platforms[platform] || 0) + 1;
        });

        // Weekly activity (Last 7 days)
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const postsLastWeek = posts.filter(p => {
            const date = p.createdAt ? ((p.createdAt as any).toDate ? (p.createdAt as any).toDate() : new Date(p.createdAt)) : new Date(0);
            return date >= oneWeekAgo;
        }).length;

        return { totalPosts, scheduledPosts, publishedPosts, platforms, postsLastWeek };
    }, [posts]);

    // Tier Limits (Mock logic based on tier)
    const tierLimits = useMemo(() => {
        const isPro = user?.tier === 'pro' || user?.tier === 'enterprise';
        return {
            postsLimit: isPro ? 1000 : 50,
            aiCreditsLimit: isPro ? 500 : 10,
            storageLimit: isPro ? 10000 : 500, // MB
        };
    }, [user]);

    const usage = {
        posts: user?.usage?.postsCreated || stats.totalPosts || 0,
        ai: user?.usage?.aiGenerationsThisMonth || 0,
        storage: Math.round((stats.totalPosts * 0.5)), // Estimate 0.5MB per post
    };

    if (isLoading && posts.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-indigo-600" />
                        Analytics & Usage
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Track your content performance and account limits
                    </p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl">
                        <Layers className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Posts</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.totalPosts}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Activity (7d)</p>
                        <h3 className="text-2xl font-bold text-gray-900">+{stats.postsLastWeek}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-xl">
                        <Crown className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Plan Status</p>
                        <h3 className="text-2xl font-bold text-gray-900 capitalize">{user?.tier || 'Free'}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <HardDrive className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Storage Used</p>
                        <h3 className="text-2xl font-bold text-gray-900">{usage.storage} MB</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Usage Limits */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                        Usage Limits
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm font-medium mb-2">
                                <span className="text-gray-700">Posts Created</span>
                                <span className="text-gray-500">{usage.posts} / {tierLimits.postsLimit}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (usage.posts / tierLimits.postsLimit) * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm font-medium mb-2">
                                <span className="text-gray-700">AI Credits (Monthly)</span>
                                <span className="text-gray-500">{usage.ai} / {tierLimits.aiCreditsLimit}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (usage.ai / tierLimits.aiCreditsLimit) * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm font-medium mb-2">
                                <span className="text-gray-700">Storage Space</span>
                                <span className="text-gray-500">{usage.storage}MB / {tierLimits.storageLimit}MB</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (usage.storage / tierLimits.storageLimit) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {user?.tier === 'free' && (
                        <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <h4 className="font-bold text-amber-900 text-sm mb-1">Upgrade to Pro</h4>
                            <p className="text-xs text-amber-700 mb-3">
                                Start your free 14-day trial to unlock unlimited posts, AI credits, and 10GB storage.
                            </p>
                            <Link href="/pricing" className="text-xs font-bold text-amber-900 underline hover:no-underline">
                                View Plans →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Platform Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-gray-400" />
                        Platform Distribution
                    </h3>

                    {stats.totalPosts === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-sm">No posts data available</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex h-4 rounded-full overflow-hidden w-full">
                                {Object.keys(stats.platforms).map((platform, index) => {
                                    const count = stats.platforms[platform];
                                    const percent = (count / stats.totalPosts) * 100;
                                    const colors = ['bg-pink-500', 'bg-blue-500', 'bg-sky-500', 'bg-indigo-500', 'bg-purple-500'];
                                    return (
                                        <div
                                            key={platform}
                                            className={`${colors[index % colors.length]}`}
                                            style={{ width: `${percent}%` }}
                                            title={`${platform}: ${count} posts`}
                                        />
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {Object.keys(stats.platforms).map((platform, index) => {
                                    const count = stats.platforms[platform];
                                    const percent = (count / stats.totalPosts) * 100;
                                    const bgColors = ['bg-pink-500', 'bg-blue-500', 'bg-sky-500', 'bg-indigo-500', 'bg-purple-500'];
                                    const color = bgColors[index % bgColors.length];

                                    return (
                                        <div key={platform} className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${color}`} />
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-gray-700 capitalize">{platform}</span>
                                                    <span className="text-gray-500 text-xs">{Math.round(percent)}%</span>
                                                </div>
                                                <p className="text-xs text-gray-400">{count} posts</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
