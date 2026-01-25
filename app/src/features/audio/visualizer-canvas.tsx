"use client";

import { useEffect, useRef, useState } from "react";
import { audioAnalyzer } from "@/lib/services/audio-analyzer-service";
import { Activity, BarChart2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type VisualizerMode = 'waveform' | 'bars' | 'circle';

interface VisualizerCanvasProps {
    className?: string;
    width?: number;
    height?: number;
}

export function VisualizerCanvas({ className, width = 300, height = 150 }: VisualizerCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<VisualizerMode>('bars');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        let animationId: number;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const render = () => {
            animationId = requestAnimationFrame(render);

            // Get Data based on mode
            const data = mode === 'waveform' ? audioAnalyzer.getWaveformData() : audioAnalyzer.getFrequencyData();
            const bufferLength = data.length;

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Transparent clear
            // Or semi-transparent trail
            // ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            // ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (mode === 'waveform') {
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#818cf8'; // Indigo 400
                ctx.beginPath();

                const sliceWidth = canvas.width * 1.0 / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = data[i] / 128.0; // 0..255 -> 0..2
                    const y = v * canvas.height / 2;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    x += sliceWidth;
                }

                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.stroke();
            } else if (mode === 'bars') {
                const barWidth = (canvas.width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = (data[i] / 255) * canvas.height;

                    const hue = i * 2 + 240; // Blue/Purple range
                    ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;

                    // Bars bottom up
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                    x += barWidth + 1;
                }
            } else if (mode === 'circle') {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const radius = Math.min(centerX, centerY) * 0.5;

                // Beat power
                const avg = data.reduce((a, b) => a + b) / data.length;
                const scale = 1 + (avg / 255) * 0.5;

                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.scale(scale, scale);

                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = '#a78bfa';
                ctx.lineWidth = 4;
                ctx.stroke();

                // Rays
                for (let i = 0; i < bufferLength; i += 4) {
                    const angle = (i / bufferLength) * Math.PI * 2;
                    const len = (data[i] / 255) * 40;

                    const x1 = Math.cos(angle) * radius;
                    const y1 = Math.sin(angle) * radius;
                    const x2 = Math.cos(angle) * (radius + len);
                    const y2 = Math.sin(angle) * (radius + len);

                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = `hsla(${i + 200}, 100%, 70%, 0.8)`;
                    ctx.stroke();
                }

                ctx.restore();
            }
        };

        render();

        return () => cancelAnimationFrame(animationId);
    }, [mode]);

    return (
        <div ref={containerRef} className={cn("relative group", className)} onMouseEnter={() => setIsMenuOpen(true)} onMouseLeave={() => setIsMenuOpen(false)}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="w-full h-full rounded-lg bg-slate-900/50 backdrop-blur-sm border border-white/5"
            />

            {/* Hover Controls */}
            <div className={cn(
                "absolute top-2 right-2 flex gap-1 bg-black/60 rounded-md p-1 transition-opacity duration-200",
                isMenuOpen ? "opacity-100" : "opacity-0"
            )}>
                <button onClick={() => setMode('waveform')} className={cn("p-1 rounded hover:bg-white/20", mode === 'waveform' && "text-indigo-400")}>
                    <Activity className="w-3 h-3" />
                </button>
                <button onClick={() => setMode('bars')} className={cn("p-1 rounded hover:bg-white/20", mode === 'bars' && "text-indigo-400")}>
                    <BarChart2 className="w-3 h-3" />
                </button>
                <button onClick={() => setMode('circle')} className={cn("p-1 rounded hover:bg-white/20", mode === 'circle' && "text-indigo-400")}>
                    <Circle className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
