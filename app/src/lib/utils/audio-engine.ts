import { Clip, AudioKeyframe } from "@/lib/stores/video-store";
import { logAudio } from "./audio-logger";

/**
 * Calculates the exact volume for a clip at a specific time,
 * considering Fades, Keyframes, and Auto-Ducking.
 */
export const calculateAudioMix = (
    targetClip: Clip,
    currentTime: number,
    allActiveClips: Clip[]
): { volume: number; isDucked: boolean; pan: number } => {
    const props = targetClip.properties;

    // 1. Base Volume & Mute
    if (props.mute) return { volume: 0, isDucked: false, pan: props.pan || 0 };
    let finalVolume = props.volume ?? 1;

    // 2. Automated Fades (Fade In / Fade Out)
    const timeInClip = currentTime - targetClip.start;
    const timeRemaining = targetClip.end - currentTime;

    // Fade In
    if (props.fadeInDuration && timeInClip < props.fadeInDuration) {
        finalVolume *= (timeInClip / props.fadeInDuration);
    }
    // Fade Out
    if (props.fadeOutDuration && timeRemaining < props.fadeOutDuration) {
        finalVolume *= (timeRemaining / props.fadeOutDuration);
    }

    // 3. Keyframe Automation
    if (props.keyframes && props.keyframes.length > 0) {
        finalVolume *= interpolateKeyframes(props.keyframes, timeInClip);
    }

    // 4. Auto-Ducking Logic
    // If THIS clip is a target for ducking (e.g. Music), check if a Source (e.g. Voice) is playing
    let isDucked = false;
    let duckingFactor = 1;

    // Default: If I am NOT a Ducking Source, I am a potential target.
    // In a real DAW, we'd use Track Types. For now, we use the `isDuckingSource` flag.
    // Logic: If I am NOT a source, and there is a Source playing elsewhere... I duck.
    if (!props.isDuckingSource) {
        const activeSources = allActiveClips.filter(c =>
            c.id !== targetClip.id &&
            c.properties.isDuckingSource &&
            // Check if source is actually audible
            (c.properties.volume ?? 1) > 0 &&
            !c.properties.mute
        );

        if (activeSources.length > 0) {
            isDucked = true;
            // Default ducking intensity = 0.2 (20% volume) if not specified
            const intensity = props.sidechainIntensity ?? 0.2;
            duckingFactor = intensity;
            finalVolume *= duckingFactor;
        }
    }

    // 5. Effects Chain (Simulation)
    // A. Compressor: If volume exceeds Threshold, reduce it by Ratio
    // We simulate this on the *calculated* volume (RMS approximation)
    if (props.audioEffects?.compressor?.enabled) {
        const { threshold = 0.8, ratio = 4 } = props.audioEffects.compressor;
        if (finalVolume > threshold) {
            const excess = finalVolume - threshold;
            const compressedExcess = excess / ratio;
            finalVolume = threshold + compressedExcess;

            // Auto Make-up gain (simple)
            finalVolume *= 1.1;
        }
    }

    // 6. Clipping Protection (Soft Limiter)
    if (finalVolume > 1.0) {
        // Soft Clip knee
        if (finalVolume < 1.5) {
            finalVolume = 1.0 + Math.tanh(finalVolume - 1.0) * 0.5;
        } else {
            // Hard limit
            logAudio(targetClip.id, 'clipper', { val: finalVolume, msg: 'Volume exceeded safe limits' });
            finalVolume = 1.5;
        }
    }

    // Log the mix
    if (Math.abs(finalVolume - (props.volume ?? 1)) > 0.01) {
        logAudio(targetClip.id, 'mix', {
            baseVol: props.volume,
            duckingFactor: isDucked ? duckingFactor : 1,
            fade: props.fadeInDuration || props.fadeOutDuration ? 'active' : 'none',
            finalVol: Number(finalVolume.toFixed(2))
        });

        if (isDucked) {
            logAudio(targetClip.id, 'duck', {
                source: "Active Voice Track",
                factor: duckingFactor
            });
        }
    }

    return {
        volume: Math.max(0, finalVolume),
        isDucked,
        pan: props.pan || 0
    };
};

// Keyframe Interpolator
function interpolateKeyframes(keyframes: AudioKeyframe[], time: number): number {
    // Sort keys by time
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);

    // Find surrounding keys
    const nextIdx = sorted.findIndex(k => k.time > time);

    // Case: After last key
    if (nextIdx === -1) {
        return sorted[sorted.length - 1].volume;
    }

    // Case: Before first key
    if (nextIdx === 0) {
        return sorted[0].volume;
    }

    const prev = sorted[nextIdx - 1];
    const next = sorted[nextIdx];

    // Interpolate
    const duration = next.time - prev.time;
    const progress = (time - prev.time) / duration;

    // Linear only for now (add easing later)
    return prev.volume + (next.volume - prev.volume) * progress;
}
