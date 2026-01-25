import { describe, it, expect } from 'vitest';
import { CanvasStateBuilder, BuilderAssets } from '../canvas-state-builder';
import { TemplateConfig } from '@/lib/templates';
import { DynamicTemplate } from '@/lib/stores/template-store';

describe('CanvasStateBuilder', () => {
    // 1. Fixed Template Mock
    const fixedTemplate: TemplateConfig = {
        id: 'fixed-1',
        name: 'Fixed Test',
        category: 'quote',
        isPro: false,
        thumbnail: '',
        description: '',
        layout: { imagePosition: 'full', textPosition: 'bottom', hasInsetPhoto: false, hasSwipeIndicator: false, hasSocialIcons: false },
        style: { backgroundColor: '#000', textColor: '#fff', accentColor: '#000', highlightColor: '#000', gradientOverlay: 'none', fontFamily: 'sans', brandPosition: 'top-right' },
        dataFields: [],
        canvasElements: []
    };

    // 2. Custom Template Mock (JSON State)
    const customTemplateState = {
        elements: [
            { id: 'headline', type: 'text', name: 'Headline', text: 'Original Headline', y: 10, isBindable: true },
            { id: 'hero', type: 'image', name: 'Hero Image', imageUrl: 'original.png', y: 20, isBindable: true },
            { id: 'other', type: 'text', name: 'Static Text', text: 'Keep Me', y: 30, isBindable: false }
        ],
        background: { color: '#ffffff' }
    };

    const customTemplate: DynamicTemplate = {
        id: 'custom-1',
        name: 'Custom Test',
        description: '',
        userId: 'u1',
        thumbnail: '',
        isPro: false,
        createdAt: {},
        updatedAt: {},
        dataFields: [],
        layout: fixedTemplate.layout,
        style: fixedTemplate.style,
        canvasState: JSON.stringify(customTemplateState)
    };

    const assets: BuilderAssets = {
        headline: 'My New Headline',
        subtext: 'My Subtext',
        images: ['new-image.png']
    };

    it('should build state from Fixed Template', () => {
        const state = CanvasStateBuilder.build(fixedTemplate, assets);

        // Fixed builder adds elements dynamically based on layout
        expect(state.elements.length).toBeGreaterThan(0);

        // Check for User Image (since we provided images)
        const userImg = state.elements.find(el => el.id === 'user-image');
        expect(userImg).toBeDefined();
        expect(userImg?.imageUrl).toBe('new-image.png');

        // Check for Headline
        const headline = state.elements.find(el => el.id === 'headline');
        expect(headline).toBeDefined();
        expect(headline?.text).toBe('My New Headline');
    });

    it('should build state from Custom Template and replace content', () => {
        const state = CanvasStateBuilder.build(customTemplate, assets);

        // Should have parsed the JSON state
        expect(state.elements).toHaveLength(3);

        // 1. Headline Replacement (id='headline')
        const headline = state.elements.find(el => el.id === 'headline');
        expect(headline?.text).toBe('My New Headline');

        // 2. Image Replacement (id='hero')
        const hero = state.elements.find(el => el.id === 'hero');
        expect(hero?.imageUrl).toBe('new-image.png');

        // 3. Static Text Preservation
        const other = state.elements.find(el => el.id === 'other');
        expect(other?.text).toBe('Keep Me');
    });

    it('should handle missing assets gracefully', () => {
        const emptyAssets: BuilderAssets = { headline: '', subtext: '', images: [] };

        // Custom template
        const state = CanvasStateBuilder.build(customTemplate, emptyAssets);

        // Should trigger but NOT replace if asset is empty
        const headline = state.elements.find(el => el.id === 'headline');
        expect(headline?.text).toBe('Original Headline'); // Kept original because no new text provided
    });
});
