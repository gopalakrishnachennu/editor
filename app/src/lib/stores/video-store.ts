import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

// --- Types ---

export type TrackType = "video" | "audio" | "text" | "overlay";

export interface Clip {
    id: string;
    trackId: string;
    type: "video" | "image" | "text" | "audio";
    startAt: number; // Global start time in frames
    duration: number; // Length in frames
    src?: string; // Content source (URL or text)
    props: Record<string, any>; // Style, volume, misc
    animation: {
        enter?: { id: string; duration?: number };
        exit?: { id: string; duration?: number };
        idle?: { id: string };
    };
    // Audio constraints
    volume: number; // 0 to 1
    fadeInDuration: number;
    fadeOutDuration: number;
    // Text specific
    textStyle?: {
        fontSize: number;
        color: string;
        backgroundColor?: string;
        align: "center" | "bottom";
    };
    name: string;
}

export interface Track {
    id: string;
    type: TrackType;
    name: string;
    isMuted: boolean;
    isLocked: boolean;
    isVoiceTrack: boolean; // Triggers ducking on other tracks if true
    clips: string[];
}

export interface VideoState {
    // Project Settings
    fps: number;
    durationInFrames: number;
    width: number;
    height: number;

    // Timeline State
    isPlaying: boolean;
    currentTime: number; // Current frame
    zoom: number; // Timeline zoom level

    // Content
    tracks: Track[];
    clips: Record<string, Clip>; // Normalized clip store

    // Selection
    selectedClipId: string | null;

    // Actions
    addTrack: (type: TrackType) => void;
    addClip: (trackId: string, clip: Partial<Clip>) => void;
    updateClip: (clipId: string, updates: Partial<Clip>) => void;
    deleteClip: (clipId: string) => void;
    moveClip: (clipId: string, newStartAt: number) => void;
    resizeClip: (clipId: string, newDuration: number) => void;
    setPlaying: (playing: boolean) => void;
    seek: (frame: number) => void;
}

// --- Store ---

export const useVideoStore = create<VideoState>((set, get) => ({
    // Defaults for Reels (9:16, 30fps, 15s)
    fps: 30,
    durationInFrames: 30 * 15,
    width: 1080,
    height: 1920,

    isPlaying: false,
    currentTime: 0,
    zoom: 1,

    tracks: [
        { id: "track-1", type: "video", name: "Main Video", isMuted: false, isLocked: false, isVoiceTrack: true, clips: ["clip-1", "clip-2"] },
        { id: "track-2", type: "text", name: "Overlays", isMuted: false, isLocked: false, isVoiceTrack: false, clips: ["clip-3"] },
        { id: "track-3", type: "audio", name: "Music", isMuted: false, isLocked: false, isVoiceTrack: false, clips: [] },
    ],
    clips: {
        "clip-1": {
            id: "clip-1", trackId: "track-1", type: "video", startAt: 0, duration: 60, name: "Intro Scene", props: {},
            animation: { enter: { id: "fade-in" }, exit: { id: "none" }, idle: { id: "slow-zoom" } },
            volume: 1, fadeInDuration: 0, fadeOutDuration: 0
        },
        "clip-2": {
            id: "clip-2", trackId: "track-1", type: "video", startAt: 60, duration: 90, name: "Product Demo", props: {},
            animation: { enter: { id: "slide-up" }, exit: { id: "none" }, idle: { id: "none" } },
            volume: 1, fadeInDuration: 0, fadeOutDuration: 0
        },
        "clip-3": {
            id: "clip-3", trackId: "track-2", type: "text", startAt: 10, duration: 40, name: "Title Text", props: {},
            animation: { enter: { id: "pop" }, exit: { id: "fade-out" }, idle: { id: "none" } },
            volume: 1, fadeInDuration: 0, fadeOutDuration: 0,
            textStyle: { fontSize: 80, color: "#ffffff", align: "center" }
        },
    },
    selectedClipId: null,

    addTrack: (type) => set((state) => ({
        tracks: [...state.tracks, {
            id: `track-${uuidv4()}`,
            type,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track`,
            isMuted: false,
            isLocked: false,
            isVoiceTrack: type === "video" || type === "audio", // Default assumption
            clips: []
        }]
    })),

    addClip: (trackId, clipData) => set((state) => {
        const newClipId = uuidv4();
        const newClip: Clip = {
            id: newClipId,
            trackId,
            type: clipData.type || "video",
            startAt: clipData.startAt || 0,
            duration: clipData.duration || 90, // 3s default
            name: clipData.name || "New Clip",
            props: clipData.props || {},
            animation: clipData.animation || { enter: { id: "none" }, exit: { id: "none" }, idle: { id: "none" } },
            volume: clipData.volume ?? 1,
            fadeInDuration: clipData.fadeInDuration ?? 0,
            fadeOutDuration: clipData.fadeOutDuration ?? 0,
            src: clipData.src
        };

        return {
            clips: { ...state.clips, [newClipId]: newClip },
            tracks: state.tracks.map(track =>
                track.id === trackId
                    ? { ...track, clips: [...track.clips, newClipId] }
                    : track
            )
        };
    }),

    updateClip: (clipId, updates) => set((state) => ({
        clips: {
            ...state.clips,
            [clipId]: { ...state.clips[clipId], ...updates }
        }
    })),

    deleteClip: (clipId) => set((state) => {
        const { [clipId]: deleted, ...remainingClips } = state.clips;
        return {
            clips: remainingClips,
            tracks: state.tracks.map(track => ({
                ...track,
                clips: track.clips.filter(id => id !== clipId)
            }))
        };
    }),

    // --- Advanced Actions ---

    moveClip: (clipId: string, newStartAt: number) => set((state) => {
        const clip = state.clips[clipId];
        if (!clip) return {};

        // 1. Magnetic Snapping (Snap to adjacent clips on same track)
        const SNAP_THRESHOLD = 5; // Frames
        let snappedStart = newStartAt;

        const trackClips = state.tracks
            .find(t => t.id === clip.trackId)
            ?.clips.map(id => state.clips[id])
            .filter(c => c.id !== clipId) || [];

        for (const other of trackClips) {
            // Snap to End of other clip
            if (Math.abs(snappedStart - (other.startAt + other.duration)) < SNAP_THRESHOLD) {
                snappedStart = other.startAt + other.duration;
            }
            // Snap to Start of other clip (End of this clip snaps to Start of other)
            if (Math.abs((snappedStart + clip.duration) - other.startAt) < SNAP_THRESHOLD) {
                snappedStart = other.startAt - clip.duration;
            }
        }

        // 0. Boundary Check
        if (snappedStart < 0) snappedStart = 0;

        // 2. Collision Detection (Prevent Overlap on same track)
        // Simple strategy: If overlap, revert (or push - Phase 2)
        const hasOverlap = trackClips.some(other => {
            const A_start = snappedStart;
            const A_end = snappedStart + clip.duration;
            const B_start = other.startAt;
            const B_end = other.startAt + other.duration;
            return (A_start < B_end && A_end > B_start);
        });

        if (hasOverlap) return {}; // Block move if overlap (basic protection)

        return {
            clips: {
                ...state.clips,
                [clipId]: { ...clip, startAt: snappedStart }
            }
        };
    }),

    resizeClip: (clipId: string, newDuration: number) => set((state) => {
        const clip = state.clips[clipId];
        if (!clip) return {};
        if (newDuration < 1) return {}; // Min 1 frame

        // Check collision with next clip
        const trackClips = state.tracks
            .find(t => t.id === clip.trackId)
            ?.clips.map(id => state.clips[id])
            .filter(c => c.id !== clipId) || [];

        const isBlocked = trackClips.some(other => {
            if (other.startAt < clip.startAt) return false; // Ignore previous clips
            return (clip.startAt + newDuration) > other.startAt;
        });

        if (isBlocked) return {}; // Prevent extending into neighbor

        return {
            clips: {
                ...state.clips,
                [clipId]: { ...clip, duration: newDuration }
            }
        };
    }),

    setPlaying: (playing) => set({ isPlaying: playing }),
    seek: (frame) => set({ currentTime: frame }),
}));
