"use client";

import { useState } from "react";
import { FolderOpen, Type, Download, Settings, Layers, Wand2, Sparkles, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaPanel } from "./media-panel";
import { TextPanel } from "./text-panel";
import { EffectsPanel } from "./effects-panel"; // Updated to new panel
import { TransitionsPanel } from "./transitions-panel";
import { AudioPanel } from "./audio-panel";
import { ExportPanel } from "./export-panel";
import { LayersPanel } from "./layers-panel";
import { SettingsPanel } from "./settings-panel";
import { CompositingPanel } from "./compositing-panel";

type PanelType = 'assets' | 'text' | 'effects' | 'transitions' | 'audio' | 'layers' | 'settings' | 'export' | 'compositing';

export function Sidebar() {
    const [activePanel, setActivePanel] = useState<PanelType>('assets');

    return (
        <div className="flex h-full bg-slate-950 border-r border-white/10">
            {/* Icon Rail */}
            <div className="w-16 flex flex-col items-center py-4 gap-4 bg-slate-950 border-r border-white/10 z-10 text-white overflow-y-auto custom-scrollbar h-full shrink-0">
                <NavItem
                    icon={FolderOpen}
                    label="Assets"
                    isActive={activePanel === 'assets'}
                    onClick={() => setActivePanel('assets')}
                />
                <NavItem
                    icon={Type}
                    label="Text"
                    isActive={activePanel === 'text'}
                    onClick={() => setActivePanel('text')}
                />
                <NavItem
                    icon={Wand2}
                    label="Effects"
                    isActive={activePanel === 'effects'}
                    onClick={() => setActivePanel('effects')}
                />
                <NavItem
                    icon={Sparkles}
                    label="Fade"
                    isActive={activePanel === 'transitions'}
                    onClick={() => setActivePanel('transitions')}
                />
                <NavItem
                    icon={Music}
                    label="Audio"
                    isActive={activePanel === 'audio'}
                    onClick={() => setActivePanel('audio')}
                />
                <div className="h-px w-8 bg-white/10 my-2" />
                <NavItem
                    icon={Download}
                    label="Export"
                    isActive={activePanel === 'export'}
                    onClick={() => setActivePanel('export')}
                />
                <div className="h-px w-8 bg-white/10 my-2" />
                <NavItem
                    icon={Layers} // Reusing layers icon or maybe 'Droplets'?
                    label="Blend"
                    isActive={activePanel === 'compositing'}
                    onClick={() => setActivePanel('compositing')}
                />
                <div className="h-px w-8 bg-white/10 my-2" />
                <NavItem
                    icon={Layers}
                    label="Layers"
                    isActive={activePanel === 'layers'}
                    onClick={() => setActivePanel('layers')}
                />
                <NavItem
                    icon={Settings}
                    label="Settings"
                    isActive={activePanel === 'settings'}
                    onClick={() => setActivePanel('settings')}
                />
            </div>

            {/* Panel Content (Expandable) */}
            <div className="w-80 bg-slate-900 border-r border-white/10 overflow-y-auto custom-scrollbar">
                {activePanel === 'assets' && <MediaPanel />}
                {activePanel === 'text' && <TextPanel />}
                {activePanel === 'effects' && <EffectsPanel />}
                {activePanel === 'transitions' && <TransitionsPanel />}
                {activePanel === 'audio' && <AudioPanel />}
                {activePanel === 'export' && <ExportPanel />}
                {activePanel === 'layers' && <LayersPanel />}
                {activePanel === 'settings' && <SettingsPanel />}
                {activePanel === 'compositing' && <CompositingPanel />}
            </div>
        </div>
    );
}

function NavItem({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all w-12",
                isActive
                    ? "bg-indigo-600/20 text-indigo-400"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            )}
            title={label}
        >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-medium">{label}</span>
        </button>
    );
}
