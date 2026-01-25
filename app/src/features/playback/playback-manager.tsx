'use client';

import { useVideoStore } from '@/lib/stores/video-store';
import { useEffect, useRef } from 'react';

export function PlaybackManager() {
    const { isPlaying, duration, currentTime, seek, pause } = useVideoStore();
    const lastTimeRef = useRef<number | null>(null);
    const requestRef = useRef<number | null>(null);

    const updateLoop = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;

        const deltaTime = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        if (isPlaying) {
            const state = useVideoStore.getState();
            let newTime = state.currentTime + deltaTime;

            if (newTime >= duration) {
                newTime = duration;
                pause();
            }

            // We use a "fast" update if available, but for now strict strict state update
            // To avoid too many re-renders, normally we might use a transient store 
            // but here we just update the main store.
            useVideoStore.setState({ currentTime: newTime });
        }

        requestRef.current = requestAnimationFrame(updateLoop);
    };

    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = null;
            requestRef.current = requestAnimationFrame(updateLoop);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            lastTimeRef.current = null;
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, duration]);

    return null; // Logic only
}
