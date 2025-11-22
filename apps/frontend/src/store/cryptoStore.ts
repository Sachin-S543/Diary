import { create } from 'zustand';
import { CapsuleKeys } from '@secret-capsule/crypto-utils';

interface CryptoState {
    // Map of capsuleId -> Keys
    capsuleKeys: Record<string, CapsuleKeys>;
    setCapsuleKeys: (id: string, keys: CapsuleKeys) => void;
    removeCapsuleKeys: (id: string) => void;
    clearAllKeys: () => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
    capsuleKeys: {},
    setCapsuleKeys: (id, keys) => set((state) => ({
        capsuleKeys: { ...state.capsuleKeys, [id]: keys }
    })),
    removeCapsuleKeys: (id) => set((state) => {
        const newKeys = { ...state.capsuleKeys };
        delete newKeys[id];
        return { capsuleKeys: newKeys };
    }),
    clearAllKeys: () => set({ capsuleKeys: {} }),
}));
