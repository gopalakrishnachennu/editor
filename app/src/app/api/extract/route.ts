import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        // Fetch the URL content
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; PostDesignerBot/1.0)",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch URL" },
                { status: 400 }
            );
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract metadata
        const title =
            $('meta[property="og:title"]').attr("content") ||
            $("title").text() ||
            "";

        const description =
            $('meta[property="og:description"]').attr("content") ||
            $('meta[name="description"]').attr("content") ||
            "";

        const ogImage =
            $('meta[property="og:image"]').attr("content") ||
            $('meta[name="twitter:image"]').attr("content") ||
            "";

        // Extract main content
        const articleText = $("article, .article, .post-content, .entry-content")
            .first()
            .text()
            .trim()
            .substring(0, 2000);

        // Extract quotes (look for blockquotes or common quote patterns)
        const quotes: string[] = [];
        $("blockquote, .quote, .pullquote").each((_, el) => {
            const text = $(el).text().trim();
            if (text.length > 20 && text.length < 500) {
                quotes.push(text);
            }
        });

        // Extract images
        const images: { url: string; alt: string; isFeatured: boolean }[] = [];
        if (ogImage) {
            images.push({ url: ogImage, alt: "Featured image", isFeatured: true });
        }
        $("article img, .article img, .post-content img").each((i, el) => {
            const src = $(el).attr("src");
            const alt = $(el).attr("alt") || "";
            if (src && !src.includes("data:") && images.length < 5) {
                images.push({
                    url: src.startsWith("http") ? src : new URL(src, url).href,
                    alt,
                    isFeatured: false,
                });
            }
        });

        // Basic entity extraction (simplified)
        const text = `${title} ${description} ${articleText}`;
        const entities = {
            people: [] as string[],
            organizations: [] as string[],
            locations: [] as string[],
        };

        // Simple hashtag suggestions based on content
        const keywords = text
            .toLowerCase()
            .split(/\W+/)
            .filter((word) => word.length > 4)
            .slice(0, 10);

        const suggestedHashtags = [...new Set(keywords)]
            .slice(0, 5)
            .map((k) => `#${k.charAt(0).toUpperCase() + k.slice(1)}`);

        // Determine category based on content
        const categoryKeywords: Record<string, string[]> = {
            tech_startup: ["startup", "technology", "tech", "innovation", "funding", "ai"],
            sports_cricket: ["cricket", "sports", "match", "team", "player", "ipl"],
            business_finance: ["business", "finance", "market", "stock", "investment"],
            government_policy: ["government", "policy", "minister", "parliament"],
            entertainment: ["movie", "film", "actor", "music", "entertainment"],
        };

        let category = "general_news";
        for (const [cat, words] of Object.entries(categoryKeywords)) {
            if (words.some((word) => text.toLowerCase().includes(word))) {
                category = cat;
                break;
            }
        }

        // Determine sentiment (very basic)
        const positiveWords = ["success", "amazing", "great", "best", "growth", "win"];
        const negativeWords = ["fail", "crisis", "problem", "issue", "decline", "loss"];

        let sentiment: "positive" | "negative" | "neutral" = "neutral";
        const positiveCount = positiveWords.filter((w) =>
            text.toLowerCase().includes(w)
        ).length;
        const negativeCount = negativeWords.filter((w) =>
            text.toLowerCase().includes(w)
        ).length;

        if (positiveCount > negativeCount) sentiment = "positive";
        else if (negativeCount > positiveCount) sentiment = "negative";

        const extraction = {
            url,
            title,
            summary: description || articleText.substring(0, 300),
            keyQuotes: quotes.slice(0, 3),
            images,
            entities,
            sentiment,
            category,
            suggestedHashtags,
            extractedAt: new Date().toISOString(),
        };

        return NextResponse.json(extraction);
    } catch (error) {
        console.error("Content extraction error:", error);
        return NextResponse.json(
            { error: "Failed to extract content" },
            { status: 500 }
        );
    }
}
