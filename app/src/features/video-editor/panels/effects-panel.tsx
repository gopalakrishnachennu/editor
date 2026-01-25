"use client";

import { useState } from "react";
import { useVideoStore, Effect, EffectType } from "@/lib/stores/video-store";
import { SlidersHorizontal, Plus, Trash2, Layers, Zap, Palette, Droplets, Ghost, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const AVAILABLE_EFFECTS = [
    { name: 'Hue Rotate', type: 'color', icon: Palette, defaultParams: { degree: 90 } },
    { name: 'Sepia', type: 'color', icon: Droplets, defaultParams: { amount: 1 } },
    { name: 'Invert', type: 'color', icon: Ghost, defaultParams: { amount: 1 } },
    { name: 'Gaussian Blur', type: 'blur', icon: Ghost, defaultParams: { radius: 10 } },
    { name: 'Vignette', type: 'color', icon: Droplets, defaultParams: { amount: 1 } },
    { name: 'Glitch', type: 'distortion', icon: Zap, defaultParams: { intensity: 1 } },
    { name: 'Pixelate', type: 'distortion', icon: Layers, defaultParams: { size: 10 } },
    { name: 'VHS', type: 'retro', icon: Activity, defaultParams: { intensity: 0.5 } },
    { name: 'Film Grain', type: 'retro', icon: Droplets, defaultParams: { intensity: 0.5 } },
    { name: 'Halftone', type: 'retro', icon: Layers, defaultParams: { dotSize: 4 } },
];

export function EffectsPanel() {
    const { selectedClipId, tracks, updateClip, addEffect, removeEffect, updateEffect } = useVideoStore();
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    // Find selected clip
    const activeClip = tracks
        .flatMap(t => t.clips)
        .find(c => c.id === selectedClipId);

    if (!activeClip || (activeClip.type !== 'video' && activeClip.type !== 'image' && activeClip.type !== 'text')) {
        return (
            <div className="h-full bg-slate-950 border-r border-white/10 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-3">
                    <Zap className="w-6 h-6 opacity-50" />
                </div>
                <h3 className="text-sm font-medium">No Visual Clip Selected</h3>
                <p className="text-xs mt-1">Select video, image, or text to add effects.</p>
            </div>
        );
    }

    const effects = activeClip.properties.effects || [];
    const blendingMode = activeClip.properties.blendingMode || 'normal';

    const toggleAddMenu = () => setIsAddMenuOpen(!isAddMenuOpen);

    const handleAddEffect = (template: typeof AVAILABLE_EFFECTS[0]) => {
        addEffect(activeClip.id, template.type as EffectType);
        // We might need to update the params immediately if they differ from default?
        // Actually the store uses `getDefaultEffectParams`.
        // But the UI template has specific defaults (e.g. Pixelate size 10).
        // Let's rely on the Store defaults for now to keep it clean, or update immediately.
        setIsAddMenuOpen(false);
    };

    const setBlendingMode = (mode: string) => {
        updateClip(activeClip.id, {
            properties: {
                ...activeClip.properties,
                blendingMode: mode as any
            }
        });
    };

    return (
        <div className="h-full bg-slate-950 border-r border-white/10 flex flex-col" onClick={() => setIsAddMenuOpen(false)}>
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white mb-1">Visual Effects</h3>
                <p className="text-xs text-gray-500">Stack modifiers & blending</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {/* 1. Blending Mode Section */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                        <Layers className="w-3 h-3" /> Blending Mode
                    </label>
                    <select
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded p-1.5 focus:border-indigo-500 outline-none"
                        value={blendingMode}
                        onChange={(e) => setBlendingMode(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="normal">Normal</option>
                        <option value="multiply">Multiply</option>
                        <option value="screen">Screen</option>
                        <option value="overlay">Overlay</option>
                        <option value="darken">Darken</option>
                        <option value="lighten">Lighten</option>
                        <option value="difference">Difference</option>
                        <option value="exclusion">Exclusion</option>
                    </select>
                </div>

                <hr className="border-white/10" />

                {/* 2. Active Effects Stack */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-400">Effect Stack</label>
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleAddMenu(); }}
                                className={cn(
                                    "text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors",
                                    isAddMenuOpen && "bg-indigo-500 ring-2 ring-indigo-500/50"
                                )}
                            >
                                <Plus className="w-3 h-3" /> Add
                            </button>

                            {/* Dropdown Menu */}
                            {isAddMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-800 rounded shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="p-1">
                                        {AVAILABLE_EFFECTS.map(ef => (
                                            <button
                                                key={ef.name}
                                                onClick={(e) => { e.stopPropagation(); handleAddEffect(ef); }}
                                                className="w-full text-left px-2 py-1.5 hover:bg-white/10 rounded text-xs text-gray-200 flex items-center gap-2"
                                            >
                                                <ef.icon className="w-3 h-3 text-indigo-400" />
                                                {ef.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {effects.length === 0 && (
                        <div className="p-4 border border-dashed border-white/10 rounded text-center">
                            <p className="text-xs text-gray-600 italic">No active effects</p>
                        </div>
                    )}

                    {effects.map((effect) => (
                        <div key={effect.id} className="bg-slate-900/50 border border-white/5 rounded-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            {/* Effect Header */}
                            <div className="bg-slate-900 px-3 py-2 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-300">{effect.name}</span>
                                </div>
                                <button onClick={() => removeEffect(activeClip.id, effect.id)} className="text-gray-500 hover:text-red-400">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Effect Controls */}
                            <div className="p-3 space-y-3">
                                {Object.entries(effect.params || {}).map(([key, value]) => {
                                    if (key === 'name') return null;

                                    // Determine max/step based on key
                                    let max = 1; let step = 0.1; let min = 0;
                                    if (key === 'degree') { max = 360; step = 1; }
                                    if (key === 'radius') { max = 50; step = 1; }
                                    if (key === 'size') { max = 50; step = 1; min = 1; }
                                    if (key === 'intensity') { max = 10; step = 0.5; }

                                    return (
                                        <div key={key} className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-gray-500 capitalize">
                                                <span>{key}</span>
                                                <span className="font-mono">{typeof value === 'number' ? value.toFixed(1) : value}</span>
                                            </div>
                                            {typeof value === 'number' && (
                                                <input
                                                    type="range" min={min} max={max} step={step}
                                                    value={value}
                                                    onChange={(e) => updateEffect(activeClip.id, effect.id, { [key]: parseFloat(e.target.value) })}
                                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
