"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import {
    Type, AlignCenter, AlignLeft, AlignRight,
    Bold, Italic, Palette, Layers, BoxSelect,
    Type as TypeIcon, Minus, Plus
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function TextControls() {
    const { selectedClipId, tracks, updateClip } = useVideoStore();
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'effects' | 'motion'>('content');

    // Helper to find selected clip
    const activeClip = tracks
        .flatMap(t => t.clips)
        .find(c => c.id === selectedClipId);

    if (!activeClip || activeClip.type !== "text") return null;

    const clip = activeClip;
    // Default Style
    const style = {
        fontSize: 60,
        color: "#ffffff",
        align: "center",
        fontFamily: "Inter",
        fontWeight: "bold",
        ...clip.properties.textStyle
    };

    const handleUpdate = (updates: any) => {
        updateClip(clip.id, {
            properties: {
                ...clip.properties,
                textStyle: { ...style, ...updates }
            }
        });
    };

    const handleShadowUpdate = (key: string, value: any) => {
        const currentShadow = style.shadow || { color: '#000000', blur: 0, offsetX: 0, offsetY: 0 };
        handleUpdate({ shadow: { ...currentShadow, [key]: value } });
    };

    const handleOutlineUpdate = (key: string, value: any) => {
        const currentOutline = style.outline || { color: '#000000', width: 0 };
        handleUpdate({ outline: { ...currentOutline, [key]: value } });
    };

    const handleBgUpdate = (key: string, value: any) => {
        const currentBg = style.background || { color: '#000000', opacity: 0, padding: 0, borderRadius: 0 };
        handleUpdate({ background: { ...currentBg, [key]: value } });
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                {['content', 'style', 'effects'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={cn(
                            "flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors relative",
                            activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Text Content</label>
                            <textarea
                                className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                                value={clip.name}
                                onChange={(e) => updateClip(clip.id, { name: e.target.value })}
                                placeholder="Enter text..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Alignment</label>
                            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                                {['left', 'center', 'right'].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => handleUpdate({ align })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-2 rounded transition-all",
                                            style.align === align ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                        {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                        {align === 'right' && <AlignRight className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STYLE TAB */}
                {activeTab === 'style' && (
                    <div className="space-y-6">
                        {/* Font Family (Mock List) */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Font Family</label>
                            <select
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-white outline-none"
                                value={style.fontFamily}
                                onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
                            >
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Lora">Lora (Serif)</option>
                                <option value="Oswald">Oswald (Condensed)</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="Impact">Impact</option>
                                <option value="Courier New">Monospace</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Size</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range" min="10" max="200"
                                        className="flex-1 h-1 bg-gray-700 rounded-lg accent-indigo-500"
                                        value={style.fontSize}
                                        onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) })}
                                    />
                                    <span className="text-xs text-gray-300 w-8 text-right">{style.fontSize}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Color</label>
                                <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded p-1">
                                    <input
                                        type="color"
                                        className="w-6 h-6 bg-transparent cursor-pointer border-none p-0"
                                        value={style.color}
                                        onChange={(e) => handleUpdate({ color: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent text-xs text-white outline-none uppercase"
                                        value={style.color}
                                        onChange={(e) => handleUpdate({ color: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Weight & Spacing</label>
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    className="bg-gray-800 border border-gray-700 rounded p-2 text-xs text-white outline-none"
                                    value={style.fontWeight}
                                    onChange={(e) => handleUpdate({ fontWeight: e.target.value })}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                    <option value="900">Black</option>
                                    <option value="300">Light</option>
                                </select>
                                <div className="flex items-center gap-2">
                                    <TypeIcon className="w-3 h-3 text-gray-500" />
                                    <input
                                        type="number"
                                        placeholder="Space"
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-white outline-none"
                                        value={style.spacing || 0}
                                        onChange={(e) => handleUpdate({ spacing: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* EFFECTS TAB */}
                {activeTab === 'effects' && (
                    <div className="space-y-8">

                        {/* Shadow Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                                    <Layers className="w-3 h-3 text-indigo-400" /> Shadow
                                </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-800">
                                <div className="col-span-2 flex items-center gap-2">
                                    <label className="text-[10px] text-gray-500 w-10">Color</label>
                                    <input type="color" className="w-full h-6" value={style.shadow?.color || '#000000'} onChange={(e) => handleShadowUpdate('color', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500">Blur</label>
                                    <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-xs" value={style.shadow?.blur || 0} onChange={(e) => handleShadowUpdate('blur', parseInt(e.target.value))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500">Offset Y</label>
                                    <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-xs" value={style.shadow?.offsetY || 0} onChange={(e) => handleShadowUpdate('offsetY', parseInt(e.target.value))} />
                                </div>
                            </div>
                        </div>

                        {/* Outline Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                                    <BoxSelect className="w-3 h-3 text-indigo-400" /> Outline
                                </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-800">
                                <div className="col-span-2 flex items-center gap-2">
                                    <label className="text-[10px] text-gray-500 w-10">Color</label>
                                    <input type="color" className="w-full h-6" value={style.outline?.color || '#000000'} onChange={(e) => handleOutlineUpdate('color', e.target.value)} />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] text-gray-500">Thickness</label>
                                    <input
                                        type="range" min="0" max="20"
                                        className="w-full h-1 bg-gray-700 rounded accent-indigo-500"
                                        value={style.outline?.width || 0}
                                        onChange={(e) => handleOutlineUpdate('width', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Background Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                                    <Palette className="w-3 h-3 text-indigo-400" /> Background Box
                                </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-800">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500">Opacity</label>
                                    <input type="number" step="0.1" min="0" max="1" className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-xs" value={style.background?.opacity ?? 0} onChange={(e) => handleBgUpdate('opacity', parseFloat(e.target.value))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500">Color</label>
                                    <input type="color" className="w-full h-7 bg-transparent" value={style.background?.color || '#000000'} onChange={(e) => handleBgUpdate('color', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500">Padding</label>
                                    <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-xs" value={style.background?.padding ?? 0} onChange={(e) => handleBgUpdate('padding', parseInt(e.target.value))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500">Radius</label>
                                    <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-xs" value={style.background?.borderRadius ?? 0} onChange={(e) => handleBgUpdate('borderRadius', parseInt(e.target.value))} />
                                </div>
                            </div>
                        </div>

                    </div>
                )}
                {/* MOTION TAB */}
                {activeTab === 'motion' && (
                    <div className="space-y-8">
                        {/* Enter Animation */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">In Animation</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {['none', 'fade', 'slide', 'zoom', 'bounce', 'typewriter'].map((anim) => (
                                    <button
                                        key={anim}
                                        onClick={() => {
                                            if (anim === 'none') {
                                                updateClip(clip.id, { properties: { ...clip.properties, animation: { ...clip.properties.animation, enter: undefined } } });
                                            } else {
                                                updateClip(clip.id, {
                                                    properties: {
                                                        ...clip.properties,
                                                        animation: {
                                                            ...clip.properties.animation,
                                                            enter: { type: anim as any, duration: 1, direction: 'left' }
                                                        }
                                                    }
                                                });
                                            }
                                        }}
                                        className={cn(
                                            "py-2 px-1 text-[10px] uppercase font-medium rounded border transition-all",
                                            (clip.properties.animation?.enter?.type === anim) || (anim === 'none' && !clip.properties.animation?.enter)
                                                ? "bg-indigo-600 border-indigo-500 text-white"
                                                : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                                        )}
                                    >
                                        {anim}
                                    </button>
                                ))}
                            </div>

                            {clip.properties.animation?.enter && (
                                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-800 space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-400">Duration (s)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range" min="0.1" max="5" step="0.1"
                                                className="flex-1 h-1 bg-gray-700 rounded-lg accent-indigo-500"
                                                value={clip.properties.animation.enter.duration}
                                                onChange={(e) => updateClip(clip.id, {
                                                    properties: { ...clip.properties, animation: { ...clip.properties.animation, enter: { ...clip.properties.animation!.enter!, duration: parseFloat(e.target.value) } } }
                                                })}
                                            />
                                            <span className="text-[10px] w-6">{clip.properties.animation.enter.duration}s</span>
                                        </div>
                                    </div>

                                    {clip.properties.animation.enter.type === 'slide' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-400">Direction</label>
                                            <div className="flex bg-gray-900 rounded p-1">
                                                {['left', 'right', 'top', 'bottom'].map(dir => (
                                                    <button
                                                        key={dir}
                                                        onClick={() => updateClip(clip.id, {
                                                            properties: { ...clip.properties, animation: { ...clip.properties.animation, enter: { ...clip.properties.animation!.enter!, direction: dir as any } } }
                                                        })}
                                                        className={cn(
                                                            "flex-1 text-[9px] py-1 rounded capitalize",
                                                            clip.properties.animation!.enter!.direction === dir ? "bg-indigo-600 text-white" : "text-gray-500"
                                                        )}
                                                    >
                                                        {dir}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Exit Animation (Similar logic, simplified for MVP) */}
                        <div className="space-y-4 pt-4 border-t border-gray-800 opacity-50 hover:opacity-100 transition-opacity">
                            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Out Animation</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {['none', 'fade', 'slide'].map((anim) => (
                                    <button
                                        key={anim}
                                        onClick={() => {
                                            if (anim === 'none') {
                                                updateClip(clip.id, { properties: { ...clip.properties, animation: { ...clip.properties.animation, exit: undefined } } });
                                            } else {
                                                updateClip(clip.id, {
                                                    properties: { ...clip.properties, animation: { ...clip.properties.animation, exit: { type: anim as any, duration: 1 } } }
                                                });
                                            }
                                        }}
                                        className={cn(
                                            "py-2 px-1 text-[10px] uppercase font-medium rounded border transition-all",
                                            (clip.properties.animation?.exit?.type === anim) || (anim === 'none' && !clip.properties.animation?.exit)
                                                ? "bg-red-900/40 border-red-500/50 text-white"
                                                : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                                        )}
                                    >
                                        {anim}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
