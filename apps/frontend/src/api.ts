/*
 * Inkrypt
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { Capsule } from '@secret-capsule/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

// ─── Generic fetch helper ──────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(err.message || `Request failed: ${res.status}`);
    }
    return res.json();
}

// ─── API ───────────────────────────────────────────────────────────────────
const realApi = {
    auth: {
        sendOtp(email: string) {
            return apiFetch<{ message: string }>('/auth/send-otp', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
        },

        signup(data: { email: string; username: string; password: string; otpCode: string }) {
            return apiFetch<{ user: any; token: string }>('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        login(data: { identifier: string; password: string }) {
            return apiFetch<{ user: any; token: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        logout() {
            return apiFetch<{ message: string }>('/auth/logout', { method: 'POST' });
        },

        checkAuth() {
            return apiFetch<{ user: any }>('/auth/me');
        },
    },

    capsules: {
        getAll(filters?: { category?: string; tag?: string }) {
            const params = new URLSearchParams();
            if (filters?.category) params.set('category', filters.category);
            if (filters?.tag) params.set('tag', filters.tag);
            const qs = params.toString();
            return apiFetch<Capsule[]>(`/capsules${qs ? `?${qs}` : ''}`).then(data => ({ data }));
        },

        getMeta() {
            return apiFetch<{ categories: string[]; tags: string[] }>('/capsules/meta');
        },

        create(capsule: Omit<Capsule, 'createdAt' | 'updatedAt' | 'userId'>) {
            return apiFetch<Capsule>('/capsules', {
                method: 'POST',
                body: JSON.stringify(capsule),
            }).then(data => ({ data }));
        },

        update(id: string, capsule: Partial<Capsule>) {
            return apiFetch<Capsule>(`/capsules/${id}`, {
                method: 'PUT',
                body: JSON.stringify(capsule),
            }).then(data => ({ data }));
        },

        delete(id: string) {
            return apiFetch<{ success: boolean }>(`/capsules/${id}`, { method: 'DELETE' });
        },
    },
};

// ─── Mock API (for dev without a server) ──────────────────────────────────
import mockApi from './mockApi';
const api = USE_MOCK ? mockApi : realApi;
export default api;
