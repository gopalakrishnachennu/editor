export interface StockAsset {
    id: string;
    type: 'image' | 'video';
    src: string;
    thumbnail: string;
    name: string;
    duration?: number; // for videos
    width: number;
    height: number;
    author: string;
}

// Mock Data for development
const MOCK_IMAGES: StockAsset[] = [
    {
        id: 'img-1',
        type: 'image',
        src: 'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        thumbnail: 'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=400',
        name: 'Abstract Landscape',
        width: 1920,
        height: 1080,
        author: 'Pexels'
    },
    {
        id: 'img-2',
        type: 'image',
        src: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        thumbnail: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=400',
        name: 'Ocean Waves',
        width: 1920,
        height: 1080,
        author: 'Pexels'
    },
    {
        id: 'img-3',
        type: 'image',
        src: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        thumbnail: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=400',
        name: 'Mountain Peak',
        width: 1920,
        height: 1080,
        author: 'Pexels'
    }
];

const MOCK_VIDEOS: StockAsset[] = [
    {
        id: 'vid-1',
        type: 'video',
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        name: 'Big Buck Bunny',
        duration: 10,
        width: 1280,
        height: 720,
        author: 'Blender'
    },
    {
        id: 'vid-2',
        type: 'video',
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
        name: 'Elephants Dream',
        duration: 10,
        width: 1280,
        height: 720,
        author: 'Blender'
    },
    {
        id: 'vid-3',
        type: 'video',
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
        thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg',
        name: 'Car Review',
        duration: 10,
        width: 1280,
        height: 720,
        author: 'Volkswagen'
    }
];

export const stockService = {
    searchImages: async (query: string): Promise<StockAsset[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_IMAGES.filter(img => img.name.toLowerCase().includes(query.toLowerCase()) || query === '');
    },

    searchVideos: async (query: string): Promise<StockAsset[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_VIDEOS.filter(vid => vid.name.toLowerCase().includes(query.toLowerCase()) || query === '');
    }
};
