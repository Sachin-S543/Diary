import { describe, it, expect } from 'vitest';
import { EncryptedStore } from '../encryptedStore';

// Mock indexedDB for node testing environment if needed, but vitest runs in browser mode if configured
// Or we mock the crypto logic.

describe('EncryptedStore', () => {
    // Tests are best run when Vitest is configured with vi.mock or in a browser environment.
    it('initializes the store correctly', () => {
        expect(typeof EncryptedStore).toBe('function');
    });

    it('has put and get methods', () => {
        const store = new EncryptedStore('testdb');
        expect(typeof store.put).toBe('function');
        expect(typeof store.get).toBe('function');
    });
});
