import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    Link: ({ children, href }: any) => <a href={href}>{children}</a>
}));

// Mock Link from lucide (icons are React components)
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual,
        // Mock icons to avoid large SVG rendering in tests
        Zap: () => <span data-testid="icon-zap" />,
        Sparkles: () => <span data-testid="icon-sparkles" />,
        Image: () => <span data-testid="icon-image" />,
    };
});

// Mock Stores
const mockUseAuthStore = vi.fn();
const mockUseEditorStore = vi.fn();
const mockUseAdminStore = vi.fn();

vi.mock('@/lib/stores', () => ({
    useAuthStore: () => mockUseAuthStore(),
    useEditorStore: () => mockUseEditorStore(),
    useAdminStore: () => mockUseAdminStore()
}));

// Mock FeatureGate
vi.mock('@/components/guards', () => ({
    FeatureGate: ({ children, fallback }: any) => <div>{children}</div>
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }: any) => <div className={className}>{children}</div>
    }
}));

describe('DashboardPage', () => {
    beforeEach(() => {
        mockUseAuthStore.mockReturnValue({
            user: {
                id: 'test-user',
                displayName: 'Test User',
                usage: { postsCreated: 5, aiGenerationsThisMonth: 10, exportsThisMonth: 2 }
            }
        });
        mockUseEditorStore.mockReturnValue({
            recentPosts: [],
            syncUserStats: vi.fn()
        });
        mockUseAdminStore.mockReturnValue({
            settings: { ai: { dailyLimitPerUser: 100 } }
        });
    });

    it('renders welcome message with user name', () => {
        render(<DashboardPage />);
        expect(screen.getByText(/Welcome back, Test!/i)).toBeDefined();
    });

    it('displays usage statistics', () => {
        render(<DashboardPage />);
        expect(screen.getByText('5')).toBeDefined(); // Posts created
        expect(screen.getByText('10')).toBeDefined(); // AI Gens
        expect(screen.getByText('2')).toBeDefined(); // Exports
    });

    it('renders Quick Actions', () => {
        render(<DashboardPage />);
        expect(screen.getByText('Create from URL')).toBeDefined();
        expect(screen.getByText('Create from Text')).toBeDefined();
        expect(screen.getByText('Use Template')).toBeDefined();
    });

    it('renders AI Assistant section', () => {
        render(<DashboardPage />);
        expect(screen.getByText('AI Content Assistant')).toBeDefined();
        // 100 limit - 10 used = 90
        expect(screen.getByText(/90 credits remaining/i)).toBeDefined();
    });
});
