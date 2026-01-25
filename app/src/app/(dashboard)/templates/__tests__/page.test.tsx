import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemplatesPage from '../page';

// Mock Router
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    Link: ({ children, href }: any) => <a href={href}>{children}</a>
}));

// Mock Lucide icons
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual,
        Palette: () => <span data-testid="icon-palette" />,
        Search: () => <span data-testid="icon-search" />,
    };
});

// Mock Stores
const mockUseEditorStore = vi.fn();
const mockUseTemplateStore = vi.fn();
const mockUseAuthStore = vi.fn();
const mockUseAdminStore = vi.fn();

vi.mock('@/lib/stores', () => ({
    useEditorStore: () => mockUseEditorStore(),
    useTemplateStore: () => mockUseTemplateStore(),
    useAuthStore: () => mockUseAuthStore(),
    useAdminStore: () => mockUseAdminStore()
}));

// Mock FeatureGate
vi.mock('@/components/guards', () => ({
    FeatureGate: ({ children }: any) => <div>{children}</div>
}));

// Mock Modals (createPortal might fail in JSDOM if target missing, but usually fine)
// Better to mock the entire modal component to avoid rendering issues
vi.mock('@/components/modals/template-fill-modal', () => ({
    TemplateFillModal: () => <div data-testid="modal-fill" />
}));
vi.mock('@/components/modals/bulk-generate-modal', () => ({
    BulkGenerateModal: () => <div data-testid="modal-bulk" />
}));
vi.mock('@/components/modals/confirm-modal', () => ({
    ConfirmModal: () => <div data-testid="modal-confirm" />
}));

describe('TemplatesPage', () => {
    beforeEach(() => {
        mockUseEditorStore.mockReturnValue({
            templates: [
                { id: 'fixed-1', name: 'Fixed 1', category: 'news', dataFields: [] }
            ],
            loadTemplates: vi.fn(),
            loadBrandKits: vi.fn(),
            isLoading: false,
            currentBrandKit: null
        });

        mockUseTemplateStore.mockReturnValue({
            dynamicTemplates: [
                { id: 'custom-1', name: 'Custom 1', category: 'quote', isPro: true, layout: {}, dataFields: [], canvasState: '{}' }
            ],
            loadDynamicTemplates: vi.fn(),
            isLoading: false
        });

        mockUseAuthStore.mockReturnValue({ user: { id: 'test' } });
        mockUseAdminStore.mockReturnValue({ settings: {} });
    });

    it('renders gallery header', () => {
        render(<TemplatesPage />);
        expect(screen.getByText('Template Gallery')).toBeDefined();
    });

    it('renders list of templates (fixed + custom)', () => {
        render(<TemplatesPage />);
        expect(screen.getByText('Fixed 1')).toBeDefined();
        expect(screen.getByText('Custom 1')).toBeDefined();
    });

    it('filters when clicking a category', async () => {
        render(<TemplatesPage />);

        // Initial state: All
        expect(screen.getByText('Fixed 1')).toBeDefined();

        // Click "Quote Posts" filter
        const quoteBtn = screen.getByText('Quote Posts');
        fireEvent.click(quoteBtn);

        // Should show Custom 1 (quote) but NOT Fixed 1 (news)
        // Wait for re-render
        await waitFor(() => {
            expect(screen.queryByText('Fixed 1')).toBeNull();
            expect(screen.getByText('Custom 1')).toBeDefined();
        });
    });

    it('searches templates by name', async () => {
        render(<TemplatesPage />);

        const searchInput = screen.getByPlaceholderText('Search templates...');
        fireEvent.change(searchInput, { target: { value: 'Custom' } });

        await waitFor(() => {
            expect(screen.queryByText('Fixed 1')).toBeNull();
            expect(screen.getByText('Custom 1')).toBeDefined();
        });
    });
});
