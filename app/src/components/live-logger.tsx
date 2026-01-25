"use client";

import { useState, useEffect, useRef } from "react";
import { X, Terminal, Trash2 } from "lucide-react";

interface LogEntry {
    type: 'log' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
}

export function LiveLogger() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const logsRef = useRef<LogEntry[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const originalLog = console.log;
        const originalInfo = console.info;
        const originalWarn = console.warn;
        const originalError = console.error;

        const syncLogsToState = () => {
            if (timeoutRef.current) return;
            timeoutRef.current = setTimeout(() => {
                setLogs([...logsRef.current]);
                timeoutRef.current = null;
            }, 100); // Throttle updates to 100ms
        };

        const addLog = (type: LogEntry['type'], ...args: any[]) => {
            let message = '';
            try {
                message = args.map(arg => {
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg, null, 2);
                        } catch (e) {
                            return '[Circular Object]';
                        }
                    }
                    return String(arg);
                }).join(' ');
            } catch (e) {
                message = '[Log Error]';
            }

            const entry: LogEntry = {
                type,
                message,
                timestamp: new Date().toLocaleTimeString()
            };

            logsRef.current = [entry, ...logsRef.current].slice(0, 100);
            syncLogsToState();
        };

        console.log = (...args) => {
            addLog('log', ...args);
            originalLog(...args);
        };

        console.info = (...args) => {
            addLog('info', ...args);
            originalInfo(...args);
        };

        console.warn = (...args) => {
            addLog('warn', ...args);
            originalWarn(...args);
        };

        console.error = (...args) => {
            addLog('error', ...args);
            originalError(...args);
        };

        return () => {
            console.log = originalLog;
            console.info = originalInfo;
            console.warn = originalWarn;
            console.error = originalError;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-gray-900 text-white p-2 rounded-full shadow-lg border border-gray-700 hover:bg-gray-800 z-[9999]"
            >
                <Terminal className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-[500px] h-[300px] bg-gray-900 rounded-lg shadow-xl border border-gray-800 z-[9999] flex flex-col font-mono text-xs">
            <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-gray-300">System Logs</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setLogs([])} className="text-gray-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-black/20">
                {logs.length === 0 && <div className="text-gray-600 italic p-2">Waiting for logs...</div>}
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 p-1 hover:bg-white/5 rounded">
                        <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                        <span className={
                            log.type === 'error' ? 'text-red-400' :
                                log.type === 'warn' ? 'text-yellow-400' :
                                    log.type === 'info' ? 'text-blue-400' : 'text-gray-300'
                        }>
                            {log.message}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
