'use client';

import { useVideoStore } from '@/lib/stores/video-store';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export function ZoomControls() {
    const { zoom, setZoom } = useVideoStore();

    return (
        <div className="flex items-center gap-1 text-white">
            <button
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                title="Zoom Out"
            >
                <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono w-12 text-center select-none">
                {Math.round(zoom * 100)}%
            </span>

            <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                title="Zoom In"
            >
                <ZoomIn className="w-4 h-4" />
            </button>

            <button
                onClick={() => setZoom(1)}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors ml-1 border-l border-white/10 pl-2"
                title="Reset Zoom"
            >
                <Maximize className="w-3 h-3" />
            </button>
        </div>
    );
}
