"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { ANIMATION_REGISTRY, AnimationType } from "@/lib/video/motion-presets";
import { Play } from "lucide-react";

export function MotionControls() {
    const { selectedClipId, clips, updateClip } = useVideoStore();
    const clip = selectedClipId ? clips[selectedClipId] : null;

    if (!clip) {
        return (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500 text-center">Select a clip to edit motion</p>
            </div>
        );
    }

    const handleUpdate = (type: AnimationType, id: string) => {
        updateClip(clip.id, {
            animation: {
                ...clip.animation,
                [type]: { ...clip.animation[type], id }
            }
        });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Motion</h3>

            {/* Enter Animation */}
            <div className="space-y-2">
                <label className="text-xs text-gray-300">Enter</label>
                <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={clip.animation.enter?.id || "none"}
                    onChange={(e) => handleUpdate("enter", e.target.value)}
                >
                    {ANIMATION_REGISTRY.enter.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Exit Animation */}
            <div className="space-y-2">
                <label className="text-xs text-gray-300">Exit</label>
                <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={clip.animation.exit?.id || "none"}
                    onChange={(e) => handleUpdate("exit", e.target.value)}
                >
                    {ANIMATION_REGISTRY.exit.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Idle Animation */}
            <div className="space-y-2">
                <label className="text-xs text-gray-300">Idle (Loop)</label>
                <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={clip.animation.idle?.id || "none"}
                    onChange={(e) => handleUpdate("idle", e.target.value)}
                >
                    {ANIMATION_REGISTRY.idle.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
