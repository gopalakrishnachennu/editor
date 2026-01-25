"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { ANIMATION_REGISTRY, AnimationType } from "@/lib/video/motion-presets";
import { Play } from "lucide-react";

export function MotionControls() {
    const { selectedClipId, tracks, updateClip } = useVideoStore();

    // Helper to find selected clip
    const activeClip = tracks
        .flatMap(t => t.clips)
        .find(c => c.id === selectedClipId);

    if (!activeClip) return null;

    const clip = activeClip; // Alias for minimal refactor
    const animation = clip.properties.animation || {
        enter: { id: 'none', type: 'fade', duration: 0 },
        exit: { id: 'none', type: 'fade', duration: 0 },
        idle: { id: 'none' }
    };

    const handleUpdate = (type: AnimationType, id: string) => {
        const existing = animation[type] || {};
        const defaults = {
            type: 'fade',
            duration: 0.5,
        };

        updateClip(clip.id, {
            properties: {
                ...clip.properties,
                animation: {
                    ...animation,
                    [type]: {
                        ...defaults,
                        ...existing,
                        id
                    }
                }
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
                    value={animation.enter?.id || "none"}
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
                    value={animation.exit?.id || "none"}
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
                    value={animation.idle?.id || "none"}
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
