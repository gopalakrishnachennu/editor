'use client';

/**
 * Batch Post Creator
 * Create multiple posts at once from URLs or text
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard, FeatureGate } from '@/components/guards';
import { useAuthStore, useAdminStore } from '@/lib/stores';
import { cn } from '@/lib/utils';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Sparkles,
    Loader2,
    CheckCircle,
    AlertCircle,
    Link as LinkIcon,
    FileText,
    Image,
    Play,
    Pause,
    RotateCcw,
} from 'lucide-react';

interface BatchItem {
    id: string;
    type: 'url' | 'text';
    input: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: {
        title: string;
        preview?: string;
    };
    error?: string;
}

export default function BatchEditorPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { settings } = useAdminStore();
    const [items, setItems] = useState<BatchItem[]>([
        { id: '1', type: 'url', input: '', status: 'pending' },
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const addItem = () => {
        setItems([
            ...items,
            { id: Date.now().toString(), type: 'url', input: '', status: 'pending' },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: string, updates: Partial<BatchItem>) => {
        setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    };

    const processBatch = async () => {
        setIsProcessing(true);
        setProgress(0);

        const validItems = items.filter((item) => item.input.trim());

        for (let i = 0; i < validItems.length; i++) {
            const item = validItems[i];
            updateItem(item.id, { status: 'processing' });

            try {
                // Simulate processing
                await new Promise((resolve) => setTimeout(resolve, 1500));

                updateItem(item.id, {
                    status: 'completed',
                    result: {
                        title: item.type === 'url'
                            ? `Post from ${new URL(item.input).hostname}`
                            : `Post: ${item.input.substring(0, 30)}...`,
                        preview: '/placeholder-post.png',
                    },
                });
            } catch (error) {
                updateItem(item.id, {
                    status: 'failed',
                    error: 'Failed to process this item',
                });
            }

            setProgress(((i + 1) / validItems.length) * 100);
        }

        setIsProcessing(false);
    };

    const resetAll = () => {
        setItems([{ id: '1', type: 'url', input: '', status: 'pending' }]);
        setProgress(0);
    };

    const completedCount = items.filter((item) => item.status === 'completed').length;
    const failedCount = items.filter((item) => item.status === 'failed').length;

    return (
        <AuthGuard>
            <FeatureGate feature="batchProcessing">
                <div className="min-h-screen bg-gray-50">
                    {/* Header */}
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold">Batch Create</h1>
                                <p className="text-sm text-gray-500">
                                    Create multiple posts at once
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isProcessing ? (
                                <button
                                    onClick={() => setIsProcessing(false)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                >
                                    <Pause className="w-4 h-4" />
                                    Stop
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={resetAll}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Reset
                                    </button>
                                    <button
                                        onClick={processBatch}
                                        disabled={!items.some((item) => item.input.trim())}
                                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <Play className="w-4 h-4" />
                                        Process All ({items.filter((i) => i.input.trim()).length})
                                    </button>
                                </>
                            )}
                        </div>
                    </header>

                    {/* Progress bar */}
                    {isProcessing && (
                        <div className="h-1 bg-gray-200">
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    )}

                    <div className="max-w-4xl mx-auto p-6">
                        {/* Stats */}
                        {(completedCount > 0 || failedCount > 0) && (
                            <div className="flex items-center gap-4 mb-6">
                                {completedCount > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                        <CheckCircle className="w-4 h-4" />
                                        {completedCount} Completed
                                    </div>
                                )}
                                {failedCount > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                                        <AlertCircle className="w-4 h-4" />
                                        {failedCount} Failed
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Items list */}
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        'bg-white rounded-xl border p-4 transition',
                                        item.status === 'completed' && 'border-green-300 bg-green-50',
                                        item.status === 'failed' && 'border-red-300 bg-red-50',
                                        item.status === 'processing' && 'border-indigo-300 bg-indigo-50',
                                        item.status === 'pending' && 'border-gray-200'
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Number */}
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-500 flex-shrink-0">
                                            {index + 1}
                                        </div>

                                        {/* Type selector */}
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => updateItem(item.id, { type: 'url' })}
                                                disabled={item.status !== 'pending'}
                                                className={cn(
                                                    'p-2 rounded-lg transition',
                                                    item.type === 'url'
                                                        ? 'bg-indigo-100 text-indigo-600'
                                                        : 'hover:bg-gray-100 text-gray-400'
                                                )}
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => updateItem(item.id, { type: 'text' })}
                                                disabled={item.status !== 'pending'}
                                                className={cn(
                                                    'p-2 rounded-lg transition',
                                                    item.type === 'text'
                                                        ? 'bg-indigo-100 text-indigo-600'
                                                        : 'hover:bg-gray-100 text-gray-400'
                                                )}
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Input */}
                                        <div className="flex-1">
                                            {item.type === 'url' ? (
                                                <input
                                                    type="url"
                                                    value={item.input}
                                                    onChange={(e) =>
                                                        updateItem(item.id, { input: e.target.value })
                                                    }
                                                    disabled={item.status !== 'pending'}
                                                    placeholder="Paste article URL..."
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                                />
                                            ) : (
                                                <textarea
                                                    value={item.input}
                                                    onChange={(e) =>
                                                        updateItem(item.id, { input: e.target.value })
                                                    }
                                                    disabled={item.status !== 'pending'}
                                                    placeholder="Enter your content..."
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                                                />
                                            )}

                                            {/* Status message */}
                                            {item.status === 'processing' && (
                                                <p className="mt-2 text-sm text-indigo-600 flex items-center gap-2">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    Processing...
                                                </p>
                                            )}
                                            {item.status === 'completed' && item.result && (
                                                <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Created: {item.result.title}
                                                </p>
                                            )}
                                            {item.status === 'failed' && (
                                                <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {item.error}
                                                </p>
                                            )}
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            disabled={items.length === 1 || item.status === 'processing'}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Add button */}
                        <button
                            onClick={addItem}
                            disabled={isProcessing || items.length >= (settings.rateLimits?.batchJobsPerDay || 10)}
                            className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-5 h-5" />
                            Add Another ({items.length} / {settings.rateLimits?.batchJobsPerDay || 10})
                        </button>

                        {/* Info */}
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-800">
                                <strong>Tip:</strong> You can add up to {settings.rateLimits?.batchJobsPerDay || 10} items per batch.
                                Each item will be processed and converted into a social media post.
                            </p>
                        </div>
                    </div>
                </div>
            </FeatureGate>
        </AuthGuard>
    );
}
