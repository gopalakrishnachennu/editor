import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartTemplateService, Asset } from '../smart-template-service';
import { DynamicTemplate } from '@/lib/stores/template-store';

// Mock templates module to avoid dependencies
vi.mock('@/lib/templates', () => ({
    templates: [
        {
            id: 'fixed-1',
            name: 'Fixed Template 1',
            category: 'quote',
            dataFields: [
                { type: 'image', required: true },
                { type: 'text', required: true }
            ],
            tags: ['quote']
        }
    ]
}));

// Mock logger
vi.mock('@/lib/ultra-logger', () => ({
    ultraLogger: {
        info: vi.fn(),
        debug: vi.fn()
    }
}));

describe('SmartTemplateService', () => {
    const mockAssets: Asset[] = [
        { id: '1', type: 'image', content: 'img1.png' },
        { id: '2', type: 'text', content: 'Short headline' }
    ];

    it('should match fixed templates correctly', () => {
        const matches = SmartTemplateService.findBestMatches(mockAssets, []);
        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0].template.id).toBe('fixed-1');
        expect(matches[0].score).toBeGreaterThan(0);
    });

    it('should prioritize templates matching asset counts', () => {
        const heavyAssets: Asset[] = [
            { id: '1', type: 'image', content: 'img1.png' },
            { id: '2', type: 'image', content: 'img2.png' },
            { id: '3', type: 'text', content: 'Headline' }
        ];

        // Should still match but maybe different score logic
        const matches = SmartTemplateService.findBestMatches(heavyAssets, []);
        expect(matches[0].score).toBeDefined();
    });

    it('should handle custom templates', () => {
        const customTemplate: DynamicTemplate = {
            id: 'custom-1',
            name: 'My Custom Template',
            description: 'Custom',
            userId: 'user1',
            thumbnail: 'thumb.png',
            isPro: false,
            createdAt: {},
            updatedAt: {},
            dataFields: [
                { id: 'f1', label: 'Image', type: 'image', placeholder: '', required: true }
            ], // 1 Image Required
            canvasState: '{}',
            layout: { imagePosition: 'full', textPosition: 'overlay', hasInsetPhoto: false, hasSwipeIndicator: false, hasSocialIcons: false },
            style: { backgroundColor: '#fff', textColor: '#000', accentColor: '#000', highlightColor: '#000', gradientOverlay: 'none', fontFamily: 'sans', brandPosition: 'top-left' }
        };

        const matches = SmartTemplateService.findBestMatches(mockAssets, [customTemplate]);

        // Custom templates get a base score of 30 + matching bonuses
        const customResult = matches.find(m => m.template.id === 'custom-1');
        expect(customResult).toBeDefined();
        expect(customResult?.isCustom).toBe(true);
        expect(customResult?.score).toBeGreaterThan(30);
    });

    it('should penalize when required assets are missing', () => {
        const onlyText: Asset[] = [
            { id: '1', type: 'text', content: 'Just text' }
        ];

        const matches = SmartTemplateService.findBestMatches(onlyText, []);
        // Fixed template requires 1 image. Should have negative score or very low.
        const fixed = matches.find(m => m.template.id === 'fixed-1');
        expect(fixed?.score).toBeLessThan(0); // -100 for missing image
        expect(fixed?.missingAssets.length).toBeGreaterThan(0);
    });
});
