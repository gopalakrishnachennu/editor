"use client";

import { useVideoStore, Clip } from "@/lib/stores/video-store";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Transformer } from "./transformer";
import { calculateSnapping } from "@/lib/utils/snapping";
import { SVGEffectsDefinition } from "./svg-effects";

// Easing Functions
const easings = {
    'linear': (x: number) => x,
    'ease-out': (x: number) => 1 - Math.pow(1 - x, 3), // Cubic out
    'ease-in-out': (x: number) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
    'elastic': (x: number) => {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
};

// Animation Processor
const applyAnimations = (style: React.CSSProperties, clip: Clip, currentTime: number): { style: React.CSSProperties, content: string } => {
    const anim = clip.properties.animation;
    let modifiedStyle = { ...style };
    let content = clip.name;

    // Helper to process a specific phase (Enter or Exit)
    const processPhase = (phase: 'enter' | 'exit') => {
        const config = anim?.[phase];
        if (!config?.duration) return;

        const duration = config.duration;
        let progress = 0;

        if (phase === 'enter') {
            const timeInClip = currentTime - clip.start;
            if (timeInClip < duration) {
                progress = timeInClip / duration;
            } else {
                return; // Animation finished
            }
        } else {
            const timeRemaining = clip.end - currentTime;
            if (timeRemaining < duration) {
                progress = timeRemaining / duration; // 1 -> 0 (fading out)
                // For exit, we typically want 1 ("fully visible") to 0 ("gone")
                // But easing functions usually go 0->1. 
                // Let's invert logic: "Exit Progress" 0 (start exit) -> 1 (done exit)
                // timeRemaining goes Duration -> 0.
                // So progress = 1 - (timeRemaining / duration)
                progress = 1 - (timeRemaining / duration);
            } else {
                return; // Not exiting yet
            }
        }

        // Apply Easing
        const easeFn = easings[config.easing as keyof typeof easings] || easings['ease-out'];
        // For Enter: we go 0 -> 1. 1 is "final state". 0 is "initial state".
        // For Exit: we go 0 -> 1. 0 is "visible". 1 is "gone".

        const p = easeFn(phase === 'enter' ? progress : (1 - progress));
        // Wait, for Exit:
        // If we use standard "Enter" logic (0=Hidden, 1=Visible), then:
        // Enter: t=0 -> p=0 (Hidden). t=1 -> p=1 (Visible).
        // Exit: t=StartExit -> p=1 (Visible). t=End -> p=0 (Hidden).

        const t = phase === 'enter' ? easeFn(progress) : easeFn(1 - progress);
        // t is now a value from 0 (Hidden/Start) to 1 (Visible/End). for both phases.

        switch (config.type) {
            case 'fade':
                modifiedStyle.opacity = (modifiedStyle.opacity as number || 1) * t;
                break;

            case 'slide':
                const dir = config.direction || 'left';
                const offset = (1 - t) * 100; // 0% when visible, 100% when hidden

                if (dir === 'left') modifiedStyle.transform += ` translateX(-${offset}%)`;
                if (dir === 'right') modifiedStyle.transform += ` translateX(${offset}%)`;
                if (dir === 'top') modifiedStyle.transform += ` translateY(-${offset}%)`;
                if (dir === 'bottom') modifiedStyle.transform += ` translateY(${offset}%)`;

                // Optional fade with slide
                modifiedStyle.opacity = (modifiedStyle.opacity as number || 1) * t;
                break;

            case 'zoom':
                // t: 0 -> 1.
                // Zoom In (Enter): Start small (0) -> End normal (1).
                modifiedStyle.transform += ` scale(${t})`;
                modifiedStyle.opacity = (modifiedStyle.opacity as number || 1) * t;
                break;

            case 'bounce':
                // Custom bounce logic or re-use elastic easing
                // t goes 0 -> 1.
                // If using 'elastic' easing, scale(t) works great.
                // If linear, let's create a bounce effect.
                const y = Math.abs(Math.sin(t * Math.PI * 2)) * 20 * (1 - t);
                modifiedStyle.transform += ` translateY(-${y}px) scale(${t})`;
                modifiedStyle.opacity = (modifiedStyle.opacity as number || 1) * t;
                break;

            case 'wipe':
                // Clip Path Wipe.
                // t: 0 (Hidden) -> 1 (Visible).
                const wipeDir = config.direction || 'left';
                const pCent = (1 - t) * 100;

                if (wipeDir === 'left') modifiedStyle.clipPath = `inset(0 ${pCent}% 0 0)`;
                if (wipeDir === 'right') modifiedStyle.clipPath = `inset(0 0 0 ${pCent}%)`;
                if (wipeDir === 'top') modifiedStyle.clipPath = `inset(0 0 ${pCent}% 0)`;
                if (wipeDir === 'bottom') modifiedStyle.clipPath = `inset(${pCent}% 0 0 0)`;
                break;

            case 'blur':
                // t: 0 (Blurry) -> 1 (Clear).
                const blurAmount = (1 - t) * 20; // Max 20px blur
                modifiedStyle.filter = `${modifiedStyle.filter || ''} blur(${blurAmount}px)`;
                modifiedStyle.opacity = (modifiedStyle.opacity as number || 1) * t;
                break;

            case 'typewriter':
                if (clip.type === 'text') {
                    const textLen = clip.name.length;
                    const charCount = Math.floor(t * textLen);
                    content = clip.name.substring(0, charCount);
                    if (t < 1) content += '|';
                } else {
                    // Fallback for non-text
                    modifiedStyle.opacity = (modifiedStyle.opacity as number || 1) * t;
                }
                break;
        }
    };

    processPhase('enter');
    processPhase('exit');

    return { style: modifiedStyle, content };
};

// Helper to determine active clip style on canvas
const getClipStyle = (clip: Clip) => {
    const { x = 0, y = 0, scale = 1, rotation = 0, opacity = 1, width, height } = clip.properties;
    const ts = clip.properties.textStyle || {};

    const style: React.CSSProperties = {
        transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`,
        opacity,
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',

        // Typography
        fontSize: ts.fontSize ? `${ts.fontSize}px` : undefined,
        fontFamily: ts.fontFamily,
        fontWeight: ts.fontWeight as any,
        color: ts.color,
        textAlign: ts.align as any,
        letterSpacing: ts.spacing ? `${ts.spacing}px` : undefined,

        // Effects
        textShadow: ts.shadow ? `${ts.shadow.offsetX}px ${ts.shadow.offsetY}px ${ts.shadow.blur}px ${ts.shadow.color}` : undefined,

        // Background Box
        backgroundColor: ts.background && ts.background.opacity > 0 ? `rgba(${hexToRgb(ts.background.color || '#000000')}, ${ts.background.opacity})` : undefined,
        padding: ts.background?.padding ? `${ts.background.padding}px` : undefined,
        borderRadius: ts.background?.borderRadius ? `${ts.background.borderRadius}px` : undefined,
    };

    // Normalized Shadow Logic
    const shadow = (clip.properties as any).shadow;
    if (shadow) {
        const shadowStr = `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`;
        if (clip.type === 'text') {
            style.textShadow = shadowStr;
        } else {
            style.boxShadow = shadowStr;
        }
    }

    // --- ADVANCED EFFECTS PIPELINE ---
    // 1. Blending Mode
    if (clip.properties.blendingMode) {
        style.mixBlendMode = clip.properties.blendingMode as any;
    }

    // 2. CSS Filters (Combine legacy + new stack)
    const filterList: string[] = [];

    // Legacy support (optional, can be removed if we migrate fully)
    const f = clip.properties.filter;
    if (f) {
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
                    // Map generic params to CSS functions
                    if (effect.name === 'Hue Rotate') filterList.push(`hue-rotate(${effect.params.degree}deg)`);
                    if (effect.name === 'Sepia') filterList.push(`sepia(${effect.params.amount})`);
                    if (effect.name === 'Invert') filterList.push(`invert(${effect.params.amount})`);
                    break;
                case 'blur':
                    if (effect.name === 'Gaussian Blur') filterList.push(`blur(${effect.params.radius}px)`);
                    break;
                case 'distortion':
                    if (effect.name === 'Pixelate') {
                        // CSS-only pixelation is limited. We use a high-contrast trick or placeholder.
                        // For now, we'll maintain 'image-rendering: pixelated' on the element style
                        // which is handled below in style object if we add a class.
                    }
                    if (effect.name === 'Chromatic Aberration') {
                        filterList.push(`url(#chromatic-aberration)`);
                    }
                    break;
            }
        });
    }

    if (filterList.length > 0) {
        style.filter = filterList.join(' ');
    }
    // ----------------------------

    // Gradient Text Logic
    if (ts.gradient?.enabled) {
        style.backgroundImage = `linear-gradient(${ts.gradient.direction}deg, ${ts.gradient.colors[0]}, ${ts.gradient.colors[1]})`;
        style.backgroundClip = 'text';
        style.WebkitBackgroundClip = 'text';
        style.color = 'transparent'; // Text must be transparent to show background
    }

    // Outline (Webkit specific mostly)
    if (ts.outline && ts.outline.width > 0) {
        // @ts-ignore
        style.WebkitTextStroke = `${ts.outline.width}px ${ts.outline.color}`;
    }

    return style;
};

// Helper for hex to RGB
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

export function CanvasOverlay() {
    const { tracks, currentTime, selectedClipId, updateClip, setSelectedClip } = useVideoStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Filter clips that should be visible at current time
    const visibleClips = tracks
        .filter(t => !t.isHidden && t.type !== 'video' && t.type !== 'audio')
        .flatMap(t => t.clips)
        .filter(c => currentTime >= c.start && currentTime < c.end);

    const { canvasSize } = useVideoStore();
    const [activeGuides, setActiveGuides] = useState<{ vertical?: number; horizontal?: number }>({});
    const [editingId, setEditingId] = useState<string | null>(null);

    // Handle updates from Transformer
    const handleClipUpdate = (clipId: string, changes: any, isFinal: boolean = false) => {
        const clip = tracks.flatMap(t => t.clips).find(c => c.id === clipId);
        if (!clip) return;

        let newProps = { ...clip.properties, ...changes };

        // Apply Snapping if moving (changing x or y)
        if (changes.x !== undefined || changes.y !== undefined) {
            const w = newProps.width || (clip.type === 'text' ? 300 : 200);
            const h = newProps.height || (clip.type === 'text' ? 100 : 200);

            const snap = calculateSnapping(
                newProps.x,
                newProps.y,
                w,
                h,
                canvasSize.width,
                canvasSize.height
            );

            newProps.x = snap.x;
            newProps.y = snap.y;
            setActiveGuides(snap.guides);
        } else {
            // Clear guides if not moving
            if (Object.keys(activeGuides).length > 0) setActiveGuides({});
        }

        // If operation ended, clear guides
        if (isFinal) {
            setActiveGuides({});
        }

        updateClip(clipId, {
            properties: newProps
        });
    };

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Global SVG Definitions */}
            <SVGEffectsDefinition />

            {/* Snap Guides */}
            {activeGuides.vertical !== undefined && (
                <div
                    className="absolute top-0 bottom-0 w-px bg-purple-500 z-50 pointer-events-none shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                    style={{ left: activeGuides.vertical }}
                />
            )}
            {activeGuides.horizontal !== undefined && (
                <div
                    className="absolute left-0 right-0 h-px bg-purple-500 z-50 pointer-events-none shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                    style={{ top: activeGuides.horizontal }}
                />
            )}

            {/* Render Layers */}
            {visibleClips.map(clip => {
                // We calculate style for inner content (visuals), 
                // BUT Position/Rotation/Scale is handled by the Transformer wrapper.
                // So we need to separate "Box Properties" from "Visual Style Properties".

                const { x = 0, y = 0, scale = 1, rotation = 0, width, height } = clip.properties;
                const isSelected = selectedClipId === clip.id;
                const isEditing = editingId === clip.id;

                // Strategy: Transformer controls the "Base" position (x,y,scale,rot).
                // Animation adds "Offset" (slide, zoom, bounce).

                // 1. Get Base Style (includes font, color, etc.)
                const baseStyle = getClipStyle(clip);

                // 2. Strip the 'transform' from baseStyle because Transformer handles x,y,scale,rot.
                // If we leave it, applyAnimations might mix it, or we might double-apply it.
                // We want applyAnimations to start with an EMPTY transform so it only returns the delta.
                const { transform: baseTransform, ...styleWithoutTransform } = baseStyle;

                // 3. Generate Animation Styles (on top of styleWithoutTransform)
                const { style: animatedContentStyle, content } = applyAnimations(styleWithoutTransform, clip, currentTime);

                // 4. animatedContentStyle now contains `transform: translateX(...)` strictly for animation.
                // We apply this to the inner div.
                const innerStyle = animatedContentStyle;

                // We might need to re-apply animation transforms that are NOT x/y if possible?
                // Or just let the inner content be animated relative to the box.
                // current applyAnimations mixes everything.
                // For now, let's use the Transformer for interactions, 
                // and the inner div for the "look".

                return (
                    <div key={clip.id} className="pointer-events-auto">
                        <Transformer
                            x={x}
                            y={y}
                            width={width || 300}
                            height={height || 100}
                            scale={scale || 1}
                            rotation={rotation || 0}
                            isSelected={isSelected}
                            onDragStart={() => setSelectedClip(clip.id)}
                            onDragEnd={() => handleClipUpdate(clip.id, {}, true)}
                            onUpdate={(changes) => handleClipUpdate(clip.id, changes)}
                        >
                            <div
                                className={cn(
                                    "w-full h-full relative",
                                    clip.properties.effects?.some(e => e.name === 'Glitch' && e.isEnabled) && "glitch-effect",
                                    clip.properties.effects?.some(e => e.name === 'Pixelate' && e.isEnabled) && "pixelate-filter"
                                )}
                                style={{
                                    ...innerStyle,
                                    width: '100%',
                                    height: '100%',
                                    display: clip.type === 'text' ? 'flex' : 'block',
                                    alignItems: 'center',
                                    justifyContent: clip.properties.textStyle?.align === 'center' ? 'center' : clip.properties.textStyle?.align === 'right' ? 'flex-end' : 'flex-start'
                                }}
                                data-text={content} // For glitch effect duplication
                            >
                                {/* Vignette Overlay (Inner) */}
                                {clip.properties.effects?.some(e => e.name === 'Vignette' && e.isEnabled) && (
                                    <div className="vignette-overlay" />
                                )}

                                {clip.type === 'text' && (
                                    <>
                                        {isEditing ? (
                                            <textarea
                                                autoFocus
                                                className="w-full h-full bg-transparent outline-none resize-none overflow-hidden"
                                                style={{
                                                    fontSize: 'inherit',
                                                    fontFamily: 'inherit',
                                                    color: 'inherit',
                                                    fontWeight: 'inherit',
                                                    textAlign: clip.properties.textStyle?.align as any || 'center',
                                                    lineHeight: '1.2'
                                                }}
                                                value={content}
                                                onChange={(e) => updateClip(clip.id, { name: e.target.value })}
                                                onBlur={() => setEditingId(null)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        setEditingId(null);
                                                    }
                                                }}
                                                // Prevent event bubbling to dragging/transformer handlers
                                                onMouseDown={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <div className="whitespace-pre-wrap leading-tight" style={{ width: '100%' }}>
                                                {content}
                                            </div>
                                        )}
                                    </>
                                )}
                                {clip.type === 'image' && (
                                    <>
                                        {/* Glitch Layers for Image */}
                                        {clip.properties.effects?.some(e => e.name === 'Glitch' && e.isEnabled) && (
                                            <>
                                                <img src={clip.src} className="glitch-layer-1 w-full h-full object-cover absolute top-0 left-0" alt="" />
                                                <img src={clip.src} className="glitch-layer-2 w-full h-full object-cover absolute top-0 left-0" alt="" />
                                            </>
                                        )}
                                        <img
                                            src={clip.src}
                                            alt={clip.name}
                                            className="w-full h-full object-cover relative z-20"
                                            draggable={false}
                                        />
                                    </>
                                )}
                            </div>
                        </Transformer>
                    </div>
                );
            })}
        </div>
    );
}
