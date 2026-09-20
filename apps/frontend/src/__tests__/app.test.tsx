import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../lib/storage', () => ({
    encryptedCache: {
        saveV3VaultHeader: vi.fn(),
        getV3VaultHeader: vi.fn(),
        clearV3VaultHeader: vi.fn(),
        purgeAllLocalCache: vi.fn(),
        getAllEncryptedCapsules: vi.fn().mockResolvedValue([]),
        getEncryptedCapsuleById: vi.fn(),
        putCapsule: vi.fn(),
        putAllCapsules: vi.fn(),
        deleteEncryptedCapsule: vi.fn(),
        queueOfflineMutation: vi.fn(),
        getPendingSyncItems: vi.fn().mockResolvedValue([]),
        removePendingSyncItem: vi.fn(),
        clearPendingSyncQueue: vi.fn(),
    },
    storage: {
        saveCapsule: vi.fn(),
        getCapsules: vi.fn().mockResolvedValue([]),
        deleteCapsule: vi.fn(),
        addToSyncQueue: vi.fn(),
        getSyncQueue: vi.fn().mockResolvedValue([]),
        clearSyncQueue: vi.fn(),
    },
}));

import App from '../App';

describe('App Component', () => {
    it('renders application cleanly', () => {
        const { container } = render(<App />);
        expect(container).toBeDefined();
    });
});
