import { Capsule, User } from '@secret-capsule/types';

const STORAGE_KEYS = {
    USERS: 'sc_users',
    CAPSULES: 'sc_capsules',
    SESSION: 'sc_session'
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockApi = {
    auth: {
        async signup(data: { email: string; username: string; password: string }) {
            await delay(500);
            const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

            if (users.find(u => u.email === data.email)) {
                throw new Error('Email already exists');
            }
            if (users.find(u => u.username === data.username)) {
                throw new Error('Username already exists');
            }

            const newUser: User = {
                id: crypto.randomUUID(),
                username: data.username,
                email: data.email,
                passwordHash: 'mock_hash', // In local mode we don't really hash for security, just storage
                salt: 'mock_salt',
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

            // Auto login
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newUser));

            return { user: newUser, token: 'mock_token' };
        },

        async login(data: { identifier: string; password: string }) {
            await delay(500);
            const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

            const user = users.find(u => u.email === data.identifier || u.username === data.identifier);

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // In mock mode, we accept any password if user exists, 
            // OR we could store the password (insecurely) to validate.
            // For a demo, let's just allow it if user exists.

            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
            return { user, token: 'mock_token' };
        },

        async logout() {
            await delay(200);
            localStorage.removeItem(STORAGE_KEYS.SESSION);
            return {};
        },

        async checkAuth() {
            await delay(200);
            const session = localStorage.getItem(STORAGE_KEYS.SESSION);
            if (!session) {
                throw new Error('Not authenticated');
            }
            return { user: JSON.parse(session) };
        },
    },

    capsules: {
        async getAll() {
            await delay(500);
            const session = localStorage.getItem(STORAGE_KEYS.SESSION);
            if (!session) throw new Error('Not authenticated');
            const user = JSON.parse(session);

            const allCapsules: Capsule[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CAPSULES) || '[]');
            const userCapsules = allCapsules.filter(c => c.userId === user.id);

            return { data: userCapsules };
        },

        async create(capsuleData: Omit<Capsule, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
            await delay(500);
            const session = localStorage.getItem(STORAGE_KEYS.SESSION);
            if (!session) throw new Error('Not authenticated');
            const user = JSON.parse(session);

            const newCapsule: Capsule = {
                ...capsuleData,
                id: crypto.randomUUID(),
                userId: user.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const allCapsules: Capsule[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CAPSULES) || '[]');
            allCapsules.push(newCapsule);
            localStorage.setItem(STORAGE_KEYS.CAPSULES, JSON.stringify(allCapsules));

            return { data: newCapsule };
        },

        async delete(id: string) {
            await delay(300);
            const session = localStorage.getItem(STORAGE_KEYS.SESSION);
            if (!session) throw new Error('Not authenticated');
            const user = JSON.parse(session);

            let allCapsules: Capsule[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CAPSULES) || '[]');
            const initialLength = allCapsules.length;

            // Only delete if belongs to user
            allCapsules = allCapsules.filter(c => !(c.id === id && c.userId === user.id));

            if (allCapsules.length === initialLength) {
                throw new Error('Capsule not found or access denied');
            }

            localStorage.setItem(STORAGE_KEYS.CAPSULES, JSON.stringify(allCapsules));
            return { data: { success: true } };
        },

        async update(_id: string, _updates: Partial<Capsule>) {
            throw new Error("Update not implemented");
        }
    },
};

export default mockApi;
