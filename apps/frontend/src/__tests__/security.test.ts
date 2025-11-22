import { describe, it, expect } from 'vitest';
import { deriveKey, encryptData, decryptData } from '@secret-capsule/crypto-utils';

describe('Security System', () => {
    it('should derive a key from a password', async () => {
        const password = 'my-secret-password';
        const salt = btoa('user-unique-salt');
        const key = await deriveKey(password, salt);

        expect(key).toBeDefined();
        expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('should encrypt and decrypt data correctly', async () => {
        const password = 'my-secret-password';
        const salt = btoa('user-unique-salt');
        const key = await deriveKey(password, salt);

        const originalText = 'This is a secret message';
        const { ciphertext, iv } = await encryptData(originalText, key);

        expect(ciphertext).toBeDefined();
        expect(iv).toBeDefined();
        expect(ciphertext).not.toBe(originalText); // Ensure it's actually encrypted

        const decryptedText = await decryptData(ciphertext, iv, key);
        expect(decryptedText).toBe(originalText);
    });

    it('should fail to decrypt with wrong key', async () => {
        const password = 'my-secret-password';
        const salt = btoa('user-unique-salt');
        const key = await deriveKey(password, salt);

        const wrongKey = await deriveKey('wrong-password', salt);

        const originalText = 'This is a secret message';
        const { ciphertext, iv } = await encryptData(originalText, key);

        await expect(decryptData(ciphertext, iv, wrongKey)).rejects.toThrow();
    });
});
