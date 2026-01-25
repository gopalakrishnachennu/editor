"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { MoveRight, Sparkles, XCircle, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Activity, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ANIMATION_TYPES = [
    { label: 'Fade', value: 'fade' },
    { label: 'Slide', value: 'slide' },
    { label: 'Zoom', value: 'zoom' },
    { label: 'Bounce', value: 'bounce' },
    { label: 'Wipe', value: 'wipe' },
    { label: 'Blur', value: 'blur' },
    { label: 'Typewriter', value: 'typewriter' }
];

const EASING_OPTIONS = [
    { label: 'Linear', value: 'linear' },
    { label: 'Smooth', value: 'ease-out' },
    { label: 'Elastic', value: 'elastic' }
];

export function TransitionsPanel() {
    const { selectedClipId, tracks, updateClip } = useVideoStore();
    const [activeTab, setActiveTab] = useState<'enter' | 'exit'>('enter');

    // Find selected clip
    const activeClip = tracks
        .flatMap(t => t.clips)
        .find(c => c.id === selectedClipId);

    if (!activeClip) {
        return (
            <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-400">No Clip Selected</h3>
                <p className="text-xs text-gray-600 mt-1">Select a clip to add transitions.</p>
            </div>
        );
    }

    const animation = activeClip.properties.animation || {};
    const currentConfig = animation[activeTab];

    // Default duration: 1s if undefined, or whatever is set. If config is undefined, mean duration is effectively 0/off.
    const duration = currentConfig?.duration || 0;
    const type = currentConfig?.type || 'fade';
    const direction = currentConfig?.direction || 'left';
    const easing = currentConfig?.easing || 'ease-out';

    const updateAnim = (updates: any) => {
        const newAnimation = { ...animation };

        // Ensure sub-object exists
        if (!newAnimation[activeTab]) {
            newAnimation[activeTab] = {
                type: 'fade',
                duration: 1, // Default duration when first enabling
                direction: 'left',
                easing: 'ease-out'
            };
        }

        // Apply updates
        newAnimation[activeTab] = { ...newAnimation[activeTab]!, ...updates };

        // If duration set to 0, maybe remove it? Or just keep it.
        // Let's decide: if explicit "Remove" button is clicked, we delete the key.

        updateClip(activeClip.id, {
            properties: {
                ...activeClip.properties,
                animation: newAnimation
            }
        });
    };

    const removeAnimation = () => {
        const newAnimation = { ...animation };
        delete newAnimation[activeTab];
        updateClip(activeClip.id, {
            properties: {
                ...activeClip.properties,
                animation: newAnimation
            }
        });
    };

    return (
        <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-bold text-white mb-1">Motion & Transitions</h3>
                <p className="text-xs text-gray-500">Advanced animation controls</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                <button
                    onClick={() => setActiveTab('enter')}
                    className={cn(
                        "flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2",
                        activeTab === 'enter' ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    In (Enter)
                </button>
                <button
                    onClick={() => setActiveTab('exit')}
                    className={cn(
                        "flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2",
                        activeTab === 'exit' ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    Out (Exit)
                </button>
            </div>

            <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">

                {/* On/Off Switch essentially */}
                {!currentConfig ? (
                    <div className="text-center py-8">
                        <button
                            onClick={() => updateAnim({ duration: 1, type: 'fade' })}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-xs font-medium transition-colors"
                        >
                            + Add {activeTab === 'enter' ? 'Entrance' : 'Exit'} Animation
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Type Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400">Animation Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {ANIMATION_TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => updateAnim({ type: t.value })}
                                        className={cn(
                                            "text-xs px-3 py-2 rounded border text-left transition-all",
                                            type === t.value
                                                ? "bg-indigo-500/20 border-indigo-500 text-white"
                                                : "bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700"
                                        )}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration Slider */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-400">Duration</label>
                                <span className="text-[10px] font-mono text-indigo-400">{duration}s</span>
                            </div>
                            <input
                                type="range"
                                min="0.1" max="5" step="0.1"
                                value={duration}
                                onChange={(e) => updateAnim({ duration: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        {/* Direction (Only for directional types) */}
                        {(type === 'slide' || type === 'wipe' || type === 'bounce') && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Direction</label>
                                <div className="flex gap-2 justify-center bg-gray-800/50 p-2 rounded-lg">
                                    <button
                                        onClick={() => updateAnim({ direction: 'left' })}
                                        className={cn("p-2 rounded hover:bg-gray-700", direction === 'left' && "bg-indigo-600 text-white")}
                                    ><ArrowLeft className="w-4 h-4" /></button>
                                    <button
                                        onClick={() => updateAnim({ direction: 'top' })}
                                        className={cn("p-2 rounded hover:bg-gray-700", direction === 'top' && "bg-indigo-600 text-white")}
                                    ><ArrowUp className="w-4 h-4" /></button>
                                    <button
                                        onClick={() => updateAnim({ direction: 'bottom' })}
                                        className={cn("p-2 rounded hover:bg-gray-700", direction === 'bottom' && "bg-indigo-600 text-white")}
                                    ><ArrowDown className="w-4 h-4" /></button>
                                    <button
                                        onClick={() => updateAnim({ direction: 'right' })}
                                        className={cn("p-2 rounded hover:bg-gray-700", direction === 'right' && "bg-indigo-600 text-white")}
                                    ><ArrowRight className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}

                        {/* Easing */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Easing
                            </label>
                            <select
                                value={easing}
                                onChange={(e) => updateAnim({ easing: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 text-xs text-white rounded p-2 focus:border-indigo-500 outline-none"
                            >
                                {EASING_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                            <button
                                onClick={removeAnimation}
                                className="w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-3 h-3" /> Remove Animation
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
