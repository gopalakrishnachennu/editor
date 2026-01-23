"use client";

import { CanvasState } from "@/lib/services/canvas-state-builder";
import React, { useMemo } from "react";

interface CanvasPreviewProps {
    state: CanvasState;
    width?: number; // Logical width (e.g. 1080)
    height?: number; // Logical height (e.g. 1080)
    className?: string;
}

export function CanvasPreview({ state, width = 1080, height = 1080, className }: CanvasPreviewProps) {
    const { elements, background, frame } = state;

    // Font size scaling factor:
    // fontSize is usually in pixels relative to frame.width (e.g. 1080).
    // We want to convert this to % relative to container width.
    // % = (fontSize / frameWidth) * 100
    // But we can use 'cqw' (container query width). 1cqw = 1% of container width.
    // So value is (fontSize / frameWidth) * 100.
    const frameWidth = frame?.width || 1080;

    return (
        <div
            className={`relative w-full h-full overflow-hidden bg-white select-none ${className}`}
            style={{
                backgroundColor: background?.color || "#ffffff",
                containerType: 'inline-size', // Enable cqw units
            }}
        >
            {/* Background Image / Gradient */}
            {background?.image && (
                <img
                    src={background.image}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="background"
                />
            )}

            {/* Render Elements */}
            {elements.map((el) => {
                if (!el.visible) return null;

                // Positioning style (Percent based)
                const style: React.CSSProperties = {
                    position: "absolute",
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: el.type === 'text' ? 'auto' : `${el.height}%`,
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                    zIndex: 10, // Base z-index
                };

                // Text Styling
                if (el.type === "text") {
                    const fontSizeCqw = ((el.fontSize || 32) / frameWidth) * 100;

                    return (
                        <div
                            key={el.id}
                            style={{
                                ...style,
                                fontSize: `${fontSizeCqw}cqw`,
                                color: el.color || "#000000",
                                fontFamily: el.fontFamily || "Inter, sans-serif",
                                fontWeight: el.fontWeight || 400,
                                textAlign: el.textAlign || "left",
                                display: "flex",
                                alignItems: "flex-start",
                                lineHeight: el.lineHeight || 1.2,
                                whiteSpace: "pre-wrap", // Preserve whitespace
                            }}
                            className="pointer-events-none"
                        >
                            {/* We use container queries for text sizing relative to parent container */}
                            {el.text}
                        </div>
                    );
                }

                // Image Styling
                if (el.type === "image" && el.imageUrl) {
                    return (
                        <div key={el.id} style={style} className="overflow-hidden">
                            <img
                                src={el.imageUrl}
                                alt={el.name}
                                className="w-full h-full object-cover"
                                style={{
                                    borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                                }}
                            />
                        </div>
                    );
                }

                // Shapes (Basic Rect/Circle support for placeholders)
                if (el.type === "shape") {
                    return (
                        <div
                            key={el.id}
                            style={{
                                ...style,
                                backgroundColor: el.fillColor || "#cccccc",
                                borderRadius: el.shapeType === 'circle' ? '50%' : 0,
                            }}
                        />
                    );
                }

                return null;
            })}
        </div>
    );
}
