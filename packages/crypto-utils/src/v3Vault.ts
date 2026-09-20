/*
 * Inkrypt — V3 Vault Master Key (VMK) Initialization & Key Wrapping
 * AGPL-3.0-or-later — Copyright (C) 2025 Sachin-S543
 */

import type { V3VaultHeader } from '@secret-capsule/types';
import { deriveArgon2idKey } from './kdf.js';
import {
    toBase64Url,
    fromBase64Url,
    formatRecoveryKeyV3,
    parseRecoveryKeyV3,
    buildAadV3,
    zeroBuffer,
} from './index.js';

const getCrypto = (): Crypto => {
    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
        return globalThis.crypto;
    }
    if (typeof window !== 'undefined' && window.crypto) {
        return window.crypto;
    }
    const nodeCrypto = require('crypto');
    return nodeCrypto.webcrypto || nodeCrypto;
};

export interface InitializeV3VaultResult {
    vaultHeader: V3VaultHeader;
    recoveryKey: string; // 46-character formatted recovery key (11-11-11-10)
    vmkKey: CryptoKey;
}

/**
 * Creates a brand-new V3 Vault Header with dual VMK wrapping (password & recovery key).
 */
export const initializeV3VaultHeader = async (
    userId: string,
    password: string,
    vaultIdOverride?: string
): Promise<InitializeV3VaultResult> => {
    const cryptoInstance = getCrypto();
    const vaultId = vaultIdOverride || `vlt-${cryptoInstance.randomUUID()}`;
    const updatedAt = new Date().toISOString();

    // 1. Generate 16-byte dedicated vault salt
    const vaultSaltBytes = cryptoInstance.getRandomValues(new Uint8Array(16));
    const vaultSalt = toBase64Url(vaultSaltBytes);

    // 2. Generate random 32-byte VMK & 32-byte raw Recovery Key
    const rawVmkBytes = cryptoInstance.getRandomValues(new Uint8Array(32));
    const rawRecoveryBytes = cryptoInstance.getRandomValues(new Uint8Array(32));

    // 3. Format recovery key (43 unpadded Base64URL chars -> 46 chars with 3 hyphens)
    const recoveryKey = formatRecoveryKeyV3(rawRecoveryBytes);

    // 4. Derive password wrapping key via Argon2id (V3)
    const passWrappingKeyBytes = await deriveArgon2idKey(password, vaultSaltBytes);
    const passWrappingKey = await cryptoInstance.subtle.importKey(
        'raw',
        passWrappingKeyBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    // 5. Derive recovery wrapping key via Argon2id (V3)
    const recWrappingKeyBytes = await deriveArgon2idKey(recoveryKey, vaultSaltBytes);
    const recWrappingKey = await cryptoInstance.subtle.importKey(
        'raw',
        recWrappingKeyBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    // 6. Build AAD bound to user domain
    const aad = buildAadV3('vmk', userId);

    // 7. Wrap VMK under password wrapping key
    const vmkPassIv = cryptoInstance.getRandomValues(new Uint8Array(12));
    const encryptedPassBuffer = await cryptoInstance.subtle.encrypt(
        { name: 'AES-GCM', iv: vmkPassIv as unknown as BufferSource, additionalData: aad as unknown as BufferSource },
        passWrappingKey,
        rawVmkBytes as unknown as BufferSource
    );

    // 8. Wrap VMK under recovery wrapping key
    const vmkRecIv = cryptoInstance.getRandomValues(new Uint8Array(12));
    const encryptedRecBuffer = await cryptoInstance.subtle.encrypt(
        { name: 'AES-GCM', iv: vmkRecIv as unknown as BufferSource, additionalData: aad as unknown as BufferSource },
        recWrappingKey,
        rawVmkBytes as unknown as BufferSource
    );

    // 9. Import in-memory non-extractable VMK CryptoKey
    const vmkKey = await cryptoInstance.subtle.importKey(
        'raw',
        rawVmkBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false, // Non-extractable in RAM
        ['encrypt', 'decrypt']
    );

    // 10. Memory hygiene: zero all transient raw key buffers
    zeroBuffer(rawVmkBytes);
    zeroBuffer(rawRecoveryBytes);
    zeroBuffer(passWrappingKeyBytes);
    zeroBuffer(recWrappingKeyBytes);
    zeroBuffer(vaultSaltBytes);

    const vaultHeader: V3VaultHeader = {
        v: 3,
        vaultId,
        vaultSalt,
        encryptedVMK_pass: toBase64Url(encryptedPassBuffer),
        vmkPassIv: toBase64Url(vmkPassIv),
        encryptedVMK_rec: toBase64Url(encryptedRecBuffer),
        vmkRecIv: toBase64Url(vmkRecIv),
        updatedAt,
    };

    return { vaultHeader, recoveryKey, vmkKey };
};

/**
 * Helper to unwrap raw VMK bytes using account password.
 */
const unwrapRawVmkWithPassword = async (
    vaultHeader: V3VaultHeader,
    password: string,
    userId: string
): Promise<Uint8Array> => {
    const cryptoInstance = getCrypto();
    const vaultSaltBytes = fromBase64Url(vaultHeader.vaultSalt);
    const passWrappingKeyBytes = await deriveArgon2idKey(password, vaultSaltBytes);

    const passWrappingKey = await cryptoInstance.subtle.importKey(
        'raw',
        passWrappingKeyBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const aad = buildAadV3('vmk', userId);
    const vmkPassIvBytes = fromBase64Url(vaultHeader.vmkPassIv);
    const encryptedPassBytes = fromBase64Url(vaultHeader.encryptedVMK_pass);

    const decryptedVmkBuffer = await cryptoInstance.subtle.decrypt(
        { name: 'AES-GCM', iv: vmkPassIvBytes as unknown as BufferSource, additionalData: aad as unknown as BufferSource },
        passWrappingKey,
        encryptedPassBytes as unknown as BufferSource
    );

    zeroBuffer(passWrappingKeyBytes);
    zeroBuffer(vaultSaltBytes);
    zeroBuffer(vmkPassIvBytes);
    zeroBuffer(encryptedPassBytes);

    return new Uint8Array(decryptedVmkBuffer);
};

/**
 * Helper to unwrap raw VMK bytes using formatted Recovery Key.
 */
const unwrapRawVmkWithRecoveryKey = async (
    vaultHeader: V3VaultHeader,
    recoveryKeyInput: string,
    userId: string
): Promise<Uint8Array> => {
    const cryptoInstance = getCrypto();
    const parsedRecoveryBytes = parseRecoveryKeyV3(recoveryKeyInput);
    const recoveryKeyFormatted = formatRecoveryKeyV3(parsedRecoveryBytes);

    const vaultSaltBytes = fromBase64Url(vaultHeader.vaultSalt);
    const recWrappingKeyBytes = await deriveArgon2idKey(recoveryKeyFormatted, vaultSaltBytes);

    const recWrappingKey = await cryptoInstance.subtle.importKey(
        'raw',
        recWrappingKeyBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const aad = buildAadV3('vmk', userId);
    const vmkRecIvBytes = fromBase64Url(vaultHeader.vmkRecIv);
    const encryptedRecBytes = fromBase64Url(vaultHeader.encryptedVMK_rec);

    const decryptedVmkBuffer = await cryptoInstance.subtle.decrypt(
        { name: 'AES-GCM', iv: vmkRecIvBytes as unknown as BufferSource, additionalData: aad as unknown as BufferSource },
        recWrappingKey,
        encryptedRecBytes as unknown as BufferSource
    );

    zeroBuffer(recWrappingKeyBytes);
    zeroBuffer(parsedRecoveryBytes);
    zeroBuffer(vaultSaltBytes);
    zeroBuffer(vmkRecIvBytes);
    zeroBuffer(encryptedRecBytes);

    return new Uint8Array(decryptedVmkBuffer);
};

/**
 * Unwraps the VMK using the account password and V3 Vault Header.
 */
export const unwrapVmkWithPassword = async (
    vaultHeader: V3VaultHeader,
    password: string,
    userId: string
): Promise<CryptoKey> => {
    const cryptoInstance = getCrypto();
    const decryptedVmkBytes = await unwrapRawVmkWithPassword(vaultHeader, password, userId);

    const vmkKey = await cryptoInstance.subtle.importKey(
        'raw',
        decryptedVmkBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    zeroBuffer(decryptedVmkBytes);
    return vmkKey;
};

/**
 * Unwraps the VMK using the formatted Recovery Key and V3 Vault Header.
 */
export const unwrapVmkWithRecoveryKey = async (
    vaultHeader: V3VaultHeader,
    recoveryKeyInput: string,
    userId: string
): Promise<CryptoKey> => {
    const cryptoInstance = getCrypto();
    const decryptedVmkBytes = await unwrapRawVmkWithRecoveryKey(vaultHeader, recoveryKeyInput, userId);

    const vmkKey = await cryptoInstance.subtle.importKey(
        'raw',
        decryptedVmkBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    zeroBuffer(decryptedVmkBytes);
    return vmkKey;
};

/**
 * Rotates the password wrapping of the V3 Vault Master Key (VMK).
 * Re-wraps the VMK under a new password wrapping key derived from newPassword + vaultSalt via Argon2id.
 * Capsule ciphertexts and Recovery Key wrapper remain unchanged.
 */
export const rotatePasswordV3 = async (
    vaultHeader: V3VaultHeader,
    oldPassword: string,
    newPassword: string,
    userId: string
): Promise<V3VaultHeader> => {
    // 1. Fail-closed: unwrap existing raw VMK using old password
    const rawVmkBytes = await unwrapRawVmkWithPassword(vaultHeader, oldPassword, userId);

    const cryptoInstance = getCrypto();

    // 2. Derive new password wrapping key using existing vaultSalt
    const vaultSaltBytes = fromBase64Url(vaultHeader.vaultSalt);
    const newPassWrappingKeyBytes = await deriveArgon2idKey(newPassword, vaultSaltBytes);
    const newPassWrappingKey = await cryptoInstance.subtle.importKey(
        'raw',
        newPassWrappingKeyBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    // 3. Re-wrap VMK under new password wrapping key
    const aad = buildAadV3('vmk', userId);
    const newVmkPassIv = cryptoInstance.getRandomValues(new Uint8Array(12));
    const newEncryptedPassBuffer = await cryptoInstance.subtle.encrypt(
        { name: 'AES-GCM', iv: newVmkPassIv as unknown as BufferSource, additionalData: aad as unknown as BufferSource },
        newPassWrappingKey,
        rawVmkBytes as unknown as BufferSource
    );

    // 4. Memory hygiene: zero raw key byte buffers
    zeroBuffer(rawVmkBytes);
    zeroBuffer(newPassWrappingKeyBytes);
    zeroBuffer(vaultSaltBytes);

    const updatedVaultHeader: V3VaultHeader = {
        ...vaultHeader,
        encryptedVMK_pass: toBase64Url(newEncryptedPassBuffer),
        vmkPassIv: toBase64Url(newVmkPassIv),
        updatedAt: new Date().toISOString(),
    };

    // 5. Verification check: unwrap with new password before committing
    await unwrapVmkWithPassword(updatedVaultHeader, newPassword, userId);

    return updatedVaultHeader;
};

/**
 * Rotates the Recovery Key wrapping of the V3 Vault Master Key (VMK).
 * Generates a fresh 32-byte CSPRNG Recovery Key (46 chars formatted) and re-wraps the VMK under it.
 * Capsule ciphertexts and password wrapper remain unchanged.
 */
export const rotateRecoveryKeyV3 = async (
    vaultHeader: V3VaultHeader,
    auth: { password?: string; recoveryKey?: string },
    userId: string
): Promise<{ vaultHeader: V3VaultHeader; newRecoveryKey: string }> => {
    // 1. Fail-closed: unwrap existing raw VMK using provided password or old recovery key
    let rawVmkBytes: Uint8Array;
    if (auth.password) {
        rawVmkBytes = await unwrapRawVmkWithPassword(vaultHeader, auth.password, userId);
    } else if (auth.recoveryKey) {
        rawVmkBytes = await unwrapRawVmkWithRecoveryKey(vaultHeader, auth.recoveryKey, userId);
    } else {
        throw new Error('Authentication required to rotate recovery key.');
    }

    const cryptoInstance = getCrypto();

    // 2. Generate new 32-byte raw Recovery Key & format into 46 chars (11-11-11-10)
    const rawNewRecoveryBytes = cryptoInstance.getRandomValues(new Uint8Array(32));
    const newRecoveryKey = formatRecoveryKeyV3(rawNewRecoveryBytes);

    // 3. Derive new recovery wrapping key from newRecoveryKey + vaultSalt
    const vaultSaltBytes = fromBase64Url(vaultHeader.vaultSalt);
    const newRecWrappingKeyBytes = await deriveArgon2idKey(newRecoveryKey, vaultSaltBytes);
    const newRecWrappingKey = await cryptoInstance.subtle.importKey(
        'raw',
        newRecWrappingKeyBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    // 4. Re-wrap VMK under new recovery wrapping key
    const aad = buildAadV3('vmk', userId);
    const newVmkRecIv = cryptoInstance.getRandomValues(new Uint8Array(12));
    const newEncryptedRecBuffer = await cryptoInstance.subtle.encrypt(
        { name: 'AES-GCM', iv: newVmkRecIv as unknown as BufferSource, additionalData: aad as unknown as BufferSource },
        newRecWrappingKey,
        rawVmkBytes as unknown as BufferSource
    );

    // 5. Memory hygiene
    zeroBuffer(rawVmkBytes);
    zeroBuffer(rawNewRecoveryBytes);
    zeroBuffer(newRecWrappingKeyBytes);
    zeroBuffer(vaultSaltBytes);

    const updatedVaultHeader: V3VaultHeader = {
        ...vaultHeader,
        encryptedVMK_rec: toBase64Url(newEncryptedRecBuffer),
        vmkRecIv: toBase64Url(newVmkRecIv),
        updatedAt: new Date().toISOString(),
    };

    // 6. Verification check: unwrap with new recovery key before committing
    await unwrapVmkWithRecoveryKey(updatedVaultHeader, newRecoveryKey, userId);

    return { vaultHeader: updatedVaultHeader, newRecoveryKey };
};
