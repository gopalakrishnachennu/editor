import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";
import { ultraLogger } from "@/lib/ultra-logger";

export class AIService {
    /**
     * Generate headlines using server-side OpenAI
     */
    static async generateHeadlines(context: string): Promise<string[]> {
        const startTime = Date.now();
        ultraLogger.info("ai-service", "Starting headline generation", { contextLength: context.length });

        try {
            const response = await fetch("/api/ai/text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context, type: "headline" }),
            });

            if (!response.ok) throw new Error("Failed to generate headlines");

            const data = await response.json();

            ultraLogger.info("ai-service", "Headline generation successful", {
                duration: Date.now() - startTime,
                count: data.options?.length
            });

            return data.options || [];
        } catch (error) {
            ultraLogger.error("ai-service", "Headline generation failed", { error: String(error) });
            return ["Error generating headlines"];
        }
    }

    /**
     * Remove background using client-side WebAssembly
     */
    static async removeBackground(imageSrc: string): Promise<Blob> {
        const startTime = Date.now();
        ultraLogger.info("ai-service", "Starting background removal", { imageSrcLength: imageSrc.length });

        try {
            const blob = await imglyRemoveBackground(imageSrc, {
                progress: (key, current, total) => {
                    if (current % 10 === 0) {
                        ultraLogger.debug("ai-service", `BG Removal progress: ${key} ${current}/${total}`, {});
                    }
                },
            });

            ultraLogger.info("ai-service", "Background removal successful", {
                duration: Date.now() - startTime,
                blobSize: blob.size
            });

            return blob;
        } catch (error) {
            ultraLogger.error("ai-service", "Background removal failed", { error: String(error) });
            throw error;
        }
    }

    /**
     * Extract dominant colors from an image
     */
    static async extractColors(imageSrc: string): Promise<string[]> {
        ultraLogger.info("ai-service", "Starting color extraction", {});

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageSrc;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    ultraLogger.warn("ai-service", "Canvas context creation failed", {});
                    resolve([]);
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const centerData = ctx.getImageData(img.width / 2, img.height / 2, 1, 1).data;
                const centerHex = `#${[centerData[0], centerData[1], centerData[2]].map(x => x.toString(16).padStart(2, '0')).join('')}`;

                ultraLogger.info("ai-service", "Color extraction successful", { color: centerHex });
                resolve([centerHex]);
            };

            img.onerror = (e) => {
                ultraLogger.error("ai-service", "Color extraction failed (image load error)", { error: String(e) });
                reject(e);
            };
        });
    }
}
