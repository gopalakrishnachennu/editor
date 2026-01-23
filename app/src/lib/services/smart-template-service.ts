import { TemplateConfig, templates } from "@/lib/templates";
import { DynamicTemplate } from "@/lib/stores/template-store";
import { ultraLogger } from "@/lib/ultra-logger";

export interface Asset {
    id: string;
    type: "image" | "text";
    content: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meta?: any;
}

export interface SmartTemplateResult {
    template: TemplateConfig | DynamicTemplate;
    score: number;
    matchReason: string[];
    missingAssets: string[];
    isCustom: boolean; // Badge indicator
}

interface InputStats {
    imageCount: number;
    textCount: number;
    hasLongText: boolean;
    hasShortText: boolean;
}

export class SmartTemplateService {
    /**
     * Main entry point: Find best templates for the given assets (fixed + custom)
     */
    static findBestMatches(
        assets: Asset[],
        customTemplates: DynamicTemplate[] = []
    ): SmartTemplateResult[] {
        ultraLogger.info("smart-matches", "Starting template matching", {
            assetCount: assets.length,
            customTemplateCount: customTemplates.length,
        });

        const inputStats = this.analyzeInput(assets);
        ultraLogger.debug("smart-matches", "Input analysis", { inputStats });

        // Score fixed templates
        const fixedResults = templates.map((template) => {
            const result = this.scoreFixedTemplate(template, inputStats);
            return result;
        });

        // Score custom templates
        const customResults = customTemplates.map((template) => {
            const result = this.scoreCustomTemplate(template, inputStats);
            return result;
        });

        // Merge and sort
        const allResults = [...fixedResults, ...customResults].sort(
            (a, b) => b.score - a.score
        );

        ultraLogger.info("smart-matches", "Matching complete", {
            topMatch: allResults[0]?.template?.id || allResults[0]?.template?.name,
            topScore: allResults[0]?.score,
            totalFixed: fixedResults.length,
            totalCustom: customResults.length,
        });

        return allResults;
    }

    private static analyzeInput(assets: Asset[]): InputStats {
        const images = assets.filter((a) => a.type === "image");
        const texts = assets.filter((a) => a.type === "text");

        return {
            imageCount: images.length,
            textCount: texts.length,
            hasLongText: texts.some((t) => t.content.length > 50),
            hasShortText: texts.some((t) => t.content.length < 50 && t.content.length > 0),
        };
    }

    /**
     * Score a fixed template (from templates.ts)
     */
    private static scoreFixedTemplate(
        template: TemplateConfig,
        inputStats: InputStats
    ): SmartTemplateResult {
        let score = 0;
        const reasons: string[] = [];
        const missing: string[] = [];

        const requiredImages = template.dataFields.filter(
            (f) => f.type === "image" && f.required
        ).length;
        const totalImages = template.dataFields.filter(
            (f) => f.type === "image"
        ).length;

        const missingImageCount = Math.max(0, requiredImages - inputStats.imageCount);

        if (missingImageCount > 0) {
            score = -100;
            missing.push(`Need ${missingImageCount} more image(s)`);
        } else {
            score += 50;
            reasons.push("Meets required image count");
        }

        if (inputStats.imageCount === totalImages) {
            score += 20;
            reasons.push("Perfect image count match");
        } else if (inputStats.imageCount > totalImages) {
            score -= 5;
        }

        const isTextHeavy = template.tags?.includes("text-heavy") || template.category === "quote";
        if (inputStats.hasLongText && isTextHeavy) {
            score += 15;
            reasons.push("Good for long text");
        }

        if (inputStats.hasShortText && template.category === "news") {
            score += 10;
            reasons.push("Good for headlines");
        }

        if (inputStats.imageCount >= 2 && template.tags?.includes("multi-person")) {
            score += 15;
            reasons.push("Designed for multiple images");
        }

        return {
            template,
            score,
            matchReason: reasons,
            missingAssets: missing,
            isCustom: false,
        };
    }

    /**
     * Score a custom template (from Firebase)
     * Custom templates always get a positive score - they're user-created
     */
    private static scoreCustomTemplate(
        template: DynamicTemplate,
        inputStats: InputStats
    ): SmartTemplateResult {
        // Start with a base score - custom templates are always valid options
        let score = 30;
        const reasons: string[] = ["Custom template"];
        const missing: string[] = [];

        // Custom templates dataFields might not be configured
        const requiredImages = template.dataFields?.filter(
            (f) => f.type === "image" && f.required
        ).length || 0;
        const totalImages = template.dataFields?.filter(
            (f) => f.type === "image"
        ).length || 0;

        // Bonus if image count matches
        if (inputStats.imageCount > 0) {
            score += 20;
            reasons.push("Image provided");
        }

        if (inputStats.imageCount === totalImages && totalImages > 0) {
            score += 15;
            reasons.push("Perfect image count match");
        }

        // Bonus for text content
        if (inputStats.hasShortText || inputStats.hasLongText) {
            score += 15;
            reasons.push("Text content provided");
        }

        // Check tags on custom templates
        const isTextHeavy = template.tags?.includes("text-heavy") || template.category === "quote";
        if (inputStats.hasLongText && isTextHeavy) {
            score += 10;
            reasons.push("Good for long text");
        }

        if (inputStats.hasShortText && template.category === "news") {
            score += 10;
            reasons.push("Good for headlines");
        }

        return {
            template,
            score,
            matchReason: reasons,
            missingAssets: missing,
            isCustom: true,
        };
    }
}
