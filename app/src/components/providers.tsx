"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAdminStore, useAuthStore } from "@/lib/stores";
import { setupGlobalErrorHandlers, setLogUser, clearLogUser } from "@/lib/logger";
import { ultraLogger } from "@/lib/ultra-logger";
import { ErrorBoundary } from "./error-boundary";

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
        },
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const initializeAuth = useAuthStore((state) => state.initializeAuth);
    const loadAdminSettings = useAdminStore((state) => state.loadSettings);
    const subscribeToAdminChanges = useAdminStore((state) => state.subscribeToChanges);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        setMounted(true);

        // Setup global error handlers for uncaught errors
        setupGlobalErrorHandlers();

        // Initialize auth
        const unsubscribeAuth = initializeAuth();

        // Load admin settings
        loadAdminSettings();

        // Subscribe to real-time admin changes
        const unsubscribeAdmin = subscribeToAdminChanges();

        return () => {
            unsubscribeAuth();
            unsubscribeAdmin();
        };
    }, [initializeAuth, loadAdminSettings, subscribeToAdminChanges]);

    // Update logger user context when auth changes
    useEffect(() => {
        if (user?.id && user?.email) {
            setLogUser(user.id, user.email);
            ultraLogger.setUserId(user.id); // Sync ultra logger
        } else {
            clearLogUser();
            ultraLogger.clearUserId(); // Sync ultra logger
        }
    }, [user?.id, user?.email]);

    if (!mounted) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary context="AppRoot">
                {children}
            </ErrorBoundary>
        </QueryClientProvider>
    );
}

