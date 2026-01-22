import { Clip, Track, VideoState } from "@/lib/stores/video-store";

export function getAudioVolume(
    currentFrame: number,
    clip: Clip,
    track: Track,
    allTracks: Track[],
    allClips: Record<string, Clip>
): number {
    if (track.isMuted) return 0;

    let volume = clip.volume;
    const padding = 5; // Frames to smooth ducking transition (optional)

    // 1. Fade In / Out logic
    const relativeFrame = currentFrame - clip.startAt;

    // Fade In
    if (clip.fadeInDuration > 0 && relativeFrame < clip.fadeInDuration) {
        volume *= (relativeFrame / clip.fadeInDuration);
    }

    // Fade Out
    const framesUntilEnd = clip.duration - relativeFrame;
    if (clip.fadeOutDuration > 0 && framesUntilEnd < clip.fadeOutDuration) {
        volume *= (framesUntilEnd / clip.fadeOutDuration);
    }

    // 2. Auto-Ducking Logic
    // If this track is NOT a voice track, we check if ANY voice track is active right now
    if (!track.isVoiceTrack) {
        const isVoiceActive = allTracks.some(t => {
            if (t.id === track.id) return false; // Don't duck self
            if (!t.isVoiceTrack || t.isMuted) return false;

            // Check if any clip on this voice track covers the current frame
            return t.clips.some(cId => {
                const voiceClip = allClips[cId];
                if (!voiceClip) return false;
                return (
                    currentFrame >= voiceClip.startAt &&
                    currentFrame < (voiceClip.startAt + voiceClip.duration)
                );
            });
        });

        if (isVoiceActive) {
            volume *= 0.2; // Ducking Factor (20% volume)
        }
    }

    return Math.max(0, Math.min(1, volume)); // Clamp 0-1
}
