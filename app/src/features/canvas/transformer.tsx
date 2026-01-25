"use client";

import React, { useState, useRef, useEffect } from "react";
import { RotateCw } from "lucide-react";

interface TransformerProps {
    x: number;
    y: number;
    width: number; // or 'auto' logic externally, but here we ideally need numbers. 
    // If width is undefined/auto, we might need a wrapper ref to measure it.
    height: number;
    rotation: number;
    scale: number;
    isSelected: boolean;
    children: React.ReactNode;
    onUpdate: (changes: { x?: number; y?: number; width?: number; height?: number; rotation?: number; scale?: number }) => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
}

export function Transformer({
    x, y, width, height, rotation, scale, isSelected, children, onUpdate, onDragStart, onDragEnd
}: TransformerProps) {
    const boxRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);

    // We store initial values on mouse down to calculate deltas
    // We store initial values on mouse down to calculate deltas
    const dragStart = useRef({
        startX: 0, startY: 0,
        initialX: 0, initialY: 0,
        initialWidth: 0, initialHeight: 0,
        initialRotation: 0,
        centerX: 0, centerY: 0, // For rotation
        startDist: 0, // For scaling
        initialScale: 1, // For scaling
        direction: '', // For resizing
        startAngle: 0 // For rotation
    });

    // --- DRAG LOGIC ---
    const handleMouseDown = (e: React.MouseEvent) => {
        // if (!isSelected) return; // Allow click to select and drag immediately
        e.stopPropagation(); // Prevent canvas deselect
        e.preventDefault();

        setIsDragging(true);
        onDragStart?.();

        dragStart.current = {
            ...dragStart.current,
            startX: e.clientX,
            startY: e.clientY,
            initialX: x,
            initialY: y
        };
    };

    // --- RESIZE / SCALE LOGIC ---
    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        onDragStart?.();

        const rect = boxRef.current?.getBoundingClientRect();
        const centerX = rect ? rect.left + rect.width / 2 : x; // approx fallback
        const centerY = rect ? rect.top + rect.height / 2 : y;

        dragStart.current = {
            ...dragStart.current,
            startX: e.clientX,
            startY: e.clientY,
            initialWidth: width || 0,
            initialHeight: height || 0,
            initialX: x,
            initialY: y,
            centerX,
            centerY,
            // For scaling:
            startDist: rect ? Math.hypot(e.clientX - centerX, e.clientY - centerY) : 1,
            initialScale: scale || 1
        };
        (dragStart.current as any).direction = direction;
    };

    // --- ROTATE LOGIC ---
    const handleRotateStart = (e: React.MouseEvent) => {
        // ... same as before, ensures simple rotate
        e.stopPropagation();
        e.preventDefault();
        setIsRotating(true);
        onDragStart?.();

        if (boxRef.current) {
            const rect = boxRef.current.getBoundingClientRect();
            dragStart.current.centerX = rect.left + rect.width / 2;
            dragStart.current.centerY = rect.top + rect.height / 2;
            dragStart.current.initialRotation = rotation;

            const dx = e.clientX - dragStart.current.centerX;
            const dy = e.clientY - dragStart.current.centerY;
            (dragStart.current as any).startAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        }
    };

    useEffect(() => {
        if (!isDragging && !isResizing && !isRotating) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = e.clientX - dragStart.current.startX;
                const dy = e.clientY - dragStart.current.startY;
                onUpdate({ x: dragStart.current.initialX + dx, y: dragStart.current.initialY + dy });
            }

            if (isRotating) {
                const dx = e.clientX - dragStart.current.centerX;
                const dy = e.clientY - dragStart.current.centerY;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                const angleDelta = angle - (dragStart.current as any).startAngle;

                // Snap to 15 degrees if Shift is held
                let newRotation = (dragStart.current.initialRotation + angleDelta) % 360;
                if (e.shiftKey) {
                    newRotation = Math.round(newRotation / 15) * 15;
                }
                onUpdate({ rotation: newRotation });
            }

            if (isResizing) {
                const direction = (dragStart.current as any).direction;

                // corner -> SCALE
                if (direction.length === 2) {
                    const { centerX, centerY, startDist, initialScale } = dragStart.current as any;
                    const currentDist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
                    const scaleFactor = currentDist / startDist;
                    let newScale = initialScale * scaleFactor;

                    // Constraint min scale
                    if (newScale < 0.1) newScale = 0.1;

                    console.log(`[Scale] Factor: ${scaleFactor.toFixed(2)} -> NewScale: ${newScale.toFixed(2)}`);
                    onUpdate({ scale: newScale });
                }
                // edge -> RESIZE
                else {
                    const dx = e.clientX - dragStart.current.startX;
                    const dy = e.clientY - dragStart.current.startY;

                    const rad = (rotation * Math.PI) / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);

                    const localDx = dx * cos + dy * sin;
                    const localDy = dy * cos - dx * sin;

                    let newW = dragStart.current.initialWidth;
                    let newH = dragStart.current.initialHeight;
                    let newX = dragStart.current.initialX;
                    let newY = dragStart.current.initialY;
                    // Delta adjustments
                    let dW = 0;
                    let dH = 0;

                    // 1. Calculate Raw Deltas
                    if (direction.includes('e')) {
                        dW = localDx;
                    } else if (direction.includes('w')) {
                        dW = -localDx;
                    }

                    if (direction.includes('s')) {
                        dH = localDy;
                    } else if (direction.includes('n')) {
                        dH = -localDy;
                    }

                    // 2. Apply Constaints (Min Size) BEFORE shifting
                    if (newW + dW < 20) dW = 20 - newW;
                    if (newH + dH < 20) dH = 20 - newH;

                    // 3. Update Dimensions
                    newW += dW;
                    newH += dH;

                    // 4. Calculate Origin Shift (Top-Left) to compensate for West/North changes
                    // If we typically grow West (dW > 0), the Right edge should stay fixed.
                    // This means the Left edge (Origin) must move Left by dW.
                    // Shift Local = (-dW, 0).
                    // Same for North: Shift Local = (0, -dH).

                    let localShiftX = 0;
                    let localShiftY = 0;

                    if (direction.includes('w')) {
                        localShiftX = -dW;
                    }
                    if (direction.includes('n')) {
                        localShiftY = -dH;
                    }

                    // 5. Rotate Shift to Screen Space
                    const screenShiftX = localShiftX * cos - localShiftY * sin;
                    const screenShiftY = localShiftX * sin + localShiftY * cos;

                    newX += screenShiftX;
                    newY += screenShiftY;

                    console.log(`[Resize] W: ${newW}, H: ${newH}, Shift: (${screenShiftX.toFixed(1)}, ${screenShiftY.toFixed(1)})`);
                    onUpdate({ width: newW, height: newH, x: newX, y: newY });
                }
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            setIsRotating(false);
            onDragEnd?.();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, isRotating, onUpdate, onDragEnd]);

    return (
        <div
            ref={boxRef}
            className="absolute left-0 top-0 origin-center select-none"
            style={{
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
                width: width ? `${width}px` : 'auto',
                height: height ? `${height}px` : 'auto',
            }}
            onMouseDown={handleMouseDown}
        >
            {/* The Content */}
            <div className="relative">
                {children}

                {/* Handles Overlay */}
                {isSelected && (
                    <div className="absolute -inset-1 border-2 border-indigo-500 pointer-events-none">
                        {/* We make the border pointer-events-none so we can click the content (children) 
                            BUT handles need to be pointer-events-auto */}

                        {/* Corners */}
                        <div className="pointer-events-auto absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-full cursor-nwse-resize" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                        <div className="pointer-events-auto absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-full cursor-nesw-resize" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                        <div className="pointer-events-auto absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-full cursor-nesw-resize" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                        <div className="pointer-events-auto absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-full cursor-nwse-resize" onMouseDown={(e) => handleResizeStart(e, 'se')} />

                        {/* Edges (Optional for complex resize, maybe skip for simple text boxes unless strict sizing) */}
                        <div className="pointer-events-auto absolute top-1/2 -left-1.5 w-3 h-3 -mt-1.5 bg-white border border-indigo-500 rounded-full cursor-ew-resize" onMouseDown={(e) => handleResizeStart(e, 'w')} />
                        <div className="pointer-events-auto absolute top-1/2 -right-1.5 w-3 h-3 -mt-1.5 bg-white border border-indigo-500 rounded-full cursor-ew-resize" onMouseDown={(e) => handleResizeStart(e, 'e')} />

                        {/* Rotation Handle */}
                        <div
                            className="pointer-events-auto absolute -top-8 left-1/2 -ml-3 w-6 h-6 bg-white border border-indigo-500 rounded-full flex items-center justify-center cursor-move hover:scale-110 transition-transform shadow-sm"
                            onMouseDown={handleRotateStart}
                        >
                            <RotateCw className="w-3 h-3 text-indigo-600" />
                        </div>
                        {/* Connection line to rotation handle */}
                        <div className="absolute -top-4 left-1/2 -ml-px w-px h-4 bg-indigo-500" />
                    </div>
                )}
            </div>
        </div>
    );
}
