'use client';

import React, { useEffect, useRef } from 'react';
import { useContextMenuStore, ContextMenuType } from '@/lib/stores/context-menu-store';
import { useVideoStore } from '@/lib/stores/video-store';
import {
    Scissors, Copy, Trash2, FastForward, Volume2,
    Type, ZoomIn, Eye, Split, ArrowRightToLine,
    ArrowLeftToLine, GripHorizontal
} from 'lucide-react';

export function ContextMenu() {
    const { isOpen, position, type, data, closeMenu } = useContextMenuStore();
    const { removeClip, splitClip, tracks, seek, currentTime, setSelectedClip } = useVideoStore();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, closeMenu]);

    // Adjust position to stay on screen
    const [adjustedPos, setAdjustedPos] = React.useState(position);

    useEffect(() => {
        if (!isOpen || !menuRef.current) return;

        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        let newX = position.x;
        let newY = position.y;

        // Check Right Edge
        if (newX + rect.width > winW) {
            newX = winW - rect.width - 10;
        }

        // Check Bottom Edge
        if (newY + rect.height > winH) {
            newY = winH - rect.height - 10;
        }

        setAdjustedPos({ x: newX, y: newY });
    }, [isOpen, position]);

    if (!isOpen) return null;

    const handleAction = (action: () => void) => {
        action();
        closeMenu();
    };

    const style = {
        top: adjustedPos.y,
        left: adjustedPos.x,
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 text-slate-200"
            style={style}
        >
            {type === 'clip' && (
                <>
                    <MenuItem
                        icon={<Scissors className="w-4 h-4" />}
                        label="Split Clip"
                        shortcut="Ctrl+K"
                        onClick={() => handleAction(() => {
                            if (data?.clipId) splitClip(data.clipId, currentTime);
                        })}
                    />
                    <MenuItem
                        icon={<ArrowLeftToLine className="w-4 h-4" />}
                        label="Trim Start to Playhead"
                        onClick={() => handleAction(() => {
                            // Implement trim logic leveraging resizeClipLeft logic
                            console.log("Trim Start Not Implemented in Store yet");
                        })}
                    />
                    <MenuItem
                        icon={<ArrowRightToLine className="w-4 h-4" />}
                        label="Trim End to Playhead"
                        onClick={() => handleAction(() => {
                            console.log("Trim End Not Implemented in Store yet");
                        })}
                    />
                    <div className="h-px bg-slate-700 my-1" />
                    <MenuItem
                        icon={<Copy className="w-4 h-4" />}
                        label="Copy"
                        shortcut="Ctrl+C"
                        onClick={() => handleAction(() => console.log('Copy', data))}
                    />
                    <MenuItem
                        icon={<GripHorizontal className="w-4 h-4" />}
                        label="Move to New Track"
                        onClick={() => handleAction(() => console.log('Move', data))}
                    />
                    <div className="h-px bg-slate-700 my-1" />
                    <MenuItem
                        icon={<FastForward className="w-4 h-4" />}
                        label="Change Speed..."
                        onClick={() => handleAction(() => console.log('Speed', data))}
                    />
                    <MenuItem
                        icon={<Volume2 className="w-4 h-4" />}
                        label="Audio Settings..."
                        onClick={() => handleAction(() => console.log('Audio', data))}
                    />
                    <div className="h-px bg-slate-700 my-1" />
                    <MenuItem
                        icon={<Trash2 className="w-4 h-4 text-red-400" />}
                        label="Delete"
                        shortcut="Del"
                        className="text-red-400 hover:bg-red-900/30"
                        onClick={() => handleAction(() => {
                            if (data?.clipId) removeClip(data.clipId);
                        })}
                    />
                </>
            )}

            {type === 'text' && (
                <>
                    <MenuItem icon={<Type className="w-4 h-4" />} label="Edit Text" onClick={() => handleAction(() => { })} />
                    <MenuItem icon={<Eye className="w-4 h-4" />} label="Change Color" onClick={() => handleAction(() => { })} />
                    <div className="h-px bg-slate-700 my-1" />
                    <MenuItem
                        icon={<Trash2 className="w-4 h-4 text-red-400" />}
                        label="Delete"
                        className="text-red-400 hover:bg-red-900/30"
                        onClick={() => handleAction(() => {
                            if (data?.clipId) removeClip(data.clipId);
                        })}
                    />
                </>
            )}

            {type === 'track' && (
                <>
                    <MenuItem label="Mute Track" onClick={() => handleAction(() => { })} />
                    <MenuItem label="Lock Track" onClick={() => handleAction(() => { })} />
                    <div className="h-px bg-slate-700 my-1" />
                    <MenuItem label="Delet Track" className="text-red-400" onClick={() => handleAction(() => { })} />
                </>
            )}

            {type === 'timeline' && (
                <>
                    <MenuItem icon={<Split className="w-4 h-4" />} label="Paste" shortcut="Ctrl+V" onClick={() => handleAction(() => { })} />
                    <div className="h-px bg-slate-700 my-1" />
                    <MenuItem icon={<ZoomIn className="w-4 h-4" />} label="Zoom to Fit" onClick={() => handleAction(() => { })} />
                    <MenuItem icon={<ArrowRightToLine className="w-4 h-4" />} label="Jump to Playhead" onClick={() => handleAction(() => { })} />
                </>
            )}
        </div>
    );
}

interface MenuItemProps {
    icon?: React.ReactNode;
    label: string;
    shortcut?: string;
    onClick?: () => void;
    className?: string;
}

function MenuItem({ icon, label, shortcut, onClick, className }: MenuItemProps) {
    return (
        <button
            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 flex items-center justify-between group transition-colors ${className}`}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
        >
            <div className="flex items-center gap-2">
                {icon && <span className="text-slate-400 group-hover:text-slate-300">{icon}</span>}
                <span>{label}</span>
            </div>
            {shortcut && <span className="text-xs text-slate-500 font-mono group-hover:text-slate-400">{shortcut}</span>}
        </button>
    );
}
