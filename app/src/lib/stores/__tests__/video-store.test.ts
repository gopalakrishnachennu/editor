import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVideoStore } from '../video-store';

// Mock nanoid to have predictable IDs
vi.mock('nanoid', () => ({
    nanoid: () => 'test-id-' + Math.random().toString(36).substr(2, 9)
}));

// Mock Zustand Persist to bypass storage completely
vi.mock('zustand/middleware', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual as any,
        persist: (config: any) => config,
    };
});

describe('Video Store', () => {
    // Reset store before each test
    beforeEach(() => {
        vi.clearAllMocks();
        useVideoStore.setState({
            tracks: [
                { id: 'track-1', name: 'Video', type: 'video', clips: [] }
            ],
            duration: 30,
            currentTime: 0,
            selectedClipId: null,
            isPlaying: false,
            zoom: 1
        });
    });

    it('should initialize with default state', () => {
        const state = useVideoStore.getState();
        expect(state.tracks).toHaveLength(1);
        expect(state.duration).toBe(30);
    });

    it('should add a track', () => {
        useVideoStore.getState().addTrack('audio');
        const state = useVideoStore.getState();
        expect(state.tracks).toHaveLength(2);
        expect(state.tracks[1].type).toBe('audio');
    });

    it('should add a clip to a track', () => {
        const trackId = 'track-1';
        useVideoStore.getState().addClip(trackId, { name: 'Test Clip', duration: 5 });

        const state = useVideoStore.getState();
        const track = state.tracks.find(t => t.id === trackId);

        expect(track?.clips).toHaveLength(1);
        expect(track?.clips[0].name).toBe('Test Clip');
        expect(track?.clips[0].start).toBe(0);
        expect(track?.clips[0].end).toBe(5);
    });

    it('should move a clip', () => {
        const trackId = 'track-1';
        useVideoStore.getState().addClip(trackId, { duration: 5 });
        const clipId = useVideoStore.getState().tracks[0].clips[0].id;

        // Move to 10s
        useVideoStore.getState().moveClip(clipId, 10);

        const state = useVideoStore.getState();
        const clip = state.tracks[0].clips[0];

        expect(clip.start).toBe(10);
        expect(clip.end).toBe(15);
    });

    it('should split a clip', () => {
        const trackId = 'track-1';
        // Add 10s clip
        useVideoStore.getState().addClip(trackId, { duration: 10 });
        const clipId = useVideoStore.getState().tracks[0].clips[0].id;

        // Split at 4s
        useVideoStore.getState().splitClip(clipId, 4);

        const state = useVideoStore.getState();
        const clips = state.tracks[0].clips;

        expect(clips).toHaveLength(2);

        // First part: 0 to 4
        expect(clips[0].start).toBe(0);
        expect(clips[0].duration).toBe(4);

        // Second part: 4 to 10
        expect(clips[1].start).toBe(4);
        expect(clips[1].duration).toBe(6);
        expect(clips[1].offset).toBe(4); // Offset should increase
    });

    it('should resize a clip', () => {
        const trackId = 'track-1';
        useVideoStore.getState().addClip(trackId, { duration: 5 });
        const clipId = useVideoStore.getState().tracks[0].clips[0].id;

        useVideoStore.getState().resizeClip(clipId, 8);

        const state = useVideoStore.getState();
        const clip = state.tracks[0].clips[0];

        expect(clip.duration).toBe(8);
        expect(clip.end).toBe(8);
    });
});
