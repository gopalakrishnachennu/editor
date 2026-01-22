"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEditorStore, useAdminStore, useTemplateStore, useAuthStore } from "@/lib/stores";
import { FeatureGate } from "@/components/guards";
import { TemplateFillModal } from "@/components/modals/template-fill-modal";
import { BulkGenerateModal } from "@/components/modals/bulk-generate-modal";
import { TemplateConfig } from "@/lib/templates";
import { BulkRenderService } from "@/lib/services/bulk-render-service";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import {
    Search,
    Filter,
    Palette,
    Sparkles,
    Crown,
    Lock,
    Grid,
    List,
    Loader2,
    Wand2,
    Zap,
    Pencil,
    ArrowUpDown,
    Clock,
    TrendingUp,
    Files,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSystemVariables } from "@/lib/variables";

const categories = [
    { id: "all", name: "All Templates" },
    { id: "quote", name: "Quote Posts" },
    { id: "news", name: "News & Headlines" },
    { id: "story", name: "Story Format" },
    { id: "announcement", name: "Announcements" },
    { id: "interview", name: "Interviews" },
    { id: "promo", name: "Promotions" },
    { id: "business", name: "Business" },
];

export default function TemplatesPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "popular" | "name">("newest");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
    const [bulkTemplate, setBulkTemplate] = useState<TemplateConfig | null>(null); // State for bulk modal
    const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null); // Delete modal state

    const router = useRouter();
    const { user } = useAuthStore();
    const { settings } = useAdminStore();
    const {
        templates: staticTemplates,
        loadTemplates,
        isLoading: staticLoading,
        createPostFromTemplate,
        createPostFromDynamicTemplate,
        currentBrandKit,
        loadBrandKits
    } = useEditorStore();
    const { dynamicTemplates, loadDynamicTemplates, isLoading: dynamicLoading, deleteTemplate } = useTemplateStore();

    // Load both static and dynamic templates, and brand kit
    useEffect(() => {
        loadTemplates(selectedCategory);
        loadDynamicTemplates();
        if (user) {
            loadBrandKits(user.id);
        }
    }, [selectedCategory, loadTemplates, loadDynamicTemplates, user, loadBrandKits]);

    // Merge static and dynamic templates, converting dynamic to TemplateConfig format
    const allTemplates = useMemo(() => {
        // Convert dynamic templates to TemplateConfig-like format for display
        const convertedDynamic = dynamicTemplates.map(dt => ({
            id: dt.id,
            name: dt.name,
            description: dt.description,
            category: dt.category as TemplateConfig['category'],
            thumbnail: dt.thumbnail,
            isPro: dt.isPro,
            layout: dt.layout,
            style: dt.style,
            dataFields: dt.dataFields.map(df => ({
                id: df.id,
                label: df.label,
                type: df.type,
                placeholder: df.placeholder,
                required: df.required,
            })),
            canvasElements: [], // Dynamic templates use canvasState directly
            _isDynamic: true, // Flag to identify dynamic templates
            _canvasState: dt.canvasState, // Store the canvas state for loading
        })) as (TemplateConfig & { _isDynamic?: boolean; _canvasState?: string })[];

        return [...convertedDynamic, ...staticTemplates];
    }, [staticTemplates, dynamicTemplates]);

    const isLoading = staticLoading || dynamicLoading;

    // 1. Dynamic Categories
    const availableCategories = useMemo(() => {
        const dynamicCats = new Set(allTemplates.map(t => t.category).filter(Boolean));
        const merged = [...categories];
        dynamicCats.forEach(cat => {
            const normalized = cat!.toLowerCase();
            if (!merged.find(c => c.id === normalized)) {
                merged.push({ id: normalized, name: cat!.charAt(0).toUpperCase() + cat!.slice(1) });
            }
        });
        return merged;
    }, [allTemplates]);

    // 2. Filter & Sort
    const processedTemplates = useMemo(() => {
        let result = allTemplates.filter((template) => {
            const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                template.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "all" || template.category?.toLowerCase() === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'newest') {
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return dateB - dateA;
            }
            if (sortBy === 'popular') {
                return (((b as any).usageCount || 0) - ((a as any).usageCount || 0));
            }
            return a.name.localeCompare(b.name);
        });

        return result;
    }, [allTemplates, searchQuery, selectedCategory, sortBy]);

    const handleTemplateClick = async (template: TemplateConfig) => {
        // If template has user-fillable data fields, show modal; otherwise generate immediately
        const hasUserFields = template.dataFields && template.dataFields.length > 0;

        if (hasUserFields) {
            setSelectedTemplate(template);
        } else {
            // Instant generate
            await handleGenerate(template, {});
        }
    };

    const handleGenerate = async (template: TemplateConfig & { _isDynamic?: boolean; _canvasState?: string }, variables: Record<string, string>) => {
        try {
            let newPostId: string;

            // Check if this is a dynamic template (from Firebase)
            if ((template as any)._isDynamic && (template as any)._canvasState) {
                newPostId = await createPostFromDynamicTemplate(
                    template.name,
                    (template as any)._canvasState,
                    variables
                );
            } else {
                // Static template - use the original function
                newPostId = await createPostFromTemplate(template, variables);
            }

            router.push(`/editor/${newPostId}`);
        } catch (error) {
            console.error("Creation failed", error);
            alert("Failed to create post");
        }
    };

    const canQuickGenerate = (template: TemplateConfig) => {
        if (!template.dataFields || template.dataFields.length === 0) return true;
        // Check if all REQUIRED fields have a defaultValue
        return template.dataFields.every(f => !f.required || (f.defaultValue && f.defaultValue.trim() !== ''));
    };

    const handleQuickGenerate = async (e: React.MouseEvent, template: TemplateConfig) => {
        e.stopPropagation();

        // Resolve default values
        const systemVars = getSystemVariables(user, currentBrandKit);
        const variables: Record<string, string> = {};

        template.dataFields?.forEach(field => {
            let value = field.defaultValue || "";
            if (value) {
                value = value.replace(/\{\{([^}]+)\}\}/g, (_, k) => systemVars[k] || "");
                variables[field.id] = value;
            }
        });

        // Add visual feedback? (Maybe just let handleGenerate redirect)
        await handleGenerate(template as any, variables);
    };

    const handleDirectEdit = async (e: React.MouseEvent, template: TemplateConfig) => {
        e.stopPropagation();
        // Generate with empty variables to skip binding and load raw template
        await handleGenerate(template as any, {});
    };

    const handleBulkGenerate = (e: React.MouseEvent, template: TemplateConfig) => {
        e.stopPropagation();
        setBulkTemplate(template);
    };

    const runBulkGeneration = async (data: any, mapping: any) => {
        if (!bulkTemplate) return;
        await BulkRenderService.generateBatch(bulkTemplate, data, mapping);
        setBulkTemplate(null);
    };

    const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteTemplateId(id);
    };

    const confirmDeleteTemplate = async () => {
        if (deleteTemplateId) {
            await deleteTemplate(deleteTemplateId);
            setDeleteTemplateId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Palette className="w-7 h-7 text-indigo-600" />
                        Template Gallery
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Choose from our collection of professionally designed templates
                    </p>
                </div>

                <FeatureGate feature="customTemplates" showUpgrade={false}>
                    <Link
                        href="/editor/new"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition font-medium"
                    >
                        <Sparkles className="w-4 h-4" />
                        Create Template
                    </Link>
                </FeatureGate>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                </div>

                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
                                "focus:outline-none", // Remove default focus outline
                                selectedCategory === category.id
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                            )}
                        >
                            {category.name}
                        </button>
                    ))}
                    {availableCategories.length > categories.length && availableCategories.slice(categories.length).map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
                                "focus:outline-none",
                                selectedCategory === category.id
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                            )}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* View toggle */}
                <div className="flex gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="popular">Most Popular</option>
                        <option value="name">A-Z</option>
                    </select>

                    <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-2 rounded-lg transition",
                                viewMode === "grid" ? "bg-indigo-100 text-indigo-600" : "text-gray-400"
                            )}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "p-2 rounded-lg transition",
                                viewMode === "list" ? "bg-indigo-100 text-indigo-600" : "text-gray-400"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Templates grid */}
            <div
                className={cn(
                    "gap-6",
                    viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "flex flex-col"
                )}
            >
                {isLoading && (
                    <>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                                <div className="aspect-[4/5] bg-gray-200" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    <div className="flex gap-2">
                                        <div className="h-5 w-16 bg-gray-200 rounded" />
                                        <div className="h-5 w-16 bg-gray-200 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
                {!isLoading && processedTemplates.map((template, index) => (
                    <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <div
                            onClick={() => handleTemplateClick(template)}
                            className={cn(
                                "group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition block cursor-pointer",
                                viewMode === "list" && "flex"
                            )}
                        >
                            {/* Thumbnail */}
                            <div
                                className={cn(
                                    "relative bg-gradient-to-br from-gray-100 to-gray-50",
                                    viewMode === "grid" ? "aspect-[4/5]" : "w-48 h-32 flex-shrink-0"
                                )}
                            >
                                {template.thumbnail ? (
                                    <img
                                        src={template.thumbnail}
                                        alt={template.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <Palette className="w-12 h-12 text-gray-300 mx-auto mb-2 group-hover:text-indigo-400 transition" />
                                            <span className="text-xs text-gray-400">Preview</span>
                                        </div>
                                    </div>
                                )}

                                {/* Template Badge */}
                                {template.isPro && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-full text-xs font-medium shadow-sm z-10">
                                        <Crown className="w-3 h-3" />
                                        Premium
                                    </div>
                                )}

                                {/* Custom Template Badge */}
                                {(template as any)._isDynamic && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded-full text-xs font-medium shadow-sm z-10 transition-opacity group-hover:opacity-0">
                                        <Wand2 className="w-3 h-3" />
                                        Custom
                                    </div>
                                )}

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-4 gap-3 z-20">
                                    {/* Delete Button (Custom Only) */}
                                    {(template as any)._isDynamic && (
                                        <button
                                            onClick={(e) => handleDeleteTemplate(e, template.id)}
                                            className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg transition backdrop-blur-sm"
                                            title="Delete Template"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Edit Button (Custom Template - Direct Edit) */}
                                    {(template as any)._isDynamic && (
                                        <button
                                            onClick={(e) => handleDirectEdit(e, template)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition shadow-lg"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Edit Design
                                        </button>
                                    )}

                                    {canQuickGenerate(template) ? (
                                        <>
                                            <button
                                                onClick={(e) => handleQuickGenerate(e, template)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition shadow-lg"
                                            >
                                                <Zap className="w-4 h-4 fill-indigo-600" />
                                                Quick Fill
                                            </button>
                                            {!((template as any)._isDynamic) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleTemplateClick(template); }}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium text-sm hover:bg-indigo-400 transition"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                    Customize
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <span className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium text-sm">
                                            Use Template
                                        </span>
                                    )}

                                    {/* Bulk Generate Button (Only if fields exist) */}
                                    {(template.dataFields && template.dataFields.length > 0) && (
                                        <button
                                            onClick={(e) => handleBulkGenerate(e, template)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition"
                                            title="Generate multiple posts from CSV"
                                        >
                                            <Files className="w-3 h-3" />
                                            Bulk Generate
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className={cn("p-4", viewMode === "list" && "flex-1")}>
                                <h3 className="font-semibold group-hover:text-indigo-600 transition">
                                    {template.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                <div className="flex flex-wrap gap-1 mt-3">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                                        {template.category || 'General'}
                                    </span>
                                    {(template as any)._isDynamic && (
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs capitalize">
                                            Custom
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty state */}
            {
                !isLoading && processedTemplates.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                        <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                        <p className="text-gray-500">
                            Try adjusting your search or filter criteria
                        </p>
                    </div>
                )
            }

            <TemplateFillModal
                isOpen={!!selectedTemplate}
                onClose={() => setSelectedTemplate(null)}
                template={selectedTemplate}
                onGenerate={(vars) => selectedTemplate ? handleGenerate(selectedTemplate, vars) : Promise.resolve()}
            />

            {bulkTemplate && (
                <BulkGenerateModal
                    isOpen={!!bulkTemplate}
                    onClose={() => setBulkTemplate(null)}
                    template={bulkTemplate}
                    onGenerate={runBulkGeneration}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteTemplateId}
                onClose={() => setDeleteTemplateId(null)}
                onConfirm={confirmDeleteTemplate}
                title="Delete Template?"
                message="Are you sure you want to delete this template? This action cannot be undone."
                confirmText="Delete Template"
                isDestructive={true}
            />
        </div >
    );
}
