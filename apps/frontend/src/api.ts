import { Capsule } from '@secret-capsule/types';

const API_URL = 'http://localhost:3001';

const api = {
    auth: {
        async signup(data: { email: string; username: string; password: string }) {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Signup failed');
            }
            return await response.json();
        },

        async login(data: { identifier: string; password: string }) {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
            return await response.json();
        },

        async logout() {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Logout failed');
            }
            return await response.json();
        },

        async checkAuth() {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: 'GET',
            });
            if (!response.ok) {
                throw new Error('Not authenticated');
            }
            return await response.json();
        },
    },

    capsules: {
        async getAll() {
            const response = await fetch(`${API_URL}/capsules`, {
                method: 'GET',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch capsules');
            }
            const data = await response.json();
            return { data };
        },

        async create(capsule: Omit<Capsule, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
            const response = await fetch(`${API_URL}/capsules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(capsule),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create capsule');
            }
            const data = await response.json();
            return { data };
        },

        async delete(id: string) {
            const response = await fetch(`${API_URL}/capsules/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete capsule');
            }
            return { data: { success: true } };
        },

        async update(_id: string, _updates: Partial<Capsule>) {
            // Note: Backend update endpoint not fully implemented in this turn, 
            // but following the pattern.
            // Assuming PUT /capsules/:id or similar.
            // For now, let's assume the backend doesn't have a specific update endpoint exposed yet
            // other than maybe overwriting?
            // The DB has `updateCapsule`.
            // The router `capsules.ts` I wrote didn't have PUT/PATCH.
            // I should probably add it if needed, but for now I'll leave it as a placeholder or
            // if the UI uses it, I need to add it to backend.
            // The Dashboard UI doesn't seem to have an "Edit" button, only "Create" and "Delete".
            // So I might skip this or implement it if needed.
            throw new Error("Update not implemented");
        }
    },
};

export default api;
