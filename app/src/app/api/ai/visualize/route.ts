import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { ultraLogger } from '@/lib/ultra-logger';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Clean text from URL using Cheerio
 */
async function scrapeUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove script, style, and noscript tags
        $('script').remove();
        $('style').remove();
        $('noscript').remove();
        $('iframe').remove();
        $('nav').remove();
        $('footer').remove();
        $('header').remove();

        // Target main content areas usually found in blogs/articles
        const content = $('article').text() || $('main').text() || $('body').text();

        // Clean white space
        return content.replace(/\s+/g, ' ').trim().slice(0, 5000); // Limit context window
    } catch (error) {
        throw new Error(`Failed to scrape URL: ${(error as Error).message}`);
    }
}

export async function POST(req: Request) {
    const startTime = Date.now();

    try {
        const { input, type = 'text', platform = 'instagram' } = await req.json();

        ultraLogger.info('ai-visualize-start',
            `Received request to visualize content. ` +
            `Type: ${type}, Platform: ${platform}. ` +
            `Input length: ${input.length} chars.`,
            { type, platform, inputPreview: input.substring(0, 100) }
        );

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not defined in environment variables');
        }

        let cleanText = input;

        // Scrape if URL
        if (type === 'url') {
            ultraLogger.info('ai-visualize-scrape',
                `Input is a URL, scraping content...`,
                { url: input }
            );
            cleanText = await scrapeUrl(input);
            ultraLogger.info('ai-visualize-scrape-success',
                `Successfully scraped URL. ` +
                `Extracted ${cleanText.length} characters of text.`,
                { contentLength: cleanText.length }
            );
        }

        // OpenAI Analysis
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", // Use turbo-preview for better instruction following or gpt-4o
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `You are the "Cognitive Engine" for a high-end social media design tool.
Your goal is to transform raw text into a Viral Social Carousel Blueprint.

Follow this cognitive process:
1. **Analyze**: Understand the core message, sentiment (mood), and intended audience.
2. **Hook**: Extract or write the single most "scroll-stopping" hook. Use "Curiosity Gaps" or "Negative Bias".
3. **Structure**: Break the narrative into 5-7 distinct slides:
   - Slide 1: Hook (Bold statement)
   - Slide 2: Problem/Agitation (Why this matters)
   - Slides 3-5: The Insight/Value (Core concepts)
   - Slide 6: Payoff/Solution
   - Slide 7: CTA (Question or prompt)
4. **Visual Metaphors**: For each slide, suggest an *abstract visual metaphor* to search for (not just literal keywords).
   - E.g., for "Compound Interest", metaphor = "Snowball rolling down hill" or "Oaktree roots".
5. **Layout Selection**: Assign a semantic layout type for each slide:
   - 'impact' (Big text, background image)
   - 'list' (Bullet points)
   - 'quote' (Centered text, author)
   - 'split' (Comparison or Text + Image side-by-side)
   - 'chart' (Data visualization placeholder)
   - 'profile' (CTA card)

Return STRICT JSON format:
{
  "meta": {
    "sentiment": "analytical" | "motivational" | "urgent" | "calm",
    "themeColor": "blue" | "red" | "green" | "yellow" | "monochrome",
    "viralityScore": 0-100
  },
  "slides": [
    {
      "order": 1,
      "layout": "impact",
      "text": {
        "primary": "Main Headline",
        "secondary": "Subtext or body"
      },
      "visual": {
        "description": "Literal description for accessibility",
        "metaphor": "Abstract concept for image search",
        "searchQuery": "Optimized unsplash search term"
      },
      "voiceover": "Optional script for video repurposing"
    }
  ]
}`
                },
                {
                    role: "user",
                    content: `Analyze this content and generate a carousel blueprint:\n\n${cleanText}`
                }
            ],
            temperature: 0.7,
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');

        ultraLogger.info('ai-visualize-success',
            `Cognitive analysis complete. ` +
            `Generated ${result.slides?.length || 0} slides. ` +
            `Sentiment: ${result.meta?.sentiment}. ` +
            `Time taken: ${Date.now() - startTime}ms.`,
            {
                sentiment: result.meta?.sentiment,
                slideCount: result.slides?.length,
                viralityScore: result.meta?.viralityScore
            }
        );

        return NextResponse.json(result);

    } catch (error) {
        ultraLogger.error('ai-visualize-error',
            `Failed to analyze content. ` +
            `Error: ${(error as Error).message}`,
            { error: (error as Error).message, stack: (error as Error).stack }
        );
        return NextResponse.json(
            { error: 'Failed to process content', details: (error as Error).message },
            { status: 500 }
        );
    }
}
