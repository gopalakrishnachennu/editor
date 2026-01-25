'use client';

import { useRef, useEffect, useState } from 'react';
import { useVideoStore, Clip } from '@/lib/stores/video-store';
import { CanvasOverlay } from '@/features/canvas/canvas-overlay';
import { cn } from '@/lib/utils';
import { applyAnimations } from '@/lib/utils/animation-engine';
import { calculateAudioMix } from '@/lib/utils/audio-engine';
import { DebugOverlay } from '@/features/canvas/debug-overlay';
import { audioAnalyzer } from '@/lib/services/audio-analyzer-service';

import { RetroOverlay } from '@/features/canvas/retro-overlay';

export function VideoPlayer() {
    const { isPlaying, currentTime, pause, play, seek, tracks } = useVideoStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Find ALL active video clips at current time (sorted by track order for z-index)
    // We reverse tracks to ensure top tracks render on top (assuming tracks[0] is bottom)
    const activeVideoClips = tracks
        .filter(t => t.type === 'video' && !t.isHidden)
        .flatMap(t => t.clips.map(c => ({ ...c, trackId: t.id })))
        .filter(c => currentTime >= c.start - 0.05 && currentTime < c.end + 0.05)
        .sort((a, b) => {
            // Sort by track index (z-index)
            const trackA = tracks.findIndex(t => t.id === a.trackId);
            const trackB = tracks.findIndex(t => t.id === b.trackId);
            return trackA - trackB;
        });

    // Handle sync for ALL active videos
    useEffect(() => {
        // We need to manage multiple video refs... 
        // For MVP refactor, we rely on the fact that React re-renders this component efficiently.
        // However, standard specific-ref logic gets tricky with N videos.
        // We will use a declarative approach: rendering <video> elements that self-manage or are managed by key.
    }, [isPlaying, pause]);

    // Helper to calculate runtime styling (Opacity for Fades + Advanced Animations)
    const getClipStyle = (clip: Clip) => {
        let style: React.CSSProperties = {
            opacity: 1,
            transform: '',
            filter: ''
        };

        // Apply shared animation engine (Slide, Zoom, Wipe, etc.)
        const { style: animatedStyle } = applyAnimations(style, clip, currentTime);
        style = animatedStyle;

        // Apply filters (Combine legacy + new stack)
        const filterList: string[] = [];
        if (style.filter) filterList.push(style.filter); // Preserve animation blurs

        // Legacy
        if (clip.properties.filter) {
            const f = clip.properties.filter;
            if (f.brightness !== undefined && f.brightness !== 1) filterList.push(`brightness(${f.brightness})`);
            if (f.contrast !== undefined && f.contrast !== 1) filterList.push(`contrast(${f.contrast})`);
            if (f.saturate !== undefined && f.saturate !== 1) filterList.push(`saturate(${f.saturate})`);
            if (f.grayscale !== undefined && f.grayscale !== 0) filterList.push(`grayscale(${f.grayscale})`);
            if (f.blur !== undefined && f.blur !== 0) filterList.push(`blur(${f.blur}px)`);
        }

        // New Effects Stack
        if (clip.properties.effects) {
            clip.properties.effects.forEach(effect => {
                if (!effect.isEnabled) return;
                switch (effect.type) {
                    case 'color':
                        if (effect.name === 'Hue Rotate') filterList.push(`hue-rotate(${effect.params.degree}deg)`);
                        if (effect.name === 'Sepia') filterList.push(`sepia(${effect.params.amount})`);
                        if (effect.name === 'Invert') filterList.push(`invert(${effect.params.amount})`);
                        break;
                    case 'blur':
                        if (effect.name === 'Gaussian Blur') filterList.push(`blur(${effect.params.radius}px)`);
                        break;
                }
            });
        }

        const filterStyle = filterList.join(' ');

        return {
            opacity: style.opacity,
            transform: style.transform,
            clipPath: style.clipPath, // Important for Wipe
            filter: filterStyle,
            mixBlendMode: clip.properties.blendingMode ? (clip.properties.blendingMode as any) : undefined,
            zIndex: tracks.findIndex(t => t.id === (clip as any).trackId)
        };
    };

    useEffect(() => {
        // Debug logging for active clips
        activeVideoClips.forEach(c => {
            console.log(`[VideoPlayer] Clip ${c.name} - Blending: ${c.properties.blendingMode}, zIndex: ${tracks.findIndex(t => t.id === (c as any).trackId)}`);
        });
    }, [activeVideoClips, tracks]);

    return (
        <div
            ref={containerRef}
            // Changed bg-black to a neutral dark gray/checker pattern to make blend modes visible
            className="relative h-full w-full bg-[#111] overflow-hidden flex items-center justify-center cursor-pointer"
            style={{
                backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
            onClick={() => isPlaying ? pause() : play()}
        >
            {activeVideoClips.length > 0 ? (
                activeVideoClips.map((clip, index) => {
                    const style = getClipStyle(clip);

                    // We need a wrapper for Overlays like Vignette / Glitch
                    // The video element itself accepts the CSS filters (Hue, Blur)
                    // But 'Vignette' needs a sibling div, and 'Glitch' usually applies to a container or needs specific setup.

                    // Note: Glitch usually works on text content via pseudo-elements, for Video it requires 
                    // a more complex setup (e.g. 3 copies of video) or a simple SVG filter/Canvas shader.
                    // For this CSS-only MVP, we apply the 'glitch-effect' class which might just jitter the container layout 
                    // or we might need to rely on the simple 'transform' jitter defined in globals.css.

                    const hasVignette = clip.properties.effects?.some(e => e.name === 'Vignette' && e.isEnabled);
                    const glitchEffect = clip.properties.effects?.find(e => e.name === 'Glitch' && e.isEnabled);
                    const pixelateEffect = clip.properties.effects?.find(e => e.name === 'Pixelate' && e.isEnabled);
                    const vhsEffect = clip.properties.effects?.find(e => e.name === 'VHS' && e.isEnabled);
                    const grainEffect = clip.properties.effects?.find(e => e.name === 'Film Grain' && e.isEnabled);
                    const halftoneEffect = clip.properties.effects?.find(e => e.name === 'Halftone' && e.isEnabled);

                    const glitchIntensity = glitchEffect ? `${(glitchEffect.params.intensity as number || 1) * 2}px` : '0px';
                    const pixelateSize = pixelateEffect ? (pixelateEffect.params.size as number || 10) : 1;
                    const isPixelated = pixelateEffect && pixelateSize > 1;

                    return (
                        <div
                            key={clip.id}
                            className={cn(
                                "absolute inset-0 w-full h-full overflow-hidden",
                                glitchEffect && "glitch-effect",
                            )}
                            style={{
                                zIndex: style.zIndex,
                                mixBlendMode: style.mixBlendMode as any,
                                // @ts-ignore
                                '--glitch-intensity': glitchIntensity,
                                transform: style.transform,
                                clipPath: style.clipPath
                            } as any}
                        >
                            <video
                                src={clip.src}
                                className={cn(
                                    "absolute top-0 left-0 object-cover",
                                    isPixelated && "pixelate-filter"
                                )}
                                style={{
                                    opacity: style.opacity,
                                    filter: style.filter,
                                    width: isPixelated ? `${100 / pixelateSize}%` : '100%',
                                    height: isPixelated ? `${100 / pixelateSize}%` : '100%',
                                    transform: isPixelated ? `scale(${pixelateSize})` : 'none',
                                    transformOrigin: 'top left'
                                }}
                                muted={false}
                                playsInline
                                ref={el => {
                                    if (el) {
                                        if (index === 0) {
                                            audioAnalyzer.connectToElement(el);
                                            audioAnalyzer.resume();
                                        }

                                        if (isPlaying && el.paused) el.play().catch(() => { });
                                        if (!isPlaying && !el.paused) el.pause();

                                        const clipTime = (currentTime - clip.start) + clip.offset;
                                        if (Math.abs(el.currentTime - clipTime) > 0.5) {
                                            el.currentTime = clipTime;
                                        }

                                        const audioMix = calculateAudioMix(clip, currentTime, activeVideoClips);
                                        const track = tracks.find(t => t.id === (clip as any).trackId);
                                        const isTrackMuted = track?.isMuted || false;
                                        const finalVolume = isTrackMuted ? 0 : audioMix.volume;
                                        const safeVolume = Math.min(Math.max(finalVolume, 0), 1);

                                        if (el.volume !== safeVolume) el.volume = safeVolume;
                                        const rate = clip.properties.playbackRate ?? 1;
                                        if (el.playbackRate !== rate) el.playbackRate = rate;
                                    }
                                }}
                            />

                            {/* Glitch Layers */}
                            {glitchEffect && (
                                <>
                                    <video
                                        src={clip.src}
                                        className="glitch-layer-1 w-full h-full object-cover"
                                        style={{
                                            opacity: 0.7,
                                            filter: `${style.filter} hue-rotate(90deg)`,
                                            // @ts-ignore
                                            '--glitch-intensity': glitchIntensity
                                        } as any}
                                        muted
                                        playsInline
                                        ref={el => {
                                            if (el) {
                                                const clipTime = (currentTime - clip.start) + clip.offset;
                                                if (Math.abs(el.currentTime - clipTime) > 0.5) el.currentTime = clipTime;
                                                if (isPlaying && el.paused) el.play().catch(() => { });
                                                if (!isPlaying && !el.paused) el.pause();
                                                el.playbackRate = clip.properties.playbackRate ?? 1;
                                            }
                                        }}
                                    />
                                    <video
                                        src={clip.src}
                                        className="glitch-layer-2 w-full h-full object-cover"
                                        style={{
                                            opacity: 0.7,
                                            filter: `${style.filter} hue-rotate(-90deg)`,
                                            // @ts-ignore
                                            '--glitch-intensity': glitchIntensity
                                        } as any}
                                        muted
                                        playsInline
                                        ref={el => {
                                            if (el) {
                                                const clipTime = (currentTime - clip.start) + clip.offset;
                                                if (Math.abs(el.currentTime - clipTime) > 0.5) el.currentTime = clipTime;
                                                if (isPlaying && el.paused) el.play().catch(() => { });
                                                if (!isPlaying && !el.paused) el.pause();
                                                el.playbackRate = clip.properties.playbackRate ?? 1;
                                            }
                                        }}
                                    />
                                </>
                            )}

                            {/* Retro Overlays */}
                            {vhsEffect && <RetroOverlay type="vhs" intensity={vhsEffect.params.intensity as number} />}
                            {grainEffect && <RetroOverlay type="grain" intensity={grainEffect.params.intensity as number} />}
                            {halftoneEffect && <RetroOverlay type="halftone" intensity={halftoneEffect.params.dotSize as number} />}

                            {hasVignette && (
                                <div className="vignette-overlay" />
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="text-slate-600 font-mono text-sm z-0">
                    {currentTime.toFixed(1)}s <br />
                    No Video
                </div>
            )}

            {/* Text Overlay Layer (Future Phase) */}
            <CanvasOverlay />



            {/* Visual Debugger */}
            <DebugOverlay />
        </div>
    );
}
