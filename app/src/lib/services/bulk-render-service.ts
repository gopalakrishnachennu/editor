/**
 * Bulk Render Service
 * Handles client-side generation of multiple post variations and zipping
 */

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ParsedData } from "@/lib/utils/csv-parser";
import { TemplateConfig } from "@/lib/templates";
import { CanvasElement } from "@/lib/editor/canvas-engine";
import { resolveVariables, getSystemVariables } from "@/lib/variables";

// We need a way to render canvas state to an image blob without showing it on screen
// Helper to load image
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

export class BulkRenderService {
    /**
     * Generate a batch of images from template + data
     */
    static async generateBatch(
        template: TemplateConfig,
        data: ParsedData,
        mapping: Record<string, string>,
        onProgress?: (progress: number) => void
    ): Promise<void> {
        const zip = new JSZip();
        const total = data.rows.length;
        const width = 1080; // Default width (should come from template.width if available)
        const height = 1080; // Default height

        // Create an off-screen canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("Could not get 2D context");

        // Cache persistent assets (bg, logo) if possible?
        // For now, we unfortunately have to re-render. 
        // A better approach would be to us the existing CanvasEngine if we can instantiate it headless.
        // Or simplified rendering logic here.

        // Since re-implementing the full CanvasEngine rendering logic here is risky and redundant,
        // we will use a simplified approach:
        // 1. Iterate rows
        // 2. For each row, substitute variables in the canvas elements
        // 3. Draw to canvas (Text, Image, Shape)
        // 4. Blob & Zip

        // NOTE: This simple renderer needs to match CanvasEngine's render loop.
        // Use this for "good enough" export or refactor CanvasEngine to be reusable headless.

        for (let i = 0; i < total; i++) {
            const row = data.rows[i];

            // Prepare variables
            const variables: Record<string, string> = { ...row }; // Raw CSV data

            // Map template field IDs to CSV data
            // If mapping exists: templateField "headline" -> csvCol "Title" -> variables["headline"] = row["Title"]
            Object.entries(mapping).forEach(([fieldId, csvHeader]) => {
                if (row[csvHeader]) {
                    variables[fieldId] = row[csvHeader];
                }
            });

            // Resolve system variables too?
            // const systemVars = getSystemVariables(null, null, variables);

            // Render Frame
            await this.renderFrame(ctx, template, variables);

            // Convert to Blob
            const blob = await new Promise<Blob | null>(resolve =>
                canvas.toBlob(resolve, "image/png", 0.9)
            );

            if (blob) {
                // Filename: try to use a unique col or index
                const name = row[mapping['headline']] || row[Object.keys(row)[0]] || `post-${i + 1}`;
                const cleanName = name.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
                zip.file(`${cleanName}-${i + 1}.png`, blob);
            }

            if (onProgress) {
                onProgress(Math.round(((i + 1) / total) * 100));
            }
        }

        // Generate Zip
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${template.name.replace(/\s+/g, '-')}-Batch.zip`);
    }

    /**
     * Simplified Renderer
     * Mirrors basic CanvasEngine logic for export
     */
    private static async renderFrame(
        ctx: CanvasRenderingContext2D,
        template: TemplateConfig,
        variables: Record<string, string>
    ) {
        const { width, height } = ctx.canvas;

        // Clear
        ctx.fillStyle = template.style.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Draw Elements (Sorted by Z-index roughly - actually array order is usually bottom-up)
        // We need to convert CanvasElementDef to something usable
        // And apply bindings!

        for (const elDef of template.canvasElements) {
            // 1. Resolve Content
            let text = elDef.defaultValue || "";
            let imageUrl = "";

            // Check binding
            if (elDef.binding && variables[elDef.binding]) {
                if (elDef.type === 'text') text = variables[elDef.binding];
                if (elDef.type === 'image') imageUrl = variables[elDef.binding];
            }

            // Resolve variables in text
            if (elDef.type === 'text') {
                text = resolveVariables(text, variables);
            }

            // 2. Draw
            ctx.save();

            // Position (Percentages to Pixels)
            const x = (elDef.x / 100) * width;
            const y = (elDef.y / 100) * height;
            const w = (elDef.width / 100) * width;
            const h = (elDef.height / 100) * height;

            // Attributes
            ctx.globalAlpha = elDef.style.opacity ?? 1;

            if (elDef.type === 'image') {
                try {
                    // Using binding URL or placeholder/default
                    const url = imageUrl || (typeof elDef.binding === 'string' && elDef.binding.includes('http') ? elDef.binding : null) || "/placeholder.png";
                    if (url) {
                        const img = await loadImage(url);

                        // Simple cover fit
                        // Draw image clipped to bounds?
                        // For now, stretch/cover
                        ctx.drawImage(img, x, y, w, h);
                    } else {
                        ctx.fillStyle = "#ccc";
                        ctx.fillRect(x, y, w, h);
                    }
                } catch (e) {
                    // Failed to load image
                    ctx.fillStyle = "#ff0000";
                    ctx.fillRect(x, y, w, h);
                }
            } else if (elDef.type === 'text') {
                ctx.font = `${elDef.style.fontWeight || 'normal'} ${elDef.style.fontSize || 24}px ${elDef.style.fontFamily || 'Arial'}`;
                ctx.fillStyle = elDef.style.color || "#000000";
                ctx.textAlign = elDef.style.textAlign || "left";
                ctx.textBaseline = "top";

                // Basic Multi-line support?
                // Simple fillText for now
                ctx.fillText(text, x, y, w);
                // Note: 'w' as 4th arg is max width compression, not wrapping. 
                // Wrapping requires complex logic (measureText).
            } else if (elDef.type === 'shape') {
                ctx.fillStyle = elDef.style.backgroundColor || elDef.style.color || "#000000";
                ctx.fillRect(x, y, w, h);
            }

            ctx.restore();
        }

        // Overlay?
        if (template.style.gradientOverlay && template.style.gradientOverlay !== 'none') {
            // Basic Gradient support (Linear Top-Bottom assumed for simplicity in MVP)
            // Parsing CSS gradients manually is hard. 
            // We'll skip complex overlays for this Client-Side MVP or hardcode a simple dark gradient if keyword detected
            if (template.style.gradientOverlay.includes("gradient")) {
                const grad = ctx.createLinearGradient(0, height * 0.5, 0, height);
                grad.addColorStop(0, "transparent");
                grad.addColorStop(1, "rgba(0,0,0,0.7)");
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            }
        }
    }
}
