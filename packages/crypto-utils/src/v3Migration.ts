/*
 * Inkrypt — V2→V3 Migration Engine & Unified Capsule Decryption
 * AGPL-3.0-or-later — Copyright (C) 2025 Sachin-S543
 */

import type { Capsule, DecryptedEntryPayload, V3VaultHeader, V3CapsuleBlob } from '@secret-capsule/types';
import { deriveArgon2idKey } from './kdf.js';
import {
    deriveCapsuleKeys,
    decryptCapsule,
    fromBase64Url,
    base64ToBuffer,
    zeroBuffer,
    initializeV3VaultHeader,
    unwrapVmkWithPassword,
    encryptCapsuleV3,
    decryptCapsuleV3,
} from './index.js';

const dec = new TextDecoder();

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

export interface DecryptUnifiedOptions {
    password?: string;
    vmkKey?: CryptoKey;
    userId?: string;
}

/**
 * Unified decryption function supporting V1, V2, and V3 capsule formats.
 */
export const decryptCapsuleUnified = async (
    capsule: Capsule,
    options: DecryptUnifiedOptions
): Promise<DecryptedEntryPayload> => {
    const version = capsule.version || 2;

    if (version === 3) {
        if (!options.vmkKey) {
            throw new Error('VMK key required to decrypt V3 capsule.');
        }
        const blob = JSON.parse(capsule.encryptedPayload) as V3CapsuleBlob;
        const capsuleId = capsule.id;
        return decryptCapsuleV3(capsuleId, blob, options.vmkKey);
    }

    if (!options.password) {
        throw new Error('Password required to decrypt legacy capsule.');
    }

    const cryptoInstance = getCrypto();

    if (version === 2) {
        const saltBytes = capsule.salt.includes('-') || capsule.salt.includes('_')
            ? fromBase64Url(capsule.salt)
            : new Uint8Array(base64ToBuffer(capsule.salt));

        const keyBytes = await deriveArgon2idKey(options.password, saltBytes);
        const key = await cryptoInstance.subtle.importKey(
            'raw',
            keyBytes as unknown as BufferSource,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        const ivBytes = capsule.iv.includes('-') || capsule.iv.includes('_')
            ? fromBase64Url(capsule.iv)
            : new Uint8Array(base64ToBuffer(capsule.iv));

        const ciphertextBytes = capsule.encryptedPayload.includes('-') || capsule.encryptedPayload.includes('_')
            ? fromBase64Url(capsule.encryptedPayload)
            : new Uint8Array(base64ToBuffer(capsule.encryptedPayload));

        const decryptedBuffer = await cryptoInstance.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBytes as unknown as BufferSource },
            key,
            ciphertextBytes as unknown as BufferSource
        );

        const text = dec.decode(decryptedBuffer);

        zeroBuffer(keyBytes);
        zeroBuffer(saltBytes);

        try {
            return JSON.parse(text) as DecryptedEntryPayload;
        } catch {
            return {
                title: capsule.encryptedTitle || 'Untitled',
                content: text,
                category: capsule.category,
                tags: capsule.tags,
            };
        }
    }

    if (version === 1) {
        const capsuleKeys = await deriveCapsuleKeys(options.password, capsule.salt);
        const title = capsule.encryptedTitle
            ? await decryptCapsule({ ciphertext: capsule.encryptedTitle, iv: capsule.iv, hmac: capsule.hmac || '' }, capsuleKeys)
            : 'Untitled';

        const content = capsule.encryptedContent
            ? await decryptCapsule({ ciphertext: capsule.encryptedContent, iv: capsule.iv, hmac: capsule.hmac || '' }, capsuleKeys)
            : '';

        return {
            title,
            content,
            category: capsule.category,
            tags: capsule.tags,
        };
    }

    throw new Error(`Unsupported capsule version: ${version}`);
};

export interface MigrateVaultResult {
    vaultHeader: V3VaultHeader;
    recoveryKey?: string;
    v3Capsules: Capsule[];
}

/**
 * Migrates an entire user vault of legacy V1/V2 capsules to V3 dual-envelope encryption under a V3 VMK.
 */
export const migrateVaultV2ToV3 = async (
    userId: string,
    password: string,
    legacyCapsules: Capsule[],
    existingVaultHeader?: V3VaultHeader
): Promise<MigrateVaultResult> => {
    let vaultHeader: V3VaultHeader;
    let recoveryKey: string | undefined;
    let vmkKey: CryptoKey;

    if (existingVaultHeader) {
        vaultHeader = existingVaultHeader;
        vmkKey = await unwrapVmkWithPassword(existingVaultHeader, password, userId);
    } else {
        const initResult = await initializeV3VaultHeader(userId, password);
        vaultHeader = initResult.vaultHeader;
        recoveryKey = initResult.recoveryKey;
        vmkKey = initResult.vmkKey;
    }

    const v3Capsules: Capsule[] = [];

    for (const capsule of legacyCapsules) {
        if (capsule.version === 3) {
            v3Capsules.push(capsule);
            continue;
        }

        // Decrypt legacy payload
        const payload = await decryptCapsuleUnified(capsule, { password });

        // Encrypt as V3 Capsule Blob
        const v3Blob = await encryptCapsuleV3(capsule.id, payload, vmkKey, 1);

        const upgradedCapsule: Capsule = {
            ...capsule,
            version: 3,
            encryptedPayload: JSON.stringify(v3Blob),
            iv: '',
            salt: '',
            hmac: '',
            updatedAt: new Date().toISOString(),
        };

        v3Capsules.push(upgradedCapsule);
    }

    return { vaultHeader, recoveryKey, v3Capsules };
};
