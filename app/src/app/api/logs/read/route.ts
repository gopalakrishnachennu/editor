import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const type = searchParams.get('type'); // Optional filter by log type
        const limit = parseInt(searchParams.get('limit') || '1000');

        const logFile = path.join(process.cwd(), 'Logs', `${date}.jsonl`);

        try {
            const content = await fs.readFile(logFile, 'utf-8');

            // Parse JSON Lines
            let logs = content
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter(log => log !== null);

            // Filter by type if specified
            if (type) {
                logs = logs.filter(log => log.type === type || log.type?.startsWith(type));
            }

            // Apply limit
            logs = logs.slice(-limit);

            return NextResponse.json({
                logs,
                count: logs.length,
                date,
                file: `${date}.jsonl`
            });
        } catch (fileError) {
            // File doesn't exist
            return NextResponse.json({
                logs: [],
                count: 0,
                date,
                message: 'No logs for this date'
            });
        }
    } catch (error) {
        console.error('[Log Read API] Failed to read logs:', error);
        return NextResponse.json({
            error: 'Failed to read logs',
            details: (error as Error).message
        }, { status: 500 });
    }
}

// Get list of available log files
export async function OPTIONS() {
    try {
        const logDir = path.join(process.cwd(), 'Logs');

        try {
            const files = await fs.readdir(logDir);
            const logFiles = files
                .filter(f => f.endsWith('.jsonl'))
                .sort()
                .reverse(); // Most recent first

            return NextResponse.json({ files: logFiles });
        } catch {
            return NextResponse.json({ files: [] });
        }
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to list log files',
            details: (error as Error).message
        }, { status: 500 });
    }
}
