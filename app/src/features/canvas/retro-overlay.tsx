import { cn } from "@/lib/utils";

interface RetroOverlayProps {
    type: 'vhs' | 'grain' | 'halftone' | null;
    intensity: number;
}

export function RetroOverlay({ type, intensity }: RetroOverlayProps) {
    if (!type) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden mix-blend-overlay">
            {type === 'vhs' && (
                <div
                    className="w-full h-full opacity-50"
                    style={{
                        background: `repeating-linear-gradient(
                            transparent 0px,
                            transparent 2px,
                            rgba(0, 0, 0, ${0.1 * intensity}) 3px,
                            rgba(0, 0, 0, ${0.1 * intensity}) 4px
                        )`,
                        backgroundSize: '100% 4px',
                        animation: 'scanline 10s linear infinite'
                    }}
                />
            )}

            {type === 'grain' && (
                <svg className="w-full h-full opacity-[0.4]" style={{ filter: `contrast(${100 + intensity * 50}%) brightness(${100 + intensity * 20}%)` }}>
                    <filter id="noiseFilter">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.8"
                            numOctaves="3"
                            stitchTiles="stitch"
                        />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            )}

            {type === 'halftone' && (
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `radial-gradient(circle, #000 ${intensity + 1}px, transparent 1px)`,
                        backgroundSize: `${(intensity * 2) + 4}px ${(intensity * 2) + 4}px`,
                        opacity: 0.3
                    }}
                />
            )}
        </div>
    );
}
