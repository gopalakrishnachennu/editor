"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Play,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Beaker,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TestResult {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    errors?: string[];
}

interface FileResult {
    name: string;
    status: 'passed' | 'failed';
    duration: number;
    tests: TestResult[];
}

interface TestSummary {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration: number;
}

interface TestRunResult {
    success: boolean;
    summary: TestSummary;
    files: FileResult[];
    error?: string;
}

export function TestsPanel() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<TestRunResult | null>(null);
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
    const [lastRunTime, setLastRunTime] = useState<Date | null>(null);

    const runTests = async () => {
        setIsRunning(true);
        setResults(null);

        try {
            const response = await fetch('/api/tests/run', {
                method: 'POST',
            });
            const data = await response.json();
            setResults(data);
            setLastRunTime(new Date());

            // Auto-expand failed files
            const failedFiles = data.files
                .filter((f: FileResult) => f.status === 'failed')
                .map((f: FileResult) => f.name);
            setExpandedFiles(new Set(failedFiles));
        } catch (error) {
            setResults({
                success: false,
                summary: { passed: 0, failed: 0, skipped: 0, total: 0, duration: 0 },
                files: [],
                error: 'Failed to connect to test server'
            });
        } finally {
            setIsRunning(false);
        }
    };

    const toggleFile = (fileName: string) => {
        const newExpanded = new Set(expandedFiles);
        if (newExpanded.has(fileName)) {
            newExpanded.delete(fileName);
        } else {
            newExpanded.add(fileName);
        }
        setExpandedFiles(newExpanded);
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Beaker className="w-5 h-5 text-purple-500" />
                        Test Runner
                    </h3>
                    <p className="text-gray-500 text-sm">
                        Run Vitest tests directly from the admin panel
                    </p>
                </div>
                <button
                    onClick={runTests}
                    disabled={isRunning}
                    className={cn(
                        "px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition",
                        isRunning
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90"
                    )}
                >
                    {isRunning ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Running Tests...
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            Run Tests
                        </>
                    )}
                </button>
            </div>

            {/* Last Run Info */}
            {lastRunTime && !isRunning && (
                <p className="text-xs text-gray-400">
                    Last run: {lastRunTime.toLocaleTimeString()}
                </p>
            )}

            {/* Summary Stats */}
            {results && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <div className={cn(
                        "p-4 rounded-xl border",
                        results.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    )}>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className={cn(
                            "text-xl font-bold",
                            results.success ? "text-green-600" : "text-red-600"
                        )}>
                            {results.success ? "PASSED" : "FAILED"}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl border bg-gray-50 border-gray-200">
                        <p className="text-sm text-gray-600">Passed</p>
                        <p className="text-xl font-bold text-green-600">
                            {results.summary.passed}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl border bg-gray-50 border-gray-200">
                        <p className="text-sm text-gray-600">Failed</p>
                        <p className="text-xl font-bold text-red-600">
                            {results.summary.failed}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl border bg-gray-50 border-gray-200">
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="text-xl font-bold text-gray-700">
                            {formatDuration(results.summary.duration)}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Error Message */}
            {results?.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-700">Error</p>
                        <p className="text-sm text-red-600">{results.error}</p>
                    </div>
                </div>
            )}

            {/* Test Files */}
            {results && results.files.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Test Files</h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        {results.files.map((file, index) => (
                            <div key={file.name} className={cn(
                                index > 0 && "border-t border-gray-200"
                            )}>
                                {/* File Header */}
                                <button
                                    onClick={() => toggleFile(file.name)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedFiles.has(file.name) ? (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        )}
                                        {file.status === 'passed' ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                        <span className="text-sm font-medium text-gray-800 text-left">
                                            {file.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-500">
                                            {file.tests.length} tests
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(file.duration)}
                                        </span>
                                    </div>
                                </button>

                                {/* Expanded Tests */}
                                {expandedFiles.has(file.name) && (
                                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                                        {file.tests.map((test, testIndex) => (
                                            <div
                                                key={testIndex}
                                                className="py-2 flex items-start gap-3"
                                            >
                                                {test.status === 'passed' ? (
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                                ) : test.status === 'failed' ? (
                                                    <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-gray-300 mt-0.5" />
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-700">{test.name}</p>
                                                    {test.errors && test.errors.length > 0 && (
                                                        <pre className="mt-2 text-xs bg-red-100 text-red-700 p-2 rounded overflow-x-auto">
                                                            {test.errors.join('\n')}
                                                        </pre>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {formatDuration(test.duration)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!results && !isRunning && (
                <div className="text-center py-12 text-gray-500">
                    <Beaker className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Click &quot;Run Tests&quot; to execute your test suite</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Tests will run using Vitest with JSON output
                    </p>
                </div>
            )}

            {/* Running State */}
            {isRunning && (
                <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-500" />
                    <p className="text-gray-600">Running tests...</p>
                    <p className="text-sm text-gray-400 mt-1">
                        This may take a minute
                    </p>
                </div>
            )}

            {/* Dev Mode Notice */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-700">
                    <strong>Note:</strong> Test runner is only available in development mode.
                    Tests will not run in production builds.
                </p>
            </div>
        </div>
    );
}
