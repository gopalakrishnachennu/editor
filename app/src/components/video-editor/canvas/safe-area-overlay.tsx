import { Video, Heart, MessageCircle, Send, MoreHorizontal } from "lucide-react";

export function SafeAreaOverlay() {
    return (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-lg">
            {/* Top Safe Area (Story/Reels Header) */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent p-4 flex justify-between items-start opacity-70">
                <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
                <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
            </div>

            {/* Right Side Actions (Likes, Comments, etc) */}
            <div className="absolute right-2 bottom-24 flex flex-col items-center gap-6 opacity-80 text-white/90">
                <div className="flex flex-col items-center gap-1">
                    <Heart className="w-7 h-7" />
                    <span className="textxs font-medium">Like</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <MessageCircle className="w-7 h-7" />
                    <span className="text-xs font-medium">1.2k</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Send className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-center gap-1">
                    <MoreHorizontal className="w-7 h-7" />
                </div>
                <div className="w-8 h-8 rounded-md bg-white/20 border-2 border-white/50" />
            </div>

            {/* Bottom Info Area (Username, Caption) */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end gap-2 text-white opacity-80">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gray-300" />
                    <span className="font-semibold text-sm">username</span>
                    <button className="px-2 py-0.5 border border-white/50 rounded text-[10px] font-medium">Follow</button>
                </div>
                <div className="w-3/4 h-4 bg-white/20 rounded animate-pulse" />
                <div className="w-1/2 h-3 bg-white/20 rounded animate-pulse" />

                {/* Rolling Audio Ticker */}
                <div className="flex items-center gap-2 mt-2 opacity-80">
                    <div className="w-3 h-3 bg-white/50 rounded-full" />
                    <div className="h-3 w-32 bg-white/10 rounded overflow-hidden">
                        <div className="h-full w-1/2 bg-white/30" />
                    </div>
                </div>
            </div>

            {/* Guides (Dotted Lines for Center) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity">
                <div className="w-px h-full bg-white/30 dashed" />
                <div className="absolute h-px w-full bg-white/30 dashed" />
            </div>

            {/* Safe Area Warning Label */}
            <div className="absolute top-2 left-2 text-[10px] text-white/30 font-mono border border-white/10 px-1 rounded">
                SAFE AREA GUIDE
            </div>
        </div>
    );
}
