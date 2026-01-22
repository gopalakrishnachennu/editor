'use client';

/**
 * Canvas Editor Component
 * Fabric.js v7-based editable canvas with draggable layers
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';

export interface CanvasLayer {
    id: string;
    type: 'text' | 'image' | 'rect' | 'gradient';
    name: string;
    visible: boolean;
    locked: boolean;
    object?: fabric.FabricObject;
}

export interface CanvasEditorProps {
    width?: number;
    height?: number;
    backgroundColor?: string;
    gradientColors?: [string, string];
    headline?: string;
    bodyText?: string;
    brandText?: string;
    brandColor?: string;
    textColor?: string;
    imageUrl?: string;
    watermarkText?: string;
    showWatermark?: boolean;
    onLayersChange?: (layers: CanvasLayer[]) => void;
    onSelectionChange?: (selected: fabric.FabricObject | null) => void;
    canvasRef?: React.MutableRefObject<fabric.Canvas | null>;
}

export function CanvasEditor({
    width = 540,
    height = 675,
    backgroundColor = '#1a1a2e',
    gradientColors = ['#000000', '#1a1a2e'],
    headline = 'Your headline will appear here',
    bodyText = '',
    brandText = 'Your Brand',
    brandColor = '#6366f1',
    textColor = '#ffffff',
    imageUrl,
    watermarkText = 'Made with Post Designer',
    showWatermark = false,
    onLayersChange,
    onSelectionChange,
    canvasRef: externalCanvasRef,
}: CanvasEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const internalCanvasRef = useRef<fabric.Canvas | null>(null);
    const [layers, setLayers] = useState<CanvasLayer[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize Fabric canvas
    useEffect(() => {
        if (!containerRef.current || isInitialized) return;

        const canvasElement = document.createElement('canvas');
        canvasElement.id = 'fabric-canvas';
        canvasElement.width = width;
        canvasElement.height = height;
        containerRef.current.appendChild(canvasElement);

        const canvas = new fabric.Canvas(canvasElement, {
            width,
            height,
            backgroundColor,
            selection: true,
            preserveObjectStacking: true,
        });

        internalCanvasRef.current = canvas;
        if (externalCanvasRef) {
            externalCanvasRef.current = canvas;
        }

        // Setup initial layers
        setupCanvas(canvas);
        setIsInitialized(true);

        // Selection events
        canvas.on('selection:created', (e) => {
            onSelectionChange?.(e.selected?.[0] || null);
        });
        canvas.on('selection:updated', (e) => {
            onSelectionChange?.(e.selected?.[0] || null);
        });
        canvas.on('selection:cleared', () => {
            onSelectionChange?.(null);
        });

        return () => {
            canvas.dispose();
        };
    }, []);

    const setupCanvas = useCallback((canvas: fabric.Canvas) => {
        const newLayers: CanvasLayer[] = [];

        // Background gradient
        const gradient = new fabric.Rect({
            width,
            height,
            selectable: false,
            evented: false,
            fill: new fabric.Gradient({
                type: 'linear',
                coords: { x1: 0, y1: 0, x2: 0, y2: height },
                colorStops: [
                    { offset: 0, color: gradientColors[0] },
                    { offset: 1, color: gradientColors[1] },
                ],
            }),
        });
        (gradient as any).name = 'background';
        canvas.add(gradient);
        newLayers.push({ id: 'bg', type: 'gradient', name: 'Background', visible: true, locked: true, object: gradient });

        // Gradient overlay at bottom
        const overlay = new fabric.Rect({
            width,
            height: height * 0.5,
            top: height * 0.5,
            selectable: false,
            evented: false,
            fill: new fabric.Gradient({
                type: 'linear',
                coords: { x1: 0, y1: 0, x2: 0, y2: height * 0.5 },
                colorStops: [
                    { offset: 0, color: 'rgba(0,0,0,0)' },
                    { offset: 1, color: 'rgba(0,0,0,0.8)' },
                ],
            }),
        });
        (overlay as any).name = 'gradient-overlay';
        canvas.add(overlay);
        newLayers.push({ id: 'overlay', type: 'gradient', name: 'Gradient Overlay', visible: true, locked: true, object: overlay });

        // Brand badge
        const brandBadge = new fabric.Textbox(brandText, {
            left: 32,
            top: height - 140,
            fontSize: 12,
            fontWeight: 'bold',
            fill: '#ffffff',
            backgroundColor: brandColor,
            padding: 8,
            width: 100,
            textAlign: 'center',
        });
        (brandBadge as any).name = 'brand';
        canvas.add(brandBadge);
        newLayers.push({ id: 'brand', type: 'text', name: 'Brand Badge', visible: true, locked: false, object: brandBadge });

        // Headline text
        const headlineText = new fabric.Textbox(headline, {
            left: 32,
            top: height - 100,
            fontSize: 28,
            fontWeight: 'bold',
            fill: textColor,
            width: width - 64,
            lineHeight: 1.2,
        });
        (headlineText as any).name = 'headline';
        canvas.add(headlineText);
        newLayers.push({ id: 'headline', type: 'text', name: 'Headline', visible: true, locked: false, object: headlineText });

        // Body text
        if (bodyText) {
            const body = new fabric.Textbox(bodyText, {
                left: 32,
                top: height - 50,
                fontSize: 14,
                fill: '#cccccc',
                width: width - 64,
            });
            (body as any).name = 'body';
            canvas.add(body);
            newLayers.push({ id: 'body', type: 'text', name: 'Body Text', visible: true, locked: false, object: body });
        }

        // Watermark
        if (showWatermark) {
            const watermark = new fabric.FabricText(watermarkText, {
                left: width - 150,
                top: height - 20,
                fontSize: 10,
                fill: 'rgba(255,255,255,0.3)',
                selectable: false,
                evented: false,
            });
            (watermark as any).name = 'watermark';
            canvas.add(watermark);
            newLayers.push({ id: 'watermark', type: 'text', name: 'Watermark', visible: true, locked: true, object: watermark });
        }

        setLayers(newLayers);
        onLayersChange?.(newLayers);
        canvas.renderAll();
    }, [width, height, gradientColors, headline, bodyText, brandText, brandColor, textColor, showWatermark, watermarkText]);

    // Update headline when prop changes
    useEffect(() => {
        if (!internalCanvasRef.current || !isInitialized) return;

        const canvas = internalCanvasRef.current;
        const headlineObj = canvas.getObjects().find((obj) => (obj as any).name === 'headline') as fabric.Textbox;
        if (headlineObj) {
            headlineObj.set('text', headline);
            canvas.renderAll();
        }
    }, [headline, isInitialized]);

    // Update body text when prop changes
    useEffect(() => {
        if (!internalCanvasRef.current || !isInitialized) return;

        const canvas = internalCanvasRef.current;
        const bodyObj = canvas.getObjects().find((obj) => (obj as any).name === 'body') as fabric.Textbox;
        if (bodyObj) {
            bodyObj.set('text', bodyText);
            canvas.renderAll();
        }
    }, [bodyText, isInitialized]);

    // Update brand when prop changes
    useEffect(() => {
        if (!internalCanvasRef.current || !isInitialized) return;

        const canvas = internalCanvasRef.current;
        const brandObj = canvas.getObjects().find((obj) => (obj as any).name === 'brand') as fabric.Textbox;
        if (brandObj) {
            brandObj.set('text', brandText);
            brandObj.set('backgroundColor', brandColor);
            canvas.renderAll();
        }
    }, [brandText, brandColor, isInitialized]);

    // Update text color when prop changes
    useEffect(() => {
        if (!internalCanvasRef.current || !isInitialized) return;

        const canvas = internalCanvasRef.current;
        const headlineObj = canvas.getObjects().find((obj) => (obj as any).name === 'headline') as fabric.Textbox;
        if (headlineObj) {
            headlineObj.set('fill', textColor);
            canvas.renderAll();
        }
    }, [textColor, isInitialized]);

    // Update background colors
    useEffect(() => {
        if (!internalCanvasRef.current || !isInitialized) return;

        const canvas = internalCanvasRef.current;
        const bgObj = canvas.getObjects().find((obj) => (obj as any).name === 'background') as fabric.Rect;
        if (bgObj) {
            bgObj.set('fill', new fabric.Gradient({
                type: 'linear',
                coords: { x1: 0, y1: 0, x2: 0, y2: height },
                colorStops: [
                    { offset: 0, color: gradientColors[0] },
                    { offset: 1, color: gradientColors[1] },
                ],
            }));
            canvas.renderAll();
        }
    }, [gradientColors, height, isInitialized]);

    return (
        <div
            ref={containerRef}
            className="shadow-2xl rounded-lg overflow-hidden"
            style={{ width, height }}
        />
    );
}

// Export utility function
export async function exportCanvas(
    canvas: fabric.Canvas,
    format: 'png' | 'jpg' = 'png',
    quality: number = 1
): Promise<string> {
    return new Promise((resolve) => {
        const dataUrl = canvas.toDataURL({
            format: format === 'jpg' ? 'jpeg' : 'png',
            quality,
            multiplier: 2, // 2x resolution for quality
        });
        resolve(dataUrl);
    });
}

export function downloadImage(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}
