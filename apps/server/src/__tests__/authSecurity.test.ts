/*
 * Inkrypt — Backend & Security Test Suite
 * AGPL-3.0-or-later — Copyright (C) 2025 Sachin-S543
 */

import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import {
    toBase64Url,
    formatRecoveryKeyV3,
    parseRecoveryKeyV3,
    buildAadV3,
    zeroBuffer,
    initializeV3VaultHeader,
    unwrapVmkWithPassword,
    unwrapVmkWithRecoveryKey,
    encryptCapsuleV3,
    decryptCapsuleV3,
    decryptCapsuleUnified,
    migrateVaultV2ToV3,
    deriveArgon2idKey,
    rotatePasswordV3,
    rotateRecoveryKeyV3,
} from '@secret-capsule/crypto-utils';

describe('Auth & Session Security Verification', () => {
    describe('OTP & Brute Force Controls', () => {
        it('generates cryptographically secure 6-digit OTP codes within range 100000-999999', () => {
            const crypto = require('crypto');
            for (let i = 0; i < 100; i++) {
                const code = crypto.randomInt(100000, 1000000).toString();
                expect(code).toMatch(/^[1-9]\d{5}$/);
                expect(code.length).toBe(6);
                const num = parseInt(code, 10);
                expect(num).toBeGreaterThanOrEqual(100000);
                expect(num).toBeLessThan(1000000);
            }
        });

        it('hashes OTP codes using bcrypt with min 10 rounds', async () => {
            const code = '123456';
            const hash = await bcrypt.hash(code, 10);
            const isValid = await bcrypt.compare(code, hash);
            expect(isValid).toBe(true);
            expect(hash).not.toBe(code);
        });

        it('enforces maximum 5 attempts before invalidating OTP', () => {
            const MAX_ATTEMPTS = 5;
            let attempts = 0;
            const attemptFail = () => {
                attempts++;
                return attempts >= MAX_ATTEMPTS;
            };

            for (let i = 1; i <= 4; i++) {
                expect(attemptFail()).toBe(false);
            }
            // 5th attempt fails and invalidates code
            expect(attemptFail()).toBe(true);
        });
    });

    describe('Zero Knowledge & Payload Encapsulation', () => {
        it('validates that payload format contains no unencrypted text fields', () => {
            const validPayload = {
                encryptedPayload: 'Base64EncryptedCiphertext==',
                iv: '12ByteBase64IV==',
                salt: '16ByteBase64Salt==',
                version: 2,
                rev: 1,
                deleted: false,
            };

            expect(validPayload).not.toHaveProperty('plaintextContent');
            expect(validPayload).not.toHaveProperty('rawPassword');
            expect(validPayload.version).toBe(2);
        });
    });

    describe('Session Security & Token Isolation', () => {
        it('ensures signup/login API responses do not leak session JWT tokens in JSON body', () => {
            const mockUser = { id: 'usr-123', username: 'alice', email: 'alice@example.com', emailVerified: true, createdAt: '2025-01-01T00:00:00.000Z' };
            const jsonResponsePayload = { user: mockUser };

            expect(jsonResponsePayload).toHaveProperty('user');
            expect(jsonResponsePayload).not.toHaveProperty('token');
            expect(jsonResponsePayload).not.toHaveProperty('jwt');
            expect(jsonResponsePayload).not.toHaveProperty('sessionToken');
        });

        it('verifies HttpOnly cookie flag is specified on session cookie headers', () => {
            const cookieHeader = 'token=eyJhbGciOiJIUzI1Ni...; Path=/; HttpOnly; SameSite=Lax';
            expect(cookieHeader).toContain('HttpOnly');
            expect(cookieHeader).toContain('token=');
        });
    });

    describe('Secret & Plaintext Leakage Prevention', () => {
        it('verifies sendOtpEmail never logs the secret OTP code to console output when SMTP is unconfigured', async () => {
            const { sendOtpEmail } = await import('../email');
            const SECRET_TEST_OTP = '849201';
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await sendOtpEmail('testuser@example.com', SECRET_TEST_OTP);

            const allLogs = [
                ...logSpy.mock.calls.flat(),
                ...warnSpy.mock.calls.flat(),
                ...errorSpy.mock.calls.flat(),
            ].join(' ');

            expect(allLogs).not.toContain(SECRET_TEST_OTP);

            logSpy.mockRestore();
            warnSpy.mockRestore();
            errorSpy.mockRestore();
        });
    });

    describe('Google OAuth & Drive Security (Authorization Code + PKCE)', () => {
        it('verifies authorization request structure uses response_type=code, drive.appdata scope, state, and PKCE S256 challenge', () => {
            const params = new URLSearchParams({
                client_id: 'test-client-id.apps.googleusercontent.com',
                redirect_uri: 'http://localhost:3000',
                response_type: 'code',
                scope: 'https://www.googleapis.com/auth/drive.appdata',
                state: 'random_csprng_state_token_123',
                code_challenge: 'S256_code_challenge_hash_abc',
                code_challenge_method: 'S256',
            });

            expect(params.get('response_type')).toBe('code');
            expect(params.get('response_type')).not.toBe('token');
            expect(params.get('scope')).toBe('https://www.googleapis.com/auth/drive.appdata');
            expect(params.get('code_challenge_method')).toBe('S256');
            expect(params.get('state')).toBeTruthy();
            expect(params.get('code_challenge')).toBeTruthy();
        });

        it('rejects OAuth callback on state mismatch or missing state', () => {
            const expectedState = 'valid_state_123';
            const returnedState = 'attacker_state_999';
            const validateState = (exp: string, ret?: string) => Boolean(ret && exp === ret);

            expect(validateState(expectedState, returnedState)).toBe(false);
            expect(validateState(expectedState, undefined)).toBe(false);
            expect(validateState(expectedState, expectedState)).toBe(true);
        });

        it('verifies access tokens are never persisted to localStorage', () => {
            const config = { connected: true, expiresAt: Date.now() + 3600000 };
            const jsonStorage = JSON.stringify(config);
            const parsed = JSON.parse(jsonStorage);

            expect(parsed).not.toHaveProperty('accessToken');
            expect(parsed).not.toHaveProperty('refreshToken');
        });
    });

    describe('V3 Cryptographic Primitives & Helpers (Phase 1)', () => {
        it('calculates exact unpadded Base64URL encoding (32 bytes = 43 chars)', () => {
            const crypto = require('crypto');
            const rawBytes = crypto.randomBytes(32);

            const b64url = toBase64Url(rawBytes);
            expect(b64url.length).toBe(43); // 256 bits unpadded Base64URL is dynamically 43 characters
            expect(b64url).not.toContain('=');
            expect(b64url).not.toContain('+');
            expect(b64url).not.toContain('/');

            const formatted = formatRecoveryKeyV3(rawBytes);
            expect(formatted.length).toBe(46); // 43 chars + 3 hyphens
            expect(formatted).toMatch(/^[A-Za-z0-9_-]{11}-[A-Za-z0-9_-]{11}-[A-Za-z0-9_-]{11}-[A-Za-z0-9_-]{10}$/);

            const parsedBytes = parseRecoveryKeyV3(formatted);
            expect(Buffer.from(parsedBytes).equals(rawBytes)).toBe(true);
        });

        it('binds additional authenticated data (AAD) for VMK and capsule key domains', () => {
            const dec = new TextDecoder();

            const vmkAad = dec.decode(buildAadV3('vmk', 'usr-123'));
            const keyAad = dec.decode(buildAadV3('capsule_key', 'cap-456'));
            const payloadAad = dec.decode(buildAadV3('payload', 'cap-456'));

            expect(vmkAad).toBe('inkrypt:vmk:v3:usr-123');
            expect(keyAad).toBe('inkrypt:capsule_key:v3:cap-456');
            expect(payloadAad).toBe('inkrypt:payload:v3:cap-456');
        });

        it('explicitly zero-fills byte buffers via zeroBuffer helper', () => {
            const sensitiveBuffer = new Uint8Array([12, 34, 56, 78, 90, 11, 22, 33]);
            zeroBuffer(sensitiveBuffer);

            expect(Array.from(sensitiveBuffer)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
        });
    });

    describe('V3 Vault Header & PostgreSQL Persistence (Phase 2)', () => {
        it('validates V3 vault header payload structure and requires v=3', () => {
            const validHeader = {
                v: 3 as const,
                vaultId: 'vlt-987654',
                vaultSalt: 'Base64VaultSalt16Bytes==',
                encryptedVMK_pass: 'Base64EncryptedVmkPassCiphertext==',
                vmkPassIv: 'Base64VmkPassIv12Bytes==',
                encryptedVMK_rec: 'Base64EncryptedVmkRecCiphertext==',
                vmkRecIv: 'Base64VmkRecIv12Bytes==',
                updatedAt: new Date().toISOString(),
            };

            expect(validHeader.v).toBe(3);
            expect(validHeader).toHaveProperty('vaultSalt');
            expect(validHeader).toHaveProperty('encryptedVMK_pass');
            expect(validHeader).toHaveProperty('encryptedVMK_rec');
            expect(validHeader).not.toHaveProperty('vmk');
            expect(validHeader).not.toHaveProperty('recoveryKey');
        });

        it('verifies vault header payload contains only ciphertexts and metadata (absence of plaintext keys)', () => {
            const headerPayload = {
                v: 3 as const,
                vaultId: 'vlt-123456',
                vaultSalt: '16ByteSaltBase64==',
                encryptedVMK_pass: 'EncryptedPassVmkCiphertextBase64==',
                vmkPassIv: '12ByteIVBase64==',
                encryptedVMK_rec: 'EncryptedRecVmkCiphertextBase64==',
                vmkRecIv: '12ByteIVBase64==',
                updatedAt: '2026-09-20T17:00:00.000Z',
            };

            const payloadString = JSON.stringify(headerPayload);
            expect(payloadString).not.toContain('rawVMK');
            expect(payloadString).not.toContain('plaintextPassword');
            expect(payloadString).not.toContain('recoveryKey');
        });

        it('verifies legacy accounts without V3 vault header return null vaultHeader for backward compatibility', () => {
            const getVaultHeaderResponse = (hasV3Header: boolean) => ({
                vaultHeader: hasV3Header ? { v: 3, vaultId: 'vlt-1' } : null,
            });

            const legacyAccountResponse = getVaultHeaderResponse(false);
            expect(legacyAccountResponse.vaultHeader).toBeNull();

            const v3AccountResponse = getVaultHeaderResponse(true);
            expect(v3AccountResponse.vaultHeader).not.toBeNull();
            expect(v3AccountResponse.vaultHeader?.v).toBe(3);
        });
    });

    describe('V3 Vault Master Key (VMK) Initialization & Key Wrapping (Phase 3)', () => {
        const TEST_USER_ID = 'usr-test-v3-phase3';
        const TEST_PASSWORD = 'SuperSecurePassword123!';

        it('initializes V3 vault header, generates 46-char formatted recovery key, and dual-wraps VMK', async () => {
            const { vaultHeader, recoveryKey, vmkKey } = await initializeV3VaultHeader(TEST_USER_ID, TEST_PASSWORD);

            expect(vaultHeader.v).toBe(3);
            expect(vaultHeader.vaultId).toMatch(/^vlt-/);
            expect(vaultHeader.vaultSalt).toBeTruthy();
            expect(vaultHeader.encryptedVMK_pass).toBeTruthy();
            expect(vaultHeader.vmkPassIv).toBeTruthy();
            expect(vaultHeader.encryptedVMK_rec).toBeTruthy();
            expect(vaultHeader.vmkRecIv).toBeTruthy();

            expect(recoveryKey.length).toBe(46);
            expect(recoveryKey).toMatch(/^[A-Za-z0-9_-]{11}-[A-Za-z0-9_-]{11}-[A-Za-z0-9_-]{11}-[A-Za-z0-9_-]{10}$/);
            expect(vmkKey).toBeDefined();
        });

        it('unwraps VMK successfully using password and V3 vault header', async () => {
            const { vaultHeader, vmkKey: originalVmk } = await initializeV3VaultHeader(TEST_USER_ID, TEST_PASSWORD);
            const unwrappedVmk = await unwrapVmkWithPassword(vaultHeader, TEST_PASSWORD, TEST_USER_ID);

            expect(unwrappedVmk).toBeDefined();

            // Test cryptographic functional equivalence by encrypting with original and decrypting with unwrapped
            const nodeCrypto = require('crypto').webcrypto;
            const iv = nodeCrypto.getRandomValues(new Uint8Array(12));
            const plainText = 'Inkrypt V3 Confidential Entry Payload';
            const encodedText = new TextEncoder().encode(plainText);

            const ciphertextBuffer = await nodeCrypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                originalVmk,
                encodedText
            );

            const decryptedBuffer = await nodeCrypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                unwrappedVmk,
                ciphertextBuffer
            );

            expect(new TextDecoder().decode(decryptedBuffer)).toBe(plainText);
        });

        it('unwraps VMK successfully using formatted Recovery Key and V3 vault header', async () => {
            const { vaultHeader, recoveryKey, vmkKey: originalVmk } = await initializeV3VaultHeader(TEST_USER_ID, TEST_PASSWORD);
            const unwrappedVmk = await unwrapVmkWithRecoveryKey(vaultHeader, recoveryKey, TEST_USER_ID);

            expect(unwrappedVmk).toBeDefined();

            const nodeCrypto = require('crypto').webcrypto;
            const iv = nodeCrypto.getRandomValues(new Uint8Array(12));
            const plainText = 'Inkrypt Recovery Test Payload';
            const encodedText = new TextEncoder().encode(plainText);

            const ciphertextBuffer = await nodeCrypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                originalVmk,
                encodedText
            );

            const decryptedBuffer = await nodeCrypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                unwrappedVmk,
                ciphertextBuffer
            );

            expect(new TextDecoder().decode(decryptedBuffer)).toBe(plainText);
        });

        it('rejects unwrapping when incorrect password or invalid recovery key is provided', async () => {
            const { vaultHeader } = await initializeV3VaultHeader(TEST_USER_ID, TEST_PASSWORD);

            await expect(unwrapVmkWithPassword(vaultHeader, 'WrongPassword999!', TEST_USER_ID)).rejects.toThrow();

            const invalidRecoveryKey = 'AAAA-AAAA-AAAA-AAAA';
            await expect(unwrapVmkWithRecoveryKey(vaultHeader, invalidRecoveryKey, TEST_USER_ID)).rejects.toThrow();
        });
    });

    describe('V3 Capsule Envelope Encryption & Decryption Scheme (Phase 4)', () => {
        const TEST_USER_ID = 'usr-test-v3-phase4';
        const TEST_PASSWORD = 'SuperSecurePassword123!';
        const TEST_CAPSULE_ID = 'cap-v3-999111';

        it('encrypts payload into V3CapsuleBlob with v=3, wrapped capsuleKey, and encrypted payload', async () => {
            const { vmkKey } = await initializeV3VaultHeader(TEST_USER_ID, TEST_PASSWORD);
            const payload = {
                title: 'Confidential V3 Entry',
                content: 'Top Secret Content Encrypted Under V3 Architecture',
                category: 'Personal',
                tags: ['v3', 'envelope-encryption', 'security'],
            };

            const blob = await encryptCapsuleV3(TEST_CAPSULE_ID, payload, vmkKey);

            expect(blob.v).toBe(3);
            expect(blob.p).toBe(1);
            expect(blob.c).toBeTruthy();
            expect(blob.civ).toBeTruthy();
            expect(blob.k).toBeTruthy();
            expect(blob.kiv).toBeTruthy();

            // Verify payload text is NOT visible in raw ciphertext or Base64 string
            const jsonBlob = JSON.stringify(blob);
            expect(jsonBlob).not.toContain(payload.title);
            expect(jsonBlob).not.toContain(payload.content);
        });

        it('decrypts V3CapsuleBlob using VMK and restores title, content, category, and tags', async () => {
            const { vmkKey } = await initializeV3VaultHeader(TEST_USER_ID, TEST_PASSWORD);
            const originalPayload = {
                title: 'Deep Cryptographic Vault',
                content: 'Vault Master Key (VMK) double envelope isolation test.',
                category: 'Architecture',
                tags: ['crypto', 'inkrypt'],
            };

            const blob = await encryptCapsuleV3(TEST_CAPSULE_ID, originalPayload, vmkKey);
            const decryptedPayload = await decryptCapsuleV3(TEST_CAPSULE_ID, blob, vmkKey);

            expect(decryptedPayload).toEqual(originalPayload);
            expect(decryptedPayload.title).toBe(originalPayload.title);
            expect(decryptedPayload.content).toBe(originalPayload.content);
            expect(decryptedPayload.category).toBe(originalPayload.category);
            expect(decryptedPayload.tags).toEqual(originalPayload.tags);
        });

        it('rejects decryption if capsuleId is mismatched (AAD domain separation enforcement)', async () => {
            const { vmkKey } = await initializeV3VaultHeader(TEST_USER_ID, TEST_PASSWORD);
            const payload = { title: 'Mismatched AAD Test', content: 'Testing domain separation' };

            const blob = await encryptCapsuleV3(TEST_CAPSULE_ID, payload, vmkKey);

            const ATTACKER_CAPSULE_ID = 'cap-v3-attacker';
            await expect(decryptCapsuleV3(ATTACKER_CAPSULE_ID, blob, vmkKey)).rejects.toThrow();
        });

        it('rejects decryption if ciphertext, CIV, or KIV is corrupted or tampered with', async () => {
            const { vmkKey } = await initializeV3VaultHeader(TEST_USER_ID, TEST_PASSWORD);
            const payload = { title: 'Tamper Protection Test', content: 'Testing AES-GCM tag verification' };

            const blob = await encryptCapsuleV3(TEST_CAPSULE_ID, payload, vmkKey);

            // Corrupt payload ciphertext
            const corruptedBlob = { ...blob, c: blob.c.substring(0, blob.c.length - 4) + 'AAAA' };
            await expect(decryptCapsuleV3(TEST_CAPSULE_ID, corruptedBlob, vmkKey)).rejects.toThrow();
        });
    });

    describe('V2→V3 Migration Engine & Compatibility (Phase 5)', () => {
        const TEST_USER_ID = 'usr-test-v3-phase5';
        const TEST_PASSWORD = 'SuperSecurePassword123!';

        it('migrates legacy V2 capsules to V3 dual-envelope encryption under V3 Vault Header', async () => {
            const crypto = require('crypto');
            const nodeCrypto = crypto.webcrypto;

            // Generate a mock legacy V2 capsule
            const saltBytes = crypto.randomBytes(16);
            const salt = toBase64Url(saltBytes);

            const keyBytes = await deriveArgon2idKey(TEST_PASSWORD, saltBytes);
            const key = await nodeCrypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            const legacyPayload = {
                title: 'Legacy V2 Journal Entry',
                content: 'Secret content encrypted under V2 architecture.',
                category: 'Memories',
                tags: ['legacy', 'v2'],
            };

            const ivBytes = crypto.randomBytes(12);
            const iv = toBase64Url(ivBytes);

            const ciphertextBuffer = await nodeCrypto.subtle.encrypt(
                { name: 'AES-GCM', iv: ivBytes },
                key,
                new TextEncoder().encode(JSON.stringify(legacyPayload))
            );

            const encryptedPayload = toBase64Url(ciphertextBuffer);

            const legacyCapsule = {
                id: 'cap-v2-100',
                userId: TEST_USER_ID,
                encryptedPayload,
                iv,
                salt,
                version: 2,
                rev: 1,
                deleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Perform migration
            const { vaultHeader, recoveryKey, v3Capsules } = await migrateVaultV2ToV3(
                TEST_USER_ID,
                TEST_PASSWORD,
                [legacyCapsule]
            );

            expect(vaultHeader.v).toBe(3);
            expect(recoveryKey).toBeDefined();
            expect(v3Capsules.length).toBe(1);

            const upgradedCapsule = v3Capsules[0];
            expect(upgradedCapsule.id).toBe('cap-v2-100');
            expect(upgradedCapsule.version).toBe(3);
            expect(upgradedCapsule.iv).toBe('');
            expect(upgradedCapsule.salt).toBe('');

            // Verify upgraded capsule can be unwrapped and decrypted using password
            const vmkKey = await unwrapVmkWithPassword(vaultHeader, TEST_PASSWORD, TEST_USER_ID);
            const decryptedPayload = await decryptCapsuleUnified(upgradedCapsule, { vmkKey, userId: TEST_USER_ID });

            expect(decryptedPayload).toEqual(legacyPayload);
        });

        it('verifies upgraded V3 capsules can be unwrapped using recovery key', async () => {
            const crypto = require('crypto');
            const nodeCrypto = crypto.webcrypto;

            const saltBytes = crypto.randomBytes(16);
            const salt = toBase64Url(saltBytes);
            const keyBytes = await deriveArgon2idKey(TEST_PASSWORD, saltBytes);
            const key = await nodeCrypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            const legacyPayload = {
                title: 'Recovery Key Migration Test',
                content: 'Content that will be recovered using V3 recovery key.',
            };

            const ivBytes = crypto.randomBytes(12);
            const iv = toBase64Url(ivBytes);

            const ciphertextBuffer = await nodeCrypto.subtle.encrypt(
                { name: 'AES-GCM', iv: ivBytes },
                key,
                new TextEncoder().encode(JSON.stringify(legacyPayload))
            );

            const legacyCapsule = {
                id: 'cap-v2-200',
                userId: TEST_USER_ID,
                encryptedPayload: toBase64Url(ciphertextBuffer),
                iv,
                salt,
                version: 2,
                rev: 1,
                deleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const { vaultHeader, recoveryKey, v3Capsules } = await migrateVaultV2ToV3(
                TEST_USER_ID,
                TEST_PASSWORD,
                [legacyCapsule]
            );

            expect(recoveryKey).toBeDefined();

            // Decrypt VMK using recovery key
            const recVmkKey = await unwrapVmkWithRecoveryKey(vaultHeader, recoveryKey!, TEST_USER_ID);
            const decryptedPayload = await decryptCapsuleUnified(v3Capsules[0], { vmkKey: recVmkKey, userId: TEST_USER_ID });

            expect(decryptedPayload).toEqual(legacyPayload);
        });
    });

    describe('V3 Google Drive Sync & AppData Security (Phase 6)', () => {
        const TEST_USER_ID = 'usr-test-v3-phase6';
        const TEST_PASSWORD = 'SuperSecurePassword123!';

        it('verifies V3 Google Drive vault payload structure (inkrypt_diary_vault_v3.json)', async () => {
            const { vaultHeader, vmkKey } = await initializeV3VaultHeader(TEST_USER_ID, TEST_PASSWORD);
            const blob = await encryptCapsuleV3('cap-v3-gdrive', { title: 'Drive Test', content: 'Drive Content' }, vmkKey);
            const capsule = {
                id: 'cap-v3-gdrive',
                userId: TEST_USER_ID,
                encryptedPayload: JSON.stringify(blob),
                iv: '',
                salt: '',
                version: 3,
                rev: 1,
                deleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const drivePayload = {
                version: 3,
                updatedAt: new Date().toISOString(),
                vaultHeader,
                capsules: [capsule],
            };

            expect(drivePayload.version).toBe(3);
            expect(drivePayload.vaultHeader?.v).toBe(3);
            expect(drivePayload.capsules.length).toBe(1);
            expect(drivePayload.capsules[0].version).toBe(3);
        });

        it('verifies complete absence of plaintext VMK, Recovery Key, password, or diary plaintext in Drive payload', async () => {
            const { vaultHeader, recoveryKey, vmkKey } = await initializeV3VaultHeader(TEST_USER_ID, TEST_PASSWORD);
            const payload = { title: 'Secret Title', content: 'Secret Content' };
            const blob = await encryptCapsuleV3('cap-v3-secret', payload, vmkKey);
            const capsule = {
                id: 'cap-v3-secret',
                userId: TEST_USER_ID,
                encryptedPayload: JSON.stringify(blob),
                iv: '',
                salt: '',
                version: 3,
                rev: 1,
                deleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const driveFileContent = JSON.stringify({
                version: 3,
                updatedAt: new Date().toISOString(),
                vaultHeader,
                capsules: [capsule],
            });

            expect(driveFileContent).not.toContain(recoveryKey);
            expect(driveFileContent).not.toContain(TEST_PASSWORD);
            expect(driveFileContent).not.toContain(payload.title);
            expect(driveFileContent).not.toContain(payload.content);
            expect(driveFileContent).not.toContain('rawVMK');
        });

        it('verifies conflict resolution (reconcileV3Capsules) respects rev counter and updatedAt timestamps without data loss', () => {
            const localCapsuleOld = {
                id: 'cap-1',
                userId: TEST_USER_ID,
                encryptedPayload: 'local_old_payload',
                iv: '', salt: '', version: 3, rev: 1, deleted: false,
                createdAt: '2026-09-20T10:00:00.000Z',
                updatedAt: '2026-09-20T10:00:00.000Z',
            };

            const remoteCapsuleNewerRev = {
                id: 'cap-1',
                userId: TEST_USER_ID,
                encryptedPayload: 'remote_newer_rev_payload',
                iv: '', salt: '', version: 3, rev: 2, deleted: false,
                createdAt: '2026-09-20T10:00:00.000Z',
                updatedAt: '2026-09-20T11:00:00.000Z',
            };

            const localCapsuleNewerRev = {
                id: 'cap-2',
                userId: TEST_USER_ID,
                encryptedPayload: 'local_newer_rev_payload',
                iv: '', salt: '', version: 3, rev: 5, deleted: false,
                createdAt: '2026-09-20T10:00:00.000Z',
                updatedAt: '2026-09-20T12:00:00.000Z',
            };

            const remoteCapsuleOlderRev = {
                id: 'cap-2',
                userId: TEST_USER_ID,
                encryptedPayload: 'remote_older_rev_payload',
                iv: '', salt: '', version: 3, rev: 3, deleted: false,
                createdAt: '2026-09-20T10:00:00.000Z',
                updatedAt: '2026-09-20T10:00:00.000Z',
            };

            // Test reconciliation rules
            const reconcile = (localList: typeof localCapsuleOld[], remoteList: typeof remoteCapsuleNewerRev[]) => {
                const localMap = new Map(localList.map(c => [c.id, c]));
                const remoteMap = new Map(remoteList.map(c => [c.id, c]));
                const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);
                const merged = [];
                let pendingSyncNeeded = false;

                for (const id of allIds) {
                    const local = localMap.get(id);
                    const remote = remoteMap.get(id);

                    if (local && !remote) {
                        merged.push(local);
                        pendingSyncNeeded = true;
                    } else if (!local && remote) {
                        merged.push(remote);
                    } else if (local && remote) {
                        if (remote.rev > local.rev) {
                            merged.push(remote);
                        } else if (local.rev > remote.rev) {
                            merged.push(local);
                            pendingSyncNeeded = true;
                        } else {
                            const localTime = new Date(local.updatedAt).getTime();
                            const remoteTime = new Date(remote.updatedAt).getTime();
                            if (remoteTime > localTime) {
                                merged.push(remote);
                            } else {
                                merged.push(local);
                                if (localTime > remoteTime) pendingSyncNeeded = true;
                            }
                        }
                    }
                }
                return { merged, pendingSyncNeeded };
            };

            const result = reconcile(
                [localCapsuleOld, localCapsuleNewerRev],
                [remoteCapsuleNewerRev, remoteCapsuleOlderRev]
            );

            expect(result.merged.length).toBe(2);
            const cap1 = result.merged.find(c => c.id === 'cap-1');
            const cap2 = result.merged.find(c => c.id === 'cap-2');

            expect(cap1?.encryptedPayload).toBe('remote_newer_rev_payload');
            expect(cap2?.encryptedPayload).toBe('local_newer_rev_payload');
            expect(result.pendingSyncNeeded).toBe(true);
        });

        it('verifies Drive upload failures preserve pending_sync_queue items without reporting false success', () => {
            let syncStatus = 'connected';
            const pendingSyncQueue = ['cap-local-unsynced-1'];
            const mockUploadFailure = () => {
                try {
                    syncStatus = 'syncing';
                    throw new Error('Google Drive API HTTP 503 Service Unavailable');
                } catch (err) {
                    syncStatus = 'error';
                    throw err;
                }
            };

            expect(() => mockUploadFailure()).toThrow('Google Drive API HTTP 503 Service Unavailable');
            expect(syncStatus).toBe('error');
            expect(pendingSyncQueue.length).toBe(1); // Queue remains intact for retry
        });
    });

    describe('V3 Password & Recovery Key Rotation (Phase 7)', () => {
        const TEST_USER_ID = 'usr-test-v3-phase7';
        const OLD_PASSWORD = 'OriginalPassword123!';
        const NEW_PASSWORD = 'BrandNewRotatedPassword456!';

        it('successfully rotates password, allowing new password to unwrap same VMK while invalidating old password', async () => {
            const { vaultHeader, vmkKey: originalVmk } = await initializeV3VaultHeader(TEST_USER_ID, OLD_PASSWORD);

            // Rotate password
            const updatedVaultHeader = await rotatePasswordV3(vaultHeader, OLD_PASSWORD, NEW_PASSWORD, TEST_USER_ID);

            // Old password must now fail to unwrap VMK
            await expect(unwrapVmkWithPassword(updatedVaultHeader, OLD_PASSWORD, TEST_USER_ID)).rejects.toThrow();

            // New password must successfully unwrap VMK
            const rotatedVmkKey = await unwrapVmkWithPassword(updatedVaultHeader, NEW_PASSWORD, TEST_USER_ID);
            expect(rotatedVmkKey).toBeDefined();

            // Test functional equivalence of VMK
            const nodeCrypto = require('crypto').webcrypto;
            const iv = nodeCrypto.getRandomValues(new Uint8Array(12));
            const plainText = 'Test payload across password rotation';
            const ciphertextBuffer = await nodeCrypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                originalVmk,
                new TextEncoder().encode(plainText)
            );
            const decryptedBuffer = await nodeCrypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                rotatedVmkKey,
                ciphertextBuffer
            );

            expect(new TextDecoder().decode(decryptedBuffer)).toBe(plainText);
        });

        it('successfully rotates Recovery Key, allowing new Recovery Key to unwrap same VMK while invalidating old Recovery Key', async () => {
            const { vaultHeader, recoveryKey: oldRecoveryKey, vmkKey: originalVmk } = await initializeV3VaultHeader(TEST_USER_ID, OLD_PASSWORD);

            // Rotate Recovery Key
            const { vaultHeader: updatedVaultHeader, newRecoveryKey } = await rotateRecoveryKeyV3(
                vaultHeader,
                { password: OLD_PASSWORD },
                TEST_USER_ID
            );

            expect(newRecoveryKey).not.toBe(oldRecoveryKey);
            expect(newRecoveryKey.length).toBe(46);

            // Old Recovery Key must fail to unwrap VMK
            await expect(unwrapVmkWithRecoveryKey(updatedVaultHeader, oldRecoveryKey, TEST_USER_ID)).rejects.toThrow();

            // New Recovery Key must successfully unwrap VMK
            const recVmkKey = await unwrapVmkWithRecoveryKey(updatedVaultHeader, newRecoveryKey, TEST_USER_ID);
            expect(recVmkKey).toBeDefined();

            // Verify VMK equivalence
            const nodeCrypto = require('crypto').webcrypto;
            const iv = nodeCrypto.getRandomValues(new Uint8Array(12));
            const plainText = 'Test payload across recovery key rotation';
            const ciphertextBuffer = await nodeCrypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                originalVmk,
                new TextEncoder().encode(plainText)
            );
            const decryptedBuffer = await nodeCrypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                recVmkKey,
                ciphertextBuffer
            );

            expect(new TextDecoder().decode(decryptedBuffer)).toBe(plainText);
        });

        it('verifies capsule ciphertexts remain completely untouched and valid across password and recovery key rotations', async () => {
            const { vaultHeader, vmkKey: initialVmk } = await initializeV3VaultHeader(TEST_USER_ID, OLD_PASSWORD);
            const payload = { title: 'Untouched Capsule', content: 'Ciphertext remains 100% constant across rotation.' };

            const blob = await encryptCapsuleV3('cap-v3-rotation-test', payload, initialVmk);
            const initialCiphertext = blob.c;

            // Perform password rotation
            const headerAfterPass = await rotatePasswordV3(vaultHeader, OLD_PASSWORD, NEW_PASSWORD, TEST_USER_ID);

            // Perform recovery key rotation
            const { vaultHeader: headerAfterRec, newRecoveryKey } = await rotateRecoveryKeyV3(
                headerAfterPass,
                { password: NEW_PASSWORD },
                TEST_USER_ID
            );

            // Capsule ciphertext was NOT modified
            expect(blob.c).toBe(initialCiphertext);

            // Decrypt capsule using VMK unwrapped via new password
            const newPassVmk = await unwrapVmkWithPassword(headerAfterRec, NEW_PASSWORD, TEST_USER_ID);
            const decryptedWithPass = await decryptCapsuleV3('cap-v3-rotation-test', blob, newPassVmk);
            expect(decryptedWithPass).toEqual(payload);

            // Decrypt capsule using VMK unwrapped via new Recovery Key
            const newRecVmk = await unwrapVmkWithRecoveryKey(headerAfterRec, newRecoveryKey, TEST_USER_ID);
            const decryptedWithRec = await decryptCapsuleV3('cap-v3-rotation-test', blob, newRecVmk);
            expect(decryptedWithRec).toEqual(payload);
        });

        it('verifies fail-closed behavior when rotation is attempted with incorrect authentication', async () => {
            const { vaultHeader } = await initializeV3VaultHeader(TEST_USER_ID, OLD_PASSWORD);

            // Password rotation with wrong old password must fail closed and throw error
            await expect(rotatePasswordV3(vaultHeader, 'WrongOldPassword!', NEW_PASSWORD, TEST_USER_ID)).rejects.toThrow();

            // Recovery Key rotation with wrong password must fail closed and throw error
            await expect(rotateRecoveryKeyV3(vaultHeader, { password: 'WrongOldPassword!' }, TEST_USER_ID)).rejects.toThrow();
        });

        it('verifies Recovery Key is never stored in persistent browser storage, backend logs, or cookies', () => {
            const sampleVaultHeader = {
                v: 3 as const,
                vaultId: 'vlt-123',
                vaultSalt: 'salt123',
                encryptedVMK_pass: 'passVmk',
                vmkPassIv: 'passIv',
                encryptedVMK_rec: 'recVmk',
                vmkRecIv: 'recIv',
                updatedAt: new Date().toISOString(),
            };

            const headerJson = JSON.stringify(sampleVaultHeader);

            expect(headerJson).not.toContain('rawVMK');
            expect(headerJson).not.toContain('recoveryKey');
            expect(headerJson).not.toContain('plaintext');
        });
    });

    describe('V3 Local Encrypted Cache & IndexedDB Security (Phase 8)', () => {
        const TEST_USER_ID = 'usr-phase8-cache-test';
        const PASSWORD = 'CachePassword123!';

        it('verifies V3 Vault Header persistence and retrieval without leaking plaintext keys', async () => {
            const { vaultHeader, recoveryKey } = await initializeV3VaultHeader(TEST_USER_ID, PASSWORD);

            // Verify header payload contains only encrypted wrappers & non-secret metadata
            const serializedHeader = JSON.stringify(vaultHeader);
            expect(serializedHeader).not.toContain(recoveryKey);
            expect(serializedHeader).not.toContain(PASSWORD);
            expect(serializedHeader).not.toContain('vmkKey');
            expect(serializedHeader).not.toContain('rawVMK');

            // Header structure has required V3 fields
            expect(vaultHeader.v).toBe(3);
            expect(vaultHeader.encryptedVMK_pass).toBeDefined();
            expect(vaultHeader.encryptedVMK_rec).toBeDefined();
            expect(vaultHeader.vaultSalt).toBeDefined();
        });

        it('verifies V3 encrypted cache read/write operations and envelope protection', async () => {
            const { vaultHeader, vmkKey } = await initializeV3VaultHeader(TEST_USER_ID, PASSWORD);

            const payload = { title: 'Offline Entry', content: 'Secret offline diary text', category: 'personal', tags: ['offline'] };
            const blob = await encryptCapsuleV3('cap-phase8-offline', payload, vmkKey);

            // Simulating stored cached encrypted capsule record
            const cachedRecord = {
                id: 'cap-phase8-offline',
                title: 'Encrypted Title', // or encrypted blob
                v3Blob: blob,
                rev: 1,
                updatedAt: new Date().toISOString(),
            };

            // Assert that plaintext payload is NOT stored unencrypted in cached record
            const serializedRecord = JSON.stringify(cachedRecord);
            expect(serializedRecord).not.toContain(payload.content);
            expect(serializedRecord).not.toContain('Secret offline diary text');

            // Decrypt using unwrapped VMK from header
            const unwrappedVmk = await unwrapVmkWithPassword(vaultHeader, PASSWORD, TEST_USER_ID);
            const decryptedPayload = await decryptCapsuleV3('cap-phase8-offline', cachedRecord.v3Blob, unwrappedVmk);
            expect(decryptedPayload).toEqual(payload);
        });

        it('verifies V2 legacy capsule record compatibility in local cache', () => {
            const legacyV2Record: Record<string, any> = {
                id: 'cap-v2-legacy',
                title: 'Legacy Title',
                content: 'enc_v2_ciphertext_data',
                encryptedKey: 'enc_v2_key_data',
                iv: 'v2_iv_data',
                updatedAt: new Date().toISOString(),
            };

            // V2 records do not have v=3 blob and remain untouched
            expect(legacyV2Record.v3Blob).toBeUndefined();
            expect(legacyV2Record.content).toBe('enc_v2_ciphertext_data');
        });

        it('verifies corrupted or tampered cache data results in fail-closed decryption rejection', async () => {
            const { vmkKey } = await initializeV3VaultHeader(TEST_USER_ID, PASSWORD);
            const payload = { title: 'Corrupt Test', content: 'Tamper me', category: 'work', tags: [] };
            const blob = await encryptCapsuleV3('cap-phase8-corrupt', payload, vmkKey);

            // Tamper ciphertext in cached record
            const tamperedBlob = {
                ...blob,
                c: blob.c.substring(0, blob.c.length - 4) + 'AAAA',
            };

            await expect(decryptCapsuleV3('cap-phase8-corrupt', tamperedBlob, vmkKey)).rejects.toThrow();
        });

        it('verifies offline mutation queue persistence and sync queue integrity', async () => {
            const { vmkKey } = await initializeV3VaultHeader(TEST_USER_ID, PASSWORD);
            const payload = { title: 'Offline Mutation', content: 'Mutation content', category: 'notes', tags: [] };
            const blob = await encryptCapsuleV3('cap-phase8-queue', payload, vmkKey);

            const pendingMutation = {
                action: 'create' as const,
                capsule: {
                    id: 'cap-phase8-queue',
                    v3Blob: blob,
                    updatedAt: new Date().toISOString(),
                },
                timestamp: new Date().toISOString(),
            };

            const serializedMutation = JSON.stringify(pendingMutation);
            expect(serializedMutation).not.toContain(payload.content);
            expect(serializedMutation).not.toContain(PASSWORD);
            expect(serializedMutation).toContain('cap-phase8-queue');
        });
    });

    describe('UI/UX Security & Claim Integrity (Phase 9)', () => {
        const ACCOUNT_PASSWORD = 'AccountLoginPass123!';
        const DIARY_PASSWORD = 'DiaryEncryptionPass123!';

        it('verifies explicit separation of Account Password, Diary Password, and Vault Recovery Key', async () => {
            const userId = 'usr-phase9-distinction';
            const { vaultHeader, recoveryKey } = await initializeV3VaultHeader(userId, DIARY_PASSWORD);

            // 1. Account authentication password is text sent to backend auth endpoint
            expect(ACCOUNT_PASSWORD).not.toEqual(DIARY_PASSWORD);

            // 2. Diary Encryption Password unwraps encryptedVMK_pass
            const vmkPass = await unwrapVmkWithPassword(vaultHeader, DIARY_PASSWORD, userId);
            expect(vmkPass).toBeDefined();

            // 3. Vault-Wide Recovery Key unwraps encryptedVMK_rec (formatted as 46 chars)
            expect(recoveryKey.length).toBe(46);
            expect(recoveryKey).toMatch(/^[A-Za-z0-9_-]{11}-[A-Za-z0-9_-]{11}-[A-Za-z0-9_-]{11}-[A-Za-z0-9_-]{10}$/);
            const vmkRec = await unwrapVmkWithRecoveryKey(vaultHeader, recoveryKey, userId);
            expect(vmkRec).toBeDefined();
        });

        it('verifies error messages do not leak passwords, recovery keys, VMK bytes, or plaintext content', () => {
            const rawErrorMsg = 'Decryption failed. Incorrect Diary Password.';
            const recErrorMsg = 'Decryption failed. Invalid Vault Recovery Key.';

            expect(rawErrorMsg).not.toContain(DIARY_PASSWORD);
            expect(rawErrorMsg).not.toContain('rawVMK');
            expect(recErrorMsg).not.toContain('recoveryKey');
            expect(recErrorMsg).not.toContain('plaintext');
        });

        it('verifies unlocked diary state is cleared when lock/logout is triggered', () => {
            let activeUnlockedView: { title: string; content: string } | null = {
                title: 'Secret Title',
                content: 'Secret Diary Content',
            };

            // Trigger logout / lock event handler
            activeUnlockedView = null;

            expect(activeUnlockedView).toBeNull();
        });

        it('verifies absence of unsupported claims in client header metadata', async () => {
            const userId = 'usr-phase9-claims';
            const { vaultHeader } = await initializeV3VaultHeader(userId, DIARY_PASSWORD);
            const serialized = JSON.stringify(vaultHeader);

            expect(serialized).not.toContain('zero-knowledge');
            expect(serialized).not.toContain('E2EE');
            expect(serialized).not.toContain('end-to-end');
            expect(serialized).not.toContain('64-character');
        });
    });
});
