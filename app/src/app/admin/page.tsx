"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminStore } from "@/lib/stores";
import {
    Shield,
    Settings,
    Users,
    BarChart3,
    Zap,
    Palette,
    Download,
    Bell,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Save,
    ToggleLeft,
    ToggleRight,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "features" | "ai" | "templates" | "exports" | "moderation" | "maintenance";

const tabs = [
    { id: "features" as TabId, name: "Features", icon: Zap },
    { id: "ai" as TabId, name: "AI Settings", icon: Zap },
    { id: "templates" as TabId, name: "Templates", icon: Palette },
    { id: "exports" as TabId, name: "Exports", icon: Download },
    { id: "moderation" as TabId, name: "Moderation", icon: Shield },
    { id: "maintenance" as TabId, name: "Maintenance", icon: AlertTriangle },
];

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<TabId>("features");
    const { settings, setSettings, saveSettings, isLoading, resetToDefaults } =
        useAdminStore();
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

    // Real stats from Firestore
    const [stats, setStats] = useState({
        totalUsers: 0,
        postsCreated: 0,
        aiGenerations: 0,
        exportsToday: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // Fetch real stats
    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                // Fetch users count
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const totalUsers = usersSnapshot.size;

                // Fetch posts count
                const postsSnapshot = await getDocs(collection(db, 'posts'));
                const postsCreated = postsSnapshot.size;

                // Count AI generations from user usage
                let aiGenerations = 0;
                usersSnapshot.docs.forEach(doc => {
                    const usage = doc.data().usage;
                    if (usage?.aiGenerationsThisMonth) {
                        aiGenerations += usage.aiGenerationsThisMonth;
                    }
                });

                // Count exports today
                let exportsToday = 0;
                usersSnapshot.docs.forEach(doc => {
                    const usage = doc.data().usage;
                    if (usage?.exportsThisMonth) {
                        exportsToday += usage.exportsThisMonth;
                    }
                });

                setStats({
                    totalUsers,
                    postsCreated,
                    aiGenerations,
                    exportsToday,
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus("idle");
        try {
            await saveSettings();
            setSaveStatus("success");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (error) {
            setSaveStatus("error");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleFeature = (feature: keyof typeof settings.features) => {
        setSettings({
            features: {
                ...settings.features,
                [feature]: !settings.features[feature],
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        Admin Control Panel
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage all aspects of your Post Designer application
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={resetToDefaults}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reset Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={cn(
                            "px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition",
                            saveStatus === "success"
                                ? "bg-green-500 text-white"
                                : saveStatus === "error"
                                    ? "bg-red-500 text-white"
                                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                        )}
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : saveStatus === "success" ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saveStatus === "success" ? "Saved!" : saveStatus === "error" ? "Error" : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", value: statsLoading ? "..." : stats.totalUsers.toLocaleString(), icon: Users, color: "from-blue-500 to-cyan-500" },
                    { label: "Posts Created", value: statsLoading ? "..." : stats.postsCreated.toLocaleString(), icon: Palette, color: "from-purple-500 to-pink-500" },
                    { label: "AI Generations", value: statsLoading ? "..." : stats.aiGenerations.toLocaleString(), icon: Zap, color: "from-amber-500 to-orange-500" },
                    { label: "Exports This Month", value: statsLoading ? "..." : stats.exportsToday.toLocaleString(), icon: Download, color: "from-green-500 to-emerald-500" },
                ].map((stat) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-200 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                            >
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions & Activity Feed */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Quick Actions
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                localStorage.clear();
                                alert('All caches cleared!');
                            }}
                            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left text-sm font-medium flex items-center gap-3 transition"
                        >
                            <RefreshCw className="w-4 h-4 text-gray-600" />
                            Clear All Caches
                        </button>
                        <button
                            onClick={() => {
                                const logs = JSON.stringify(stats, null, 2);
                                const blob = new Blob([logs], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `admin-stats-${new Date().toISOString().split('T')[0]}.json`;
                                a.click();
                            }}
                            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left text-sm font-medium flex items-center gap-3 transition"
                        >
                            <Download className="w-4 h-4 text-gray-600" />
                            Export Stats
                        </button>
                        <button
                            onClick={() => alert('Demo data reset functionality would go here')}
                            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left text-sm font-medium flex items-center gap-3 transition"
                        >
                            <RefreshCw className="w-4 h-4 text-gray-600" />
                            Reset Demo Data
                        </button>
                        <button
                            onClick={() => alert('Announcement system would go here')}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-left text-sm font-medium flex items-center gap-3 transition hover:opacity-90"
                        >
                            <Bell className="w-4 h-4" />
                            Send Announcement
                        </button>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {[
                            { action: 'New user signup', user: 'user@example.com', time: '2 minutes ago', icon: Users, color: 'text-green-500 bg-green-50' },
                            { action: 'Design exported', user: 'designer@company.com', time: '5 minutes ago', icon: Download, color: 'text-blue-500 bg-blue-50' },
                            { action: 'Template created', user: 'creator@mail.com', time: '15 minutes ago', icon: Palette, color: 'text-purple-500 bg-purple-50' },
                            { action: 'AI generation used', user: 'pro@business.com', time: '1 hour ago', icon: Zap, color: 'text-amber-500 bg-amber-50' },
                            { action: 'Settings updated', user: 'admin@postdesigner.com', time: '2 hours ago', icon: Settings, color: 'text-gray-500 bg-gray-50' },
                        ].map((activity, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}>
                                    <activity.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{activity.action}</p>
                                    <p className="text-xs text-gray-500">{activity.user}</p>
                                </div>
                                <span className="text-xs text-gray-400">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "border-amber-500 text-amber-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Features Tab */}
                    {activeTab === "features" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Feature Flags</h3>
                                    <p className="text-gray-500">
                                        Control feature access by user tier
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-gray-400"></span> Free
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-blue-500"></span> Pro
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-purple-500"></span> Enterprise
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {Object.entries(settings.features).map(([key, config]) => {
                                    const featureConfig = config as { enabled: boolean; allowedTiers: string[]; allowedRoles: string[] };
                                    const isEnabled = typeof config === 'boolean' ? config : featureConfig.enabled;
                                    const allowedTiers = typeof config === 'boolean'
                                        ? ['free', 'pro', 'enterprise']
                                        : (featureConfig.allowedTiers || []);

                                    return (
                                        <div
                                            key={key}
                                            className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="font-medium capitalize">
                                                        {key.replace(/([A-Z])/g, " $1").trim()}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {isEnabled
                                                            ? `Available to: ${allowedTiers.join(', ').toUpperCase() || 'None'}`
                                                            : "Disabled globally"}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const currentConfig = settings.features[key as keyof typeof settings.features];
                                                        const current = typeof currentConfig === 'boolean'
                                                            ? { enabled: currentConfig, allowedTiers: ['free', 'pro', 'enterprise'], allowedRoles: [] }
                                                            : currentConfig;
                                                        setSettings({
                                                            features: {
                                                                ...settings.features,
                                                                [key]: { ...current, enabled: !current.enabled },
                                                            },
                                                        });
                                                    }}
                                                    className={cn(
                                                        "w-14 h-8 rounded-full flex items-center transition p-1",
                                                        isEnabled ? "bg-green-500 justify-end" : "bg-gray-300 justify-start"
                                                    )}
                                                >
                                                    <div className="w-6 h-6 bg-white rounded-full shadow" />
                                                </button>
                                            </div>

                                            {/* Tier Access Checkboxes */}
                                            {isEnabled && (
                                                <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                                                    <span className="text-sm text-gray-600">Access:</span>
                                                    {['free', 'pro', 'enterprise'].map((tier) => {
                                                        const isChecked = allowedTiers.includes(tier);
                                                        return (
                                                            <label
                                                                key={tier}
                                                                className="flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => {
                                                                        const currentConfig = settings.features[key as keyof typeof settings.features];
                                                                        const current = typeof currentConfig === 'boolean'
                                                                            ? { enabled: true, allowedTiers: ['free', 'pro', 'enterprise'], allowedRoles: ['free', 'pro', 'moderator', 'admin'] }
                                                                            : { ...currentConfig };

                                                                        const newTiers = isChecked
                                                                            ? current.allowedTiers.filter((t: string) => t !== tier)
                                                                            : [...current.allowedTiers, tier];

                                                                        setSettings({
                                                                            features: {
                                                                                ...settings.features,
                                                                                [key]: { ...current, allowedTiers: newTiers },
                                                                            },
                                                                        });
                                                                    }}
                                                                    className={cn(
                                                                        "w-4 h-4 rounded border-gray-300 focus:ring-2",
                                                                        tier === 'free' && "text-gray-500 focus:ring-gray-300",
                                                                        tier === 'pro' && "text-blue-500 focus:ring-blue-300",
                                                                        tier === 'enterprise' && "text-purple-500 focus:ring-purple-300"
                                                                    )}
                                                                />
                                                                <span className={cn(
                                                                    "text-sm font-medium capitalize",
                                                                    tier === 'free' && "text-gray-600",
                                                                    tier === 'pro' && "text-blue-600",
                                                                    tier === 'enterprise' && "text-purple-600"
                                                                )}>
                                                                    {tier}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    <strong>Tip:</strong> Admins always have access to all features regardless of tier settings.
                                    Use these controls to restrict features for regular users based on their subscription tier.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* AI Settings Tab */}
                    {activeTab === "ai" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">AI Configuration</h3>

                            <div className="grid gap-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium">AI Enabled</p>
                                        <p className="text-sm text-gray-500">
                                            Master switch for all AI features
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setSettings({
                                                ai: { ...settings.ai, enabled: !settings.ai.enabled },
                                            })
                                        }
                                        className={cn(
                                            "w-14 h-8 rounded-full flex items-center transition p-1",
                                            settings.ai.enabled
                                                ? "bg-green-500 justify-end"
                                                : "bg-gray-300 justify-start"
                                        )}
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full shadow" />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        AI Provider
                                    </label>
                                    <select
                                        value={settings.ai.provider}
                                        onChange={(e) =>
                                            setSettings({
                                                ai: {
                                                    ...settings.ai,
                                                    provider: e.target.value as "openai" | "gemini" | "both",
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    >
                                        <option value="openai">OpenAI GPT-4</option>
                                        <option value="gemini">Google Gemini</option>
                                        <option value="both">Both (Fallback)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Max Tokens Per Request
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.ai.maxTokensPerRequest}
                                        onChange={(e) =>
                                            setSettings({
                                                ai: {
                                                    ...settings.ai,
                                                    maxTokensPerRequest: parseInt(e.target.value),
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Daily Limit Per User
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.ai.dailyLimitPerUser}
                                        onChange={(e) =>
                                            setSettings({
                                                ai: {
                                                    ...settings.ai,
                                                    dailyLimitPerUser: parseInt(e.target.value),
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Content Filter
                                    </label>
                                    <select
                                        value={settings.ai.contentFilter}
                                        onChange={(e) =>
                                            setSettings({
                                                ai: {
                                                    ...settings.ai,
                                                    contentFilter: e.target.value as "strict" | "moderate" | "off",
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    >
                                        <option value="strict">Strict</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="off">Off</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Templates Tab */}
                    {activeTab === "templates" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">Template Settings</h3>

                            <div className="grid gap-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium">Allow User Uploads</p>
                                        <p className="text-sm text-gray-500">
                                            Let users create custom templates
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setSettings({
                                                templates: {
                                                    ...settings.templates,
                                                    allowUserUploads: !settings.templates.allowUserUploads,
                                                },
                                            })
                                        }
                                        className={cn(
                                            "w-14 h-8 rounded-full flex items-center transition p-1",
                                            settings.templates.allowUserUploads
                                                ? "bg-green-500 justify-end"
                                                : "bg-gray-300 justify-start"
                                        )}
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full shadow" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium">Require Approval</p>
                                        <p className="text-sm text-gray-500">
                                            New templates need admin approval
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setSettings({
                                                templates: {
                                                    ...settings.templates,
                                                    requireApproval: !settings.templates.requireApproval,
                                                },
                                            })
                                        }
                                        className={cn(
                                            "w-14 h-8 rounded-full flex items-center transition p-1",
                                            settings.templates.requireApproval
                                                ? "bg-green-500 justify-end"
                                                : "bg-gray-300 justify-start"
                                        )}
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full shadow" />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Max Templates Per User
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.templates.maxTemplatesPerUser}
                                        onChange={(e) =>
                                            setSettings({
                                                templates: {
                                                    ...settings.templates,
                                                    maxTemplatesPerUser: parseInt(e.target.value),
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Exports Tab */}
                    {activeTab === "exports" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">Export Settings</h3>

                            <div className="grid gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Allowed Formats
                                    </label>
                                    <div className="flex gap-4">
                                        {["png", "jpg", "webp", "pdf"].map((format) => (
                                            <label key={format} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.exports.allowedFormats.includes(
                                                        format as "png" | "jpg" | "webp" | "pdf"
                                                    )}
                                                    onChange={(e) => {
                                                        const newFormats = e.target.checked
                                                            ? [...settings.exports.allowedFormats, format as "png" | "jpg" | "webp" | "pdf"]
                                                            : settings.exports.allowedFormats.filter(
                                                                (f) => f !== format
                                                            );
                                                        setSettings({
                                                            exports: {
                                                                ...settings.exports,
                                                                allowedFormats: newFormats,
                                                            },
                                                        });
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                                />
                                                <span className="uppercase text-sm font-medium">
                                                    {format}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium">Watermark Enabled</p>
                                        <p className="text-sm text-gray-500">
                                            Add watermark to free tier exports
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setSettings({
                                                exports: {
                                                    ...settings.exports,
                                                    watermarkEnabled: !settings.exports.watermarkEnabled,
                                                },
                                            })
                                        }
                                        className={cn(
                                            "w-14 h-8 rounded-full flex items-center transition p-1",
                                            settings.exports.watermarkEnabled
                                                ? "bg-green-500 justify-end"
                                                : "bg-gray-300 justify-start"
                                        )}
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full shadow" />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Watermark Text
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.exports.watermarkText}
                                        onChange={(e) =>
                                            setSettings({
                                                exports: {
                                                    ...settings.exports,
                                                    watermarkText: e.target.value,
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Max Resolution: {settings.exports.maxResolution}px
                                    </label>
                                    <input
                                        type="range"
                                        min="1080"
                                        max="8192"
                                        step="1024"
                                        value={settings.exports.maxResolution}
                                        onChange={(e) =>
                                            setSettings({
                                                exports: {
                                                    ...settings.exports,
                                                    maxResolution: parseInt(e.target.value),
                                                },
                                            })
                                        }
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Moderation Tab */}
                    {activeTab === "moderation" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">Content Moderation</h3>

                            <div className="grid gap-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium">Moderation Enabled</p>
                                        <p className="text-sm text-gray-500">
                                            Enable content moderation features
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setSettings({
                                                moderation: {
                                                    ...settings.moderation,
                                                    enabled: !settings.moderation.enabled,
                                                },
                                            })
                                        }
                                        className={cn(
                                            "w-14 h-8 rounded-full flex items-center transition p-1",
                                            settings.moderation.enabled
                                                ? "bg-green-500 justify-end"
                                                : "bg-gray-300 justify-start"
                                        )}
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full shadow" />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Max Daily Posts Per User
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.moderation.maxDailyPosts}
                                        onChange={(e) =>
                                            setSettings({
                                                moderation: {
                                                    ...settings.moderation,
                                                    maxDailyPosts: parseInt(e.target.value),
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Maintenance Tab */}
                    {activeTab === "maintenance" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">Maintenance Mode</h3>

                            <div
                                className={cn(
                                    "p-4 rounded-xl border-2 flex items-start gap-4",
                                    settings.maintenance.enabled
                                        ? "border-yellow-300 bg-yellow-50"
                                        : "border-gray-200 bg-gray-50"
                                )}
                            >
                                <AlertTriangle
                                    className={cn(
                                        "w-6 h-6 flex-shrink-0",
                                        settings.maintenance.enabled ? "text-yellow-600" : "text-gray-400"
                                    )}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Maintenance Mode</p>
                                            <p className="text-sm text-gray-500">
                                                {settings.maintenance.enabled
                                                    ? "Site is currently under maintenance"
                                                    : "Site is operating normally"}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setSettings({
                                                    maintenance: {
                                                        ...settings.maintenance,
                                                        enabled: !settings.maintenance.enabled,
                                                    },
                                                })
                                            }
                                            className={cn(
                                                "w-14 h-8 rounded-full flex items-center transition p-1",
                                                settings.maintenance.enabled
                                                    ? "bg-yellow-500 justify-end"
                                                    : "bg-gray-300 justify-start"
                                            )}
                                        >
                                            <div className="w-6 h-6 bg-white rounded-full shadow" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Maintenance Message
                                </label>
                                <textarea
                                    value={settings.maintenance.message}
                                    onChange={(e) =>
                                        setSettings({
                                            maintenance: {
                                                ...settings.maintenance,
                                                message: e.target.value,
                                            },
                                        })
                                    }
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium">Allow Admin Access</p>
                                    <p className="text-sm text-gray-500">
                                        Admins can still access during maintenance
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setSettings({
                                            maintenance: {
                                                ...settings.maintenance,
                                                allowAdminAccess: !settings.maintenance.allowAdminAccess,
                                            },
                                        })
                                    }
                                    className={cn(
                                        "w-14 h-8 rounded-full flex items-center transition p-1",
                                        settings.maintenance.allowAdminAccess
                                            ? "bg-green-500 justify-end"
                                            : "bg-gray-300 justify-start"
                                    )}
                                >
                                    <div className="w-6 h-6 bg-white rounded-full shadow" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
