"use client";

import { useState, useRef } from "react";
import { Player } from "@remotion/player";
import { useVideoStore } from "@/lib/stores/video-store";
import { Play, Pause, ChevronLeft, Settings, Video, Type, Music, Download } from "lucide-react";
import Link from "next/link";
import { MotionControls } from "@/components/video-editor/panels/motion-controls";
import { AudioControls } from "@/components/video-editor/panels/audio-controls";
import { TextControls } from "@/components/video-editor/panels/text-controls";
import { Timeline } from "@/components/video-editor/timeline/timeline";
import { VideoComposition } from "@/components/video-editor/canvas/video-composition";
import { SafeAreaOverlay } from "@/components/video-editor/canvas/safe-area-overlay";
import { useVideoExport } from "@/hooks/use-video-export";
import { logger } from "@/lib/logger";

export default function VideoEditorPage() {
    const {
        width,
        height,
        fps,
        durationInFrames,
        isPlaying,
        setPlaying,
        currentTime,
        seek
    } = useVideoStore();

    const playerContainerRef = useRef<HTMLDivElement>(null);
    const { exportVideo, progress, isExporting } = useVideoExport();

    // --- Frame Export Logic ---
    const handleExportImage = async () => {
        const timer = logger.time('video-editor', 'Export PNG Frame');
        logger.info('video-editor', 'Exporting frame as PNG', { currentTime, fps });

        try {
            const node = document.getElementById("video-composition-container");
            if (node) {
                // Dynamic import to avoid SSR issues
                const { toPng } = await import("html-to-image");
                const dataUrl = await toPng(node);
                const link = document.createElement("a");
                link.download = `reel-frame-${currentTime}.png`;
                link.href = dataUrl;
                link.click();
                timer.end({ fileName: link.download });
                logger.info('video-editor', 'Frame exported successfully');
            }
        } catch (err) {
            logger.exception('video-editor', err as Error, { action: 'export_frame', currentTime });
        }
    };

    const handleSaveProject = () => {
        logger.info('video-editor', 'Saving project as JSON');
        const state = useVideoStore.getState();
        const data = JSON.stringify({ clips: state.clips, tracks: state.tracks }, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "my-reel-project.json";
        link.href = url;
        link.click();
        logger.info('video-editor', 'Project saved', {
            clipCount: Object.keys(state.clips).length,
            trackCount: state.tracks.length,
            fileSize: blob.size
        });
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <span className="font-bold text-lg tracking-tight">Reel Editor <span className="text-xs font-normal text-gray-500 ml-2">Beta</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => playerContainerRef.current && exportVideo(playerContainerRef.current)}
                        disabled={isExporting}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2 shadow-lg"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? `Exporting ${progress}%` : "Export MP4"}
                    </button>
                    <button
                        onClick={handleExportImage}
                        disabled={isExporting}
                        className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        Save Frame
                    </button>
                    <button
                        onClick={handleSaveProject}
                        className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
                    >
                        Save Project
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar (Assets) */}
                <div className="w-72 border-r border-gray-800 bg-gray-900 flex flex-col">
                    <div className="flex items-center p-2 gap-1 border-b border-gray-800">
                        <button className="flex-1 py-4 flex flex-col items-center gap-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-indigo-400">
                            <Video className="w-6 h-6" />
                            <span className="text-xs font-medium">Media</span>
                        </button>
                        <button className="flex-1 py-4 flex flex-col items-center gap-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-indigo-400">
                            <Type className="w-6 h-6" />
                            <span className="text-xs font-medium">Text</span>
                        </button>
                        <button className="flex-1 py-4 flex flex-col items-center gap-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-indigo-400">
                            <Music className="w-6 h-6" />
                            <span className="text-xs font-medium">Audio</span>
                        </button>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-gray-500 mb-4">Drag and drop assets here</p>
                        {/* Asset Grid Placeholder */}
                        <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-square bg-gray-800 rounded-lg border border-gray-700 hover:border-indigo-500 cursor-pointer transition"></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Canvas Area (Player) */}
                <div className="flex-1 bg-gray-950 flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div
                            id="video-composition-container"
                            className="relative shadow-2xl shadow-black/50 overflow-hidden rounded-lg aspect-[9/16] h-full max-h-[85vh]"
                        >
                            <Player
                                component={VideoComposition}
                                durationInFrames={durationInFrames}
                                compositionWidth={width}
                                compositionHeight={height}
                                fps={fps}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                }}
                                controls={true} // Use built-in controls for Phase 1
                                inputProps={{}}
                            />
                            {/* Safe Area Overlay */}
                            <SafeAreaOverlay />
                        </div>
                    </div>
                </div>

                {/* Properties Panel */}
                <div className="w-80 border-l border-gray-800 bg-gray-900 p-4 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Properties</h3>
                    <TextControls />
                    <MotionControls />
                    <AudioControls />
                </div>
            </div>

            {/* Timeline Area (Bottom) */}
            <div className="h-72 flex-shrink-0 flex flex-col z-0">
                <Timeline />
            </div>
        </div>
    );
}
