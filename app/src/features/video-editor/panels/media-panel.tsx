"use client";

import { useMediaStore, MediaAsset } from "@/lib/stores/media-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { stockService, StockAsset } from "@/lib/services/stock-service";
import { Upload, Image as ImageIcon, Video, Music, Trash2, Search, Library, Globe, Volume2, VolumeX } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function MediaPanel() {
    const { assets, addAsset, removeAsset } = useMediaStore();
    const { addClip, tracks } = useVideoStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mobile/Stock State
    const [activeTab, setActiveTab] = useState<'uploads' | 'stock'>('uploads');
    const [stockQuery, setStockQuery] = useState('');
    const [stockType, setStockType] = useState<'image' | 'video'>('image');
    const [stockResults, setStockResults] = useState<StockAsset[]>([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);

    // Fetch stock on change
    useEffect(() => {
        if (activeTab === 'stock') {
            setIsLoadingStock(true);
            const fetcher = stockType === 'image' ? stockService.searchImages : stockService.searchVideos;
            fetcher(stockQuery).then(results => {
                setStockResults(results);
                setIsLoadingStock(false);
            });
        }
    }, [activeTab, stockQuery, stockType]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(async file => {
            const url = URL.createObjectURL(file);
            let type: 'video' | 'audio' | 'image' = file.type.startsWith('video') ? 'video' :
                file.type.startsWith('audio') ? 'audio' : 'image';

            let duration = 0;
            let hasAudio = false;
            let dimensions = undefined;

            if (type === 'video' || type === 'audio') {
                const element = type === 'video' ? document.createElement('video') : document.createElement('audio');
                element.src = url;
                element.preload = 'metadata';

                await new Promise((resolve) => {
                    element.onloadedmetadata = () => {
                        // Ensure finite duration (sometimes infinite for blob streams)
                        if (element.duration === Infinity) {
                            element.currentTime = 10000; // Trigger seek to find end? No, unsafe. 
                            // Just fallback.
                            duration = 0;
                        } else {
                            duration = element.duration;
                        }

                        if (isNaN(duration)) duration = 0;

                        if (type === 'video') {
                            dimensions = { width: (element as HTMLVideoElement).videoWidth, height: (element as HTMLVideoElement).videoHeight };

                            // Check audio tracks (works in most modern browsers)
                            // @ts-ignore
                            const audioTracks = element.mozHasAudio || Boolean((element as any).webkitAudioDecodedByteCount) || (element as any).audioTracks?.length > 0;

                            // Fallback heuristic: 
                            // webkitAudioDecodedByteCount is unreliable at metadata stage (often 0).
                            // We default to TRUE for videos to avoid "No Icon" confusion.
                            if ((element as any).audioTracks) {
                                hasAudio = (element as any).audioTracks.length > 0;
                            } else if ((element as any).mozHasAudio) {
                                hasAudio = (element as any).mozHasAudio;
                            } else {
                                // Safe default
                                hasAudio = true;
                            }
                        }
                        resolve(null);
                    };
                    element.onerror = () => resolve(null);
                });
            } else if (type === 'image') {
                const img = new Image();
                img.src = url;
                await new Promise((resolve) => {
                    img.onload = () => {
                        dimensions = { width: img.width, height: img.height };
                        resolve(null);
                    };
                    img.onerror = () => resolve(null);
                });
            }

            console.log(`Uploaded ${type}: ${file.name}, Duration: ${duration}s, HasAudio: ${hasAudio}`);

            addAsset({
                file,
                url,
                name: file.name,
                type,
                size: file.size,
                mimeType: file.type,
                duration,
                hasAudio,
                dimensions,
                format: file.name.split('.').pop()
            });
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddClip = (asset: MediaAsset | StockAsset) => {
        let targetTrackId = tracks.find(t => t.type === asset.type)?.id;

        if (!targetTrackId && (asset.type === 'image' || asset.type === 'video')) {
            targetTrackId = tracks.find(t => t.type === 'video')?.id;
        }

        if (targetTrackId) {
            addClip(targetTrackId, {
                name: asset.name,
                type: asset.type === 'image' ? 'image' : asset.type === 'audio' ? 'audio' : 'video',
                src: 'src' in asset ? asset.src : asset.url,
                duration: asset.duration || (asset.type === 'image' ? 5 : 10),
                start: 0
            });
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 border-r border-gray-800">
            {/* Header with Tabs */}
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-bold text-white mb-3">Assets</h3>

                <div className="flex p-1 bg-black/40 rounded-lg">
                    <button
                        onClick={() => setActiveTab('uploads')}
                        className={cn("flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-colors",
                            activeTab === 'uploads' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white")}
                    >
                        <Library className="w-3 h-3" /> Uploads
                    </button>
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={cn("flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-colors",
                            activeTab === 'stock' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white")}
                    >
                        <Globe className="w-3 h-3" /> Stock
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">

                {/* UPLOADS TAB */}
                {activeTab === 'uploads' && (
                    <>
                        <div className="p-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500 text-white rounded-lg text-sm font-medium transition-all group"
                            >
                                <Upload className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                                <span className="text-gray-300 group-hover:text-white">Upload Media</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="video/*,image/*,audio/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 pt-0 custom-scrollbar">
                            {assets.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <p className="text-xs text-gray-500">No media yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {assets.map(asset => (
                                        <div
                                            key={asset.id}
                                            className="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 cursor-pointer transition-all active:cursor-grabbing"
                                            onClick={() => handleAddClip(asset)}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('application/json', JSON.stringify({
                                                    type: 'media-asset',
                                                    assetId: asset.id,
                                                    mediaType: asset.type,
                                                    src: asset.url,
                                                    name: asset.name,
                                                    duration: asset.duration
                                                }));
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                        >
                                            {/* Thumbnail Rendering */}
                                            {asset.type === 'image' && <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />}
                                            {asset.type === 'video' && <video src={`${asset.url}#t=1.0`} className="w-full h-full object-cover" preload="metadata" />}
                                            {asset.type === 'audio' && (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                                                    <Music className="w-8 h-8" />
                                                </div>
                                            )}

                                            {/* Labels */}
                                            <div className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                                                {asset.type === 'video' ? <Video className="w-3 h-3" /> : asset.type === 'audio' ? <Music className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                                {(asset.type === 'video' || asset.type === 'audio') && (
                                                    <span>{formatTime(asset.duration || 0)}</span>
                                                )}
                                            </div>

                                            {/* Audio Indicator */}
                                            {asset.type === 'video' && (
                                                <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                                                    {asset.hasAudio ? <Volume2 className="w-3 h-3 text-green-400" /> : <VolumeX className="w-3 h-3 text-red-400" />}
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}
                                                className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* STOCK TAB */}
                {activeTab === 'stock' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Search Bar */}
                        <div className="p-4 pb-2 space-y-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search Pexels..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={stockQuery}
                                    onChange={(e) => setStockQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStockType('image')}
                                    className={cn("flex-1 text-[10px] uppercase font-bold py-1 rounded border transition-colors",
                                        stockType === 'image' ? "bg-white/10 border-white/20 text-white" : "border-transparent text-gray-500 hover:text-gray-300")}
                                >
                                    Images
                                </button>
                                <button
                                    onClick={() => setStockType('video')}
                                    className={cn("flex-1 text-[10px] uppercase font-bold py-1 rounded border transition-colors",
                                        stockType === 'video' ? "bg-white/10 border-white/20 text-white" : "border-transparent text-gray-500 hover:text-gray-300")}
                                >
                                    Videos
                                </button>
                            </div>
                        </div>

                        {/* Results Grid */}
                        <div className="flex-1 overflow-y-auto p-4 pt-2 custom-scrollbar">
                            {isLoadingStock ? (
                                <div className="text-center py-10">
                                    <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {stockResults.map(asset => (
                                        <div
                                            key={asset.id}
                                            className="group relative aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 cursor-pointer transition-all active:cursor-grabbing"
                                            onClick={() => handleAddClip(asset)}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('application/json', JSON.stringify({
                                                    type: 'media-asset',
                                                    assetId: asset.id,
                                                    mediaType: asset.type,
                                                    src: asset.src,
                                                    name: asset.name,
                                                    duration: asset.duration
                                                }));
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                        >
                                            <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />

                                            <div className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                                                {asset.type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                                {asset.type === 'video' && <span>{asset.duration}s</span>}
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                                                <p className="text-[10px] text-white truncate">{asset.author}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
