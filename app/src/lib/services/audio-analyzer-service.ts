export class AudioAnalyzerService {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private source: MediaElementAudioSourceNode | null = null;
    private dataArray: Uint8Array | null = null;
    private bufferLength: number = 0;
    private isConnected: boolean = false;

    constructor() {
        // Initialize on user interaction usually, but we prepare the class
    }

    initialize() {
        if (typeof window === 'undefined') return;

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256; // 128 bins
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
        }
    }

    connectToElement(element: HTMLVideoElement | HTMLAudioElement) {
        if (!this.audioContext || !this.analyser) this.initialize();
        if (!this.audioContext || !this.analyser) return;

        // Prevent double connection
        if (this.isConnected) return;

        try {
            // Note: MediaElementSource can only be connected once per element
            // In a real app with React re-renders, this can be tricky.
            // We assume a singleton usage or careful lifecycle management.
            this.source = this.audioContext.createMediaElementSource(element);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            this.isConnected = true;
        } catch (e) {
            console.warn("AudioAnalyzer: Failed to connect to element", e);
        }
    }

    getWaveformData(): Uint8Array {
        if (!this.analyser || !this.dataArray) return new Uint8Array(0);
        this.analyser.getByteTimeDomainData(this.dataArray as any);
        return this.dataArray;
    }

    getFrequencyData(): Uint8Array {
        if (!this.analyser || !this.dataArray) return new Uint8Array(0);
        this.analyser.getByteFrequencyData(this.dataArray as any);
        return this.dataArray;
    }

    resume() {
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    disconnect() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        this.isConnected = false;
    }
}

export const audioAnalyzer = new AudioAnalyzerService();
