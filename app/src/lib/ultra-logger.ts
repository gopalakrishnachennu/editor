/**
 * Ultra-Detailed Local Logging System
 * 
 * Features:
 * - Logs EVERYTHING (clicks, inputs, scrolls, navigation, errors, state changes)
 * - Self-explanatory messages with full context
 * - Stores to local Logs/ folder via API
 * - Zero Firebase dependency
 * - Instant debugging for LLMs and developers
 */

// Types
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

class UltraDetailedLogger {
    private buffer: LogEntry[] = [];
    private readonly bufferSize = 50; // Flush after 50 entries
    private sessionId: string;
    private userId?: string;
    private flushInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.sessionId = this.generateSessionId();
        this.setupGlobalListeners();
        this.startAutoFlush();
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    setUserId(userId: string) {
        this.userId = userId;
        this.log('system', 'User context set for logging', { userId });
    }

    clearUserId() {
        this.log('system', 'User context cleared from logging', { userId: this.userId });
        this.userId = undefined;
    }

    private setupGlobalListeners() {
        if (typeof window === 'undefined') return;

        // === LOG EVERY CLICK ===
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const selector = this.getElementSelector(target);
            const text = target.textContent?.slice(0, 100);

            this.log('click',
                `User clicked "${text || selector}" element. ` +
                `Element type: ${target.tagName} located at position (${e.clientX}, ${e.clientY}). ` +
                `Modifiers: ${this.formatModifiers(e)}. ` +
                `User was viewing page: ${window.location.pathname}. ` +
                `This click may trigger: ${this.predictClickAction(target)}.`,
                {
                    selector,
                    text,
                    position: { x: e.clientX, y: e.clientY },
                    modifiers: {
                        ctrl: e.ctrlKey,
                        shift: e.shiftKey,
                        alt: e.altKey,
                        meta: e.metaKey
                    },
                    elementType: target.tagName,
                    elementClasses: target.className,
                    elementId: target.id,
                    predictedAction: this.predictClickAction(target)
                }
            );
        }, true);

        // === LOG EVERY INPUT ===
        document.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const selector = this.getElementSelector(target);

            this.log('input',
                `User typed into "${target.placeholder || selector}" field. ` +
                `Entered value: "${target.value.slice(0, 50)}${target.value.length > 50 ? '...' : ''}" (${target.value.length} characters). ` +
                `Field type: ${target.type}. ` +
                `User is ${target.value.length > 10 ? 'actively typing' : 'starting to type'}. ` +
                `Expected input format: ${this.getExpectedFormat(target)}.`,
                {
                    selector,
                    value: target.value.slice(0, 200), // First 200 chars
                    length: target.value.length,
                    fieldType: target.type,
                    placeholder: target.placeholder,
                    fieldName: target.name,
                    expectedFormat: this.getExpectedFormat(target)
                }
            );
        }, true);

        // === LOG EVERY KEYSTROKE ===
        document.addEventListener('keydown', (e) => {
            this.log('keypress',
                `User pressed "${e.key}" key. ` +
                `Key code: ${e.code}. ` +
                `Modifiers: ${this.formatModifiers(e)}. ` +
                `Keyboard shortcut detected: ${this.detectShortcut(e)}. ` +
                `Active element: ${this.getElementSelector(document.activeElement as HTMLElement)}.`,
                {
                    key: e.key,
                    code: e.code,
                    modifiers: {
                        ctrl: e.ctrlKey,
                        shift: e.shiftKey,
                        alt: e.altKey,
                        meta: e.metaKey
                    },
                    shortcut: this.detectShortcut(e),
                    activeElement: this.getElementSelector(document.activeElement as HTMLElement)
                }
            );
        }, true);

        // === LOG EVERY SCROLL ===
        let scrollTimeout: NodeJS.Timeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);

                this.log('scroll',
                    `User scrolled to position (${window.scrollX}, ${window.scrollY}). ` +
                    `Scroll progress: ${scrollPercent}% of page. ` +
                    `Page: ${window.location.pathname}. ` +
                    `User is ${scrollPercent > 80 ? 'near bottom of page' : scrollPercent < 20 ? 'near top of page' : 'mid-page'}. ` +
                    `Possible intent: ${scrollPercent > 80 ? 'Looking for more content or footer info' : 'Browsing/reading content'}.`,
                    {
                        position: { x: window.scrollX, y: window.scrollY },
                        scrollPercent,
                        page: window.location.pathname,
                        pageHeight: document.body.scrollHeight,
                        viewportHeight: window.innerHeight
                    }
                );
            }, 200); // Debounce
        });

        // === LOG EVERY NAVIGATION ===
        const originalPushState = history.pushState;
        history.pushState = function (...args) {
            const from = window.location.pathname;
            const to = args[2] as string;

            (window as any).__logger.log('navigation',
                `User navigated from "${from}" → "${to}". ` +
                `Navigation method: Browser history (pushState). ` +
                `User spend ${Math.round(performance.now() / 1000)}s on previous page. ` +
                `New page loading: User will see ${to} content. ` +
                `Session navigation count: ${(window as any).__navCount++}.`,
                {
                    from,
                    to,
                    method: 'pushState',
                    timeOnPreviousPage: Math.round(performance.now() / 1000),
                    sessionNavigations: (window as any).__navCount
                }
            );

            return originalPushState.apply(history, args);
        };
        (window as any).__navCount = 1;

        // === LOG EVERY ERROR ===
        window.addEventListener('error', (e) => {
            this.log('error',
                `UNCAUGHT ERROR occurred in application. ` +
                `Error message: "${e.message}". ` +
                `Location: ${e.filename}:${e.lineno}:${e.colno}. ` +
                `User was viewing: ${window.location.pathname}. ` +
                `User action before error: [check previous logs]. ` +
                `This error prevented normal app operation. ` +
                `IMMEDIATE ACTION NEEDED: Debug this error to restore functionality.`,
                {
                    message: e.message,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno,
                    stack: e.error?.stack,
                    page: window.location.pathname,
                    timestamp: Date.now()
                }
            );
        });

        // === LOG EVERY PROMISE REJECTION ===
        window.addEventListener('unhandledrejection', (e) => {
            this.log('promise_rejection',
                `UNHANDLED PROMISE REJECTION detected. ` +
                `Reason: "${String(e.reason)}". ` +
                `This typically means: An async operation failed but wasn't caught with .catch(). ` +
                `Common causes: (1) Network request failed, (2) API error not handled, (3) Async function threw error. ` +
                `User impact: Operation silently failed - user may not see expected result. ` +
                `SOLUTION: Add proper error handling to async operations.`,
                {
                    reason: String(e.reason),
                    promise: String(e.promise),
                    page: window.location.pathname
                }
            );
        });

        // === LOG VISIBILITY CHANGES (Tab focus) ===
        document.addEventListener('visibilitychange', () => {
            this.log('visibility',
                `User ${document.hidden ? 'switched away from' : 'returned to'} application tab. ` +
                `Previous visibility state: ${!document.hidden ? 'visible' : 'hidden'}. ` +
                `User was ${document.hidden ? 'viewing another tab/window' : 'back to using the app'}. ` +
                `Session time: ${Math.round(performance.now() / 1000)}s total.`,
                {
                    visible: !document.hidden,
                    page: window.location.pathname,
                    sessionTime: Math.round(performance.now() / 1000)
                }
            );
        });
    }

    // Main logging method with self-explanatory messages
    log(type: string, message: string, context: Record<string, any> = {}) {
        const entry: LogEntry = {
            timestamp: Date.now(),
            type,
            message,
            context,
            userId: this.userId,
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.buffer.push(entry);

        // Console output in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${type.toUpperCase()}]`, message, context);
        }

        // Auto-flush if buffer full
        if (this.buffer.length >= this.bufferSize) {
            this.flush();
        }
    }

    async flush() {
        if (this.buffer.length === 0) return;

        const entries = [...this.buffer];
        this.buffer = [];

        try {
            await fetch('/api/logs/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries })
            });
        } catch (error) {
            console.error('Failed to write logs to file:', error);
            // Put entries back in buffer to retry
            this.buffer.unshift(...entries);
        }
    }

    private startAutoFlush() {
        // Flush every 5 seconds
        this.flushInterval = setInterval(() => this.flush(), 5000);

        // Flush on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.flush());
        }
    }

    // Helper: Get CSS selector for element
    private getElementSelector(element: HTMLElement | null): string {
        if (!element) return 'unknown';

        const id = element.id ? `#${element.id}` : '';
        const classes = element.className ? `.${element.className.split(' ').filter(c => c).join('.')}` : '';
        return `${element.tagName.toLowerCase()}${id}${classes}`;
    }

    // Helper: Format keyboard modifiers
    private formatModifiers(e: KeyboardEvent | MouseEvent): string {
        const mods = [];
        if (e.ctrlKey) mods.push('Ctrl');
        if (e.shiftKey) mods.push('Shift');
        if (e.altKey) mods.push('Alt');
        if (e.metaKey) mods.push('Cmd/Win');
        return mods.length > 0 ? mods.join('+') : 'None';
    }

    // Helper: Detect keyboard shortcuts
    private detectShortcut(e: KeyboardEvent): string {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') return 'Undo';
            if (e.key === 'y' || (e.shiftKey && e.key === 'z')) return 'Redo';
            if (e.key === 'c') return 'Copy';
            if (e.key === 'v') return 'Paste';
            if (e.key === 'x') return 'Cut';
            if (e.key === 's') return 'Save';
            if (e.key === 'f') return 'Find';
        }
        return 'None';
    }

    // Helper: Predict what a click will do
    private predictClickAction(element: HTMLElement): string {
        if (element.tagName === 'BUTTON') {
            const text = element.textContent?.toLowerCase() || '';
            if (text.includes('export')) return 'Start export process';
            if (text.includes('save')) return 'Save to database';
            if (text.includes('delete')) return 'Delete item';
            if (text.includes('upload')) return 'Open file picker';
            return 'Execute button action';
        }
        if (element.tagName === 'A') return 'Navigate to new page';
        if (element.tagName === 'INPUT') return 'Focus input field';
        return 'Unknown action';
    }

    // Helper: Get expected input format
    private getExpectedFormat(input: HTMLInputElement): string {
        if (input.type === 'email') return 'Email address (user@example.com)';
        if (input.type === 'password') return 'Password (8+ characters)';
        if (input.type === 'number') return 'Numeric value';
        if (input.type === 'tel') return 'Phone number';
        if (input.type === 'url') return 'URL (https://...)';
        if (input.placeholder) return input.placeholder;
        return 'Text';
    }

    // Exposed methods for manual logging
    info(component: string, message: string, context: Record<string, any> = {}) {
        this.log(`info:${component}`, message, context);
    }

    warn(component: string, message: string, context: Record<string, any> = {}) {
        this.log(`warn:${component}`, message, context);
    }

    error(component: string, message: string, context: Record<string, any> = {}) {
        this.log(`error:${component}`, message, context);
    }

    debug(component: string, message: string, context: Record<string, any> = {}) {
        if (process.env.NODE_ENV === 'development') {
            this.log(`debug:${component}`, message, context);
        }
    }
}

// Export singleton instance
export const ultraLogger = new UltraDetailedLogger();

// Expose to window for debugging
if (typeof window !== 'undefined') {
    (window as any).__logger = ultraLogger;
    (window as any).debugLogs = {
        view: () => ultraLogger,
        export: () => ultraLogger.flush(),
        buffer: () => (ultraLogger as any).buffer
    };
}

export default ultraLogger;
