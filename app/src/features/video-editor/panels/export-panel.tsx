"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { videoExporter } from "@/lib/services/video-exporter";
import { Download, Film, FileVideo, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ExportPanel() {
    const { tracks, duration } = useVideoStore();

    const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('720p');
    const [format, setFormat] = useState<'mp4'>('mp4');
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'rendering' | 'encoding' | 'done' | 'error'>('idle');

    const handleExport = async () => {
        try {
            setIsExporting(true);
            setProgress(0);
            setStatus('rendering');

            const width = resolution === '4k' ? 3840 : resolution === '1080p' ? 1920 : 1280;
            const height = resolution === '4k' ? 2160 : resolution === '1080p' ? 1080 : 720;

            const url = await videoExporter.exportComposition({
                width,
                height,
                fps: 30,
                tracks,
                duration,
                onProgress: (p) => {
                    setProgress(p);
                    if (p > 0.99) setStatus('encoding');
                }
            });

            setStatus('done');

            // Auto download
            const a = document.createElement('a');
            a.href = url;
            a.download = `video-${resolution}-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (err) {
            console.error(err);
            setStatus('error');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-bold text-white mb-1">Export</h3>
                <p className="text-xs text-gray-500">Render your video</p>
            </div>

            <div className="flex-1 p-4 space-y-8">
                {/* Settings */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-300">Resolution</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['720p', '1080p', '4k'].map(res => (
                                <button
                                    key={res}
                                    onClick={() => setResolution(res as any)}
                                    className={cn(
                                        "py-2 rounded-lg text-xs font-bold border transition-all",
                                        resolution === res
                                            ? "bg-indigo-600 border-indigo-500 text-white"
                                            : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                                    )}
                                >
                                    {res.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-300">Format</label>
                        <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-between opacity-50 cursor-not-allowed">
                            <span className="text-sm text-gray-300 flex items-center gap-2">
                                <FileVideo className="w-4 h-4 text-indigo-400" /> MP4 (H.264)
                            </span>
                            <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">Default</span>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="p-4 bg-black/20 rounded-lg border border-gray-800 text-xs space-y-2">
                    <div className="flex justify-between text-gray-400">
                        <span>Duration</span>
                        <span className="text-white">{duration}s</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>FPS</span>
                        <span className="text-white">30</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>Est. Size</span>
                        <span className="text-white">~{Math.round(duration * (resolution === '4k' ? 5 : resolution === '1080p' ? 2 : 1))} MB</span>
                    </div>
                </div>

                {/* Status / Output */}
                <div className="pt-4 border-t border-gray-800">
                    {status === 'rendering' || status === 'encoding' ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className={cn("flex items-center gap-2", status === 'encoding' ? "text-indigo-400 animate-pulse" : "text-gray-300")}>
                                    {status === 'rendering' ? "Rendering Frames..." : "Encoding Video..."}
                                </span>
                                <span className="text-gray-400">{Math.round(progress * 100)}%</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                                    style={{ width: `${progress * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : status === 'done' ? (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                            <p className="text-sm font-bold text-green-400">Export Complete!</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="text-xs text-green-500/80 hover:text-green-400 underline"
                            >
                                Export Another
                            </button>
                        </div>
                    ) : status === 'error' ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center space-y-2">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                            <p className="text-sm font-bold text-red-400">Export Failed</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="text-xs text-red-500/80 hover:text-red-400 underline"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleExport}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-indigo-900/20"
                        >
                            <Download className="w-5 h-5" /> Export Video
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
