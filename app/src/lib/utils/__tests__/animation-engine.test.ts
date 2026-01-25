import { describe, it, expect } from 'vitest';
import { calculateAnimationState } from '../animation-engine';
import { Clip } from '@/lib/stores/video-store';

// Mock Clip Factory
const createMockClip = (animationConfig?: any): Clip => ({
    id: 'test-clip',
    type: 'image',
    src: 'test.jpg',
    start: 0,
    end: 5,
    layer: 1,
    properties: {
        x: 0, y: 0, width: 100, height: 100, scale: 1, rotation: 0, opacity: 1,
        animation: animationConfig
    }
});

describe('Animation Engine', () => {
    describe('calculateAnimationState', () => {
        it('should return default properties when no animation is present', () => {
            const clip = createMockClip();
            const state = calculateAnimationState(clip, 2.5);

            expect(state.x).toBe(0);
            expect(state.y).toBe(0);
            expect(state.opacity).toBe(1);
        });

        it('should handle SLIDE animation (Left to Right)', () => {
            const clip = createMockClip({
                enter: {
                    type: 'slide',
                    direction: 'left',
                    duration: 1,
                    easing: 'linear'
                }
            });

            // At t=0 (Start of animation)
            // Slide Left means it starts "Left" (negative X) and moves to 0.
            // My engine logic: dir='left' -> state.x -= offset. 
            // t=0 -> offset=100. x=-100.

            const stateMid = calculateAnimationState(clip, 0.5);
            // t=0.5 -> offset=50. x=-50.
            expect(stateMid.x).not.toBe(0);
        });

        it('should handle ZOOM animation', () => {
            const clip = createMockClip({
                enter: {
                    type: 'zoom',
                    direction: 'in',
                    duration: 1,
                    easing: 'linear'
                }
            });

            // At start (t=0), scale should be 0 (if zoom in starts from 0)
            const stateStart = calculateAnimationState(clip, 0);
            expect(stateStart.scale).toBe(0);

            // At end (t=1), scale should be 1
            const stateEnd = calculateAnimationState(clip, 1);
            expect(stateEnd.scale).toBe(1);
        });
    });
});
