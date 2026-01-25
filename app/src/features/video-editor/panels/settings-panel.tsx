"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { Save, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";

export function SettingsPanel() {
    const store = useVideoStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSaveProject = () => {
        try {
            const projectState = {
                version: "2.0",
                timestamp: Date.now(),
                tracks: store.tracks,
                duration: store.duration,
                fps: store.fps
            };

            const blob = new Blob([JSON.stringify(projectState, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `project-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                // Basic validation
                if (!json.tracks || !Array.isArray(json.tracks)) {
                    throw new Error("Invalid project file");
                }

                store.loadProject(json);
                setStatus('success');
                setTimeout(() => setStatus('idle'), 2000);
            } catch (err) {
                console.error(err);
                setStatus('error');
                alert("Failed to load project file. It might be corrupted.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-bold text-white mb-1">Project Settings</h3>
                <p className="text-xs text-gray-500">Save and Load</p>
            </div>

            <div className="p-4 space-y-6">

                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Canvas Size</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => store.setCanvasSize(1080, 1920)}
                            className={`p-2 rounded text-xs border transition-colors ${store.canvasSize.width === 1080 && store.canvasSize.height === 1920 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            9:16 (Story)
                        </button>
                        <button
                            onClick={() => store.setCanvasSize(1920, 1080)}
                            className={`p-2 rounded text-xs border transition-colors ${store.canvasSize.width === 1920 && store.canvasSize.height === 1080 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            16:9 (Video)
                        </button>
                        <button
                            onClick={() => store.setCanvasSize(1080, 1080)}
                            className={`p-2 rounded text-xs border transition-colors ${store.canvasSize.width === 1080 && store.canvasSize.height === 1080 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            1:1 (Square)
                        </button>
                        <button
                            onClick={() => store.setCanvasSize(1080, 1350)}
                            className={`p-2 rounded text-xs border transition-colors ${store.canvasSize.width === 1080 && store.canvasSize.height === 1350 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            4:5 (Portrait)
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Storage</h4>

                    <button
                        onClick={handleSaveProject}
                        className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-lg flex items-center justify-center gap-2 transition-all group"
                    >
                        <Save className="w-4 h-4 text-gray-400 group-hover:text-white" />
                        <span className="text-xs font-medium text-gray-300 group-hover:text-white">Save Project (.json)</span>
                    </button>

                    <div className="relative">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleLoadProject}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500 rounded-lg flex items-center justify-center gap-2 transition-all group"
                        >
                            <Upload className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                            <span className="text-xs font-medium text-indigo-300 group-hover:text-indigo-200">Load Project</span>
                        </button>
                    </div>
                </div>

                {status === 'success' && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-400">Project action successful!</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-red-400">Something went wrong.</span>
                    </div>
                )}

                <div className="pt-6 border-t border-gray-800">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About</h4>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                        Video Editor v2.0 "Flash" <br />
                        Built with Next.js + FFmpeg.wasm <br />
                        &copy; 2024
                    </p>
                </div>

            </div>
        </div>
    );
}
