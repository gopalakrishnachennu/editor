import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostsPage from '../page';

// Mock everything needed
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    Link: ({ children, href }: any) => <a href={href}>{children}</a>
}));

vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual,
        Search: () => <span data-testid="icon-search" />,
        Filter: () => <span data-testid="icon-filter" />
    };
});

// Mock store
const mockUseEditorStore = vi.fn();

vi.mock('@/lib/stores', () => ({
    useEditorStore: () => mockUseEditorStore(),
    useAuthStore: () => ({ user: { id: 'test' } }),
    useAdminStore: () => ({ settings: {} })
}));

// Mock AuthGuard
vi.mock('@/components/guards', () => ({
    AuthGuard: ({ children }: any) => <div>{children}</div>
}));

describe('Posts Page', () => {
    beforeEach(() => {
        mockUseEditorStore.mockReturnValue({
            recentPosts: [
                { id: '1', title: 'Test Post 1', updatedAt: new Date().toISOString() },
                { id: '2', title: 'Test Post 2', updatedAt: new Date().toISOString() }
            ],
            // Add loadUserPosts if the component uses it
            loadUserPosts: vi.fn(),
            loadRecentPosts: vi.fn(),
            deletePost: vi.fn(),
            repairPostTimestamps: vi.fn(),
            userPosts: [], // Maybe it uses this instead of recentPosts?
            isLoading: false
        });
    });

    it('renders page', () => {
        render(<PostsPage />);
        expect(screen.getByText('My Designs')).toBeDefined();
    });
});
