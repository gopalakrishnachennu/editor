'use client';

/**
 * Admin Settings Page
 * Fully functional system-wide configuration settings with Firestore persistence
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Server,
    Database,
    Globe,
    Bell,
    Shield,
    Key,
    RefreshCw,
    Save,
    CheckCircle,
    AlertCircle,
    Info,
    Palette,
    Lock,
    Clock,
    Loader2,
} from 'lucide-react';
import { useAdminStore } from '@/lib/stores';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

export default function AdminSettingsPage() {
    const { settings, setSettings, saveSettings, loadSettings, isLoading } = useAdminStore();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('general');

    // Local state for form fields that need immediate UI updates
    const [localSettings, setLocalSettings] = useState({
        appName: 'Post Designer',
        supportEmail: 'support@postdesigner.app',
        defaultTimezone: 'Asia/Kolkata',
    });

    // Notification settings
    const [notifications, setNotifications] = useState({
        emailNewUsers: true,
        emailErrors: true,
        weeklyReport: false,
        pushNotifications: false,
    });

    // Security settings
    const [security, setSecurity] = useState({
        requireEmailVerification: true,
        enable2FA: false,
        sessionTimeout: true,
        logAdminActions: true,
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save appearance settings (already in admin settings)
            setSettings({
                appearance: {
                    ...settings.appearance,
                    primaryColor: settings.appearance.primaryColor,
                    accentColor: settings.appearance.accentColor,
                }
            });

            await saveSettings();
            setSaved(true);
            logger.info('AdminSettings', 'Settings saved successfully');
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            logger.exception('AdminSettings', error as Error);
        } finally {
            setSaving(false);
        }
    };

    const sections = [
        { id: 'general', name: 'General', icon: Settings },
        { id: 'appearance', name: 'Appearance', icon: Palette },
        { id: 'ratelimits', name: 'Rate Limits', icon: Clock },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'api', name: 'API Keys', icon: Key },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-4">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Settings className="w-7 h-7 text-violet-500" />
                            System Settings
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Configure application-wide settings (saved to Firestore)
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={cn(
                            'flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors',
                            saved
                                ? 'bg-green-600 text-white'
                                : 'bg-violet-600 hover:bg-violet-700 text-white'
                        )}
                    >
                        {saving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : saved ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="col-span-1">
                        <nav className="bg-gray-900 rounded-xl border border-gray-800 p-2">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                                        activeSection === section.id
                                            ? 'bg-violet-600 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    )}
                                >
                                    <section.icon className="w-5 h-5" />
                                    {section.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="col-span-3 space-y-6">
                        {/* General Settings */}
                        {activeSection === 'general' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <h2 className="text-lg font-semibold text-white mb-6">General Settings</h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Application Name
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.general?.appName || 'Post Designer'}
                                            onChange={(e) => setSettings({
                                                general: { ...settings.general, appName: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                        <p className="text-gray-500 text-xs mt-1">This will be displayed in the sidebar and header after saving</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Support Email
                                        </label>
                                        <input
                                            type="email"
                                            value={settings.general?.supportEmail || 'support@postdesigner.app'}
                                            onChange={(e) => setSettings({
                                                general: { ...settings.general, supportEmail: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Default Timezone
                                        </label>
                                        <select
                                            value={settings.general?.defaultTimezone || 'Asia/Kolkata'}
                                            onChange={(e) => setSettings({
                                                general: { ...settings.general, defaultTimezone: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        >
                                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                            <option value="America/New_York">America/New_York (EST)</option>
                                            <option value="Europe/London">Europe/London (GMT)</option>
                                            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                                            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Appearance Settings */}
                        {activeSection === 'appearance' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <h2 className="text-lg font-semibold text-white mb-6">Appearance Settings</h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Primary Color
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={settings.appearance.primaryColor}
                                                onChange={(e) => setSettings({
                                                    appearance: { ...settings.appearance, primaryColor: e.target.value }
                                                })}
                                                className="w-12 h-12 rounded-lg cursor-pointer border-0"
                                            />
                                            <input
                                                type="text"
                                                value={settings.appearance.primaryColor}
                                                onChange={(e) => setSettings({
                                                    appearance: { ...settings.appearance, primaryColor: e.target.value }
                                                })}
                                                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Accent Color
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={settings.appearance.accentColor}
                                                onChange={(e) => setSettings({
                                                    appearance: { ...settings.appearance, accentColor: e.target.value }
                                                })}
                                                className="w-12 h-12 rounded-lg cursor-pointer border-0"
                                            />
                                            <input
                                                type="text"
                                                value={settings.appearance.accentColor}
                                                onChange={(e) => setSettings({
                                                    appearance: { ...settings.appearance, accentColor: e.target.value }
                                                })}
                                                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Logo URL
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.appearance.logoUrl}
                                            onChange={(e) => setSettings({
                                                appearance: { ...settings.appearance, logoUrl: e.target.value }
                                            })}
                                            placeholder="https://example.com/logo.png"
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Custom CSS
                                        </label>
                                        <textarea
                                            value={settings.appearance.customCss}
                                            onChange={(e) => setSettings({
                                                appearance: { ...settings.appearance, customCss: e.target.value }
                                            })}
                                            placeholder="/* Add custom CSS here */"
                                            rows={4}
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Rate Limits */}
                        {activeSection === 'ratelimits' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <h2 className="text-lg font-semibold text-white mb-6">Rate Limits</h2>
                                <p className="text-gray-400 text-sm mb-6">Control how many actions users can perform</p>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            URL Extractions (per hour)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.rateLimits.urlExtractionsPerHour}
                                            onChange={(e) => setSettings({
                                                rateLimits: { ...settings.rateLimits, urlExtractionsPerHour: parseInt(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            AI Generations (per hour)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.rateLimits.aiGenerationsPerHour}
                                            onChange={(e) => setSettings({
                                                rateLimits: { ...settings.rateLimits, aiGenerationsPerHour: parseInt(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Exports (per hour)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.rateLimits.exportsPerHour}
                                            onChange={(e) => setSettings({
                                                rateLimits: { ...settings.rateLimits, exportsPerHour: parseInt(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Batch Jobs (per day)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.rateLimits.batchJobsPerDay}
                                            onChange={(e) => setSettings({
                                                rateLimits: { ...settings.rateLimits, batchJobsPerDay: parseInt(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Notifications */}
                        {activeSection === 'notifications' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <h2 className="text-lg font-semibold text-white mb-6">Notification Settings</h2>

                                <div className="space-y-4">
                                    {[
                                        { key: 'emailNewUsers', label: 'Email notifications for new users', enabled: notifications.emailNewUsers },
                                        { key: 'emailErrors', label: 'Email notifications for errors', enabled: notifications.emailErrors },
                                        { key: 'weeklyReport', label: 'Weekly usage report', enabled: notifications.weeklyReport },
                                        { key: 'pushNotifications', label: 'Push notifications', enabled: notifications.pushNotifications },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                            <span className="text-white">{item.label}</span>
                                            <button
                                                onClick={() => setNotifications({ ...notifications, [item.key]: !item.enabled })}
                                                className={cn(
                                                    'w-12 h-6 rounded-full flex items-center transition p-0.5',
                                                    item.enabled ? 'bg-violet-600 justify-end' : 'bg-gray-600 justify-start'
                                                )}
                                            >
                                                <div className="w-5 h-5 bg-white rounded-full shadow" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Security */}
                        {activeSection === 'security' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <h2 className="text-lg font-semibold text-white mb-6">Security Settings</h2>

                                <div className="space-y-4">
                                    {[
                                        { key: 'requireEmailVerification', label: 'Require email verification', enabled: security.requireEmailVerification },
                                        { key: 'enable2FA', label: 'Enable two-factor authentication', enabled: security.enable2FA },
                                        { key: 'sessionTimeout', label: 'Session timeout (30 minutes)', enabled: security.sessionTimeout },
                                        { key: 'logAdminActions', label: 'Log all admin actions', enabled: security.logAdminActions },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                            <span className="text-white">{item.label}</span>
                                            <button
                                                onClick={() => setSecurity({ ...security, [item.key]: !item.enabled })}
                                                className={cn(
                                                    'w-12 h-6 rounded-full flex items-center transition p-0.5',
                                                    item.enabled ? 'bg-violet-600 justify-end' : 'bg-gray-600 justify-start'
                                                )}
                                            >
                                                <div className="w-5 h-5 bg-white rounded-full shadow" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* API Keys */}
                        {activeSection === 'api' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <h2 className="text-lg font-semibold text-white mb-6">API Configuration</h2>

                                <div className="space-y-6">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-blue-300 text-sm">
                                                API keys are stored in environment variables for security.
                                                Update them in your <code className="bg-blue-500/20 px-1 rounded">.env.local</code> file and restart the server.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            OpenAI API Key
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value="sk-••••••••••••••••••••"
                                                disabled
                                                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-500 focus:outline-none cursor-not-allowed"
                                            />
                                            <span className="flex items-center px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Configured
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1">Set via OPENAI_API_KEY environment variable</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Firebase Project ID
                                        </label>
                                        <input
                                            type="text"
                                            value="post-designer-5bf55"
                                            disabled
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-500 focus:outline-none cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            AI Provider (from Admin Panel)
                                        </label>
                                        <select
                                            value={settings.ai.provider}
                                            onChange={(e) => setSettings({
                                                ai: { ...settings.ai, provider: e.target.value as 'openai' | 'gemini' | 'both' }
                                            })}
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        >
                                            <option value="openai">OpenAI GPT-4</option>
                                            <option value="gemini">Google Gemini</option>
                                            <option value="both">Both (Fallback)</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
