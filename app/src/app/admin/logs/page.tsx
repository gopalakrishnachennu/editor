'use client';

import { useState, useEffect } from 'react';
import { Calendar, Search, Download, RefreshCw, Filter, User, AlertCircle, Info, AlertTriangle, Monitor, ExternalLink, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface LogEntry {
    timestamp: number;
    type: string;
    message: string;
    context: Record<string, any>;
    userId?: string;
    sessionId: string;
    url: string;
    userAgent: string;
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Load available log files
    useEffect(() => {
        const loadAvailableDates = async () => {
            try {
                const response = await fetch('/api/logs/read', { method: 'OPTIONS' });
                const data = await response.json();
                if (data.files && Array.isArray(data.files)) {
                    const dates = data.files.map((f: string) => f.replace('.jsonl', ''));
                    setAvailableDates(dates);
                }
            } catch (error) {
                console.error('Failed to load available log dates:', error);
            }
        };
        loadAvailableDates();
    }, []);

    // Load logs for selected date
    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ date: selectedDate });
            const response = await fetch(`/api/logs/read?${params}`);
            const data = await response.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [selectedDate]);

    // Auto-refresh every 5 seconds
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(() => {
                loadLogs();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, selectedDate]);

    // Filter logs
    const filteredLogs = logs.filter(log => {
        // Type filter
        if (typeFilter !== 'all') {
            if (typeFilter === 'error' && !log.type.includes('error')) return false;
            if (typeFilter === 'warn' && !log.type.includes('warn')) return false;
            if (typeFilter === 'info' && (!log.type.includes('info') && !log.type.includes('click') && !log.type.includes('start'))) return false;
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesMessage = log.message.toLowerCase().includes(query);
            const matchesType = log.type.toLowerCase().includes(query);
            const matchesContext = JSON.stringify(log.context).toLowerCase().includes(query);
            const matchesUser = log.userId?.toLowerCase().includes(query);

            if (!matchesMessage && !matchesType && !matchesContext && !matchesUser) return false;
        }

        // User filter
        if (userFilter && log.userId !== userFilter) return false;

        return true;
    }).reverse(); // Show newest first

    // Export logs
    const exportLogs = (format: 'json' | 'csv') => {
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs-${selectedDate}.json`;
            a.click();
        } else {
            // CSV export
            const headers = ['Timestamp', 'Type', 'Message', 'User ID', 'Session ID', 'URL'];
            const csvData = [
                headers.join(','),
                ...filteredLogs.map(log => [
                    new Date(log.timestamp).toISOString(),
                    log.type,
                    `"${log.message.replace(/"/g, '""')}"`,
                    log.userId || 'N/A',
                    log.sessionId,
                    log.url
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs-${selectedDate}.csv`;
            a.click();
        }
    };

    const toggleExpand = (index: number) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedLogs(newExpanded);
    };

    const copyLogContext = (context: any, index: number) => {
        navigator.clipboard.writeText(JSON.stringify(context, null, 2));
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Get unique users
    const uniqueUsers = Array.from(new Set(logs.map(l => l.userId).filter(Boolean)));

    // Get log type styling
    const getTypeStyle = (type: string) => {
        if (type.includes('error')) return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
        if (type.includes('warn')) return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
        if (type.includes('click') || type.includes('scroll')) return { icon: Monitor, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
        if (type.includes('nav')) return { icon: ExternalLink, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
        return { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Logs</h1>
                        <p className="text-gray-500 mt-1">
                            Monitor ultra-detailed user interactions and debug issues
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadLogs}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${autoRefresh
                                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            Live
                        </button>
                        <div className="h-6 w-px bg-gray-300 mx-1" />
                        <button
                            onClick={() => exportLogs('json')}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                            title="Export JSON"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Date
                            </label>
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="block w-full rounded-lg border-gray-200 bg-gray-50/50 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                {availableDates.map(date => (
                                    <option key={date} value={date}>{date}</option>
                                ))}
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5" />
                                Type
                            </label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="block w-full rounded-lg border-gray-200 bg-gray-50/50 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="all">All Events</option>
                                <option value="error">Errors & Exceptions</option>
                                <option value="warn">Warnings</option>
                                <option value="info">Info Logs</option>
                            </select>
                        </div>

                        {/* User Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                User
                            </label>
                            <select
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="block w-full rounded-lg border-gray-200 bg-gray-50/50 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">All Users</option>
                                {uniqueUsers.map(userId => (
                                    <option key={userId} value={userId!}>
                                        {userId?.substring(0, 8)}...
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Search className="w-3.5 h-3.5" />
                                Search
                            </label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search messages, context..."
                                className="block w-full rounded-lg border-gray-200 bg-gray-50/50 text-sm focus:border-indigo-500 focus:ring-indigo-500 placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-sm font-medium text-gray-500">Total Entries</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{filteredLogs.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-sm font-medium text-gray-500">Unique Users</div>
                        <div className="text-2xl font-bold text-indigo-600 mt-1">
                            {new Set(filteredLogs.map(l => l.userId).filter(Boolean)).size}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                        <div className="text-sm font-medium text-red-600">Errors</div>
                        <div className="text-2xl font-bold text-red-700 mt-1">
                            {filteredLogs.filter(l => l.type.includes('error')).length}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100">
                        <div className="text-sm font-medium text-yellow-600">Warnings</div>
                        <div className="text-2xl font-bold text-yellow-700 mt-1">
                            {filteredLogs.filter(l => l.type.includes('warn')).length}
                        </div>
                    </div>
                </div>

                {/* Logs Stream */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {filteredLogs.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">No logs found</h3>
                                <p className="text-gray-500 mt-1">Try adjusting your filters or search query</p>
                            </div>
                        ) : (
                            filteredLogs.map((log, index) => {
                                const style = getTypeStyle(log.type);
                                const Icon = style.icon;
                                const isExpanded = expandedLogs.has(index);

                                return (
                                    <div
                                        key={index}
                                        className={`group hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
                                    >
                                        <div
                                            className="p-4 cursor-pointer"
                                            onClick={() => toggleExpand(index)}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Timestamp & Type Icon */}
                                                <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-1">
                                                    <div className={`p-2 rounded-lg ${style.bg} ${style.color}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-gray-400">
                                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded textxs font-medium ${style.bg} ${style.color} border ${style.border}`}>
                                                            {log.type}
                                                        </span>
                                                        {log.userId && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                                <User className="w-3 h-3" />
                                                                {log.userId.substring(0, 8)}...
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400 font-mono ml-auto">
                                                            ID: {log.sessionId.substring(8, 16)}
                                                        </span>
                                                    </div>

                                                    <p className={`text-sm text-gray-900 leading-relaxed font-mono whitespace-pre-wrap ${!isExpanded && 'line-clamp-2'}`}>
                                                        {log.message}
                                                    </p>

                                                    {log.url && (
                                                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1 truncate">
                                                            <ExternalLink className="w-3 h-3" />
                                                            {log.url}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Expand Arrow */}
                                                <div className="flex-shrink-0 pt-1 text-gray-400">
                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Context */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pl-[4.5rem]">
                                                <div className="bg-gray-900 rounded-lg p-4 relative group/code">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyLogContext(log.context, index);
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded opacity-0 group-hover/code:opacity-100 transition-opacity"
                                                        title="Copy Context"
                                                    >
                                                        {copiedIndex === index ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                    <pre className="text-xs font-mono text-blue-300 overflow-x-auto">
                                                        {JSON.stringify(log.context, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
