import { TemplateConfig } from "@/lib/templates";
import { DynamicTemplate } from "@/lib/stores/template-store";

/**
 * CanvasElement - Matches the editor's internal format exactly
 */
export interface CanvasElement {
    id: string;
    type: 'text' | 'image' | 'shape' | 'group' | 'icon';
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    locked: boolean;
    visible: boolean;
    flipX: boolean;
    flipY: boolean;
    opacity?: number;
    // Text
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number;
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    // Image
    imageUrl?: string;
    borderRadius?: number;
    // Shape
    shapeType?: string;
    fillColor?: string;
    strokeWidth?: number;
    strokeColor?: string;
    // Binding
    isBindable?: boolean;
    bindConfig?: {
        fieldId: string;
        label: string;
        placeholder: string;
        fieldType: 'text' | 'image' | 'color';
    };
}

export interface CanvasState {
    elements: CanvasElement[];
    background: {
        color: string;
        image?: string | null;
    };
    frame: {
        id: string;
        name: string;
        width: number;
        height: number;
    };
    coordinateSystem?: 'percent' | 'pixel';
}

export interface BuilderAssets {
    images: string[];
    headline: string;
    subtext: string;
}

/**
 * CanvasStateBuilder - Generates editor-compatible canvas state
 * Single source of truth for both preview rendering and editor loading
 */
export class CanvasStateBuilder {
    /**
     * Build canvas state for any template type
     */
    static build(
        template: TemplateConfig | DynamicTemplate,
        assets: BuilderAssets
    ): CanvasState {
        const isCustom = "canvasState" in template && template.canvasState;

        if (isCustom) {
            return this.buildFromCustomTemplate(template as DynamicTemplate, assets);
        } else {
            return this.buildFromFixedTemplate(template as TemplateConfig, assets);
        }
    }

    /**
     * Build from a CUSTOM template (has canvasState)
     * Smart replacement of text and images with user's content
     */
    private static buildFromCustomTemplate(
        template: DynamicTemplate,
        assets: BuilderAssets
    ): CanvasState {
        // Parse stored canvas state
        const stored = JSON.parse(template.canvasState);
        const elements: CanvasElement[] = stored.elements || [];
        const background = stored.background || { color: "#1a1a2e" };
        const frame = stored.frame || { id: "instagram-portrait", name: "Instagram Portrait", width: 1080, height: 1350 };

        // Find text elements sorted by Y position (top to bottom for predictable replacement)
        const textElements = elements
            .filter((el: CanvasElement) => el.type === "text")
            .sort((a, b) => a.y - b.y);

        // Find replaceable images (hero/main images, not logos)
        const replaceableImages = elements.filter((el: CanvasElement) => {
            if (el.type !== "image") return false;

            const name = el.name?.toLowerCase() || "";
            const id = el.id?.toLowerCase() || "";

            // Skip if it's clearly a logo or brand element
            if (name.includes("logo") || id.includes("logo")) return false;
            if (name.includes("brand") || id.includes("brand")) return false;
            if (name.includes("icon") || id.includes("icon")) return false;

            // Include if bindable OR named as placeholder/hero/main OR is larger than 10% of canvas
            const isBindable = el.isBindable === true;
            const isHero =
                name.includes("hero") ||
                name.includes("main") ||
                name.includes("product") ||
                name.includes("placeholder") ||
                name.includes("image") || // common default name
                name.includes("photo") ||
                name.includes("picture");

            // Reduced threshold to 10% to catch smaller but significant images
            const isLargeImage = (el.width > 10 && el.height > 10);

            return isBindable || isHero || isLargeImage;
        });

        let headlineReplaced = false;
        let subtextReplaced = false;
        let imageIndex = 0;

        // Clone and update elements with user assets
        const updatedElements = elements.map((el: CanvasElement) => {
            const newEl = { ...el };

            // Replace only replaceable images (not logos/icons)
            if (el.type === "image") {
                const isReplaceable = replaceableImages.some(img => img.id === el.id);
                if (isReplaceable && imageIndex < assets.images.length) {
                    newEl.imageUrl = assets.images[imageIndex];
                    imageIndex++;
                }
            }

            // Replace text - use top-most text for headline (sorted by Y position)
            if (el.type === "text" && assets.headline && !headlineReplaced) {
                // Check if this is the primary text element
                const isPrimary =
                    el.id === "headline" ||
                    el.name?.toLowerCase().includes("headline") ||
                    el.name?.toLowerCase().includes("title") ||
                    el.isBindable ||
                    textElements[0]?.id === el.id; // Top-most text element

                // Also check if current text is placeholder-like
                const isPlaceholder =
                    el.text?.toLowerCase().includes("click") ||
                    el.text?.toLowerCase().includes("edit") ||
                    el.text?.toLowerCase().includes("headline") ||
                    el.text?.toLowerCase().includes("your text") ||
                    el.text?.toLowerCase().includes("double") ||
                    (el.text?.length || 0) < 30;

                if (isPrimary || isPlaceholder) {
                    newEl.text = assets.headline;
                    headlineReplaced = true;
                }
            }

            // Replace subtext (second text element by Y position)
            if (el.type === "text" && assets.subtext && headlineReplaced && !subtextReplaced) {
                if (el.id !== textElements[0]?.id) { // Not the headline
                    const isSecondary =
                        el.id === "subtext" ||
                        el.name?.toLowerCase().includes("sub") ||
                        el.name?.toLowerCase().includes("body") ||
                        el.name?.toLowerCase().includes("description") ||
                        textElements[1]?.id === el.id; // Second from top

                    if (isSecondary) {
                        newEl.text = assets.subtext;
                        subtextReplaced = true;
                    }
                }
            }

            return newEl;
        });

        return {
            elements: updatedElements,
            background,
            frame,
            coordinateSystem: 'pixel',
        };
    }

    /**
     * Build from a FIXED template (layout-based)
     */
    private static buildFromFixedTemplate(
        template: TemplateConfig,
        assets: BuilderAssets
    ): CanvasState {
        const elements: CanvasElement[] = [];
        const layout = template.layout;
        const style = template.style || {};
        const backgroundColor = style.backgroundColor || "#1a1a2e";

        // Frame dimensions
        const frame = { id: "instagram-portrait", name: "Instagram Portrait", width: 1080, height: 1350 };

        // Add user's image based on layout
        if (assets.images.length > 0) {
            const imgConfig = this.getImageConfig(layout.imagePosition, frame);
            elements.push({
                id: "user-image",
                type: "image",
                name: "User Image",
                ...imgConfig,
                rotation: 0,
                locked: false,
                visible: true,
                flipX: false,
                flipY: false,
                imageUrl: assets.images[0],
            });
        }

        // Add gradient overlay for text visibility
        if (layout.imagePosition === "full" || layout.textPosition === "overlay") {
            elements.push({
                id: "gradient-overlay",
                type: "shape",
                name: "Gradient Overlay",
                x: 0,
                y: 50,
                width: 100,
                height: 50,
                rotation: 0,
                locked: true,
                visible: true,
                flipX: false,
                flipY: false,
                shapeType: "rectangle",
                fillColor: "rgba(0,0,0,0.6)",
            });
        }

        // Add headline
        if (assets.headline) {
            const textY = layout.textPosition === "bottom" || layout.textPosition === "overlay" ? 70 : 10;
            elements.push({
                id: "headline",
                type: "text",
                name: "Headline",
                x: 5,
                y: textY,
                width: 90,
                height: 15,
                rotation: 0,
                locked: false,
                visible: true,
                flipX: false,
                flipY: false,
                text: assets.headline,
                fontSize: 32,
                fontWeight: 700,
                color: style.textColor || "#ffffff",
                fontFamily: style.fontFamily || "Inter, sans-serif",
                textAlign: "left",
            });
        }

        // Add subtext
        if (assets.subtext) {
            const subtextY = layout.textPosition === "bottom" || layout.textPosition === "overlay" ? 85 : 25;
            elements.push({
                id: "subtext",
                type: "text",
                name: "Subtext",
                x: 5,
                y: subtextY,
                width: 90,
                height: 10,
                rotation: 0,
                locked: false,
                visible: true,
                flipX: false,
                flipY: false,
                text: assets.subtext,
                fontSize: 16,
                fontWeight: 400,
                color: style.textColor || "#cccccc",
                fontFamily: style.fontFamily || "Inter, sans-serif",
                textAlign: "left",
            });
        }

        return {
            elements,
            background: { color: backgroundColor },
            frame,
            coordinateSystem: 'percent',
        };
    }

    /**
     * Get image position config based on layout
     */
    private static getImageConfig(position: string, frame: { width: number; height: number }) {
        switch (position) {
            case "full":
                return { x: 0, y: 0, width: 100, height: 100 };
            case "top":
                return { x: 0, y: 0, width: 100, height: 60 };
            case "split":
                return { x: 0, y: 0, width: 50, height: 100 };
            case "inset":
                return { x: 60, y: 5, width: 35, height: 35 };
            default:
                return { x: 0, y: 0, width: 100, height: 60 };
        }
    }
}
