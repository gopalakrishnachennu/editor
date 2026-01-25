"use client";

import { useVideoStore, Track as TrackType } from "@/lib/stores/video-store";
import { useContextMenuStore } from "@/lib/stores/context-menu-store";
import { ClipItem } from "./clip-item";
import { Video, Type, Music, Layers, Volume2, VolumeX, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackProps {
    track: TrackType;
    trackIndex: number;
    pixelsPerSecond: number;
    hideHeader?: boolean;
}

export function Track({ track, trackIndex, pixelsPerSecond, hideHeader = false }: TrackProps) {
    const { addClip } = useVideoStore();
    const { openMenu } = useContextMenuStore();
    // Removed clips access since it's now nested in tracks

    // Get icon based on track type
    const Icon = {
        video: Video,
        audio: Music,
        text: Type,
        image: Layers, // Map image type
        overlay: Layers
    }[track.type] || Layers;

    return (
        <div className="flex h-24 group">
            {/* Track Header (Sticky Left) */}
            <div
                className="w-48 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col justify-center px-3 sticky left-0 z-10 shadow-lg"
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openMenu({ x: e.clientX, y: e.clientY }, 'track', { trackId: track.id });
                }}
            >
                <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-200 truncate">{track.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition">
                        {track.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                    <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition">
                        {track.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {/* Track Content Area */}
            <div
                className="flex-1 relative bg-gray-800/30 border-y border-gray-800/50 transition-colors hover:bg-gray-800/50"
                onContextMenu={(e) => {
                    e.preventDefault();
                    // Don't stop propagation so it can bubble to timeline if needed, but for now we catch it here or let it go?
                    // Let's set it as timeline type click if clicked on empty space in track
                    openMenu({ x: e.clientX, y: e.clientY }, 'timeline', { trackId: track.id, time: (e.clientX - e.currentTarget.getBoundingClientRect().left) / pixelsPerSecond });
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const data = e.dataTransfer.getData("application/json");
                    if (!data) return;

                    try {
                        const payload = JSON.parse(data);
                        if (payload.type !== "media-asset") return;

                        // Type compatibility check
                        // Allow image -> video track
                        const isCompatible =
                            track.type === payload.mediaType ||
                            (track.type === 'video' && payload.mediaType === 'image');

                        if (!isCompatible) return;

                        const rect = e.currentTarget.getBoundingClientRect();
                        const offsetX = e.clientX - rect.left;
                        const start = Math.max(0, offsetX / pixelsPerSecond);

                        addClip(track.id, {
                            name: payload.name,
                            type: payload.mediaType,
                            src: payload.src,
                            duration: payload.duration || (payload.mediaType === 'image' ? 5 : 10),
                            start: start
                        });
                    } catch (err) {
                        console.error("Failed to process drop:", err);
                    }
                }}
            >
                {track.clips.map(clip => (
                    <ClipItem
                        key={clip.id}
                        clip={clip}
                        trackIndex={trackIndex}
                        pixelsPerSecond={pixelsPerSecond}
                    />
                ))}
            </div>
        </div>
    );
}
