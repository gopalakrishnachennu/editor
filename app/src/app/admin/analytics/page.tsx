'use client';

/**
 * Admin Analytics Dashboard
 * Overview of platform metrics and statistics
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    FileText,
    Palette,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Activity,
    Calendar,
    Crown,
    AlertCircle,
    RefreshCw,
    Globe,
    Smartphone,
    Monitor,
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

interface DashboardStats {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    totalPosts: number;
    postsToday: number;
    totalTemplates: number;
    proUsers: number;
    activeUsers: number;
    errorCount: number;
}

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        totalPosts: 0,
        postsToday: 0,
        totalTemplates: 0,
        proUsers: 0,
        activeUsers: 0,
        errorCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState<Array<{ type: string; message: string; time: Date }>>([]);
    const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
    const [weeklyData, setWeeklyData] = useState<Array<{ day: string; users: number; posts: number }>>([]);

    const loadStats = async () => {
        setLoading(true);
        try {
            // Get dates for filtering
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(todayStart);
            weekStart.setDate(weekStart.getDate() - 7);

            // Fetch users
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const users = usersSnapshot.docs.map(d => {
                const data = d.data();
                return {
                    tier: data.tier as string || 'free',
                    email: data.email as string || '',
                    createdAt: data.createdAt?.toDate() || new Date(),
                    lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
                };
            });

            const totalUsers = users.length;
            const newUsersToday = users.filter(u => u.createdAt >= todayStart).length;
            const newUsersThisWeek = users.filter(u => u.createdAt >= weekStart).length;
            const proUsers = users.filter(u => u.tier === 'pro' || u.tier === 'enterprise').length;
            const activeUsers = users.filter(u => u.lastLoginAt >= weekStart).length;

            // Fetch posts
            const postsSnapshot = await getDocs(collection(db, 'posts'));
            const posts = postsSnapshot.docs.map(d => ({
                ...d.data(),
                createdAt: d.data().createdAt?.toDate() || new Date(),
            }));
            const totalPosts = posts.length;
            const postsToday = posts.filter(p => p.createdAt >= todayStart).length;

            // Fetch templates
            const templatesSnapshot = await getDocs(collection(db, 'templates'));
            const totalTemplates = templatesSnapshot.docs.length;

            // Fetch recent errors
            const logsQuery = query(
                collection(db, 'logs'),
                where('level', '==', 'error'),
                orderBy('timestamp', 'desc'),
                limit(10)
            );
            const logsSnapshot = await getDocs(logsQuery);
            const errorCount = logsSnapshot.docs.length;

            setStats({
                totalUsers,
                newUsersToday,
                newUsersThisWeek,
                totalPosts,
                postsToday,
                totalTemplates,
                proUsers,
                activeUsers,
                errorCount,
            });

            // Set recent activity
            const activities: Array<{ type: string; message: string; time: Date }> = [];

            // Add recent user signups
            users
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 5)
                .forEach(u => {
                    activities.push({
                        type: 'user',
                        message: `New user: ${u.email}`,
                        time: u.createdAt,
                    });
                });

            // Add recent posts
            posts
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 5)
                .forEach(p => {
                    activities.push({
                        type: 'post',
                        message: `New post created`,
                        time: p.createdAt,
                    });
                });

            // Sort all activities by time
            activities.sort((a, b) => b.time.getTime() - a.time.getTime());
            setRecentActivity(activities.slice(0, 8));

            // Calculate weekly chart data
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const weekData: Array<{ day: string; users: number; posts: number }> = [];
            for (let i = 6; i >= 0; i--) {
                const dayDate = new Date(todayStart);
                dayDate.setDate(dayDate.getDate() - i);
                const nextDay = new Date(dayDate);
                nextDay.setDate(nextDay.getDate() + 1);

                const dayUsers = users.filter(u => u.createdAt >= dayDate && u.createdAt < nextDay).length;
                const dayPosts = posts.filter(p => p.createdAt >= dayDate && p.createdAt < nextDay).length;

                weekData.push({
                    day: daysOfWeek[dayDate.getDay()],
                    users: dayUsers,
                    posts: dayPosts,
                });
            }
            setWeeklyData(weekData);

            logger.info('AdminAnalytics', 'Loaded dashboard stats', { ...stats } as Record<string, unknown>);
        } catch (error) {
            logger.exception('AdminAnalytics', error as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const statCards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            change: `+${stats.newUsersThisWeek} this week`,
            trend: 'up',
            icon: Users,
            color: 'violet',
        },
        {
            title: 'Pro Users',
            value: stats.proUsers,
            change: `${((stats.proUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}% of total`,
            trend: 'up',
            icon: Crown,
            color: 'amber',
        },
        {
            title: 'Total Posts',
            value: stats.totalPosts,
            change: `+${stats.postsToday} today`,
            trend: 'up',
            icon: FileText,
            color: 'blue',
        },
        {
            title: 'Active Users',
            value: stats.activeUsers,
            change: 'Last 7 days',
            trend: 'up',
            icon: Activity,
            color: 'green',
        },
    ];

    const colorClasses = {
        violet: 'bg-violet-500/20 text-violet-400',
        amber: 'bg-amber-500/20 text-amber-400',
        blue: 'bg-blue-500/20 text-blue-400',
        green: 'bg-green-500/20 text-green-400',
        red: 'bg-red-500/20 text-red-400',
    };

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <TrendingUp className="w-7 h-7 text-violet-500" />
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Platform overview and metrics
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                            className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="today">Today</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="all">All Time</option>
                        </select>
                        <button
                            onClick={loadStats}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {statCards.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-1 text-green-400 text-sm">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-bold text-white">
                                    {loading ? '—' : stat.value.toLocaleString()}
                                </div>
                                <div className="text-gray-400 text-sm mt-1">{stat.title}</div>
                                <div className="text-gray-500 text-xs mt-2">{stat.change}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Weekly Activity Chart */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-violet-400" />
                        Weekly Activity
                    </h2>
                    <div className="flex items-end justify-between gap-2 h-40">
                        {weeklyData.map((day, index) => {
                            const maxVal = Math.max(...weeklyData.map(d => d.users + d.posts), 1);
                            const height = ((day.users + day.posts) / maxVal) * 100;
                            return (
                                <motion.div
                                    key={day.day}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(height, 5)}%` }}
                                    transition={{ delay: index * 0.05, duration: 0.4 }}
                                    className="flex-1 flex flex-col items-center"
                                >
                                    <div className="w-full flex-1 flex flex-col justify-end">
                                        <div
                                            className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-md relative"
                                            style={{ height: `${Math.max(height, 5)}%`, minHeight: '8px' }}
                                        >
                                            {(day.users + day.posts) > 0 && (
                                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white font-medium">
                                                    {day.users + day.posts}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-2">{day.day}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-violet-500" />
                            Users + Posts
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-violet-400" />
                            Recent Activity
                        </h2>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-8">
                                    <RefreshCw className="w-6 h-6 text-violet-500 animate-spin mx-auto" />
                                </div>
                            ) : recentActivity.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No recent activity
                                </div>
                            ) : (
                                recentActivity.map((activity, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg"
                                    >
                                        <div className={`p-2 rounded-lg ${activity.type === 'user' ? 'bg-violet-500/20' :
                                            activity.type === 'post' ? 'bg-blue-500/20' :
                                                'bg-gray-500/20'
                                            }`}>
                                            {activity.type === 'user' ? (
                                                <Users className="w-4 h-4 text-violet-400" />
                                            ) : (
                                                <FileText className="w-4 h-4 text-blue-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-sm">{activity.message}</p>
                                            <p className="text-gray-500 text-xs">
                                                {activity.time.toLocaleString()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-4">
                        {/* Templates */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Palette className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">{stats.totalTemplates}</div>
                                    <div className="text-gray-400 text-sm">Templates</div>
                                </div>
                            </div>
                        </div>

                        {/* Errors */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">{stats.errorCount}</div>
                                    <div className="text-gray-400 text-sm">Recent Errors</div>
                                </div>
                            </div>
                            <a
                                href="/admin/logs?level=error"
                                className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                            >
                                View error logs →
                            </a>
                        </div>

                        {/* New Users Today */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <Calendar className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">{stats.newUsersToday}</div>
                                    <div className="text-gray-400 text-sm">New Users Today</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
