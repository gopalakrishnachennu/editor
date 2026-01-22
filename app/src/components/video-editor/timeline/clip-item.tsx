"use client";

import { useVideoStore, Clip } from "@/lib/stores/video-store";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface ClipItemProps {
    clip: Clip;
    pixelsPerFrame: number;
}

export function ClipItem({ clip, pixelsPerFrame }: ClipItemProps) {
    const { selectedClipId, updateClip, moveClip, resizeClip } = useVideoStore();
    const isSelected = selectedClipId === clip.id;

    const left = clip.startAt * pixelsPerFrame;
    const width = clip.duration * pixelsPerFrame;

    // --- Interaction Handlers ---

    const handleDragStart = (e: React.MouseEvent, type: "move" | "resize-left" | "resize-right") => {
        e.stopPropagation();
        useVideoStore.setState({ selectedClipId: clip.id });

        const startX = e.clientX;
        const initialStart = clip.startAt;
        const initialDuration = clip.duration;

        const handleMouseMove = (ev: MouseEvent) => {
            const deltaPixels = ev.clientX - startX;
            const deltaFrames = Math.round(deltaPixels / pixelsPerFrame);

            if (type === "move") {
                moveClip(clip.id, initialStart + deltaFrames);
            } else if (type === "resize-right") {
                resizeClip(clip.id, initialDuration + deltaFrames);
            }
            // Resize left is trickier (affects start + duration), Phase 2
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
                "absolute top-1 bottom-1 rounded-md border text-xs overflow-hidden cursor-pointer transition-colors shadow-sm select-none",
                isSelected
                    ? "bg-indigo-600 border-indigo-400 text-white z-20"
                    : "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500 z-10"
            )}
            style={{
                left: `${left}px`,
                width: `${width}px`,
            }}
            onMouseDown={(e) => handleDragStart(e, "move")}
        >
            {/* Clip Content */}
            <div className="h-full w-full flex items-center px-2 gap-2 pointer-events-none">
                {/* Drag Handle (Visual) */}
                <GripVertical className="w-3 h-3 opacity-50" />
                <span className="truncate font-medium">{clip.name}</span>
            </div>

            {/* Resize Handles */}
            <div
                className="absolute left-0 top-0 bottom-0 w-2 hover:bg-white/20 cursor-col-resize z-30"
            // onMouseDown={(e) => handleDragStart(e, "resize-left")} // Phase 2
            />
            <div
                className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/20 cursor-col-resize z-30"
                onMouseDown={(e) => handleDragStart(e, "resize-right")}
            />
        </div>
    );
}
