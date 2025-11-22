import { describe, it, expect } from 'vitest';
import { deriveCapsuleKeys, encryptCapsule, decryptCapsule, generateSalt } from '@secret-capsule/crypto-utils';

describe('Security System', () => {
    it('should derive keys from a password', async () => {
        const password = 'my-secret-password';
        const salt = generateSalt();
        const keys = await deriveCapsuleKeys(password, salt);

        expect(keys).toBeDefined();
        expect(keys.encKey.algorithm.name).toBe('AES-GCM');
        expect(keys.macKey.algorithm.name).toBe('HMAC');
    });

    it('should encrypt and decrypt data correctly', async () => {
        const password = 'my-secret-password';
        const salt = generateSalt();
        const keys = await deriveCapsuleKeys(password, salt);

        const originalText = 'This is a secret message';
        const encrypted = await encryptCapsule(originalText, keys);

        expect(encrypted.ciphertext).toBeDefined();
        expect(encrypted.iv).toBeDefined();
        expect(encrypted.hmac).toBeDefined();
        expect(encrypted.ciphertext).not.toBe(originalText);

        const decryptedText = await decryptCapsule(encrypted, keys);
        expect(decryptedText).toBe(originalText);
    });

    it('should fail to decrypt with wrong key (HMAC failure)', async () => {
        const password = 'my-secret-password';
        const salt = generateSalt();
        const keys = await deriveCapsuleKeys(password, salt);
        const wrongKeys = await deriveCapsuleKeys('wrong-password', salt);

        const originalText = 'This is a secret message';
        const encrypted = await encryptCapsule(originalText, keys);

        await expect(decryptCapsule(encrypted, wrongKeys)).rejects.toThrow();
    });
});
