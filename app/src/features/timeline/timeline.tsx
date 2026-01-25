'use client';

import { useVideoStore, Clip } from '@/lib/stores/video-store';
import { useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Track } from './track';
import { Scissors, ZoomIn, ZoomOut, Grid, Magnet } from 'lucide-react';
import { useCallback, useEffect } from 'react';

// Constants
const PX_PER_SEC = 20; // 1 second = 20px width

export function Timeline() {
    const { tracks, duration, currentTime, seek } = useVideoStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const totalWidth = duration * PX_PER_SEC;

    // Handle clicking on the ruler to seek
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!scrollContainerRef.current) return;
        const rect = scrollContainerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft - 192; // Adjust for w-48 header
        const newTime = clickX / PX_PER_SEC;
        seek(newTime);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key.toLowerCase() === 's') {
                const state = useVideoStore.getState();
                if (state.selectedClipId) {
                    state.splitClip(state.selectedClipId, state.currentTime);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="flex flex-col h-full bg-slate-900 border-t border-white/10 select-none">

            {/* Toolbar */}
            <div className="h-10 bg-slate-950 border-b border-white/10 px-4 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="font-bold mr-4 text-slate-200">Timeline</span>

                    <div className="h-4 w-px bg-white/10 mx-2" />

                    <button
                        onClick={() => {
                            if (useVideoStore.getState().selectedClipId) {
                                seek(currentTime); // Ensure sync
                                useVideoStore.getState().splitClip(useVideoStore.getState().selectedClipId!, currentTime);
                            }
                        }}
                        className="p-1.5 hover:bg-white/10 rounded group tooltip-container relative"
                        title="Split Clip (S)"
                    >
                        <Scissors className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                    </button>

                    <div className="h-4 w-px bg-white/10 mx-2" />

                    <button className="p-1.5 hover:bg-white/10 rounded disabled:opacity-50" title="Snap to Grid">
                        <Magnet className="w-4 h-4 text-indigo-400" />
                    </button>
                    <button className="p-1.5 hover:bg-white/10 rounded disabled:opacity-50" title="Grid View">
                        <Grid className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-white/10 rounded">
                        <ZoomOut className="w-3 h-3" />
                    </button>
                    <span className="font-mono w-16 text-center">{PX_PER_SEC}px/s</span>
                    <button className="p-1 hover:bg-white/10 rounded">
                        <ZoomIn className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">

                {/* Single Unified Scroll Container for both Headers and Tracks */}
                {/* This ensures vertical scrolling stays in sync across headers and content */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-auto custom-scrollbar bg-slate-900 relative"
                >
                    <div style={{ width: `${Math.max(totalWidth + 192, 100)}px`, minWidth: '100%' }} className="flex flex-col min-h-full">

                        {/* Ruler Area (Needs to offset by header width 192px/w-48) */}
                        <div className="flex h-8 bg-slate-950 sticky top-0 z-30 border-b border-white/10">
                            {/* Empty Corner above headers */}
                            <div className="w-48 flex-shrink-0 bg-slate-950 sticky left-0 z-40 border-r border-white/10" />

                            {/* Actual Ruler */}
                            <div
                                className="flex-1 relative cursor-pointer hover:bg-slate-900/50"
                                onClick={handleSeek}
                            >
                                {Array.from({ length: Math.ceil(duration / 5) + 1 }).map((_, i) => {
                                    const sec = i * 5;
                                    return (
                                        <div
                                            key={sec}
                                            className="absolute top-0 bottom-0 border-l border-white/20 pl-1 text-[10px] text-slate-500 select-none pointer-events-none"
                                            style={{ left: `${sec * PX_PER_SEC}px` }}
                                        >
                                            {sec}s
                                        </div>
                                    )
                                })}
                                {/* Playhead in Ruler */}
                                <div
                                    className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none"
                                    style={{ left: `${currentTime * PX_PER_SEC}px` }}
                                >
                                    <div className="absolute top-0 -translate-x-1/2 -mt-1 w-3 h-3 bg-red-500 rotate-45 transform rounded-sm shadow-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Tracks Container */}
                        <div className="flex-1 relative">
                            {/* Global Playhead Line spanning all tracks */}
                            <div
                                className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                                style={{ left: `${(currentTime * PX_PER_SEC) + 192}px` }} // Offset by header width (w-48 = 192px)
                            />

                            {tracks.map((track, index) => (
                                <Track
                                    key={track.id}
                                    track={track}
                                    trackIndex={index}
                                    pixelsPerSecond={PX_PER_SEC}
                                // Header is now handled internally by Track as sticky
                                />
                            ))}

                            {/* End Duration Line */}
                            <div
                                className="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-white/10"
                                style={{ left: `${(duration * PX_PER_SEC) + 192}px` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
