import { useVideoStore } from "@/lib/stores/video-store";
import { Layers, Droplets, MoveHorizontal, MoveVertical, Hexagon } from "lucide-react";

export function CompositingPanel() {
    const { tracks, selectedClipId, updateClip } = useVideoStore();

    const clip = tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId);

    if (!clip) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 p-4 text-center">
                <Layers className="w-8 h-8 mb-2 opacity-50" />
                <p>Select a clip to adjust blending</p>
            </div>
        );
    }

    const { opacity = 1, blendingMode = 'normal' } = clip.properties;

    // Normalized Shadow Logic
    const shadow = (clip.properties as any).shadow || clip.properties.textStyle?.shadow || {
        color: '#000000',
        blur: 0,
        offsetX: 0,
        offsetY: 0,
        enabled: false
    };

    const handleOpacityChange = (val: number) => {
        updateClip(clip.id, {
            properties: { ...clip.properties, opacity: val }
        });
    };

    const handleBlendChange = (val: string) => {
        updateClip(clip.id, {
            properties: { ...clip.properties, blendingMode: val as any }
        });
    };

    const updateShadow = (changes: Partial<typeof shadow>) => {
        const newShadow = { ...shadow, ...changes };

        const newProps: any = { ...clip.properties };
        newProps.shadow = newShadow;

        if (clip.type === 'text') {
            newProps.textStyle = {
                ...newProps.textStyle,
                shadow: newShadow
            };
        }

        updateClip(clip.id, { properties: newProps });
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white">Compositing</h3>
            </div>

            {/* Opacity */}
            <div className="space-y-4">
                <div className="flex justify-between text-xs text-slate-400">
                    <span className="text-slate-300">Opacity</span>
                    <span>{Math.round(opacity * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="0" max="1" step="0.01"
                    value={opacity}
                    onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>

            {/* Blending Mode */}
            <div className="space-y-2">
                <span className="text-slate-300 text-xs">Blend Mode</span>
                <select
                    value={blendingMode}
                    onChange={(e) => handleBlendChange(e.target.value)}
                    className="w-full bg-slate-800 border-slate-700 text-slate-200 h-9 text-xs rounded px-2 outline-none border focus:border-indigo-500"
                >
                    <option value="normal">Normal</option>
                    <option value="multiply">Multiply (Darken)</option>
                    <option value="screen">Screen (Lighten)</option>
                    <option value="overlay">Overlay</option>
                    <option value="darken">Darken</option>
                    <option value="lighten">Lighten</option>
                    <option value="difference">Difference</option>
                    <option value="exclusion">Exclusion</option>
                    <option value="color-dodge">Color Dodge</option>
                    <option value="color-burn">Color Burn</option>
                </select>
            </div>

            <div className="h-px bg-white/10 my-2" />

            {/* Drop Shadow */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Hexagon className="w-4 h-4 text-indigo-400" />
                        <span className="text-slate-300">Drop Shadow</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Color */}
                    <div className="space-y-2 col-span-2">
                        <span className="text-xs text-slate-500">Color</span>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={shadow.color}
                                onChange={(e) => updateShadow({ color: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                            />
                            <div className="flex-1 text-xs text-slate-400 flex items-center">{shadow.color}</div>
                        </div>
                    </div>

                    {/* Blur */}
                    <div className="space-y-2 col-span-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><Droplets className="w-3 h-3" /> Blur</span>
                            <span>{Math.round(shadow.blur)}px</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="50" step="1"
                            value={shadow.blur || 0}
                            onChange={(e) => updateShadow({ blur: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    {/* Offset X */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><MoveHorizontal className="w-3 h-3" /> X</span>
                            <span>{Math.round(shadow.offsetX)}</span>
                        </div>
                        <input
                            type="range"
                            min="-50" max="50" step="1"
                            value={shadow.offsetX || 0}
                            onChange={(e) => updateShadow({ offsetX: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    {/* Offset Y */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><MoveVertical className="w-3 h-3" /> Y</span>
                            <span>{Math.round(shadow.offsetY)}</span>
                        </div>
                        <input
                            type="range"
                            min="-50" max="50" step="1"
                            value={shadow.offsetY || 0}
                            onChange={(e) => updateShadow({ offsetY: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
