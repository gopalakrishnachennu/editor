import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { context, type = 'headline' } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        const prompt = type === 'headline'
            ? `Generate 3 catchy, viral-worthy headlines (under 50 chars) based on this context: "${context}". Return ONLY a JSON array of strings.`
            : `Rewrite this text to be more engaging and concise (under 280 chars): "${context}". Return ONLY a JSON array with one string.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a professional social media copywriter. Return raw JSON array."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
        });

        const content = completion.choices[0].message.content || '[]';
        let options: string[] = [];

        try {
            // Attempt to parse JSON
            options = JSON.parse(content);
            if (!Array.isArray(options)) {
                // Handle case where it returns a single object
                options = [content.replace(/^"|"$/g, '')];
            }
        } catch (e) {
            // Fallback if not JSON
            options = [content];
        }

        return NextResponse.json({ options });

    } catch (error) {
        console.error('AI Text Gen Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate text', details: (error as Error).message },
            { status: 500 }
        );
    }
}
