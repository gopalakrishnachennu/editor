'use client';

// Force Rebuild 4.0
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Link as LinkIcon, FileText, Loader2, Play } from 'lucide-react';
import { ultraLogger } from '@/lib/ultra-logger';

// Type definitions for the API response
interface VisualizerResponse {
    meta: {
        sentiment: string;
        themeColor: string;
        viralityScore: number;
    };
    slides: {
        order: number;
        layout: string;
        text: {
            primary: string;
            secondary: string;
        };
        visual: {
            description: string;
            metaphor: string;
            searchQuery: string;
        };
    }[];
}

export default function InsightVisualizerPage() {
    const [input, setInput] = useState('');
    const [inputType, setInputType] = useState<'text' | 'url'>('text');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [result, setResult] = useState<VisualizerResponse | null>(null);

    const handleAnalyze = async () => {
        if (!input.trim()) return;

        setIsAnalyzing(true);
        setLoadingStage('Reading content...');
        setResult(null);

        try {
            // Simulate stage progression for better UX
            const stageTimer = setInterval(() => {
                setLoadingStage(prev => {
                    if (prev === 'Reading content...') return 'Extracting insights...';
                    if (prev === 'Extracting insights...') return 'Identifying viral hooks...';
                    if (prev === 'Identifying viral hooks...') return 'Designing visual metaphors...';
                    return prev;
                });
            }, 2000);

            const response = await fetch('/api/ai/visualize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input, type: inputType }),
            });

            clearInterval(stageTimer);

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            setResult(data);
            ultraLogger.info('visualizer-ui-success', 'Received analysis result from API', { slideCount: data.slides?.length });

        } catch (error) {
            console.error('Analysis error:', error);
            ultraLogger.error('visualizer-ui-error', 'Failed to analyze content', { error: (error as Error).message });
            setLoadingStage('Error occurred');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                        Insight <span className="text-indigo-600">Visualizer</span> 🧠
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Transform articles, notes, or ideas into viral social carousels instantly.
                        Powered by cognitive AI analysis.
                    </p>
                </div>

                {/* The Magic Box */}
                {!result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-2 md:p-4 mb-12"
                    >
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4 p-2">
                            <button
                                onClick={() => setInputType('text')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputType === 'text' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                Paste Text
                            </button>
                            <button
                                onClick={() => setInputType('url')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputType === 'url' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <LinkIcon className="w-4 h-4" />
                                Import URL
                            </button>
                        </div>

                        {/* Input Area */}
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={inputType === 'url' ? "https://example.com/article..." : "Paste your rough notes, blog post, or idea here..."}
                                className="w-full h-48 p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all resize-none text-lg placeholder:text-gray-400 outline-none"
                            />

                            {/* Analyze Button */}
                            <div className="absolute bottom-4 right-4">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!input.trim() || isAnalyzing}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {loadingStage}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Visualize This
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Results Preview */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                        >
                            {/* Meta Header */}
                            <div className="bg-gray-900 p-6 text-white flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-yellow-400" />
                                        Blueprint Generated
                                    </h2>
                                    <div className="flex gap-3 mt-3">
                                        <div className="px-3 py-1 rounded-full bg-gray-800 text-sm border border-gray-700">
                                            Mood: <span className="text-indigo-300 font-medium capitalize">{result.meta.sentiment}</span>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-gray-800 text-sm border border-gray-700">
                                            Theme: <span className="text-indigo-300 font-medium capitalize">{result.meta.themeColor}</span>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-gray-800 text-sm border border-gray-700">
                                            Virality: <span className="text-green-400 font-medium">{result.meta.viralityScore}/100</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setResult(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Start Over
                                </button>
                            </div>

                            {/* Slides Grid */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50/50">
                                {result.slides.map((slide, idx) => (
                                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all">
                                        {/* Slide Header */}
                                        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Slide {slide.order} • {slide.layout}
                                            </span>
                                        </div>

                                        {/* Slide Content */}
                                        <div className="p-5 space-y-4">
                                            <div>
                                                <div className="text-xs text-indigo-500 font-semibold mb-1 uppercase">Primary Text</div>
                                                <p className="font-bold text-gray-900 leading-tight">
                                                    {slide.text.primary}
                                                </p>
                                            </div>

                                            {slide.text.secondary && (
                                                <div>
                                                    <div className="text-xs text-gray-400 font-medium mb-1 uppercase">Secondary</div>
                                                    <p className="text-sm text-gray-600">
                                                        {slide.text.secondary}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Visual Metaphor Box */}
                                            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100 mt-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Sparkles className="w-3 h-3 text-indigo-600" />
                                                    <span className="text-xs font-bold text-indigo-700 uppercase">Visual Metaphor</span>
                                                </div>
                                                <p className="text-xs text-indigo-900 font-medium italic">
                                                    "{slide.visual.metaphor}"
                                                </p>
                                                <div className="mt-2 text-[10px] text-indigo-500 font-mono bg-white/50 px-2 py-1 rounded">
                                                    Query: {slide.visual.searchQuery}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Final CTA Card */}
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30 text-center">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                        <Play className="w-6 h-6 ml-1" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Ready to Build?</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Generate images and assemble layout.
                                    </p>
                                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md shadow-indigo-200">
                                        Generate Carousel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
