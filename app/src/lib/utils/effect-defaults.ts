import { EffectType } from "../stores/video-store";

export const getDefaultEffectParams = (type: EffectType): Record<string, any> => {
    switch (type) {
        case 'blur':
            return { radius: 10, name: 'Gaussian Blur' };
        case 'color':
            return { degree: 90, amount: 1, name: 'Hue Rotate' };
        case 'distortion':
            return { amount: 1, name: 'Glitch' };
        default:
            return {};
    }
};
