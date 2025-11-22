import { Capsule } from '@secret-capsule/types';
import mockApi from './mockApi';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

console.log('API Configuration:', { API_URL, USE_MOCK });

const realApi = {
    auth: {
        async signup(data: { email: string; username: string; password: string }) {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
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
                credentials: 'include',
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
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Logout failed');
            }
            return await response.json();
        },

        async checkAuth() {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: 'GET',
                credentials: 'include',
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
                credentials: 'include',
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
                credentials: 'include',
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
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to delete capsule');
            }
            return { data: { success: true } };
        },

        async update(_id: string, _updates: Partial<Capsule>) {
            throw new Error("Update not implemented");
        }
    },
};

const api = USE_MOCK ? mockApi : realApi;

export default api;
