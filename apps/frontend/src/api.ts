import { clientDb } from './lib/clientDb';
import { DiaryEntry } from '@secret-capsule/types';

// Mock API interface that uses IndexedDB instead of HTTP requests
const api = {
    // Auth endpoints
    auth: {
        async signup(data: { email: string; username: string; password: string }) {
            // Check if user already exists
            const existingEmail = await clientDb.findUserByEmail(data.email);
            if (existingEmail) {
                throw new Error('Email already registered');
            }

            const existingUsername = await clientDb.findUserByUsername(data.username);
            if (existingUsername) {
                throw new Error('Username already taken');
            }

            // Create new user
            const user = {
                id: crypto.randomUUID(),
                email: data.email,
                username: data.username,
                createdAt: new Date().toISOString(),
            };

            await clientDb.createUser(user, data.password);

            // Store auth state in localStorage
            localStorage.setItem('currentUserId', user.id);

            return { data: { user } };
        },

        async login(data: { identifier: string; password: string }) {
            // Find user by email or username
            let user = await clientDb.findUserByEmail(data.identifier);
            if (!user) {
                user = await clientDb.findUserByUsername(data.identifier);
            }

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Verify password
            const isValid = await clientDb.verifyPassword(user.passwordHash, data.password);
            if (!isValid) {
                throw new Error('Invalid credentials');
            }

            // Store auth state in localStorage
            localStorage.setItem('currentUserId', user.id);

            // Remove passwordHash from response
            const { passwordHash: _, ...userWithoutPassword } = user;
            return { data: { user: userWithoutPassword } };
        },

        async logout() {
            localStorage.removeItem('currentUserId');
            return { data: { success: true } };
        },

        async checkAuth() {
            const userId = localStorage.getItem('currentUserId');
            if (!userId) {
                throw new Error('Not authenticated');
            }

            const user = await clientDb.findUserById(userId);
            if (!user) {
                localStorage.removeItem('currentUserId');
                throw new Error('User not found');
            }

            const { passwordHash: _, ...userWithoutPassword } = user;
            return { data: { user: userWithoutPassword } };
        },
    },

    // Entry endpoints
    entries: {
        async getAll() {
            const userId = localStorage.getItem('currentUserId');
            if (!userId) {
                throw new Error('Not authenticated');
            }

            const entries = await clientDb.getEntries(userId);
            return { data: entries };
        },

        async create(entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) {
            const userId = localStorage.getItem('currentUserId');
            if (!userId) {
                throw new Error('Not authenticated');
            }

            const newEntry: DiaryEntry = {
                ...entry,
                id: crypto.randomUUID(),
                userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await clientDb.createEntry(newEntry);
            return { data: newEntry };
        },

        async delete(id: string) {
            await clientDb.deleteEntry(id);
            return { data: { success: true } };
        },

        async update(id: string, updates: Partial<DiaryEntry>) {
            const userId = localStorage.getItem('currentUserId');
            if (!userId) {
                throw new Error('Not authenticated');
            }

            const entries = await clientDb.getEntries(userId);
            const existing = entries.find(e => e.id === id);
            if (!existing) {
                throw new Error('Entry not found');
            }

            const updated: DiaryEntry = {
                ...existing,
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            await clientDb.updateEntry(updated);
            return { data: updated };
        },
    },

    // Helper methods to match axios-like interface
    async get(url: string) {
        if (url === '/entries') {
            return this.entries.getAll();
        }
        throw new Error(`Unknown GET endpoint: ${url}`);
    },

    async post(url: string, data: unknown) {
        if (url === '/auth/signup') {
            return this.auth.signup(data as Parameters<typeof this.auth.signup>[0]);
        }
        if (url === '/auth/login') {
            return this.auth.login(data as Parameters<typeof this.auth.login>[0]);
        }
        if (url === '/auth/logout') {
            return this.auth.logout();
        }
        if (url === '/entries') {
            return this.entries.create(data as Parameters<typeof this.entries.create>[0]);
        }
        throw new Error(`Unknown POST endpoint: ${url}`);
    },
};

export default api;
