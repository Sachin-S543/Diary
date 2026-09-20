import { create } from 'zustand';
import { SafeUser } from '@secret-capsule/types';
import api from '../api';
import { useCryptoStore } from './cryptoStore';
import { encryptedCache } from '../lib/storage';

interface AuthState {
    user: SafeUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: SafeUser) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: (user) => set({ user, isAuthenticated: true }),
    logout: async () => {
        try {
            await api.auth.logout();
        } catch (e) {
            console.error(e);
        }
        useCryptoStore.getState().clearAllKeys();
        try {
            await encryptedCache.purgeAllLocalCache();
        } catch (e) {
            console.error(e);
        }
        set({ user: null, isAuthenticated: false });
    },
    checkAuth: async () => {
        try {
            const { data } = await api.auth.checkAuth();
            set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (e) {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
}));
