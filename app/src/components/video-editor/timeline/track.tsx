"use client";

import { useVideoStore, Track as TrackType } from "@/lib/stores/video-store";
import { ClipItem } from "./clip-item";
import { Video, Type, Music, Layers, Volume2, VolumeX, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackProps {
    track: TrackType;
    pixelsPerFrame: number;
}

export function Track({ track, pixelsPerFrame }: TrackProps) {
    const { clips } = useVideoStore();

    // Get icon based on track type
    const Icon = {
        video: Video,
        audio: Music,
        text: Type,
        overlay: Layers
    }[track.type] || Layers;

    return (
        <div className="flex h-24 group">
            {/* Track Header (Sticky Left) */}
            <div className="w-48 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col justify-center px-3 sticky left-0 z-10 shadow-lg">
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
            <div className="flex-1 relative bg-gray-800/30 border-y border-gray-800/50">
                {track.clips.map(clipId => {
                    const clip = clips[clipId];
                    if (!clip) return null;
                    return (
                        <ClipItem
                            key={clipId}
                            clip={clip}
                            pixelsPerFrame={pixelsPerFrame}
                        />
                    );
                })}
            </div>
        </div>
    );
}
