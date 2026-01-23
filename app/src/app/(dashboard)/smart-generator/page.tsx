"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Upload, Sparkles, ArrowRight, Wand2, Loader2, Eraser, Star, ArrowLeft, Download, Maximize2, PenTool } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { SmartTemplateService, Asset, SmartTemplateResult } from "@/lib/services/smart-template-service";
import { useRouter } from "next/navigation";
import { AIService } from "@/lib/services/ai-service";
import { useTemplateStore } from "@/lib/stores/template-store";
import { CanvasState, CanvasStateBuilder } from "@/lib/services/canvas-state-builder";
import { useSmartGeneratorStore } from "@/lib/stores";
import { CanvasPreview } from "@/components/smart-generator/canvas-preview";
import { toPng } from "html-to-image";

export default function SmartGeneratorPage() {
    const router = useRouter();
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [exportingId, setExportingId] = useState<string | null>(null);

    // Global Store State
    const {
        step, setStep,
        assets, setAssets,
        headline, setHeadline,
        subtext, setSubtext,
        results, setResults,
        isGenerating, setIsGenerating,
        generatedCanvasStates, setGeneratedCanvasStates,
        reset
    } = useSmartGeneratorStore();

    // Custom templates from Firebase
    const { dynamicTemplates, loadDynamicTemplates, isLoading: templatesLoading } = useTemplateStore();

    // Load custom templates on mount
    useEffect(() => {
        if (dynamicTemplates.length === 0) {
            loadDynamicTemplates();
        }
    }, [dynamicTemplates.length, loadDynamicTemplates]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                setAssets((prev) => [
                    ...prev,
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        type: "image",
                        content: reader.result as string,
                        meta: { file },
                    },
                ]);
            };
            reader.readAsDataURL(file);
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
    });

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratedCanvasStates(new Map());

        const fullAssets = [...assets];
        if (headline) {
            fullAssets.push({ id: "headline", type: "text", content: headline });
        }
        if (subtext) {
            fullAssets.push({ id: "subtext", type: "text", content: subtext });
        }

        const matches = SmartTemplateService.findBestMatches(fullAssets, dynamicTemplates);
        const filtered = matches.filter(m => m.score > -50).slice(0, 6);

        setResults(filtered);
        setStep("results");

        // Generate Canvas States for Live DOM Rendering
        const previewAssets = {
            images: assets.filter(a => a.type === "image").map(a => a.content),
            headline,
            subtext,
        };

        const newCanvasStates = new Map<string, CanvasState>();

        // We can do this synchronously as it's just data transformation now
        for (const result of filtered) {
            try {
                const canvasState = CanvasStateBuilder.build(result.template, previewAssets);
                // Ensure coordinate system is set (though CanvasPreview is mostly % based, 
                // it handles the data structure correctly)
                newCanvasStates.set(result.template.id, canvasState);
            } catch (e) {
                console.error("Failed to build state for", result.template.id, e);
            }
        }

        setGeneratedCanvasStates(new Map(newCanvasStates));
        setIsGenerating(false);
    };

    const handleMagicRewrite = async () => {
        if (!headline) return;
        setIsAIProcessing(true);
        const suggestions = await AIService.generateHeadlines(headline);
        if (suggestions.length > 0) {
            setHeadline(suggestions[0]);
        }
        setIsAIProcessing(false);
    };

    const handleRemoveBg = async (assetId: string) => {
        const asset = assets.find(a => a.id === assetId);
        if (!asset || asset.type !== 'image') return;

        setIsAIProcessing(true);
        try {
            const blob = await AIService.removeBackground(asset.content);
            const newUrl = URL.createObjectURL(blob);
            setAssets(prev => prev.map(a =>
                a.id === assetId ? { ...a, content: newUrl } : a
            ));
        } catch (e) {
            console.error("BG Removal failed", e);
        }
        setIsAIProcessing(false);
    };

    const handleTemplateSelect = (result: SmartTemplateResult) => {
        if (typeof window !== "undefined") {
            // Get the pre-built canvas state (SINGLE SOURCE OF TRUTH)
            const canvasState = generatedCanvasStates.get(result.template.id);

            const payload = {
                templateId: result.template.id,
                isCustom: result.isCustom,
                // Pass the EXACT canvas state used for preview
                canvasState: canvasState || null,
            };
            localStorage.setItem("smart_gen_handoff", JSON.stringify(payload));
            localStorage.setItem("smart_gen_return", "/smart-generator");
        }

        router.push(`/editor/new?mode=smart&templateId=${result.template.id}`);
    };

    const handleReset = () => {
        reset();
    };

    const handleExport = async (templateId: string) => {
        const element = document.getElementById(`preview-container-${templateId}`);
        if (!element) return;

        setExportingId(templateId);
        try {
            // Use html-to-image to snapshot the DOM node
            const dataUrl = await toPng(element, { quality: 0.95, pixelRatio: 2 });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `smart-design-${templateId}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Export failed", e);
        }
        setExportingId(null);
    };

    return (
        <div className="min-h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                            <Sparkles className="w-6 h-6 text-indigo-600" />
                            Smart Generator
                        </h1>
                        <p className="text-sm text-gray-500">Drop your assets, get instant designs</p>
                    </div>
                </div>
                {step === "results" && (
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                    >
                        Start Over
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex gap-6 h-[calc(100vh-200px)]">
                {/* Left Panel: Inputs */}
                <div className="w-80 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm">
                    {templatesLoading && (
                        <p className="text-xs text-indigo-500 mb-4 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading templates...
                        </p>
                    )}

                    <div className="space-y-6 flex-1 overflow-y-auto">
                        {/* Image Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Images ({assets.filter(a => a.type === "image").length})
                            </label>
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${isDragActive
                                    ? "border-indigo-500 bg-indigo-50"
                                    : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">Drop images here</p>
                                    <p className="text-xs text-gray-400">or click to browse</p>
                                </div>
                            </div>

                            {assets.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                    {assets.filter(a => a.type === "image").map((asset) => (
                                        <div key={asset.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                            <img src={asset.content} className="w-full h-full object-cover" />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAssets(assets.filter(a => a.id !== asset.id));
                                                }}
                                                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveBg(asset.id);
                                                }}
                                                disabled={isAIProcessing}
                                                className="absolute bottom-1 right-1 bg-indigo-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {isAIProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eraser className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Text Inputs */}
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Headline</label>
                                    <button
                                        onClick={handleMagicRewrite}
                                        disabled={!headline || isAIProcessing}
                                        className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 transition"
                                    >
                                        {isAIProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        Magic Rewrite
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    placeholder="e.g. Summer Sale"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subtext</label>
                                <textarea
                                    value={subtext}
                                    onChange={(e) => setSubtext(e.target.value)}
                                    placeholder="Add some details..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-20 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 mt-4">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || (assets.length === 0 && !headline)}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Wand2 className="w-5 h-5 animate-spin" />
                                    Designing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Designs
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Results */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 overflow-y-auto shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        {step === 'input' ? 'Generated Designs' : `Results (${results.length})`}
                    </h2>

                    {step === 'input' ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-20">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Wand2 className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="text-lg font-medium">Ready to work magic</p>
                            <p className="text-sm">Add content on the left to start</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-20">
                            <p className="text-lg font-medium">No matching templates</p>
                            <p className="text-sm">Try adding more images or text</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.map((result) => {
                                const canvasState = generatedCanvasStates.get(result.template.id);
                                const isReady = !!canvasState;
                                const isExportingCurrent = exportingId === result.template.id;

                                return (
                                    <div
                                        key={result.template.id}
                                        className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${result.score > 40 ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-gray-50'
                                            }`}
                                    >
                                        {/* Minimal Badges */}
                                        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end pointer-events-none">
                                            {result.isCustom && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-sm bg-purple-500 text-white flex items-center gap-1 backdrop-blur-md bg-opacity-90">
                                                    <Star className="w-3 h-3 fill-current" /> Custom
                                                </span>
                                            )}
                                            {result.score > 40 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-sm bg-emerald-500 text-white backdrop-blur-md bg-opacity-90">
                                                    Best Match
                                                </span>
                                            )}
                                        </div>

                                        {/* Missing Assets Alert */}
                                        {result.missingAssets.length > 0 && (
                                            <div className="absolute top-4 left-4 z-20 pointer-events-none">
                                                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm bg-red-50 text-red-600 border border-red-100 flex items-center gap-1">
                                                    Missing: {result.missingAssets.join(", ")}
                                                </span>
                                            </div>
                                        )}

                                        {/* Preview Area (Live Canvas Preview) */}
                                        <div
                                            className="aspect-[4/5] bg-gray-100 relative overflow-hidden"
                                            // Assign ID specifically for export
                                            id={`preview-container-${result.template.id}`}
                                        >
                                            {canvasState ? (
                                                <CanvasPreview state={canvasState} width={1080} height={result.template.id.includes('story') ? 1920 : 1350} />
                                            ) : (
                                                /* Fallback thumbnail if state gen fails or pending */
                                                <img
                                                    src={result.template.thumbnail}
                                                    alt={result.template.name}
                                                    className="w-full h-full object-cover opacity-50"
                                                />
                                            )}


                                            {/* Hover Overlay (Desktop) & Persistent Actions (Mobile friendly via group-hover logic) */}
                                            {/* NOTE: We must ensure this overlay is NOT captured by html-to-image export. 
                                                html-to-image captures the node. If overlay is child, it captures overlay. 
                                                BUT, the overlay is hidden by default. 
                                                If we trigger export programmatically, hover state might not be active? 
                                                Or we can add data-html2canvas-ignore on the overlay div! 
                                            */}
                                            <div
                                                data-html2canvas-ignore="true"
                                                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-6 px-4 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex flex-col gap-3 z-10 backdrop-blur-[2px]"
                                            >
                                                {/* Primary Action */}
                                                <button
                                                    onClick={() => handleTemplateSelect(result)}
                                                    className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold shadow-lg hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
                                                >
                                                    <PenTool className="w-4 h-4 text-indigo-600" />
                                                    Edit Design
                                                </button>

                                                {/* Secondary Actions */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => handleExport(result.template.id)}
                                                        disabled={isExportingCurrent}
                                                        className="py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium backdrop-blur-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isExportingCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                                        Export
                                                    </button>
                                                    <button
                                                        onClick={() => { }}
                                                        className="py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium backdrop-blur-md transition flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <Maximize2 className="w-4 h-4" />
                                                        Zoom
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Info */}
                                        <div className="p-4 bg-white border-t border-gray-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 leading-tight">{result.template.name}</h3>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                        {Array.isArray(result.template.category)
                                                            ? result.template.category.join(", ")
                                                            : result.template.category || "General"}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1 mt-3">
                                                {result.matchReason.slice(0, 3).map((reason, i) => (
                                                    <span key={i} className="text-[9px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                                                        {reason}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
