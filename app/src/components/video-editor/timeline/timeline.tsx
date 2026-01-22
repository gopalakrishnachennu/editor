"use client";

import { useRef, useEffect } from "react";
import { useVideoStore } from "@/lib/stores/video-store";
import { Track } from "./track";
import { cn } from "@/lib/utils";

export function Timeline() {
    const {
        tracks,
        durationInFrames,
        currentTime,
        seek,
        zoom,
        fps
    } = useVideoStore();

    const containerRef = useRef<HTMLDivElement>(null);

    // Dynamic width based on zoom (1 frame = X pixels)
    // Zoom 1: 1 frame = 10px
    const pixelsPerFrame = 2 * zoom;
    const totalWidth = durationInFrames * pixelsPerFrame;

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const frame = Math.max(0, Math.min(durationInFrames, Math.round(x / pixelsPerFrame)));
        seek(frame);
    };

    // Auto-scroll logic could go here

    return (
        <div className="flex flex-col h-full bg-gray-900 border-t border-gray-800 select-none">
            {/* Toolbar / Time Display */}
            <div className="h-10 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900 z-10">
                <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                    <span>Frame: {Math.round(currentTime)}</span>
                    <span>Time: {(currentTime / fps).toFixed(2)}s</span>
                    <span>Zoom: {zoom}x</span>
                </div>
            </div>

            {/* Scrollable Timeline Area */}
            <div className="flex-1 overflow-auto relative custom-scrollbar">
                <div
                    ref={containerRef}
                    className="relative min-w-full"
                    style={{ width: `${totalWidth}px` }}
                >
                    {/* Time Ruler */}
                    <div
                        className="h-6 border-b border-gray-800 bg-gray-900/50 sticky top-0 z-20 cursor-pointer"
                        onClick={handleSeek}
                    >
                        {Array.from({ length: Math.ceil(durationInFrames / fps) }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute top-0 h-full border-l border-gray-700 text-[10px] text-gray-500 pl-1 pt-1"
                                style={{ left: `${i * fps * pixelsPerFrame}px` }}
                            >
                                {i}s
                            </div>
                        ))}
                    </div>

                    {/* Tracks */}
                    <div className="py-2 space-y-2">
                        {tracks.map(track => (
                            <Track
                                key={track.id}
                                track={track}
                                pixelsPerFrame={pixelsPerFrame}
                            />
                        ))}
                    </div>

                    {/* Playhead */}
                    <div
                        className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-30 pointer-events-none"
                        style={{ left: `${currentTime * pixelsPerFrame}px` }}
                    >
                        <div className="w-3 h-3 bg-red-500 rotate-45 -translate-x-1.5 -translate-y-1.5 shadow-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
}
