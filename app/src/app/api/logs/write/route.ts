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

        // --- RETENTION POLICY START ---
        // Cleanup logs older than 30 days
        // We do this asynchronously without awaiting to not block the response
        cleanOldLogs(logDir).catch(err => console.error('[Log Cleanup] Failed:', err));
        // --- RETENTION POLICY END ---

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

// Helper: Delete logs older than 30 days
async function cleanOldLogs(logDir: string) {
    const RETENTION_DAYS = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    try {
        const files = await fs.readdir(logDir);
        for (const file of files) {
            if (!file.endsWith('.jsonl')) continue;

            // Filename format: YYYY-MM-DD.jsonl
            const dateStr = file.replace('.jsonl', '');
            const fileDate = new Date(dateStr);

            // Validate date
            if (isNaN(fileDate.getTime())) continue;

            if (fileDate < cutoffDate) {
                const filePath = path.join(logDir, file);
                await fs.unlink(filePath);
                console.log(`[Log Cleanup] Deleted old log file: ${file}`);
            }
        }
    } catch (error) {
        console.error('[Log Cleanup] Error during cleanup:', error);
    }
}
