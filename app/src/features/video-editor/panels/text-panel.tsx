"use client";

import { useVideoStore } from "@/lib/stores/video-store";
import { Type, AlignCenter, AlignLeft, AlignRight, Bold, Italic } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextControls } from "./text-controls";

export function TextPanel() {
    const { addClip, tracks, selectedClipId } = useVideoStore();

    // Determine if we show creation tools or edit properties
    const activeClip = tracks
        .flatMap(t => t.clips)
        .find(c => c.id === selectedClipId);

    const isTextSelected = activeClip?.type === 'text';

    const handleAddText = (variant: 'headline' | 'subheading' | 'body') => {
        let textTrackId = tracks.find(t => t.type === 'text')?.id;

        // Auto-create text track if missing (shouldn't happen with standard init, but safe)
        if (!textTrackId) {
            // In a real app we might ask store to create one
            return alert("No text track available!");
        }

        const presets = {
            headline: {
                name: "New Headline",
                fontSize: 80,
                fontWeight: 'bold',
                duration: 5
            },
            subheading: {
                name: "Subheading",
                fontSize: 50,
                fontWeight: 'medium',
                duration: 5
            },
            body: {
                name: "Body Text",
                fontSize: 32,
                fontWeight: 'normal',
                duration: 5
            }
        };

        const preset = presets[variant];

        addClip(textTrackId, {
            name: preset.name,
            type: 'text',
            start: 0, // Should use playhead position ideally
            duration: preset.duration,
            properties: {
                text: preset.name,
                textStyle: {
                    fontSize: preset.fontSize,
                    color: '#ffffff',
                    align: 'center',
                    fontWeight: preset.fontWeight
                }
            }
        });
    };

    if (isTextSelected) {
        return (
            <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Edit Text</h3>
                    <button
                        onClick={() => useVideoStore.setState({ selectedClipId: null })}
                        className="text-xs text-gray-500 hover:text-white"
                    >
                        Back
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4">
                    <TextControls />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-900 border-r border-gray-800">
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-bold text-white mb-1">Text</h3>
                <p className="text-xs text-gray-500">Add titles and captions</p>
            </div>

            <div className="p-4 space-y-3">
                <button
                    onClick={() => handleAddText('headline')}
                    className="w-full h-24 bg-gray-800 border border-gray-700 hover:border-indigo-500 rounded-lg flex items-center justify-center transition-all group"
                >
                    <span className="text-3xl font-bold text-white group-hover:scale-105 transition-transform">Headline</span>
                </button>

                <button
                    onClick={() => handleAddText('subheading')}
                    className="w-full h-16 bg-gray-800 border border-gray-700 hover:border-indigo-500 rounded-lg flex items-center justify-center transition-all group"
                >
                    <span className="text-xl font-medium text-gray-300 group-hover:text-white transition-colors">Subheading</span>
                </button>

                <button
                    onClick={() => handleAddText('body')}
                    className="w-full h-12 bg-gray-800 border border-gray-700 hover:border-indigo-500 rounded-lg flex items-center justify-center transition-all group"
                >
                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Body Text</span>
                </button>
            </div>

            {/* Text Templates */}
            <div className="p-4 pt-0 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Professional Templates</h4>
                <div className="grid grid-cols-2 gap-2">
                    <TemplateButton
                        label="Neon Title"
                        previewColor="from-pink-500/20 to-purple-500/20"
                        onClick={() => {
                            if (!tracks.find(t => t.type === 'text')) return alert("No Text Track");
                            addClip(tracks.find(t => t.type === 'text')!.id, {
                                name: "NEON GLOW",
                                properties: {
                                    text: "NEON GLOW",
                                    textStyle: {
                                        fontSize: 100,
                                        fontWeight: '900',
                                        color: '#ffffff',
                                        fontFamily: 'Oswald',
                                        align: 'center',
                                        shadow: { color: '#ff00ff', blur: 20, offsetX: 0, offsetY: 0 },
                                        outline: { color: '#ffffff', width: 2 }
                                    },
                                    animation: { enter: { type: 'fade', duration: 1.5 } }
                                }
                            })
                        }}
                    />
                    <TemplateButton
                        label="Lower Third"
                        previewColor="from-blue-500/20 to-cyan-500/20"
                        onClick={() => {
                            if (!tracks.find(t => t.type === 'text')) return alert("No Text Track");
                            addClip(tracks.find(t => t.type === 'text')!.id, {
                                name: "Speaker Name",
                                properties: {
                                    text: "Speaker Name",
                                    y: 350, // Bottom area
                                    textStyle: {
                                        fontSize: 40,
                                        fontWeight: 'bold',
                                        color: '#ffffff',
                                        align: 'left',
                                        background: { color: '#000000', opacity: 0.7, padding: 10, borderRadius: 5 }
                                    },
                                    animation: { enter: { type: 'slide', direction: 'left', duration: 0.8 } }
                                }
                            })
                        }}
                    />
                    <TemplateButton
                        label="Typewriter"
                        previewColor="from-green-500/20 to-emerald-500/20"
                        onClick={() => {
                            if (!tracks.find(t => t.type === 'text')) return alert("No Text Track");
                            addClip(tracks.find(t => t.type === 'text')!.id, {
                                name: "Story caption...",
                                properties: {
                                    text: "Story caption...",
                                    textStyle: {
                                        fontSize: 40,
                                        fontWeight: 'normal',
                                        color: '#eeeeee',
                                        fontFamily: 'Courier New',
                                        align: 'center',
                                        background: { color: '#000000', opacity: 0.5, padding: 5, borderRadius: 0 }
                                    },
                                    animation: { enter: { type: 'typewriter', duration: 3 } }
                                }
                            })
                        }}
                    />
                    <TemplateButton
                        label="Cinematic"
                        previewColor="from-yellow-500/20 to-orange-500/20"
                        onClick={() => {
                            if (!tracks.find(t => t.type === 'text')) return alert("No Text Track");
                            addClip(tracks.find(t => t.type === 'text')!.id, {
                                name: "CINEMA",
                                properties: {
                                    text: "CINEMA",
                                    textStyle: {
                                        fontSize: 120,
                                        fontWeight: '300',
                                        color: '#ffffff',
                                        spacing: 20,
                                        fontFamily: 'Lora',
                                        align: 'center',
                                    },
                                    animation: { enter: { type: 'zoom', duration: 4 } }
                                }
                            })
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function TemplateButton({ label, previewColor, onClick }: { label: string, previewColor: string, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="aspect-video bg-gray-800 rounded border border-gray-700 hover:border-indigo-500 cursor-pointer flex items-center justify-center relative overflow-hidden group transition-all"
        >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-80 transition-opacity", previewColor)} />
            <span className="relative text-[10px] font-bold text-gray-200 uppercase tracking-widest">{label}</span>
        </div>
    )
}
