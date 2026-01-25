import { describe, it, expect } from 'vitest';
import { calculateAudioMix } from '../audio-engine';
import { Clip } from '@/lib/stores/video-store';

// Mock Clip Factory
const createMockClip = (overrides: Partial<Clip> = {}): Clip => ({
    id: 'test-clip-' + Math.random(),
    type: 'audio',
    src: 'test.mp3',
    start: 0,
    end: 10,
    offset: 0,
    duration: 10,
    name: 'Audio Clip',
    properties: { volume: 1, ...overrides.properties },
    ...overrides
});

describe('Audio Engine', () => {
    describe('calculateAudioMix', () => {
        it('should return base volume', () => {
            const clip = createMockClip({ properties: { volume: 0.5 } });
            const mix = calculateAudioMix(clip, 5, []);
            expect(mix.volume).toBe(0.5);
        });

        it('should return 0 when muted', () => {
            const clip = createMockClip({ properties: { volume: 1, mute: true } });
            const mix = calculateAudioMix(clip, 5, []);
            expect(mix.volume).toBe(0);
        });

        it('should handle Fade In', () => {
            const clip = createMockClip({
                start: 0,
                properties: { volume: 1, fadeInDuration: 2 }
            });

            // At 1s (50% of 2s fade)
            const mixHalf = calculateAudioMix(clip, 1, []);
            expect(mixHalf.volume).toBe(0.5);

            // At 2s (Full volume)
            const mixFull = calculateAudioMix(clip, 2, []);
            expect(mixFull.volume).toBe(1);
        });

        it('should handle Fade Out', () => {
            const clip = createMockClip({
                start: 0, end: 10,
                properties: { volume: 1, fadeOutDuration: 2 }
            });

            // End is 10. Fade out starts at 8. 
            // At 9s (1s remaining out of 2s fade)
            const mix = calculateAudioMix(clip, 9, []);
            expect(mix.volume).toBe(0.5);
        });

        it('should handle Auto-Ducking', () => {
            const musicClip = createMockClip({
                id: 'music',
                properties: { volume: 1, isDuckingSource: false, sidechainIntensity: 0.2 }
            });

            const voiceClip = createMockClip({
                id: 'voice',
                properties: { volume: 1, isDuckingSource: true }
            });

            // Case 1: Voice is NOT present in active clips -> No Ducking
            const mixNoCloud = calculateAudioMix(musicClip, 5, []);
            expect(mixNoCloud.isDucked).toBe(false);
            expect(mixNoCloud.volume).toBe(1);

            // Case 2: Voice IS present -> Should Duck
            const mixDucked = calculateAudioMix(musicClip, 5, [voiceClip]);
            expect(mixDucked.isDucked).toBe(true);
            expect(mixDucked.volume).toBe(0.2); // Intensified down to 0.2
        });

        it('should handle Audio Keyframes', () => {
            const clip = createMockClip({
                start: 0,
                properties: {
                    volume: 1,
                    keyframes: [
                        { id: 'k1', time: 0, volume: 0 },
                        { id: 'k2', time: 2, volume: 1 }
                    ]
                }
            });

            // At 1s (Halfway between 0 and 1)
            const mix = calculateAudioMix(clip, 1, []);
            expect(mix.volume).toBe(0.5);
        });
    });
});
