'use client';

/**
 * Posts Gallery Page
 * Displays all user's created posts/designs in a filterable gallery
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEditorStore, useAuthStore } from '@/lib/stores';
import { AuthGuard } from '@/components/guards';
import {
    Plus,
    FileText,
    Search,
    Grid3X3,
    List,
    Filter,
    Calendar,
    ArrowLeft,
    Trash2,
    Download,
    Edit,
    MoreVertical,
    RefreshCw,
} from 'lucide-react';
import { ConfirmModal } from '@/components/modals/confirm-modal';

export default function PostsPage() {
    const { recentPosts, loadRecentPosts, deletePost, isLoading, repairPostTimestamps } = useEditorStore();
    const { user } = useAuthStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = (e: React.MouseEvent, postId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteId(postId);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deletePost(deleteId);
            setDeleteId(null);
        }
    };

    // Fetch posts on mount
    useEffect(() => {
        if (user?.id) {
            loadRecentPosts(user.id);
        }
    }, [user, loadRecentPosts]);

    // Filter and sort posts
    const filteredPosts = recentPosts
        .filter(post => {
            const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.platform?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            // Sort by updatedAt first, fallback to createdAt
            if (sortBy === 'newest') {
                const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                return dateB - dateA;
            }
            if (sortBy === 'oldest') {
                const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                return dateA - dateB;
            }
            return (a.title || '').localeCompare(b.title || '');
        });

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50/50">
                {/* Minimal Header */}
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900 tracking-tight">My Designs</h1>
                            </div>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                                {filteredPosts.length}
                            </span>
                        </div>
                        <Link
                            href="/editor/new"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-all shadow-sm hover:shadow-md text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Create New
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Clean Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
                        {/* Search Pill */}
                        <div className="relative w-full max-w-sm group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search designs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-300 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            {/* Sort & Filter Pills */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-gray-400 hover:border-gray-300 transition-colors cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Drafts</option>
                                <option value="published">Published</option>
                                <option value="scheduled">Scheduled</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-gray-400 hover:border-gray-300 transition-colors cursor-pointer"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="name">Name</option>
                            </select>

                            <div className="w-px h-4 bg-gray-300 mx-1" />

                            {/* View Toggles */}
                            <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Gallery Grid */}
                    {filteredPosts.length > 0 ? (
                        <div
                            className={viewMode === 'grid'
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                : "flex flex-col gap-3"
                            }
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredPosts.map((post, index) => (
                                    <motion.div
                                        key={post.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                    >
                                        <Link
                                            href={`/editor/${post.id}`}
                                            className={`group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300 ${viewMode === 'list' ? 'flex items-center gap-4 p-3' : ''
                                                }`}
                                        >
                                            {/* Minimalist Thumbnail Frame */}
                                            <div className={`relative bg-gray-50 overflow-hidden ${viewMode === 'grid' ? 'aspect-[4/5] w-full border-b border-gray-50' : 'w-16 h-16 rounded-lg border border-gray-100'
                                                }`}>
                                                {post.images?.thumbnail ? (
                                                    <img
                                                        src={post.images.thumbnail}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <FileText className="w-8 h-8 opacity-50" />
                                                    </div>
                                                )}

                                                {/* Hover Overlay Only (Grid) */}
                                                {viewMode === 'grid' && (
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                                )}

                                                {/* Status Dot */}
                                                {viewMode === 'grid' && (
                                                    <div className="absolute top-3 right-3 flex gap-2">
                                                        {post.status !== 'draft' && (
                                                            <div className={`w-2 h-2 rounded-full shadow-sm ${post.status === 'published' ? 'bg-green-500' : 'bg-blue-500'
                                                                }`} title={post.status} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Minimalist Info */}
                                            <div className={`${viewMode === 'grid' ? 'p-4' : 'flex-1 min-w-0'}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="text-sm font-medium text-gray-900 truncate pr-2 group-hover:text-blue-600 transition-colors">
                                                        {post.title || 'Untitled'}
                                                    </h3>
                                                    {viewMode === 'grid' && (
                                                        <button
                                                            onClick={(e) => handleDelete(e, post.id)}
                                                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-center text-xs text-gray-500 gap-2">
                                                    <span className="capitalize">{post.platform}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {post.updatedAt
                                                            ? new Date((post.updatedAt as any).seconds * 1000 || post.updatedAt).toLocaleDateString()
                                                            : 'Just now'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* List View Actions */}
                                            {viewMode === 'list' && (
                                                <div className="flex items-center gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => handleDelete(e, post.id)} className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1">No designs yet</h3>
                            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                                Start with a blank canvas or choose a template to begin your journey.
                            </p>
                            <Link href="/editor/new" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                Create first design &rarr;
                            </Link>
                        </div>
                    )}

                </div>

                {/* Confirm Delete Modal */}
                <ConfirmModal
                    isOpen={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={confirmDelete}
                    title="Delete Design?"
                    message="This action cannot be undone. This design will be permanently removed from your library."
                    confirmText="Delete Design"
                    isDestructive={true}
                />
            </div>
        </AuthGuard>
    );
}
