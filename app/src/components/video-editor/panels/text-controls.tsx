"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { Type, AlignCenter, AlignVerticalJustifyEnd } from "lucide-react";

export function TextControls() {
    const { selectedClipId, clips, updateClip } = useVideoStore();
    const clip = selectedClipId ? clips[selectedClipId] : null;

    if (!clip || clip.type !== "text") return null;

    // Ensure textStyle exists
    const style = clip.textStyle || { fontSize: 60, color: "#ffffff", align: "center" };

    const handleUpdate = (updates: any) => {
        updateClip(clip.id, {
            textStyle: { ...style, ...updates }
        });
    };

    return (
        <div className="space-y-6 pt-4 border-t border-gray-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                <Type className="w-3 h-3" /> Text
            </h3>

            {/* Content Input */}
            <div className="space-y-2">
                <label className="text-xs text-gray-400">Content</label>
                <textarea
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                    value={clip.name}
                    onChange={(e) => updateClip(clip.id, { name: e.target.value })}
                />
            </div>

            {/* Style Controls */}
            <div className="grid grid-cols-2 gap-4">
                {/* Font Size */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Size</label>
                    <input
                        type="number"
                        className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-xs text-white"
                        value={style.fontSize}
                        onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) })}
                    />
                </div>
                {/* Color */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Color</label>
                    <input
                        type="color"
                        className="w-full h-8 bg-transparent cursor-pointer"
                        value={style.color}
                        onChange={(e) => handleUpdate({ color: e.target.value })}
                    />
                </div>
            </div>

            {/* Alignment / Presets */}
            <div className="space-y-2">
                <label className="text-xs text-gray-400">Style</label>
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                    <button
                        onClick={() => handleUpdate({ align: "center" })}
                        className={`flex-1 flex items-center justify-center py-1.5 rounded ${style.align === "center" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
                    >
                        <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleUpdate({ align: "bottom" })}
                        className={`flex-1 flex items-center justify-center py-1.5 rounded ${style.align === "bottom" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
                    >
                        <AlignVerticalJustifyEnd className="w-4 h-4" /> {/* Icon override needed? default is AlignBottom */}
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 text-center mt-1">
                    {style.align === "center" ? "Centered Headline" : "Lower Third Caption"}
                </p>
            </div>
        </div>
    );
}
