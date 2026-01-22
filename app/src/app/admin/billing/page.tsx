'use client';

/**
 * Admin Billing Page
 * Subscription management and revenue overview
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    DollarSign,
    Users,
    TrendingUp,
    Calendar,
    AlertCircle,
    Gift,
    Tag,
    Plus,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminBillingPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'coupons'>('overview');

    // Placeholder data - would come from Stripe/payment provider
    const stats = {
        mrr: 0,
        totalRevenue: 0,
        activeSubscriptions: 0,
        churnRate: 0,
    };

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <CreditCard className="w-7 h-7 text-violet-500" />
                            Billing & Subscriptions
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Manage subscriptions, revenue, and payment settings
                        </p>
                    </div>
                </div>

                {/* Coming Soon Banner */}
                <div className="mb-8 p-6 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-xl">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-violet-500/20 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Payment Integration Coming Soon</h3>
                            <p className="text-gray-300 text-sm mt-1">
                                Stripe integration for subscriptions and payments is planned for Phase 3.
                                This page will display real revenue data, subscription management, and coupon codes once implemented.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Monthly Revenue', value: `$${stats.mrr}`, icon: DollarSign, color: 'violet' },
                        { label: 'Total Revenue', value: `$${stats.totalRevenue}`, icon: TrendingUp, color: 'green' },
                        { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: Users, color: 'blue' },
                        { label: 'Churn Rate', value: `${stats.churnRate}%`, icon: Calendar, color: 'amber' },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                        >
                            <div className="flex items-start justify-between">
                                <div className={cn(
                                    'p-3 rounded-xl',
                                    stat.color === 'violet' && 'bg-violet-500/20',
                                    stat.color === 'green' && 'bg-green-500/20',
                                    stat.color === 'blue' && 'bg-blue-500/20',
                                    stat.color === 'amber' && 'bg-amber-500/20'
                                )}>
                                    <stat.icon className={cn(
                                        'w-6 h-6',
                                        stat.color === 'violet' && 'text-violet-400',
                                        stat.color === 'green' && 'text-green-400',
                                        stat.color === 'blue' && 'text-blue-400',
                                        stat.color === 'amber' && 'text-amber-400'
                                    )} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-bold text-white">{stat.value}</div>
                                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="bg-gray-900 rounded-xl border border-gray-800">
                    <div className="border-b border-gray-800">
                        <nav className="flex gap-1 p-2">
                            {[
                                { id: 'overview', label: 'Overview', icon: TrendingUp },
                                { id: 'subscriptions', label: 'Subscriptions', icon: Users },
                                { id: 'coupons', label: 'Coupon Codes', icon: Gift },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        activeTab === tab.id
                                            ? 'bg-violet-600 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">No Revenue Data Yet</h3>
                                <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                                    Revenue data will appear here once Stripe integration is complete and you have paying subscribers.
                                </p>
                            </div>
                        )}

                        {activeTab === 'subscriptions' && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">No Active Subscriptions</h3>
                                <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                                    Active subscriptions will be displayed here once payment integration is enabled.
                                </p>
                            </div>
                        )}

                        {activeTab === 'coupons' && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-white">Coupon Codes</h3>
                                    <button
                                        disabled
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create Coupon
                                    </button>
                                </div>
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Tag className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">No Coupons Created</h3>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Create discount codes for promotional campaigns.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
