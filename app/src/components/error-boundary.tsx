'use client';

/**
 * React Error Boundary Component
 * Catches React errors and logs them to our logging system
 */

import React from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    context?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        const context = this.props.context || 'ReactErrorBoundary';

        // Log to our advanced logging system
        logger.error(context, 'React component error caught', {
            componentStack: errorInfo.componentStack,
        }, error);

        this.setState({ errorInfo });
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-red-500/20">
                        <div className="flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>

                        <h2 className="text-xl font-semibold text-white text-center mb-2">
                            Something went wrong
                        </h2>

                        <p className="text-gray-400 text-center text-sm mb-6">
                            We&apos;ve logged this error and will look into it. You can try refreshing or go back home.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-gray-800 rounded-lg p-4 mb-6 overflow-auto max-h-48">
                                <p className="text-red-400 text-sm font-mono mb-2">
                                    {this.state.error.name}: {this.state.error.message}
                                </p>
                                {this.state.errorInfo?.componentStack && (
                                    <pre className="text-gray-500 text-xs whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>

                            <Link
                                href="/"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    context?: string
): React.FC<P> {
    const WrappedComponent: React.FC<P> = (props) => (
        <ErrorBoundary context={context || Component.displayName || Component.name}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}

export default ErrorBoundary;
