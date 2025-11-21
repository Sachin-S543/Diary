import { create } from 'zustand';

interface CryptoState {
    key: CryptoKey | null;
    setKey: (key: CryptoKey) => void;
    clearKey: () => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
    key: null,
    setKey: (key) => set({ key }),
    clearKey: () => set({ key: null }),
}));
