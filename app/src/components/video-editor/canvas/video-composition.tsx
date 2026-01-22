import { useCurrentFrame, Audio, Sequence } from "remotion";
import { useVideoStore } from "@/lib/stores/video-store";
import { getAnimationStyles } from "@/lib/video/motion-presets";
import { getAudioVolume } from "@/lib/video/audio-logic";

export const VideoComposition = () => {
    const { tracks, clips, width, height } = useVideoStore();
    const frame = useCurrentFrame();

    return (
        <div
            style={{
                width,
                height,
                backgroundColor: "white",
                position: "relative",
                overflow: "hidden"
            }}
        >
            {tracks.map(track => (
                <div key={track.id} className="absolute inset-0 pointer-events-none">
                    {track.clips.map(clipId => {
                        const clip = clips[clipId];
                        if (!clip) return null;

                        // Dynamic Volume Calculation (Ducking)
                        // We calculate this every frame because ducking depends on OTHER tracks
                        const volume = getAudioVolume(frame, clip, track, tracks, clips);

                        return (
                            <Sequence
                                key={clip.id}
                                from={clip.startAt}
                                durationInFrames={clip.duration}
                            >
                                {/* Audio Element */}
                                {(clip.type === "audio" || clip.type === "video") && !track.isMuted && (
                                    <Audio
                                        src={clip.src}
                                        volume={volume}
                                    // TODO: handle src start offset (startFrom prop)
                                    />
                                )}

                                {/* Visual Element */}
                                <VisualElement clip={clip} frame={frame} />
                            </Sequence>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

// Extracted for cleaner Sequence usage
const VisualElement = ({ clip, frame }: { clip: any, frame: number }) => {
    // Note: Inside Sequence, useCurrentFrame returns frame relative to sequence start (0 to duration)
    // But our 'frame' prop passed from parent is global. 
    // Actually, Remotion's useCurrentFrame() INSIDE Sequence returns relative frame automatically.
    const relativeFrame = useCurrentFrame();

    const motionStyle = getAnimationStyles(
        clip.duration,
        relativeFrame,
        clip.animation?.enter?.id,
        clip.animation?.exit?.id,
        clip.animation?.idle?.id
    );

    // Text Style Logic
    const textStyle = clip.textStyle || { fontSize: 80, color: "#ffffff", align: "center" };

    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: textStyle.align === "bottom" ? "flex-end" : "center",
                justifyContent: "center",
                padding: "40px",
                ...motionStyle
            }}
        >
            {clip.type === "text" && (
                <div
                    style={{
                        transform: textStyle.align === "bottom" ? "translateY(-100px)" : "none",
                        textAlign: "center"
                    }}
                >
                    <h1
                        className="font-black leading-tight drop-shadow-lg"
                        style={{
                            fontSize: `${textStyle.fontSize}px`,
                            color: textStyle.color,
                            // Dynamic text shadow for visibility
                            textShadow: "0 2px 10px rgba(0,0,0,0.5)"
                        }}
                    >
                        {clip.name}
                    </h1>
                </div>
            )}
            {clip.type === "video" && (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 font-mono">{clip.name}</span>
                </div>
            )}
        </div>
    );
}
