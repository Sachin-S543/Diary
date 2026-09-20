/*
 * Inkrypt — V3 Capsule Encryption & Decryption Scheme (V3CapsuleBlob)
 * AGPL-3.0-or-later — Copyright (C) 2025 Sachin-S543
 */

import type { DecryptedEntryPayload, V3CapsuleBlob } from '@secret-capsule/types';
import {
    toBase64Url,
    fromBase64Url,
    buildAadV3,
    zeroBuffer,
} from './index.js';

const enc = new TextEncoder();
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

/**
 * Encrypts an entry payload into a V3 Capsule Blob using a fresh per-capsule key wrapped under the VMK.
 */
export const encryptCapsuleV3 = async (
    capsuleId: string,
    payload: DecryptedEntryPayload,
    vmkKey: CryptoKey,
    protectionLevel: number = 1
): Promise<V3CapsuleBlob> => {
    const cryptoInstance = getCrypto();

    // 1. Generate random 32-byte per-capsule key
    const rawCapsuleKeyBytes = cryptoInstance.getRandomValues(new Uint8Array(32));

    // 2. Import raw capsule key as CryptoKey for AES-GCM
    const capsuleKey = await cryptoInstance.subtle.importKey(
        'raw',
        rawCapsuleKeyBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    // 3. Wrap capsule key under Vault Master Key (VMK) with Key AAD
    const keyAad = buildAadV3('capsule_key', capsuleId);
    const kiv = cryptoInstance.getRandomValues(new Uint8Array(12));
    const encryptedKeyBuffer = await cryptoInstance.subtle.encrypt(
        { name: 'AES-GCM', iv: kiv as unknown as BufferSource, additionalData: keyAad as unknown as BufferSource },
        vmkKey,
        rawCapsuleKeyBytes as unknown as BufferSource
    );

    // 4. Encrypt JSON payload under capsule key with Payload AAD
    const payloadJson = JSON.stringify(payload);
    const payloadBytes = enc.encode(payloadJson);
    const payloadAad = buildAadV3('payload', capsuleId);
    const civ = cryptoInstance.getRandomValues(new Uint8Array(12));

    const encryptedContentBuffer = await cryptoInstance.subtle.encrypt(
        { name: 'AES-GCM', iv: civ as unknown as BufferSource, additionalData: payloadAad as unknown as BufferSource },
        capsuleKey,
        payloadBytes as unknown as BufferSource
    );

    // 5. Memory hygiene: zero raw capsule key byte buffer
    zeroBuffer(rawCapsuleKeyBytes);

    return {
        v: 3,
        p: protectionLevel,
        c: toBase64Url(encryptedContentBuffer),
        civ: toBase64Url(civ),
        k: toBase64Url(encryptedKeyBuffer),
        kiv: toBase64Url(kiv),
    };
};

/**
 * Decrypts a V3 Capsule Blob by unwrapping its capsule key under the VMK and decrypting the content payload.
 */
export const decryptCapsuleV3 = async (
    capsuleId: string,
    blob: V3CapsuleBlob,
    vmkKey: CryptoKey
): Promise<DecryptedEntryPayload> => {
    if (blob.v !== 3) {
        throw new Error(`Unsupported capsule blob version: expected 3, got ${blob.v}`);
    }

    const cryptoInstance = getCrypto();

    // 1. Unwrap capsule key under VMK using Key AAD
    const keyAad = buildAadV3('capsule_key', capsuleId);
    const kivBytes = fromBase64Url(blob.kiv);
    const encryptedKeyBytes = fromBase64Url(blob.k);

    const decryptedKeyBuffer = await cryptoInstance.subtle.decrypt(
        { name: 'AES-GCM', iv: kivBytes as unknown as BufferSource, additionalData: keyAad as unknown as BufferSource },
        vmkKey,
        encryptedKeyBytes as unknown as BufferSource
    );

    const rawCapsuleKeyBytes = new Uint8Array(decryptedKeyBuffer);

    // 2. Import raw capsule key as CryptoKey for AES-GCM
    const capsuleKey = await cryptoInstance.subtle.importKey(
        'raw',
        rawCapsuleKeyBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    // 3. Decrypt content payload under capsule key using Payload AAD
    const payloadAad = buildAadV3('payload', capsuleId);
    const civBytes = fromBase64Url(blob.civ);
    const encryptedContentBytes = fromBase64Url(blob.c);

    const decryptedContentBuffer = await cryptoInstance.subtle.decrypt(
        { name: 'AES-GCM', iv: civBytes as unknown as BufferSource, additionalData: payloadAad as unknown as BufferSource },
        capsuleKey,
        encryptedContentBytes as unknown as BufferSource
    );

    const payloadJson = dec.decode(decryptedContentBuffer);
    const payload = JSON.parse(payloadJson) as DecryptedEntryPayload;

    // 4. Memory hygiene: zero all transient byte buffers
    zeroBuffer(rawCapsuleKeyBytes);
    zeroBuffer(kivBytes);
    zeroBuffer(encryptedKeyBytes);
    zeroBuffer(civBytes);
    zeroBuffer(encryptedContentBytes);

    return payload;
};
