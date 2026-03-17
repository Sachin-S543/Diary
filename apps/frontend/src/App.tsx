/*
 * Inkrypt
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin" />
            </div>
        </div>
    );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return <LoadingSpinner />;
    return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return <LoadingSpinner />;
    return isAuthenticated ? <Navigate to="/app" replace /> : <>{children}</>;
}

const SESSION_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

export default function App() {
    const { checkAuth, logout } = useAuthStore();

    useEffect(() => {
        checkAuth();

        let timeout: ReturnType<typeof setTimeout>;

        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (useAuthStore.getState().isAuthenticated) logout();
            }, SESSION_TIMEOUT_MS);
        };

        const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'touchstart'];
        events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
        resetTimer();

        return () => {
            clearTimeout(timeout);
            events.forEach(ev => window.removeEventListener(ev, resetTimer));
        };
    }, [checkAuth, logout]);

    return (
        <HashRouter>
            <Routes>
                {/* Public landing page */}
                <Route path="/" element={<LandingPage />} />

                {/* Auth — redirect to /app if already signed in */}
                <Route path="/auth" element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />

                {/* App — requires authentication */}
                <Route path="/app" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

                {/* Legacy redirect */}
                <Route path="/dashboard" element={<Navigate to="/app" replace />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
}
