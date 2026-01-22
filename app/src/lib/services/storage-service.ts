import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { v4 as uuidv4 } from "uuid";

// Types
export interface UploadResult {
    url: string;
    path: string;
    filename: string;
    size: number;
    contentType: string;
}

export interface UploadOptions {
    folder?: string;
    maxSizeMB?: number;
    preserveName?: boolean;
    onProgress?: (progress: number) => void;
    skipOptimization?: boolean;
}

/**
 * Service to handle file uploads to Firebase Storage
 * Optimized for high-performance binding by returning URLs quickly
 */
export const StorageService = {
    /**
     * Upload a file to Firebase Storage with progress tracking
     */
    uploadFile: async (
        file: File,
        userId: string,
        options: UploadOptions = {}
    ): Promise<UploadResult> => {
        try {
            // Validation
            if (!file) throw new Error("No file provided");

            // Client-side size check (optional)
            if (options.maxSizeMB && file.size > options.maxSizeMB * 1024 * 1024) {
                throw new Error(`File too large. Max size is ${options.maxSizeMB}MB`);
            }

            // OPTIMIZATION: Smart HD Compression
            // Converts to WebP (smaller size, high quality) and caps dimension at 1920px
            let fileToUpload = file;
            if (!options.skipOptimization && file.type.startsWith('image/')) {
                try {
                    // Timeout optimization after 3 seconds to prevent hangs
                    const optimizationPromise = StorageService.optimizeImage(file);
                    const timeoutPromise = new Promise<File>((_, reject) =>
                        setTimeout(() => reject(new Error("Optimization timeout")), 3000)
                    );

                    fileToUpload = await Promise.race([optimizationPromise, timeoutPromise]) as File;
                } catch (e) {
                    console.warn("Image optimization failed or timed out, uploading original", e);
                }
            }

            // Path construction
            // Path: users/{userId}/{timestamp}_{uuid}_{filename}
            // CHANGED default folder to 'users' to match storage.rules
            const folder = options.folder || "users";
            const timestamp = Date.now();
            const uniqueId = uuidv4().slice(0, 8);

            // Ensure filename ends in .webp if we optimized it
            let safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            if (fileToUpload !== file && !safeFilename.endsWith('.webp')) {
                safeFilename = safeFilename.substring(0, safeFilename.lastIndexOf('.')) + '.webp';
            }

            const filename = options.preserveName
                ? `${timestamp}_${safeFilename}`
                : `${timestamp}_${uniqueId}_${safeFilename}`;

            const fullPath = `${folder}/${userId}/${filename}`;
            const storageRef = ref(storage, fullPath);

            // Upload with Resumable Upload for progress tracking
            return new Promise((resolve, reject) => {
                const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (options.onProgress) {
                            // Map upload progress (0-100) to UI progress (10-100)
                            // We reserve 0-10 for optimization
                            const uiProgress = 10 + (progress * 0.9);
                            options.onProgress(Math.min(uiProgress, 99)); // Keep at 99 until URL is fetched
                        }
                    },
                    async (error) => {
                        console.warn("Storage upload failed, attempting Base64 fallback...", error);
                        // FALLBACK: If Storage fails (e.g. no bucket), convert to Base64
                        // Since we optimized it to < 500KB, it should fit in Firestore (1MB limit)
                        try {
                            const base64 = await StorageService.fileToBase64(fileToUpload);
                            // Safety check: 900KB limit for Firestore safety
                            if (base64.length < 900 * 1024) {
                                console.log("Using Base64 fallback (Size: " + (base64.length / 1024).toFixed(1) + "KB)");
                                if (options.onProgress) options.onProgress(100);
                                resolve({
                                    url: base64,
                                    path: "fallback/base64",
                                    filename: safeFilename,
                                    size: base64.length,
                                    contentType: fileToUpload.type
                                });
                                return;
                            }
                        } catch (fallbackError) {
                            console.error("Fallback failed:", fallbackError);
                        }
                        // If fallback failed or too big, reject with original error
                        reject(error);
                    },
                    async () => {
                        // Complete
                        try {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            if (options.onProgress) options.onProgress(100);
                            resolve({
                                url,
                                path: fullPath,
                                filename: safeFilename,
                                size: fileToUpload.size,
                                contentType: fileToUpload.type
                            });
                        } catch (err) {
                            // Fallback here too if getDownloadURL fails (e.g. CORS)
                            try {
                                const base64 = await StorageService.fileToBase64(fileToUpload);
                                if (base64.length < 900 * 1024) {
                                    if (options.onProgress) options.onProgress(100);
                                    resolve({
                                        url: base64,
                                        path: "fallback/base64",
                                        filename: safeFilename,
                                        size: base64.length,
                                        contentType: fileToUpload.type
                                    });
                                    return;
                                }
                            } catch (e) { }
                            reject(err);
                        }
                    }
                );
            });

        } catch (error) {
            console.error("Storage Service Upload Error:", error);
            throw error;
        }
    },

    /**
     * Helper to convert File to Base64
     */
    fileToBase64: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    },

    /**
     * Optimizes an image file for upload (WebP format, max 1920px width, 0.85 quality)
     */
    optimizeImage: (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // IMPROVED OPTIMIZATION:
                    // Max width 2560px (2K/QHD) - Significantly sharper than 1080p
                    // Quality 0.92 (Visually lossless)
                    // Result: ~800KB - 1.2MB (vs 5MB+ original)
                    const MAX_WIDTH = 2560;
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error("Canvas context failed"));

                    // High quality smoothing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to WebP at 92% quality (Super HD)
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const optimizedFile = new File([blob], file.name, {
                                type: 'image/webp',
                                lastModified: Date.now(),
                            });
                            console.log(`⚡ Speed Optimization: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`);
                            resolve(optimizedFile);
                        } else {
                            reject(new Error("Canvas to Blob failed"));
                        }
                    }, 'image/webp', 0.92);
                };
                img.onerror = (e) => reject(e);
            };
            reader.onerror = (e) => reject(e);
        });
    },

    /**
     * Upload multiple files
     */
    uploadFiles: async (
        files: File[],
        userId: string,
        options: UploadOptions = {}
    ): Promise<UploadResult[]> => {
        return Promise.all(
            files.map(file => StorageService.uploadFile(file, userId, options))
        );
    }
};
