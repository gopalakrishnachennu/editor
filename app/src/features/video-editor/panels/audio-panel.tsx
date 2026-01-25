"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { Volume2, Volume1, VolumeX, Music, Mic, Sliders, Activity, Layers, ArrowRightLeft, Ear } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { VisualizerCanvas } from '@/features/audio/visualizer-canvas';

export function AudioPanel() {
    const { selectedClipId, tracks, updateClip } = useVideoStore();
    const [activeTab, setActiveTab] = useState<'mix' | 'fades' | 'ducking' | 'effects'>('mix');

    // Find selected clip
    const activeClip = tracks
        .flatMap(t => t.clips)
        .find(c => c.id === selectedClipId);

    if (!activeClip) {
        return (
            <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    <Music className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-400">No Audio Clip</h3>
                <p className="text-xs text-gray-600 mt-1">Select a clip to open mixer.</p>
            </div>
        );
    }

    const props = activeClip.properties;
    const volume = props.volume ?? 1;
    const pan = props.pan ?? 0;
    const isMuted = props.mute || false;

    // Updates
    const update = (updates: any) => {
        updateClip(activeClip.id, {
            properties: { ...props, ...updates }
        });
    };

    return (
        <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800 space-y-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-1">Audio Mixer</h3>
                        <p className="text-xs text-gray-500">Pro mixing & automation</p>
                    </div>
                </div>

                {/* Visualizer Widget */}
                <div className="w-full h-16 bg-black/40 rounded overflow-hidden border border-white/5 relative">
                    <VisualizerCanvas width={280} height={64} className="opacity-80" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                <button
                    onClick={() => setActiveTab('mix')}
                    className={cn(
                        "flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2",
                        activeTab === 'mix' ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    Mix
                </button>
                <button
                    onClick={() => setActiveTab('fades')}
                    className={cn(
                        "flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2",
                        activeTab === 'fades' ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    Fades
                </button>
                <button
                    onClick={() => setActiveTab('ducking')}
                    className={cn(
                        "flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2",
                        activeTab === 'ducking' ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    Ducking
                </button>
                <button
                    onClick={() => setActiveTab('effects')}
                    className={cn(
                        "flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2",
                        activeTab === 'effects' ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                    )}
                >
                    Effects
                </button>
            </div>

            <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">

                {/* MIX TAB (Volume, Pan, Mute) */}
                {activeTab === 'mix' && (
                    <div className="space-y-6">
                        {/* Volume */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-300 flex items-center gap-2">
                                    <Volume2 className="w-3 h-3 text-indigo-400" /> Volume
                                </label>
                                <span className="text-[10px] font-mono text-gray-500">{Math.round(volume * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1.5" step="0.05"
                                value={volume}
                                onChange={(e) => update({ volume: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        {/* Stereo Pan */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-300 flex items-center gap-2">
                                    <ArrowRightLeft className="w-3 h-3 text-indigo-400" /> Stereo Pan
                                </label>
                                <span className="text-[10px] font-mono text-gray-500">
                                    {pan === 0 ? 'Center' : pan < 0 ? `${Math.round(Math.abs(pan) * 100)}% L` : `${Math.round(pan * 100)}% R`}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-1" max="1" step="0.1"
                                value={pan}
                                onChange={(e) => update({ pan: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-[8px] text-gray-600 font-mono uppercase">
                                <span>Left</span>
                                <span>Center</span>
                                <span>Right</span>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                                onClick={() => update({ mute: !isMuted })}
                                className={cn(
                                    "px-3 py-2 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                                    isMuted ? "bg-red-500/20 text-red-400 border border-red-500/50" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                )}
                            >
                                <VolumeX className="w-3 h-3" /> {isMuted ? 'Muted' : 'Mute'}
                            </button>
                            <button
                                onClick={() => update({ solo: !props.solo })}
                                className={cn(
                                    "px-3 py-2 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                                    props.solo ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                )}
                            >
                                <Ear className="w-3 h-3" /> Solo
                            </button>
                        </div>
                    </div>
                )}

                {/* FADES TAB */}
                {activeTab === 'fades' && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-300">Fade In</label>
                                <span className="text-[10px] font-mono text-gray-500">{props.fadeInDuration || 0}s</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="5" step="0.1"
                                value={props.fadeInDuration || 0}
                                onChange={(e) => update({ fadeInDuration: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-300">Fade Out</label>
                                <span className="text-[10px] font-mono text-gray-500">{props.fadeOutDuration || 0}s</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="5" step="0.1"
                                value={props.fadeOutDuration || 0}
                                onChange={(e) => update({ fadeOutDuration: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-lg text-[10px] text-gray-400 leading-relaxed">
                            💡 Fades are applied automatically at the start/end of the clip, respecting any trims.
                        </div>
                    </div>
                )}

                {/* DUCKING TAB */}
                {activeTab === 'ducking' && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                            <Mic className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-indigo-100">Voiceover Detection</h4>
                                <p className="text-[10px] text-indigo-300 mt-1">If enabled, other audio (music) will automatically lower volume when this clip is playing.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-gray-800 rounded-lg border border-gray-700">
                            <label className="text-xs font-medium text-gray-300">Use as Ducking Source</label>
                            <input
                                type="checkbox"
                                checked={props.isDuckingSource || false}
                                onChange={(e) => update({ isDuckingSource: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-offset-gray-900"
                            />
                        </div>

                        <div className="space-y-3 opacity-60 pointer-events-none">
                            {/* Disabled placeholder for Intensity until next iteration */}
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-400">Ducking Intensity</label>
                                <span className="text-[10px] font-mono text-gray-500">80%</span>
                            </div>
                            <input type="range" disabled value={80} className="w-full h-1 bg-gray-800 rounded-lg" />
                        </div>
                    </div>
                )}

                {/* EFFECTS TAB */}
                {activeTab === 'effects' && (
                    <div className="space-y-6">
                        {/* Compressor */}
                        <div className="space-y-3 border-b border-gray-800 pb-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-white flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-indigo-400" /> Dynamics (Compressor)
                                </label>
                                <input
                                    type="checkbox"
                                    checked={props.audioEffects?.compressor?.enabled || false}
                                    onChange={(e) => {
                                        const prev = props.audioEffects?.compressor || { threshold: 0.8, ratio: 4, enabled: false };
                                        update({
                                            audioEffects: {
                                                ...props.audioEffects,
                                                compressor: { ...prev, enabled: e.target.checked }
                                            }
                                        });
                                    }}
                                    className="w-3 h-3 rounded border-gray-600 bg-gray-700"
                                />
                            </div>

                            {props.audioEffects?.compressor?.enabled && (
                                <div className="space-y-3 pl-2 border-l-2 border-gray-800">
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <label className="text-[10px] text-gray-400">Threshold</label>
                                            <span className="text-[10px] font-mono text-gray-500">{props.audioEffects.compressor.threshold}</span>
                                        </div>
                                        <input
                                            type="range" min="0.1" max="1" step="0.05"
                                            value={props.audioEffects.compressor.threshold}
                                            onChange={(e) => update({
                                                audioEffects: {
                                                    ...props.audioEffects,
                                                    compressor: { ...props.audioEffects?.compressor, threshold: parseFloat(e.target.value) }
                                                }
                                            })}
                                            className="w-full h-1 bg-gray-700 rounded cursor-pointer accent-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <label className="text-[10px] text-gray-400">Ratio</label>
                                            <span className="text-[10px] font-mono text-gray-500">1:{props.audioEffects.compressor.ratio}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="20" step="1"
                                            value={props.audioEffects.compressor.ratio}
                                            onChange={(e) => update({
                                                audioEffects: {
                                                    ...props.audioEffects,
                                                    compressor: { ...props.audioEffects?.compressor, ratio: parseFloat(e.target.value) }
                                                }
                                            })}
                                            className="w-full h-1 bg-gray-700 rounded cursor-pointer accent-indigo-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* EQ Placeholders */}
                        <div className="space-y-3 opacity-50">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-white flex items-center gap-2">
                                    <Sliders className="w-3 h-3 text-gray-400" /> EQ (Coming Soon)
                                </label>
                                <input type="checkbox" disabled className="w-3 h-3 rounded border-gray-600 bg-gray-800" />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
