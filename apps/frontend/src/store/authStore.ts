import { create } from 'zustand';
import { User } from '@secret-capsule/types';
import api from '../api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User) => void;
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
