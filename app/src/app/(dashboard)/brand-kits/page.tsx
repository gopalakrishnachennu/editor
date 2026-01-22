"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEditorStore, useAuthStore } from "@/lib/stores";
import { AuthGuard } from "@/components/guards";
import { BrandKit } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    Sparkles,
    Palette,
    Type,
    Image as ImageIcon,
    Save,
    Trash2,
    Plus,
    Check,
    Loader2,
    Globe,
    Instagram,
    Linkedin,
    Twitter,
    Mail,
    MessageSquare,
    Link as LinkIcon,
    Droplet,
    Volume2
} from "lucide-react";

export default function BrandKitsPage() {
    const { user } = useAuthStore();
    const {
        brandKits,
        currentBrandKit,
        loadBrandKits,
        saveBrandKit,
        deleteBrandKit,
        setCurrentBrandKit
    } = useEditorStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'visuals' | 'voice' | 'info'>('visuals');

    // Form state
    const [editingKit, setEditingKit] = useState<Partial<BrandKit>>({
        name: "New Brand Kit",
        colors: {
            primary: "#6366f1",
            secondary: "#ec4899",
            accent: "#f59e0b",
            text: "#1f2937",
            background: "#ffffff"
        },
        fonts: {
            heading: "Inter",
            body: "Inter"
        },
        voice: {
            tone: "Professional",
            keywords: [],
            audience: "General"
        },
        social: {},
        isDefault: false
    });

    useEffect(() => {
        if (user) {
            loadBrandKits(user.id).then(() => setIsLoading(false));
        }
    }, [user, loadBrandKits]);

    // Update form when selecting a kit
    useEffect(() => {
        if (currentBrandKit) {
            setEditingKit(currentBrandKit);
        } else if (brandKits.length > 0) {
            setEditingKit(brandKits[0]);
            setCurrentBrandKit(brandKits[0]);
        }
    }, [currentBrandKit, brandKits, setCurrentBrandKit]);

    const handleSave = async () => {
        if (!user || !editingKit.name) return;
        setIsSaving(true);
        try {
            const kitToSave = {
                ...editingKit,
                userId: user.id,
                updatedAt: new Date()
            };
            const id = await saveBrandKit(kitToSave as BrandKit);
            setIsSaving(false);
            // Re-select if it was new
            if (!editingKit.id) {
                const newKit = { ...kitToSave, id } as BrandKit;
                setCurrentBrandKit(newKit);
            }
        } catch (error) {
            console.error("Failed to save brand kit:", error);
            setIsSaving(false);
        }
    };

    const handleCreateNew = () => {
        const newKit = {
            name: "New Brand Kit",
            // ... (defaults)
            colors: { primary: "#6366f1", secondary: "#ec4899", accent: "#f59e0b", text: "#1f2937", background: "#ffffff" },
            fonts: { heading: "Inter", body: "Inter" },
            isDefault: brandKits.length === 0
        };
        setEditingKit(newKit);
        setCurrentBrandKit(null); // Deselect current to indicate "New" mode
    };

    const handleDelete = async () => {
        if (!editingKit.id) return;
        if (confirm("Are you sure you want to delete this brand kit?")) {
            await deleteBrandKit(editingKit.id);
            if (brandKits.length > 0) {
                setEditingKit(brandKits[0]);
                setCurrentBrandKit(brandKits[0]);
            }
        }
    };

    const colorFields = [
        { key: 'primary', label: 'Primary Color' },
        { key: 'secondary', label: 'Secondary Color' },
        { key: 'accent', label: 'Accent Color' },
        { key: 'text', label: 'Text Color' },
        { key: 'background', label: 'Background Color' },
    ];

    const tones = ["Professional", "Witty", "Urgent", "Friendly", "Luxury", "Minimalist", "Technical"];

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50 pb-12">
                <div className="max-w-6xl mx-auto p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-indigo-600" />
                                Brand Identity
                            </h1>
                            <p className="text-gray-500">Manage your brand's look, voice, and details.</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateNew}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition"
                            >
                                <Plus className="w-4 h-4" /> New Kit
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg font-medium flex items-center gap-2 transition disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Sidebar: Kit List */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b bg-gray-50">
                                    <h3 className="font-semibold text-gray-700">Your Brand Kits</h3>
                                </div>
                                <div className="divide-y max-h-[400px] overflow-y-auto">
                                    {isLoading ? (
                                        <div className="p-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
                                    ) : brandKits.map(kit => (
                                        <button
                                            key={kit.id}
                                            onClick={() => {
                                                setCurrentBrandKit(kit);
                                                setEditingKit(kit);
                                            }}
                                            className={cn(
                                                "w-full text-left p-4 hover:bg-gray-50 transition flex items-center gap-3",
                                                editingKit.id === kit.id ? "bg-indigo-50 border-l-4 border-indigo-600" : "border-l-4 border-transparent"
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-full border shadow-sm" style={{ backgroundColor: kit.colors.primary }} />
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{kit.name}</p>
                                                {kit.isDefault && <span className="text-xs text-indigo-600 font-medium bg-indigo-100 px-2 py-0.5 rounded-full">Default</span>}
                                            </div>
                                        </button>
                                    ))}
                                    {brandKits.length === 0 && !isLoading && (
                                        <div className="p-4 text-center text-gray-500 text-sm">No kits found. Create one to get started!</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-9 space-y-6">
                            {/* Kit Name Input */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Kit Name</label>
                                <input
                                    type="text"
                                    value={editingKit.name}
                                    onChange={(e) => setEditingKit({ ...editingKit, name: e.target.value })}
                                    className="w-full text-xl font-bold border-b border-gray-200 focus:border-indigo-600 focus:outline-none py-2 px-1 bg-transparent"
                                    placeholder="e.g. My Startup Brand"
                                />
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-200">
                                {(['visuals', 'voice', 'info'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "px-8 py-3 font-medium text-sm transition relative",
                                            activeTab === tab ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        {tab === 'visuals' && <div className="flex items-center gap-2"><Palette className="w-4 h-4" /> Visuals</div>}
                                        {tab === 'voice' && <div className="flex items-center gap-2"><Volume2 className="w-4 h-4" /> Brand Voice</div>}
                                        {tab === 'info' && <div className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Smart Info</div>}
                                        {activeTab === tab && (
                                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                                {/* Visuals Tab */}
                                {activeTab === 'visuals' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Colors */}
                                        <section>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Palette className="w-5 h-5 text-indigo-500" /> Color Palette
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                {colorFields.map((field) => (
                                                    <div key={field.key} className="space-y-2 group">
                                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{field.label}</label>
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm border border-gray-200 group-hover:scale-105 transition">
                                                                <input
                                                                    type="color"
                                                                    value={editingKit.colors?.[field.key as keyof typeof editingKit.colors] || '#000000'}
                                                                    onChange={(e) => setEditingKit({
                                                                        ...editingKit,
                                                                        colors: { ...editingKit.colors!, [field.key]: e.target.value }
                                                                    })}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                />
                                                                <div
                                                                    className="w-full h-full"
                                                                    style={{ backgroundColor: editingKit.colors?.[field.key as keyof typeof editingKit.colors] }}
                                                                />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={editingKit.colors?.[field.key as keyof typeof editingKit.colors]}
                                                                onChange={(e) => setEditingKit({
                                                                    ...editingKit,
                                                                    colors: { ...editingKit.colors!, [field.key]: e.target.value }
                                                                })}
                                                                className="w-24 px-2 py-1 text-sm border rounded font-mono uppercase"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <div className="h-px bg-gray-100" />

                                        {/* Typography */}
                                        <section>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Type className="w-5 h-5 text-pink-500" /> Typography
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="font-medium text-gray-700">Headings Font</label>
                                                    <select
                                                        value={editingKit.fonts?.heading}
                                                        onChange={(e) => setEditingKit({ ...editingKit, fonts: { ...editingKit.fonts!, heading: e.target.value } })}
                                                        className="w-full p-2 border rounded-lg bg-gray-50"
                                                    >
                                                        <option>Inter</option>
                                                        <option>Roboto</option>
                                                        <option>Playfair Display</option>
                                                        <option>Montserrat</option>
                                                        <option>Open Sans</option>
                                                        <option>Lato</option>
                                                    </select>
                                                    <p className="text-3xl font-bold mt-2" style={{ fontFamily: editingKit.fonts?.heading }}>
                                                        The quick brown fox
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-medium text-gray-700">Body Font</label>
                                                    <select
                                                        value={editingKit.fonts?.body}
                                                        onChange={(e) => setEditingKit({ ...editingKit, fonts: { ...editingKit.fonts!, body: e.target.value } })}
                                                        className="w-full p-2 border rounded-lg bg-gray-50"
                                                    >
                                                        <option>Inter</option>
                                                        <option>Roboto</option>
                                                        <option>Open Sans</option>
                                                        <option>Lato</option>
                                                        <option>Source Sans Pro</option>
                                                    </select>
                                                    <p className="text-base mt-2 text-gray-600" style={{ fontFamily: editingKit.fonts?.body }}>
                                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="h-px bg-gray-100" />

                                        {/* Logo Upload Placeholder */}
                                        <section>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <ImageIcon className="w-5 h-5 text-blue-500" /> Logs & Assets
                                            </h3>
                                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer">
                                                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p className="font-medium text-gray-900">Upload Logo</p>
                                                <p className="text-sm text-gray-500">Coming soon: Upload SVG or PNG logos here.</p>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* Voice Tab (New) */}
                                {activeTab === 'voice' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-6 rounded-xl border border-indigo-100">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                                                    <Sparkles className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-indigo-900">AI Brand Persona</h3>
                                                    <p className="text-indigo-700 text-sm">Define how our AI writer speaks for your brand. This affects generated captions and headlines.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="block font-medium text-gray-700">Tone of Voice</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {tones.map(tone => (
                                                        <button
                                                            key={tone}
                                                            onClick={() => setEditingKit({
                                                                ...editingKit,
                                                                voice: { ...editingKit.voice!, tone }
                                                            })}
                                                            className={cn(
                                                                "px-4 py-2 rounded-full text-sm font-medium transition border",
                                                                editingKit.voice?.tone === tone
                                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                                            )}
                                                        >
                                                            {tone}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="block font-medium text-gray-700">Target Audience</label>
                                                <input
                                                    type="text"
                                                    value={editingKit.voice?.audience || ''}
                                                    onChange={(e) => setEditingKit({
                                                        ...editingKit,
                                                        voice: { ...editingKit.voice!, audience: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                    placeholder="e.g. Gen Z Gamers, Enterprise CTOs..."
                                                />
                                            </div>

                                            <div className="col-span-full space-y-4">
                                                <label className="block font-medium text-gray-700">Brand Keywords</label>
                                                <p className="text-sm text-gray-500 mb-2">Words the AI should try to include naturally.</p>
                                                <input
                                                    type="text"
                                                    value={editingKit.voice?.keywords?.join(', ') || ''}
                                                    onChange={(e) => setEditingKit({
                                                        ...editingKit,
                                                        voice: { ...editingKit.voice!, keywords: e.target.value.split(',').map(s => s.trim()) }
                                                    })}
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                    placeholder="e.g. Sustainable, Innovative, Fast, Reliable..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Info Tab (New) */}
                                {activeTab === 'info' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                                                    <LinkIcon className="w-6 h-6 text-orange-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-orange-900">Smart Functions</h3>
                                                    <p className="text-orange-700 text-sm">These details can be auto-injected into your templates using variables like <code className="bg-white/50 px-1 rounded break-all">{"{{brand.website}}"}</code>.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 font-medium text-gray-700"><Globe className="w-4 h-4" /> Website</label>
                                                <input
                                                    type="url"
                                                    value={editingKit.social?.website || ''}
                                                    onChange={(e) => setEditingKit({ ...editingKit, social: { ...editingKit.social, website: e.target.value } })}
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    placeholder="https://mysite.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 font-medium text-gray-700"><Mail className="w-4 h-4" /> Contact Email</label>
                                                <input
                                                    type="email"
                                                    value={editingKit.social?.email || ''}
                                                    onChange={(e) => setEditingKit({ ...editingKit, social: { ...editingKit.social, email: e.target.value } })}
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    placeholder="hello@mysite.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 font-medium text-gray-700"><Instagram className="w-4 h-4" /> Instagram</label>
                                                <input
                                                    type="text"
                                                    value={editingKit.social?.instagram || ''}
                                                    onChange={(e) => setEditingKit({ ...editingKit, social: { ...editingKit.social, instagram: e.target.value } })}
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    placeholder="@username"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 font-medium text-gray-700"><Twitter className="w-4 h-4" /> Twitter / X</label>
                                                <input
                                                    type="text"
                                                    value={editingKit.social?.twitter || ''}
                                                    onChange={(e) => setEditingKit({ ...editingKit, social: { ...editingKit.social, twitter: e.target.value } })}
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    placeholder="@username"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 font-medium text-gray-700"><Linkedin className="w-4 h-4" /> LinkedIn</label>
                                                <input
                                                    type="text"
                                                    value={editingKit.social?.linkedin || ''}
                                                    onChange={(e) => setEditingKit({ ...editingKit, social: { ...editingKit.social, linkedin: e.target.value } })}
                                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    placeholder="in/username"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Danger Zone */}
                            {editingKit.id && (
                                <div className="border border-red-200 rounded-xl p-6 bg-red-50 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-red-900">Delete Brand Kit</h4>
                                        <p className="text-red-700 text-sm">Permanently remove this kit. This action cannot be undone.</p>
                                    </div>
                                    <button
                                        onClick={handleDelete}
                                        className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium shadow-sm transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
