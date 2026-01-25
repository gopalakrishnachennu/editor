"use client";

import { useVideoStore, Clip } from "@/lib/stores/video-store";
import { useContextMenuStore } from "@/lib/stores/context-menu-store";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { Waveform } from "./waveform";

interface ClipItemProps {
    clip: Clip;
    trackIndex: number;
    pixelsPerSecond: number;
}

export function ClipItem({ clip, trackIndex, pixelsPerSecond }: ClipItemProps) {
    const { selectedClipId, tracks, moveClip, moveClipToTrack, resizeClip, resizeClipLeft, currentTime } = useVideoStore();
    const { openMenu } = useContextMenuStore();
    const isSelected = selectedClipId === clip.id;

    const left = clip.start * pixelsPerSecond;
    const width = clip.duration * pixelsPerSecond;

    // --- Interaction Handlers ---

    const handleDragStart = (e: React.MouseEvent, type: "move" | "resize-left" | "resize-right") => {
        e.stopPropagation();
        useVideoStore.setState({ selectedClipId: clip.id });

        const startX = e.clientX;
        const startY = e.clientY;
        const initialStart = clip.start;
        const initialDuration = clip.duration;
        const TRACK_HEIGHT = 96;

        // Snapping Threshold (e.g., 10 pixels converted to seconds)
        const SNAP_THRESHOLD_S = 10 / pixelsPerSecond;

        const handleMouseMove = (ev: MouseEvent) => {
            const deltaPixelsX = ev.clientX - startX;
            const deltaPixelsY = ev.clientY - startY;
            const deltaSeconds = deltaPixelsX / pixelsPerSecond;

            if (type === "move") {
                // Calculate target track
                const trackDelta = Math.round(deltaPixelsY / TRACK_HEIGHT);
                const targetIndex = Math.max(0, Math.min(tracks.length - 1, trackIndex + trackDelta));

                let newStart = initialStart + deltaSeconds;

                // --- SNAP TO PLAYHEAD ---
                if (Math.abs(newStart - currentTime) < SNAP_THRESHOLD_S) {
                    newStart = currentTime;
                }

                // Allow snapping to 0 as well
                if (Math.abs(newStart) < SNAP_THRESHOLD_S) {
                    newStart = 0;
                }

                // If staying on same track, use simple move
                if (targetIndex === trackIndex) {
                    moveClip(clip.id, newStart);
                } else {
                    // Moving to new track - verify compatibility if needed
                    // For now assuming all tracks accept all clips or store handles it.
                    const targetTrackId = tracks[targetIndex].id;
                    moveClipToTrack(clip.id, targetTrackId, newStart);
                }
            } else if (type === "resize-right") {
                let newDuration = initialDuration + deltaSeconds;
                // Snap end to playhead? (newStart + newDuration) ~= currentTime
                if (Math.abs((initialStart + newDuration) - currentTime) < SNAP_THRESHOLD_S) {
                    newDuration = currentTime - initialStart;
                }
                resizeClip(clip.id, newDuration);
            } else if (type === "resize-left") {
                let newStart = initialStart + deltaSeconds;
                // Snap start to playhead
                if (Math.abs(newStart - currentTime) < SNAP_THRESHOLD_S) {
                    newStart = currentTime;
                }
                if (Math.abs(newStart) < SNAP_THRESHOLD_S) newStart = 0;

                resizeClipLeft(clip.id, newStart);
            }
        };

        const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <div
            className={cn(
                "absolute top-1 bottom-1 rounded-md border text-xs overflow-hidden cursor-pointer transition-colors shadow-sm select-none group/clip",
                // Type-based colors (when not selected)
                !isSelected && clip.type === 'video' && "bg-blue-600/80 border-blue-500 hover:bg-blue-600",
                !isSelected && clip.type === 'image' && "bg-emerald-600/80 border-emerald-500 hover:bg-emerald-600",
                !isSelected && clip.type === 'audio' && "bg-amber-600/80 border-amber-500 hover:bg-amber-600",
                !isSelected && clip.type === 'text' && "bg-purple-600/80 border-purple-500 hover:bg-purple-600",

                // Selected state (overrides type color)
                isSelected
                    ? "bg-indigo-600 border-indigo-400 text-white z-20 ring-2 ring-white/20"
                    : "text-gray-100 z-10"
            )}
            style={{
                left: `${left}px`,
                width: `${width}px`,
            }}
            onMouseDown={(e) => handleDragStart(e, "move")}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                useVideoStore.setState({ selectedClipId: clip.id });
                openMenu({ x: e.clientX, y: e.clientY }, clip.type === 'text' ? 'text' : 'clip', { clipId: clip.id });
            }}
        >
            {/* Waveform Background (Audio/Video only) */}
            {(clip.type === 'audio' || clip.type === 'video') && (
                <div className="absolute inset-0 z-0 opacity-50 mix-blend-overlay pointer-events-none">
                    <Waveform
                        width={width}
                        height={40}
                        color={isSelected ? "#ffffff" : "#e0e7ff"}
                        isMuted={clip.properties.mute}
                        seed={clip.id}
                    />
                </div>
            )}

            {/* Clip Content */}
            <div className="absolute inset-0 flex items-center px-2 gap-2 pointer-events-none z-10">
                {/* Drag Handle (Visual) */}
                <GripVertical className="w-3 h-3 opacity-50" />
                <span className="truncate font-medium drop-shadow-md">{clip.name}</span>
            </div>

            {/* Resize Handles */}
            <div
                className="absolute left-0 top-0 bottom-0 w-2 hover:bg-white/20 cursor-col-resize z-30"
                onMouseDown={(e) => handleDragStart(e, "resize-left")}
            />
            <div
                className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/20 cursor-col-resize z-30"
                onMouseDown={(e) => handleDragStart(e, "resize-right")}
            />
        </div>
    );
}
