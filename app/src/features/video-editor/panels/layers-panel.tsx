"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { ArrowUp, ArrowDown, GripVertical, Layers, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function LayersPanel() {
    const { tracks, currentTime, selectedClipId, setSelectedClip, updateClip } = useVideoStore();

    // Get all visual clips (videos, images, text) that are currently visible on the playhead
    // or generally all clips in the project to manage specific layer order.
    // For this MVP, we will list ALL clips from visual tracks, grouped by track or flattened.
    // Flattening them based on 'z-index' (which effectively is just track order + clip order)
    // In our engine, Track 0 is bottom, Track N is top.

    // We display tracks in reverse order (Top layers first)
    const visualTracks = [...tracks].reverse().filter(t => t.type !== 'audio');

    return (
        <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-bold text-white mb-1">Layers</h3>
                <p className="text-xs text-gray-500">Manage stacking order</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {visualTracks.map((track) => {
                    // Filter clips relevant to current time? Or just all?
                    // Let's show all clips in the track for now, but highlight active ones.
                    const clipsToShow = track.clips.sort((a, b) => a.start - b.start);

                    return (
                        <div key={track.id} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-800">
                            <div className="p-2 bg-gray-800 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase">{track.name}</span>
                                <div className="flex gap-1">
                                    {/* Mock Actions for Track Reordering could go here */}
                                </div>
                            </div>

                            <div className="divide-y divide-gray-800">
                                {clipsToShow.length === 0 && <div className="p-2 text-[10px] text-gray-600 italic">No clips</div>}
                                {clipsToShow.map(clip => {
                                    const isActive = currentTime >= clip.start && currentTime < clip.end;
                                    const isSelected = selectedClipId === clip.id;

                                    return (
                                        <div
                                            key={clip.id}
                                            onClick={() => setSelectedClip(clip.id)}
                                            className={cn(
                                                "p-2 flex items-center gap-2 cursor-pointer transition-colors hover:bg-gray-700/50",
                                                isSelected ? "bg-indigo-900/30 border-l-2 border-indigo-500" : "border-l-2 border-transparent",
                                                !isActive && "opacity-50"
                                            )}
                                        >
                                            <GripVertical className="w-3 h-3 text-gray-600" />
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-xs font-medium truncate", isSelected ? "text-white" : "text-gray-300")}>
                                                    {clip.name}
                                                </p>
                                                <p className="text-[10px] text-gray-500">
                                                    {clip.type} • {clip.start.toFixed(1)}s - {clip.end.toFixed(1)}s
                                                </p>
                                            </div>
                                            {/* Visibility Toggle (Mock) */}
                                            <button className="text-gray-500 hover:text-white">
                                                <Eye className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}

                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500">
                        Tracks are stacked from bottom to top. <br />
                        Track 1 is background, Top Track is foreground.
                    </p>
                </div>
            </div>
        </div>
    );
}
