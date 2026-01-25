/**
 * Audio Debug Logger ("Antigravity Audio Scope")
 * Provides developer-grade observability into the mixing engine.
 */

type AudioEvent = 'mix' | 'duck' | 'keyframe' | 'effect' | 'clipper';

interface AudioLogData {
    baseVol?: number;
    duckingFactor?: number;
    finalVol?: number;
    pan?: number;
    source?: string; // which clip caused the ducking
    [key: string]: any;
}

import { useDebugStore } from "@/lib/stores/debug-store";

// Throttle logs to avoid 60fps console spam
const lastLogs: Record<string, number> = {};

export const logAudio = (clipId: string, event: AudioEvent, data: AudioLogData) => {
    const now = Date.now();
    const key = `${clipId}-${event}`;

    // Only log every 500ms per clip/event type unless it's a critical 'clipper' warning
    if (event !== 'clipper' && lastLogs[key] && now - lastLogs[key] < 500) {
        return;
    }
    lastLogs[key] = now;

    const emoji = {
        'mix': '🎚',
        'duck': '🦅', // Ducking
        'keyframe': '💎',
        'effect': '🎛',
        'clipper': '🔴'
    }[event];

    const message = `${emoji} Clip: ${clipId.slice(-4)} | ${event.toUpperCase()}`;

    // Console fallback
    console.log(`[AudioLogger] ${message}`, data);

    // Visual Debugger
    useDebugStore.getState().addLog('audio', message, data);
};
