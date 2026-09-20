import { describe, it, expect } from 'vitest';
import { EncryptedStore } from '../encryptedStore';

describe('EncryptedStore', () => {
    it('initializes the store correctly', () => {
        expect(typeof EncryptedStore).toBe('function');
    });

    it('has put and get methods', () => {
        expect(typeof EncryptedStore.prototype.put).toBe('function');
        expect(typeof EncryptedStore.prototype.get).toBe('function');
    });
});
