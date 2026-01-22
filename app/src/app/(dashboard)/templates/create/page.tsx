"use client";

/**
 * Advanced Template Builder
 * Create custom templates with layers, effects, and animations
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toPng } from "html-to-image";
import { useAuthStore, useAdminStore } from "@/lib/stores";
import { AuthGuard, FeatureGate } from "@/components/guards";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Save,
    Download,
    ZoomIn,
    ZoomOut,
    Type,
    ImageIcon,
    Square,
    Circle,
    Triangle,
    Minus,
    Plus,
    Layers,
    Palette,
    Move,
    Trash2,
    Copy,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    Underline,
    Upload,
    Sparkles,
    Loader2,
    X,
    ChevronUp,
    ChevronDown,
    GripVertical,
    Monitor,
    Smartphone,
} from "lucide-react";

// Layer types
type LayerType = 'text' | 'image' | 'shape' | 'gradient';

interface Layer {
    id: string;
    type: LayerType;
    name: string;
    visible: boolean;
    locked: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    // Type-specific properties
    text?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    imageUrl?: string;
    gradient?: {
        type: 'linear' | 'radial';
        angle: number;
        stops: { color: string; position: number }[];
    };
}

// Frame presets
const frameSizes = [
    { id: 'instagram-post', name: 'Instagram Post', width: 1080, height: 1080 },
    { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920 },
    { id: 'instagram-portrait', name: 'Instagram Portrait', width: 1080, height: 1350 },
    { id: 'facebook-post', name: 'Facebook Post', width: 1200, height: 630 },
    { id: 'twitter-post', name: 'Twitter/X Post', width: 1200, height: 675 },
    { id: 'linkedin-post', name: 'LinkedIn Post', width: 1200, height: 627 },
];

export default function TemplateBuilderPage() {
    const { user } = useAuthStore();
    const { settings } = useAdminStore();

    // Template state
    const [templateName, setTemplateName] = useState("Untitled Template");
    const [selectedFrame, setSelectedFrame] = useState(frameSizes[2]);
    const [zoom, setZoom] = useState(0.5);
    const [backgroundColor, setBackgroundColor] = useState("#1a1a2e");

    // Layers
    const [layers, setLayers] = useState<Layer[]>([
        {
            id: 'bg-gradient',
            type: 'gradient',
            name: 'Background Gradient',
            visible: true,
            locked: true,
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            opacity: 1,
            gradient: {
                type: 'linear',
                angle: 180,
                stops: [
                    { color: 'rgba(0,0,0,0)', position: 0 },
                    { color: 'rgba(0,0,0,0.8)', position: 100 },
                ],
            },
        },
        {
            id: 'brand-badge',
            type: 'text',
            name: 'Brand Badge',
            visible: true,
            locked: false,
            x: 5,
            y: 80,
            width: 20,
            height: 5,
            rotation: 0,
            opacity: 1,
            text: 'YOUR BRAND',
            fontSize: 12,
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: '#6366f1',
            borderRadius: 4,
            textAlign: 'center',
        },
        {
            id: 'headline',
            type: 'text',
            name: 'Headline',
            visible: true,
            locked: false,
            x: 5,
            y: 86,
            width: 90,
            height: 10,
            rotation: 0,
            opacity: 1,
            text: 'Your Headline Goes Here',
            fontSize: 28,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'left',
        },
        {
            id: 'subtitle',
            type: 'text',
            name: 'Subtitle',
            visible: true,
            locked: false,
            x: 5,
            y: 94,
            width: 90,
            height: 5,
            rotation: 0,
            opacity: 0.7,
            text: 'Subtitle or description text',
            fontSize: 14,
            color: '#ffffff',
            textAlign: 'left',
        },
    ]);

    const [selectedLayerId, setSelectedLayerId] = useState<string | null>('headline');
    const [activePanel, setActivePanel] = useState<'layers' | 'properties' | 'effects'>('layers');
    const [showExportModal, setShowExportModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calculate display size
    const maxDisplayHeight = 450;
    const scale = Math.min(1, maxDisplayHeight / selectedFrame.height) * zoom;
    const displayWidth = selectedFrame.width * scale;
    const displayHeight = selectedFrame.height * scale;

    // Get selected layer
    const selectedLayer = layers.find(l => l.id === selectedLayerId);

    // Layer operations
    const addLayer = (type: LayerType) => {
        const id = `layer-${Date.now()}`;
        const newLayer: Layer = {
            id,
            type,
            name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            visible: true,
            locked: false,
            x: 10,
            y: 10,
            width: type === 'text' ? 80 : 30,
            height: type === 'text' ? 10 : 30,
            rotation: 0,
            opacity: 1,
            ...(type === 'text' && {
                text: 'New Text',
                fontSize: 20,
                fontWeight: 'normal',
                color: '#ffffff',
                textAlign: 'left',
            }),
            ...(type === 'shape' && {
                backgroundColor: '#6366f1',
                borderRadius: 0,
            }),
        };
        setLayers([...layers, newLayer]);
        setSelectedLayerId(id);
    };

    const updateLayer = (id: string, updates: Partial<Layer>) => {
        setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const deleteLayer = (id: string) => {
        setLayers(layers.filter(l => l.id !== id));
        if (selectedLayerId === id) setSelectedLayerId(null);
    };

    const duplicateLayer = (id: string) => {
        const layer = layers.find(l => l.id === id);
        if (layer) {
            const newId = `layer-${Date.now()}`;
            setLayers([...layers, { ...layer, id: newId, name: `${layer.name} Copy`, x: layer.x + 5, y: layer.y + 5 }]);
            setSelectedLayerId(newId);
        }
    };

    const moveLayer = (id: string, direction: 'up' | 'down') => {
        const index = layers.findIndex(l => l.id === id);
        if (direction === 'up' && index < layers.length - 1) {
            const newLayers = [...layers];
            [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
            setLayers(newLayers);
        } else if (direction === 'down' && index > 0) {
            const newLayers = [...layers];
            [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
            setLayers(newLayers);
        }
    };

    // Export
    const handleExport = async () => {
        if (!canvasRef.current) return;
        setIsSaving(true);
        try {
            const scale = selectedFrame.width / displayWidth;
            const dataUrl = await toPng(canvasRef.current, {
                pixelRatio: scale,
            });
            const link = document.createElement('a');
            link.download = `${templateName}.png`;
            link.href = dataUrl;
            link.click();
            setShowExportModal(false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                addLayer('image');
                const newLayerId = `layer-${Date.now()}`;
                setTimeout(() => {
                    updateLayer(layers[layers.length - 1].id, { imageUrl: event.target?.result as string });
                }, 100);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <AuthGuard>
            <FeatureGate feature="customTemplates">
                <div className="h-screen flex flex-col bg-gray-100">
                    {/* Header */}
                    <header className="h-14 bg-white border-b flex items-center justify-between px-4 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <Link href="/templates" className="p-2 hover:bg-gray-100 rounded-lg">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="text-lg font-semibold bg-transparent border-none outline-none w-64"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Frame selector */}
                            <select
                                value={selectedFrame.id}
                                onChange={(e) => setSelectedFrame(frameSizes.find(f => f.id === e.target.value) || frameSizes[0])}
                                className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium border-none"
                            >
                                {frameSizes.map(f => (
                                    <option key={f.id} value={f.id}>{f.name} ({f.width}×{f.height})</option>
                                ))}
                            </select>

                            {/* Zoom */}
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                                <button onClick={() => setZoom(Math.max(0.25, zoom - 0.1))} className="p-1 hover:bg-gray-200 rounded">
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-medium w-14 text-center">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1 hover:bg-gray-200 rounded">
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => setShowExportModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </header>

                    {/* Main */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left - Add Elements */}
                        <div className="w-20 bg-white border-r flex flex-col items-center py-4 gap-2">
                            <button onClick={() => addLayer('text')} className="p-3 hover:bg-gray-100 rounded-xl transition flex flex-col items-center gap-1">
                                <Type className="w-5 h-5" />
                                <span className="text-xs">Text</span>
                            </button>
                            <button onClick={() => addLayer('shape')} className="p-3 hover:bg-gray-100 rounded-xl transition flex flex-col items-center gap-1">
                                <Square className="w-5 h-5" />
                                <span className="text-xs">Shape</span>
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-gray-100 rounded-xl transition flex flex-col items-center gap-1">
                                <ImageIcon className="w-5 h-5" />
                                <span className="text-xs">Image</span>
                            </button>
                            <button onClick={() => addLayer('gradient')} className="p-3 hover:bg-gray-100 rounded-xl transition flex flex-col items-center gap-1">
                                <Palette className="w-5 h-5" />
                                <span className="text-xs">Gradient</span>
                            </button>
                        </div>

                        {/* Canvas Area */}
                        <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-gray-200">
                            <div
                                ref={canvasRef}
                                className="shadow-2xl rounded-lg overflow-hidden relative"
                                style={{
                                    width: displayWidth,
                                    height: displayHeight,
                                    backgroundColor,
                                }}
                            >
                                {/* Render layers */}
                                {layers.filter(l => l.visible).map((layer) => (
                                    <div
                                        key={layer.id}
                                        onClick={() => !layer.locked && setSelectedLayerId(layer.id)}
                                        className={cn(
                                            "absolute cursor-pointer transition-all",
                                            selectedLayerId === layer.id && !layer.locked && "ring-2 ring-blue-500 ring-offset-1"
                                        )}
                                        style={{
                                            left: `${layer.x}%`,
                                            top: `${layer.y}%`,
                                            width: `${layer.width}%`,
                                            height: layer.type === 'text' ? 'auto' : `${layer.height}%`,
                                            opacity: layer.opacity,
                                            transform: `rotate(${layer.rotation}deg)`,
                                        }}
                                    >
                                        {layer.type === 'text' && (
                                            <div
                                                style={{
                                                    fontSize: layer.fontSize ? layer.fontSize * scale : 16,
                                                    fontWeight: layer.fontWeight,
                                                    fontStyle: layer.fontStyle,
                                                    color: layer.color,
                                                    backgroundColor: layer.backgroundColor,
                                                    borderRadius: layer.borderRadius,
                                                    textAlign: layer.textAlign,
                                                    padding: layer.backgroundColor ? '4px 12px' : 0,
                                                    display: 'inline-block',
                                                }}
                                            >
                                                {layer.text}
                                            </div>
                                        )}
                                        {layer.type === 'shape' && (
                                            <div
                                                className="w-full h-full"
                                                style={{
                                                    backgroundColor: layer.backgroundColor,
                                                    borderRadius: layer.borderRadius,
                                                }}
                                            />
                                        )}
                                        {layer.type === 'image' && layer.imageUrl && (
                                            <img src={layer.imageUrl} className="w-full h-full object-cover" />
                                        )}
                                        {layer.type === 'gradient' && layer.gradient && (
                                            <div
                                                className="w-full h-full"
                                                style={{
                                                    background: layer.gradient.type === 'linear'
                                                        ? `linear-gradient(${layer.gradient.angle}deg, ${layer.gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                                                        : `radial-gradient(circle, ${layer.gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`,
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel - Layers & Properties */}
                        <div className="w-80 bg-white border-l flex flex-col overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b">
                                {(['layers', 'properties', 'effects'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActivePanel(tab)}
                                        className={cn(
                                            "flex-1 py-3 text-sm font-medium capitalize border-b-2 transition",
                                            activePanel === tab ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {/* Layers Panel */}
                                {activePanel === 'layers' && (
                                    <div className="space-y-2">
                                        {[...layers].reverse().map((layer) => (
                                            <div
                                                key={layer.id}
                                                onClick={() => setSelectedLayerId(layer.id)}
                                                className={cn(
                                                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition",
                                                    selectedLayerId === layer.id ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50"
                                                )}
                                            >
                                                <GripVertical className="w-4 h-4 text-gray-400" />
                                                <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}>
                                                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                                                </button>
                                                <span className="flex-1 text-sm truncate">{layer.name}</span>
                                                <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}>
                                                    {layer.locked ? <Lock className="w-4 h-4 text-gray-400" /> : <Unlock className="w-4 h-4" />}
                                                </button>
                                                <div className="flex gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }} className="p-1 hover:bg-gray-200 rounded">
                                                        <ChevronUp className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }} className="p-1 hover:bg-gray-200 rounded">
                                                        <ChevronDown className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Properties Panel */}
                                {activePanel === 'properties' && selectedLayer && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Name</label>
                                            <input
                                                type="text"
                                                value={selectedLayer.name}
                                                onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                            />
                                        </div>

                                        {selectedLayer.type === 'text' && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-medium mb-1 block">Text</label>
                                                    <textarea
                                                        value={selectedLayer.text}
                                                        onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 block">Font Size</label>
                                                        <input
                                                            type="number"
                                                            value={selectedLayer.fontSize}
                                                            onChange={(e) => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })}
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 block">Color</label>
                                                        <input
                                                            type="color"
                                                            value={selectedLayer.color}
                                                            onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                                                            className="w-full h-10 rounded-lg cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => updateLayer(selectedLayer.id, { fontWeight: selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                                        className={cn("p-2 rounded-lg border", selectedLayer.fontWeight === 'bold' && "bg-indigo-100 border-indigo-300")}
                                                    >
                                                        <Bold className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateLayer(selectedLayer.id, { fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                                        className={cn("p-2 rounded-lg border", selectedLayer.fontStyle === 'italic' && "bg-indigo-100 border-indigo-300")}
                                                    >
                                                        <Italic className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateLayer(selectedLayer.id, { textAlign: 'left' })}
                                                        className={cn("p-2 rounded-lg border", selectedLayer.textAlign === 'left' && "bg-indigo-100 border-indigo-300")}
                                                    >
                                                        <AlignLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateLayer(selectedLayer.id, { textAlign: 'center' })}
                                                        className={cn("p-2 rounded-lg border", selectedLayer.textAlign === 'center' && "bg-indigo-100 border-indigo-300")}
                                                    >
                                                        <AlignCenter className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateLayer(selectedLayer.id, { textAlign: 'right' })}
                                                        className={cn("p-2 rounded-lg border", selectedLayer.textAlign === 'right' && "bg-indigo-100 border-indigo-300")}
                                                    >
                                                        <AlignRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-1 block">Background</label>
                                                    <input
                                                        type="color"
                                                        value={selectedLayer.backgroundColor || '#ffffff'}
                                                        onChange={(e) => updateLayer(selectedLayer.id, { backgroundColor: e.target.value })}
                                                        className="w-full h-10 rounded-lg cursor-pointer"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {selectedLayer.type === 'shape' && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-medium mb-1 block">Fill Color</label>
                                                    <input
                                                        type="color"
                                                        value={selectedLayer.backgroundColor}
                                                        onChange={(e) => updateLayer(selectedLayer.id, { backgroundColor: e.target.value })}
                                                        className="w-full h-10 rounded-lg cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-1 block">Border Radius</label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="50"
                                                        value={selectedLayer.borderRadius}
                                                        onChange={(e) => updateLayer(selectedLayer.id, { borderRadius: parseInt(e.target.value) })}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Position & Size */}
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Position & Size (%)</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-xs text-gray-500">X</span>
                                                    <input type="number" value={selectedLayer.x} onChange={(e) => updateLayer(selectedLayer.id, { x: parseFloat(e.target.value) })} className="w-full px-2 py-1 border rounded text-sm" />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500">Y</span>
                                                    <input type="number" value={selectedLayer.y} onChange={(e) => updateLayer(selectedLayer.id, { y: parseFloat(e.target.value) })} className="w-full px-2 py-1 border rounded text-sm" />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500">Width</span>
                                                    <input type="number" value={selectedLayer.width} onChange={(e) => updateLayer(selectedLayer.id, { width: parseFloat(e.target.value) })} className="w-full px-2 py-1 border rounded text-sm" />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500">Height</span>
                                                    <input type="number" value={selectedLayer.height} onChange={(e) => updateLayer(selectedLayer.id, { height: parseFloat(e.target.value) })} className="w-full px-2 py-1 border rounded text-sm" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Opacity */}
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Opacity</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={selectedLayer.opacity}
                                                onChange={(e) => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2 border-t">
                                            <button onClick={() => duplicateLayer(selectedLayer.id)} className="flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                                                <Copy className="w-4 h-4" /> Duplicate
                                            </button>
                                            <button onClick={() => deleteLayer(selectedLayer.id)} className="flex-1 flex items-center justify-center gap-2 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm">
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activePanel === 'properties' && !selectedLayer && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Select a layer to edit properties</p>
                                    </div>
                                )}

                                {/* Effects Panel */}
                                {activePanel === 'effects' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Canvas Background</label>
                                            <input
                                                type="color"
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                                className="w-full h-10 rounded-lg cursor-pointer"
                                            />
                                        </div>

                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-xs text-amber-700">
                                                <strong>Pro Tip:</strong> Use the gradient layer for overlays that make text more readable.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Export Modal */}
                    <AnimatePresence>
                        {showExportModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                                onClick={() => setShowExportModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.95 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white rounded-2xl p-6 w-full max-w-md"
                                >
                                    <div className="flex justify-between mb-4">
                                        <h2 className="text-xl font-bold">Export Template</h2>
                                        <button onClick={() => setShowExportModal(false)}><X className="w-5 h-5" /></button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                            <p><strong>Template:</strong> {templateName}</p>
                                            <p><strong>Size:</strong> {selectedFrame.width}×{selectedFrame.height}px</p>
                                            <p><strong>Layers:</strong> {layers.length}</p>
                                        </div>
                                        <button
                                            onClick={handleExport}
                                            disabled={isSaving}
                                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            Download PNG
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </FeatureGate>
        </AuthGuard>
    );
}
