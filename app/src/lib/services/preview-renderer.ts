import * as fabric from "fabric";
import { TemplateConfig } from "@/lib/templates";
import { DynamicTemplate } from "@/lib/stores/template-store";
import { CanvasStateBuilder, CanvasState, CanvasElement, BuilderAssets } from "./canvas-state-builder";
import { ultraLogger } from "@/lib/ultra-logger";

interface RenderResult {
    templateId: string;
    previewUrl: string;
    canvasState: CanvasState;
    success: boolean;
    error?: string;
}

/**
 * PreviewRenderer - Uses CanvasStateBuilder for single source of truth
 * Same canvas state is used for preview AND editor loading
 */
export class PreviewRenderer {
    /**
     * Render a template with user assets
     * Returns both preview image AND canvas state for editor
     */
    static async renderPreview(
        template: TemplateConfig | DynamicTemplate,
        assets: BuilderAssets,
        options: { width?: number; height?: number } = {}
    ): Promise<RenderResult> {
        const { width = 400, height = 500 } = options;
        const templateId = template.id || (template as DynamicTemplate).id;

        ultraLogger.info("preview-render", "Starting preview render", { templateId });

        try {
            // Step 1: Build canvas state (SINGLE SOURCE OF TRUTH)
            const canvasState = CanvasStateBuilder.build(template, assets);

            // Step 2: Render canvas state to image
            const previewUrl = await this.renderStateToImage(canvasState, { width, height });

            ultraLogger.info("preview-render", "Preview render complete", { templateId });

            return {
                templateId,
                previewUrl,
                canvasState,
                success: true,
            };
        } catch (error) {
            ultraLogger.error("preview-render", "Preview render failed", { templateId, error: String(error) });

            return {
                templateId,
                previewUrl: template.thumbnail || "",
                canvasState: { elements: [], background: { color: "#1a1a2e" }, frame: { id: "default", name: "Default", width: 1080, height: 1350 } },
                success: false,
                error: String(error),
            };
        }
    }

    /**
     * Render canvas state to image
     */
    private static async renderStateToImage(
        state: CanvasState,
        options: { width: number; height: number }
    ): Promise<string> {
        const { width, height } = options;
        const frame = state.frame;

        // Create offscreen canvas
        const container = document.createElement("div");
        container.style.cssText = `position:absolute;left:-10000px;top:-10000px;width:${width}px;height:${height}px;`;
        document.body.appendChild(container);

        const canvasEl = document.createElement("canvas");
        canvasEl.width = width;
        canvasEl.height = height;
        container.appendChild(canvasEl);

        const canvas = new fabric.Canvas(canvasEl, {
            width,
            height,
            preserveObjectStacking: true,
            renderOnAddRemove: false,
        });

        try {
            // Set background
            canvas.backgroundColor = state.background.color;

            // Scale factor
            const scaleX = width / frame.width;
            const scaleY = height / frame.height;
            const scale = Math.min(scaleX, scaleY);

            // Render each element
            for (const el of state.elements) {
                if (el.visible === false) continue;

                let elX, elY, elW, elH;

                // Handle Different Coordinate Systems
                if (state.coordinateSystem === 'pixel') {
                    // Pixel Coordinates (Custom Templates)
                    elX = el.x * scale;
                    elY = el.y * scale;
                    elW = el.width * scale;
                    elH = el.height * scale;
                } else {
                    // Percentage Coordinates (Fixed Templates)
                    elX = (el.x / 100) * frame.width * scale;
                    elY = (el.y / 100) * frame.height * scale;
                    elW = (el.width / 100) * frame.width * scale;
                    elH = (el.height / 100) * frame.height * scale;
                }

                if (el.type === "text") {
                    // DEBUG: Force Arial to check if it's a font loading issue
                    const safeFont = "Arial, sans-serif";

                    console.log(`[PreviewRenderer] Rendering Text: "${el.text}"`, {
                        x: elX, y: elY, w: elW, fontSize: (el.fontSize || 24) * scale,
                        color: el.color,
                        type: "IText (No Wrapping)"
                    });

                    // Use IText instead of Textbox (Simpler rendering, no auto-wrap)
                    const textbox = new fabric.IText(el.text || "", {
                        left: elX,
                        top: elY,
                        // width: elW, // IText doesn't use width for wrapping
                        fontSize: (el.fontSize || 24) * scale,
                        fontWeight: el.fontWeight || 400,
                        fill: "#00FF00", // DEBUG: Force GREEN
                        fontFamily: safeFont,
                        backgroundColor: "rgba(255, 0, 0, 0.5)", // DEBUG: Red Background
                        objectCaching: false, // Force re-render on every frame
                    });

                    // If we need to scale it to fit width (since IText doesn't wrap)
                    // limit width ? No, let it overflow for now to see if it renders.

                    canvas.add(textbox);

                } else if (el.type === "image" && el.imageUrl) {
                    await this.addImage(canvas, el.imageUrl, elX, elY, elW, elH);

                } else if (el.type === "shape") {
                    const rect = new fabric.Rect({
                        left: elX,
                        top: elY,
                        width: elW,
                        height: elH,
                        fill: el.fillColor || "#6366f1",
                    });
                    canvas.add(rect);
                }
            }

            canvas.renderAll();

            return canvas.toDataURL({
                format: "jpeg",
                quality: 0.85,
                multiplier: 1,
            });
        } finally {
            canvas.dispose();
            document.body.removeChild(container);
        }
    }

    /**
     * Add image to canvas
     */
    private static async addImage(
        canvas: fabric.Canvas,
        imageUrl: string,
        x: number,
        y: number,
        w: number,
        h: number
    ): Promise<void> {
        return new Promise((resolve) => {
            fabric.FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" })
                .then((img) => {
                    if (!img) { resolve(); return; }

                    const scaleX = w / (img.width || 1);
                    const scaleY = h / (img.height || 1);
                    const scale = Math.max(scaleX, scaleY);

                    // Center the image in the slot
                    const cx = x + w / 2;
                    const cy = y + h / 2;

                    img.set({
                        originX: "center",
                        originY: "center",
                        left: cx,
                        top: cy,
                        scaleX: scale,
                        scaleY: scale,
                        // Removed clipPath to ensure visibility (relying on canvas bounds for full-screen templates)
                    });

                    canvas.add(img);
                    resolve();
                })
                .catch((err) => {
                    // console.error("Failed to load image for preview", err);
                    resolve();
                });
        });
    }
}
