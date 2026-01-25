import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Clip, Track } from '@/lib/stores/video-store';
import { calculateAnimationState } from '@/lib/utils/animation-engine';

interface ExportConfig {
    width: number;
    height: number;
    fps: number;
    tracks: Track[];
    duration: number;
    onProgress?: (progress: number) => void;
}

class VideoExporter {
    private ffmpeg: FFmpeg;
    private loaded: boolean = false;

    constructor() {
        this.ffmpeg = new FFmpeg();
    }

    async load() {
        if (this.loaded) return;

        // Load ffmpeg.wasm from a reliable CDN or local assets
        // For MVP, we use the unpkg CDN which is standard for ffmpeg.wasm usage
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        try {
            await this.ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            this.loaded = true;
            console.log('FFmpeg loaded successfully');
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            throw new Error('Failed to initialize video exporter');
        }
    }

    async exportComposition(config: ExportConfig): Promise<string> {
        if (!this.loaded) await this.load();

        const { width, height, fps, tracks, duration, onProgress } = config;
        const totalFrames = Math.ceil(duration * fps);

        // 1. Prepare Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) throw new Error('Could not create canvas context');

        // 2. Preload Visual Assets & Prepare Audio
        console.log('Preloading assets...');
        const loadedAssets = new Map<string, HTMLImageElement | HTMLVideoElement>();

        // Audio Processing State
        const audioInputs: { id: string, file: string, start: number, end: number, offset: number, volume: number }[] = [];

        // Helper to load image
        const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

        // Helper to load video
        const loadVideo = (src: string) => new Promise<HTMLVideoElement>((resolve, reject) => {
            const vid = document.createElement('video');
            vid.crossOrigin = 'anonymous';
            vid.src = src;
            vid.onloadedmetadata = () => resolve(vid);
            vid.onerror = reject;
        });

        const clips = tracks.flatMap(t => t.clips);
        for (const clip of clips) {
            // Visual Preloading
            if (clip.type === 'image') {
                if (!loadedAssets.has(clip.src)) {
                    loadedAssets.set(clip.src, await loadImage(clip.src));
                }
            } else if (clip.type === 'video') {
                if (!loadedAssets.has(clip.src)) {
                    loadedAssets.set(clip.src, await loadVideo(clip.src));
                }
            }

            // Audio Preloading Logic
            // We need to fetch the actual file data for FFmpeg if it has audio
            const hasAudio = (clip.type === 'audio') || (clip.type === 'video' && !clip.properties.mute);

            if (hasAudio) {
                try {
                    const fileExt = clip.src.split('.').pop()?.split('?')[0] || (clip.type === 'video' ? 'mp4' : 'mp3');
                    const fileName = `input_${clip.id}.${fileExt}`;

                    // Check if already written (deduplicate by src?)
                    // For now, simpler to write per clip or check if file exists.
                    // To save memory, we ideally check unique src.
                    // But clips might be trimmed differently? No, source file is same.

                    // We'll write unique file per clip for simplicity of filter graph mapping 
                    // (unless we track src -> filename map).
                    // FETCHING:
                    console.log(`Fetching audio source: ${clip.src}`);
                    const data = await fetchFile(clip.src);
                    await this.ffmpeg.writeFile(fileName, data);

                    audioInputs.push({
                        id: clip.id,
                        file: fileName,
                        start: clip.start, // time in composition when it starts
                        end: clip.end,     // time in composition when it ends
                        offset: clip.offset, // start time within the source file
                        volume: clip.properties.volume ?? 1
                    });
                } catch (e) {
                    console.warn(`Failed to prepare audio for clip ${clip.id}`, e);
                }
            }
        }

        console.log(`Assets loaded. Audio tracks: ${audioInputs.length}`);

        // 3. Render Loop (Visuals)
        for (let i = 0; i < totalFrames; i++) {
            const currentTime = i / fps;

            // Clear Canvas
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);

            // Find visible clips sorted by track
            const visibleClips = tracks
                .filter(t => !t.isHidden)
                .flatMap(t => t.clips.map(c => ({ ...c, trackIndex: tracks.indexOf(t) })))
                .filter(c => currentTime >= c.start && currentTime < c.end)
                .sort((a, b) => a.trackIndex - b.trackIndex);

            for (const clip of visibleClips) {
                const asset = loadedAssets.get(clip.src);
                const animState = calculateAnimationState(clip, currentTime);
                const { x = 0, y = 0, scale = 1, rotation = 0, width: clipW, height: clipH } = clip.properties;

                // Combine Base + Animation Props
                const finalOpacity = (clip.properties.opacity ?? 1) * animState.opacity;
                const finalScale = scale * animState.scale;

                // Calculate Animation Offsets
                const assetW = (asset as any)?.width || (asset as any)?.videoWidth || 100;
                const finalAnimX = (animState.x / 100) * assetW;
                const finalAnimY = (animState.y / 100) * ((asset as any)?.height || 100);

                ctx.save();
                ctx.globalAlpha = finalOpacity;

                // 2. Blending Mode
                if (clip.properties.blendingMode) {
                    ctx.globalCompositeOperation = clip.properties.blendingMode as GlobalCompositeOperation;
                }

                // 3. Shadow Logic (Unified)
                // We check generic shadow first, then fallback to textStyle shadow
                const shadow = (clip.properties as any).shadow || clip.properties.textStyle?.shadow;
                if (shadow) {
                    ctx.shadowColor = shadow.color;
                    ctx.shadowBlur = shadow.blur;
                    ctx.shadowOffsetX = shadow.offsetX;
                    ctx.shadowOffsetY = shadow.offsetY;
                }

                // 1. Filter Stack
                let filterString = '';
                const f = clip.properties.filter;
                if (f) {
                    filterString += `brightness(${f.brightness ?? 1}) contrast(${f.contrast ?? 1}) saturate(${f.saturate ?? 1}) grayscale(${f.grayscale ?? 0}) blur(${f.blur ?? 0}px) `;
                }

                if (clip.properties.effects) {
                    clip.properties.effects.forEach(e => {
                        if (!e.isEnabled) return;
                        if (e.name === 'Hue Rotate') filterString += `hue-rotate(${e.params.degree}deg) `;
                        if (e.name === 'Sepia') filterString += `sepia(${e.params.amount}) `;
                        if (e.name === 'Invert') filterString += `invert(${e.params.amount}) `;
                        if (e.name === 'Gaussian Blur') filterString += `blur(${e.params.radius}px) `;
                        if (e.name === 'Pixelate') ctx.imageSmoothingEnabled = false;
                    });
                }
                if (animState.blur > 0) filterString += `blur(${animState.blur}px) `;

                ctx.filter = filterString.trim();

                // 2. Transform
                const centerX = width / 2 + x + finalAnimX;
                const centerY = height / 2 + y + finalAnimY;

                ctx.translate(centerX, centerY);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.scale(finalScale, finalScale);

                // 3. Draw Content (with Glitch)
                const isGlitch = clip.properties.effects?.some(e => e.name === 'Glitch' && e.isEnabled);

                const drawAsset = (offsetX = 0, offsetY = 0, colorChannel?: string) => {
                    if (asset) {
                        if (clip.type === 'video' && asset instanceof HTMLVideoElement) {
                            try {
                                const videoTime = (currentTime - clip.start) + clip.offset;
                                asset.currentTime = Math.max(0, Math.min(videoTime, asset.duration));
                                ctx.drawImage(asset, -asset.videoWidth / 2 + offsetX, -asset.videoHeight / 2 + offsetY);
                            } catch (e) { /**/ }
                        } else if (clip.type === 'image' && asset instanceof HTMLImageElement) {
                            const w = clipW || asset.width;
                            const h = clipH || asset.height;
                            ctx.drawImage(asset, -w / 2 + offsetX, -h / 2 + offsetY, w, h);
                        }
                    }

                    if (clip.type === 'text') {
                        const style = clip.properties.textStyle || {};
                        ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize || 40}px sans-serif`;
                        ctx.textAlign = (style.align as CanvasTextAlign) || 'center';
                        ctx.fillStyle = colorChannel || style.color || '#ffffff';
                        ctx.fillText(clip.name, offsetX, offsetY);
                    }
                };

                if (isGlitch) {
                    ctx.globalCompositeOperation = 'screen';
                    ctx.save();
                    ctx.globalAlpha = 0.8 * finalOpacity;
                    const glitchOff = (Math.sin(currentTime * 20) * 5) + 2;
                    drawAsset(glitchOff, 0, '#ff0000');
                    ctx.restore();

                    ctx.save();
                    ctx.globalAlpha = 0.8 * finalOpacity;
                    drawAsset(-glitchOff, 0, '#00ffff');
                    ctx.restore();

                    ctx.globalCompositeOperation = 'source-over';
                } else {
                    drawAsset(0, 0);
                }

                // Retro Overlay: VHS (Scanlines)
                const vhsEffect = clip.properties.effects?.find(e => e.name === 'VHS' && e.isEnabled);
                if (vhsEffect) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.globalAlpha = 0.1 * (vhsEffect.params.intensity as number || 0.5);

                    const w = clipW || (asset ? (asset as any).width : 100);
                    const h = clipH || (asset ? (asset as any).height : 100);
                    const halfW = w / 2;
                    const halfH = h / 2;

                    ctx.fillStyle = '#000000';
                    for (let y = -halfH; y < halfH; y += 4) {
                        ctx.fillRect(-halfW, y, w, 2);
                    }
                    ctx.restore();
                }

                ctx.restore();
                ctx.imageSmoothingEnabled = true;
            }

            // Capture Frame
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
            if (blob) {
                const buffer = await blob.arrayBuffer();
                await this.ffmpeg.writeFile(`frame_${i.toString().padStart(6, '0')}.jpg`, new Uint8Array(buffer));
            }

            if (onProgress) onProgress((i / totalFrames) * 0.7); // 70% for rendering
        }

        // 4. Construct FFmpeg Command
        console.log('Encoding video with audio...');

        const args = [
            '-framerate', fps.toString(),
            '-i', 'frame_%06d.jpg', // Input 0: Visuals
        ];

        // Add Audio Inputs
        audioInputs.forEach(input => {
            args.push('-i', input.file);
        });

        // Filter Complex
        let filterComplex = '';
        let mapAudio = '';

        if (audioInputs.length > 0) {
            // Process each audio input
            audioInputs.forEach((input, index) => {
                const inputIdx = index + 1; // 0 is video
                const duration = input.end - input.start;
                // a) Trim source (offset -> offset+dur)
                // b) Set PTS to 0
                // c) Add delay to position on timeline (start * 1000 ms)
                // d) Volume
                const delayMs = Math.round(input.start * 1000);

                // Note: adelay takes milliseconds. pipes | for stereo.
                // atrim uses seconds.
                filterComplex += `[${inputIdx}:a]atrim=start=${input.offset}:end=${input.offset + duration},asetpts=PTS-STARTPTS,volume=${input.volume},adelay=${delayMs}|${delayMs}[a${index}];`;
            });

            // Mix all [aX]
            const mixInputs = audioInputs.map((_, i) => `[a${i}]`).join('');
            filterComplex += `${mixInputs}amix=inputs=${audioInputs.length}:duration=longest[outa]`;

            mapAudio = '[outa]';
        }

        args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p');

        if (filterComplex) {
            args.push('-filter_complex', filterComplex);
            args.push('-map', '0:v'); // Map Visuals
            args.push('-map', mapAudio); // Map Mixed Audio
            args.push('-c:a', 'aac'); // Encode Audio
        } else {
            // Silent video
        }

        args.push('output.mp4');

        await this.ffmpeg.exec(args);

        // 5. Read Output
        const data = await this.ffmpeg.readFile('output.mp4');
        const url = URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' }));

        return url;
    }
}

export const videoExporter = new VideoExporter();
