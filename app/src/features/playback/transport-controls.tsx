'use client';

import { useVideoStore } from '@/lib/stores/video-store';
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TransportControls({ className }: { className?: string }) {
    const { isPlaying, play, pause, seek, currentTime, duration } = useVideoStore();

    const formatTime = (time: number) => {
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    return (
        <div className={cn("flex items-center gap-6 px-4 py-2", className)}>
            {/* Simple Time */}
            <div className="font-mono text-xs font-medium text-slate-400 w-16 text-right tabular-nums">
                {formatTime(currentTime)}
            </div>

            {/* Minimalist Controls */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => seek(0)}
                    className="group"
                    title="Start"
                >
                    <SkipBack className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>

                <button
                    onClick={() => isPlaying ? pause() : play()}
                    className="p-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full transition-transform active:scale-95 flex items-center justify-center"
                >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current pl-0.5" />}
                </button>

                <button
                    onClick={() => seek(duration)}
                    className="group"
                    title="End"
                >
                    <SkipForward className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>
            </div>

            {/* Duration */}
            <div className="font-mono text-xs font-medium text-slate-600 w-16 tabular-nums">
                {formatTime(duration)}
            </div>
        </div>
    );
}
