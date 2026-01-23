import * as fabric from "fabric";
import JSZip from "jszip";

interface BulkRenderOptions {
    width: number;
    height: number;
    quality?: number;
}

export class BulkRenderService {
    static async generateBatch(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        template: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any[],
        options: BulkRenderOptions
    ): Promise<Blob> {
        const { width, height, quality = 0.8 } = options;

        // Create a container for the canvas to ensure it renders correctly
        // We position it off-screen but keep it in the DOM for reliability
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-10000px";
        container.style.top = "-10000px";
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        document.body.appendChild(container);

        const canvasEl = document.createElement("canvas");
        canvasEl.width = width;
        canvasEl.height = height;
        container.appendChild(canvasEl);

        // Initialize Fabric canvas
        const canvas = new fabric.Canvas(canvasEl, {
            width,
            height,
            preserveObjectStacking: true,
            renderOnAddRemove: false, // Optimization: manual render
        });

        const zip = new JSZip();

        try {
            console.log("BulkRenderService: Loading template...");

            // Load standard template
            await canvas.loadFromJSON(template);

            // Ensure all objects are loaded
            await Promise.all(
                canvas.getObjects().map((obj) => {
                    if (obj instanceof fabric.Image) {
                        // Ensure images are fully decoded
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        if ((obj as any)._element && (obj as any)._element instanceof HTMLImageElement) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            return ((obj as any)._element as HTMLImageElement).decode().catch(() => { });
                        }
                    }
                    return Promise.resolve();
                })
            );

            console.log("BulkRenderService: Template loaded. Processing rows...");

            for (let i = 0; i < data.length; i++) {
                const row = data[i];

                // Apply variables to canvas objects
                this.applyVariables(canvas, row);

                // Render
                canvas.renderAll();

                // Export
                const blob = await new Promise<Blob | null>((resolve) => {
                    canvasEl.toBlob((b) => resolve(b), "image/jpeg", quality);
                });

                if (blob) {
                    zip.file(`image_${i + 1}.jpg`, blob);
                }
            }

            console.log("BulkRenderService: Generation complete.");
            return await zip.generateAsync({ type: "blob" });

        } catch (error) {
            console.error("BulkRenderService Error:", error);
            throw error;
        } finally {
            // Cleanup
            canvas.dispose();
            document.body.removeChild(container);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static applyVariables(canvas: fabric.Canvas, row: any) {
        const objects = canvas.getObjects();

        objects.forEach((obj) => {
            // Logic to replace text and images based on 'id' or other properties matching row keys
            // This matches the logic from the previous implementations
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const id = (obj as any).id; // Assuming 'id' property exists on objects for mapping
            if (id && row[id] !== undefined) {
                if (obj instanceof fabric.IText || obj instanceof fabric.Textbox || obj instanceof fabric.Text) {
                    obj.set("text", String(row[id]));
                } else if (obj instanceof fabric.Image && typeof row[id] === "string") {
                    // Handle image replacement - complex in Fabric, assumes src replacement logic would go here
                    // For now, keeping it simple as the user is aborting deep debug
                }
            }
        });
    }
}
