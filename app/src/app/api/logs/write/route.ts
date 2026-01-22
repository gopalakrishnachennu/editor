import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { entries } = await request.json();

        if (!entries || !Array.isArray(entries)) {
            return NextResponse.json({ error: 'Invalid entries' }, { status: 400 });
        }

        // Get today's date for log file name
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const logDir = path.join(process.cwd(), 'Logs');
        const logFile = path.join(logDir, `${today}.jsonl`);

        // Ensure Logs directory exists
        await fs.mkdir(logDir, { recursive: true });

        // Format as JSON Lines (one JSON object per line)
        const logLines = entries
            .map((entry: any) => JSON.stringify(entry))
            .join('\n') + '\n';

        // Append to today's log file
        await fs.appendFile(logFile, logLines, 'utf-8');

        return NextResponse.json({
            success: true,
            count: entries.length,
            file: `${today}.jsonl`
        });
    } catch (error) {
        console.error('[Log Write API] Failed to write logs:', error);
        return NextResponse.json({
            error: 'Failed to write logs',
            details: (error as Error).message
        }, { status: 500 });
    }
}
