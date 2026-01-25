"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { SlidersHorizontal, Sun, Contrast, Droplets, Monitor, EyeOff, RotateCcw } from "lucide-react";

export function FilterPanel() {
    const { selectedClipId, tracks, updateClip } = useVideoStore();

    // Find selected clip
    const activeClip = tracks
        .flatMap(t => t.clips)
        .find(c => c.id === selectedClipId);

    // Filter logic only applies to visual clips (video/image)
    if (!activeClip || (activeClip.type !== 'video' && activeClip.type !== 'image')) {
        return (
            <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    <SlidersHorizontal className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-400">No Visual Clip Selected</h3>
                <p className="text-xs text-gray-600 mt-1">Select a video or image to apply filters.</p>
            </div>
        );
    }

    const filters = activeClip.properties.filter || {};
    const hasActiveFilters = Object.keys(filters).length > 0;

    const updateFilter = (key: string, value: number) => {
        updateClip(activeClip.id, {
            properties: {
                ...activeClip.properties,
                filter: {
                    ...filters,
                    [key]: value
                }
            }
        });
    };

    const resetFilters = () => {
        updateClip(activeClip.id, {
            properties: {
                ...activeClip.properties,
                filter: undefined
            }
        });
    };

    return (
        <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white mb-1">Filters</h3>
                    <p className="text-xs text-gray-500">Color correction</p>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={resetFilters}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                        <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {/* Visual Preview (future: histogram?) */}

                {/* Brightness */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1.5"><Sun className="w-3 h-3" /> Brightness</span>
                        <span className="font-mono">{Math.round((filters.brightness ?? 1) * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="2" step="0.05"
                        value={filters.brightness ?? 1}
                        onChange={(e) => updateFilter('brightness', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* Contrast */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1.5"><Contrast className="w-3 h-3" /> Contrast</span>
                        <span className="font-mono">{Math.round((filters.contrast ?? 1) * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="2" step="0.05"
                        value={filters.contrast ?? 1}
                        onChange={(e) => updateFilter('contrast', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* Saturation */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1.5"><Droplets className="w-3 h-3" /> Saturation</span>
                        <span className="font-mono">{Math.round((filters.saturate ?? 1) * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="3" step="0.05"
                        value={filters.saturate ?? 1}
                        onChange={(e) => updateFilter('saturate', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* Grayscale */}
                <div className="space-y-2 pt-2 border-t border-gray-800">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1.5"><Monitor className="w-3 h-3" /> Grayscale</span>
                        <span className="font-mono">{Math.round((filters.grayscale ?? 0) * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="1" step="0.05"
                        value={filters.grayscale ?? 0}
                        onChange={(e) => updateFilter('grayscale', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* Blur */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1.5"><EyeOff className="w-3 h-3" /> Blur</span>
                        <span className="font-mono">{filters.blur ?? 0}px</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="20" step="0.5"
                        value={filters.blur ?? 0}
                        onChange={(e) => updateFilter('blur', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>
            </div>
        </div>
    );
}
