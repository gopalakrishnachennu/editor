"use client";

import { useDebugStore } from "@/lib/stores/debug-store";
import { cn } from "@/lib/utils";
import { X, Trash2, Terminal } from "lucide-react";
import { useEffect, useRef } from "react";

export function DebugOverlay() {
    const { logs, isEnabled, toggleDebug, clearLogs } = useDebugStore();
    const endRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (isEnabled) {
            endRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, isEnabled]);

    if (!isEnabled) {
        return (
            <button
                onClick={toggleDebug}
                className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-black/80 text-green-500 rounded-md border border-green-500/30 backdrop-blur-sm z-50 transition-all opacity-0 hover:opacity-100"
                title="Open Debugger"
            >
                <Terminal className="w-4 h-4" />
            </button>
        );
    }

    return (
        <div className="absolute top-2 left-2 w-80 max-h-[300px] flex flex-col bg-black/90 border border-green-500/30 rounded-lg shadow-2xl backdrop-blur-md z-50 font-mono text-[10px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b border-green-500/20 bg-green-500/5">
                <span className="text-green-400 font-bold flex items-center gap-2">
                    <Terminal className="w-3 h-3" /> AG_DEBUG_CONSOLE
                </span>
                <div className="flex gap-1">
                    <button onClick={clearLogs} className="p-1 hover:text-red-400 text-gray-500"><Trash2 className="w-3 h-3" /></button>
                    <button onClick={toggleDebug} className="p-1 hover:text-white text-gray-500"><X className="w-3 h-3" /></button>
                </div>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {logs.length === 0 && (
                    <div className="text-gray-600 italic text-center py-4">Waiting for events...</div>
                )}
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-150">
                        <span className="text-gray-500 flex-shrink-0">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
                        <div className="flex flex-col">
                            <span className={cn(
                                "font-bold",
                                log.category === 'audio' && "text-blue-400",
                                log.category === 'anim' && "text-purple-400",
                                log.category === 'system' && "text-gray-400"
                            )}>
                                {log.message}
                            </span>
                            {log.data && (
                                <span className="text-gray-500 truncate max-w-[180px]">
                                    {JSON.stringify(log.data)}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
}
