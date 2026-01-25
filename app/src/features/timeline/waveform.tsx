"use client";

import { useEffect, useRef } from "react";

interface WaveformProps {
    width: number;
    height: number;
    color?: string;
    isMuted?: boolean;
    seed?: string; // To ensure the same random pattern for the same clip
}

export function Waveform({ width, height, color = "#6366f1", isMuted = false, seed = "" }: WaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Styling
        ctx.fillStyle = isMuted ? "#4b5563" : color;

        // Generate pseudo-random waveform based on string seed
        // We use a simple hash to make it deterministic for the same clip ID
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = (hash << 5) - hash + seed.charCodeAt(i);
            hash |= 0;
        }

        const random = () => {
            const x = Math.sin(hash++) * 10000;
            return x - Math.floor(x);
        };

        // Draw Bars
        const barWidth = 3;
        const gap = 1;
        const totalBars = Math.ceil(width / (barWidth + gap));

        const centerY = height / 2;

        for (let i = 0; i < totalBars; i++) {
            // Generate height (0.1 to 1.0)
            // Use Perlin-noise-like smoothing for "real" audio look
            // Combine a low freq and high freq sine wave with noise
            const noise = random();
            const freq1 = Math.sin(i * 0.1);
            const freq2 = Math.cos(i * 0.05);

            let barHeightCoef = (Math.abs(freq1) * 0.5 + Math.abs(freq2) * 0.3 + noise * 0.2);
            barHeightCoef = Math.max(0.1, Math.min(1, barHeightCoef));

            // Apply a "Beat" pattern simulation
            if (i % 20 < 2) barHeightCoef *= 1.5; // Kick hits

            const barHeight = barHeightCoef * (height * 0.8);

            // Draw rounded bar
            const x = i * (barWidth + gap);
            const y = centerY - barHeight / 2;

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 2);
            ctx.fill();
        }

    }, [width, height, color, isMuted, seed]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full opacity-80"
        />
    );
}
