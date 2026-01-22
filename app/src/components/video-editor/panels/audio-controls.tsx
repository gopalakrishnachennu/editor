"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { Volume2, Mic, Music } from "lucide-react";

export function AudioControls() {
    const { selectedClipId, clips, updateClip } = useVideoStore();
    const clip = selectedClipId ? clips[selectedClipId] : null;

    if (!clip) return null;

    const handleChange = (key: string, value: number) => {
        updateClip(clip.id, { [key]: value });
    };

    return (
        <div className="space-y-6 pt-4 border-t border-gray-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                <Music className="w-3 h-3" /> Audio
            </h3>

            {/* Volume */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Volume</span>
                    <span>{Math.round(clip.volume * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={clip.volume}
                    onChange={(e) => handleChange("volume", parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>

            {/* Fades */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Fade In (frames)</label>
                    <input
                        type="number"
                        min="0"
                        max="60"
                        className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-xs text-white"
                        value={clip.fadeInDuration}
                        onChange={(e) => handleChange("fadeInDuration", parseInt(e.target.value))}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Fade Out (frames)</label>
                    <input
                        type="number"
                        min="0"
                        max="60"
                        className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-xs text-white"
                        value={clip.fadeOutDuration}
                        onChange={(e) => handleChange("fadeOutDuration", parseInt(e.target.value))}
                    />
                </div>
            </div>
        </div>
    );
}
