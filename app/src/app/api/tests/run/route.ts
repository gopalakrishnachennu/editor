import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface VitestTestResult {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    errors?: string[];
}

interface VitestFileResult {
    name: string;
    status: 'passed' | 'failed';
    duration: number;
    tests: VitestTestResult[];
}

interface TestRunResponse {
    success: boolean;
    summary: {
        passed: number;
        failed: number;
        skipped: number;
        total: number;
        duration: number;
    };
    files: VitestFileResult[];
    error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<TestRunResponse>> {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
            success: false,
            summary: { passed: 0, failed: 0, skipped: 0, total: 0, duration: 0 },
            files: [],
            error: 'Test runner is only available in development mode'
        }, { status: 403 });
    }

    try {
        const appDir = path.resolve(process.cwd());

        // Run vitest with JSON reporter
        const { stdout, stderr } = await execAsync(
            'npx vitest run --reporter=json',
            {
                cwd: appDir,
                timeout: 120000, // 2 minute timeout
                env: { ...process.env, CI: 'true' } // Ensure non-interactive mode
            }
        );

        // Parse JSON output
        let results;
        try {
            // Vitest outputs JSON to stdout
            results = JSON.parse(stdout);
        } catch {
            // If JSON parsing fails, try to extract from the output
            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                results = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse test results');
            }
        }

        // Transform vitest output to our format
        const files: VitestFileResult[] = (results.testResults || []).map((file: any) => ({
            name: file.name.replace(appDir, '').replace(/^\//, ''),
            status: file.status === 'passed' ? 'passed' : 'failed',
            duration: file.endTime - file.startTime,
            tests: (file.assertionResults || []).map((test: any) => ({
                name: test.title || test.fullName,
                status: test.status,
                duration: test.duration || 0,
                errors: test.failureMessages || []
            }))
        }));

        const summary = {
            passed: results.numPassedTests || 0,
            failed: results.numFailedTests || 0,
            skipped: results.numPendingTests || 0,
            total: results.numTotalTests || 0,
            duration: files.reduce((acc: number, f: VitestFileResult) => acc + f.duration, 0)
        };

        return NextResponse.json({
            success: summary.failed === 0,
            summary,
            files
        });

    } catch (error: any) {
        console.error('Test run error:', error);

        // Try to parse partial results from stderr/stdout
        let partialResults = null;
        try {
            if (error.stdout) {
                const jsonMatch = error.stdout.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    partialResults = JSON.parse(jsonMatch[0]);
                }
            }
        } catch {
            // Ignore parsing errors
        }

        if (partialResults) {
            const files: VitestFileResult[] = (partialResults.testResults || []).map((file: any) => ({
                name: file.name.replace(process.cwd(), '').replace(/^\//, ''),
                status: file.status === 'passed' ? 'passed' : 'failed',
                duration: file.endTime - file.startTime,
                tests: (file.assertionResults || []).map((test: any) => ({
                    name: test.title || test.fullName,
                    status: test.status,
                    duration: test.duration || 0,
                    errors: test.failureMessages || []
                }))
            }));

            return NextResponse.json({
                success: false,
                summary: {
                    passed: partialResults.numPassedTests || 0,
                    failed: partialResults.numFailedTests || 0,
                    skipped: partialResults.numPendingTests || 0,
                    total: partialResults.numTotalTests || 0,
                    duration: files.reduce((acc: number, f: VitestFileResult) => acc + f.duration, 0)
                },
                files
            });
        }

        return NextResponse.json({
            success: false,
            summary: { passed: 0, failed: 0, skipped: 0, total: 0, duration: 0 },
            files: [],
            error: error.message || 'Failed to run tests'
        }, { status: 500 });
    }
}
