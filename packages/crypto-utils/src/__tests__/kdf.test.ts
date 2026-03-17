import { describe, it, expect } from 'vitest';
import { deriveArgon2idKey, deriveKey } from '../kdf';

describe('KDF logic', () => {
    it('generates different keys for different passwords using Argon2id', async () => {
        const password = 'my-secret-password';
        const salt = new Uint8Array(16);
        crypto.getRandomValues(salt);

        const key1 = await deriveArgon2idKey(password, salt);
        const key2 = await deriveArgon2idKey('different-password', salt);

        expect(key1).not.toEqual(key2);
        expect(key1.length).toBe(32);
    });

    it('successfully derives using unified deriveKey function', async () => {
        const salt = new Uint8Array(16);
        crypto.getRandomValues(salt);
        const keyV2 = await deriveKey('password123', salt, 2);
        expect(keyV2.byteLength).toBe(32);
    });
});
