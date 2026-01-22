"use client";

import { useEffect, useState } from "react";
import { useEditorStore, useAuthStore } from "@/lib/stores";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock, MoreVertical, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { Post } from "@/lib/types";

export default function CalendarPage() {
    const { user } = useAuthStore();
    const { posts, loadPosts, isLoading } = useEditorStore();

    useEffect(() => {
        if (user) loadPosts(user.id);
    }, [user, loadPosts]);

    // Filter scheduled posts
    const scheduledPosts = posts
        .filter(p => p.status === 'scheduled' && p.scheduledAt)
        .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

    // Group by Date
    const groupedPosts: Record<string, Post[]> = {};
    scheduledPosts.forEach(post => {
        const dateKey = format(new Date(post.scheduledAt!), 'yyyy-MM-dd');
        if (!groupedPosts[dateKey]) groupedPosts[dateKey] = [];
        groupedPosts[dateKey].push(post);
    });

    const dates = Object.keys(groupedPosts).sort();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <CalendarIcon className="w-7 h-7 text-indigo-600" />
                        Content Calendar
                    </h1>
                    <p className="text-gray-500 mt-1">
                        View and manage your upcoming scheduled posts
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : scheduledPosts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled posts</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">
                        Schedule your designs for auto-publishing directly from the editor.
                    </p>
                    <Link
                        href="/templates"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
                    >
                        Create Post
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {dates.map(dateKey => (
                        <div key={dateKey} className="space-y-3">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                <CalendarIcon className="w-4 h-4" />
                                {format(parseISO(dateKey), 'EEEE, MMMM do')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupedPosts[dateKey].map(post => (
                                    <div key={post.id} className="bg-white border boundary-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition group">
                                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                                            {/* Thumbnail */}
                                            {post.images.thumbnail ? (
                                                <img src={post.images.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Send className="w-6 h-6" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <Link href={`/editor/${post.id}`} className="px-3 py-1 bg-white text-xs font-bold rounded-full">
                                                    Edit
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 truncate" title={post.title}>
                                                    {post.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium capitalize">
                                                        {post.platform}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock className="w-4 h-4" />
                                                {format(new Date(post.scheduledAt!), 'h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
