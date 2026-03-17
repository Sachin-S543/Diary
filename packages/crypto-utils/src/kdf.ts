/*
 * Secret Capsule (Diary)
 * Copyright (C) 2025 Sachin-S543
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public 
 * License along with this program. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

import { argon2id } from 'hash-wasm';

const enc = new TextEncoder();

export const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

export const base64ToBuffer = (base64: string): ArrayBuffer => {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
};

// V1: PBKDF2 (Legacy)
export const derivePBKDF2Key = async (password: string, salt: string): Promise<ArrayBuffer> => {
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    return await window.crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: base64ToBuffer(salt),
            iterations: 200000,
            hash: "SHA-256",
        },
        keyMaterial,
        512 // 256 for enc, 256 for mac
    );
};

// V2: Argon2id
export const deriveArgon2idKey = async (password: string, saltBuffer: Uint8Array): Promise<Uint8Array> => {
    const hashHexString = await argon2id({
        password: password,
        salt: saltBuffer,
        memorySize: 65536, // 64 MB (65536 KiB)
        iterations: 3,
        parallelism: 1,
        hashLength: 32, // 32 bytes (256-bit)
        outputType: 'binary',
    });
    return hashHexString as Uint8Array;
};

export const deriveKey = async (password: string, salt: string | Uint8Array, version: number): Promise<Uint8Array | ArrayBuffer> => {
    if (version === 1) {
        return derivePBKDF2Key(password, typeof salt === 'string' ? salt : bufferToBase64(salt.buffer as ArrayBuffer));
    } else if (version === 2) {
        let saltBuf: Uint8Array;
        if (typeof salt === 'string') {
            saltBuf = new Uint8Array(base64ToBuffer(salt));
        } else {
            saltBuf = salt;
        }
        return deriveArgon2idKey(password, saltBuf);
    }
    throw new Error('Unsupported KDF version');
};

export interface VaultMetadata {
    version: number;
    salt: string;
    encryptedMasterKey: string; // Base64
    iv: string; // Base64
}

export const migrateVaultKey = async (password: string, metadata: VaultMetadata): Promise<VaultMetadata> => {
    if (metadata.version !== 1) {
        throw new Error('Can only migrate version 1 vaults');
    }

    const saltStr = metadata.salt;
    const oldMaterial = await derivePBKDF2Key(password, saltStr);
    
    // Import V1 AES-GCM Key (first 32 bytes)
    const oldEncKeyBuf = oldMaterial.slice(0, 32);
    const oldKey = await window.crypto.subtle.importKey(
        "raw",
        oldEncKeyBuf,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    // Decrypt the old master key
    const ciphertext = base64ToBuffer(metadata.encryptedMasterKey);
    const iv = base64ToBuffer(metadata.iv);
    
    const masterKeyPlaintext = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) },
        oldKey,
        ciphertext
    );

    // Re-encrypt with Argon2id (Version 2)
    const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
    const newArgonKeyBytes = await deriveArgon2idKey(password, newSalt);
    
    const newKey = await window.crypto.subtle.importKey(
        "raw",
        newArgonKeyBytes as unknown as BufferSource,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    const newIv = window.crypto.getRandomValues(new Uint8Array(12));
    const newCiphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: newIv },
        newKey,
        masterKeyPlaintext
    );

    return {
        version: 2,
        salt: bufferToBase64(newSalt.buffer as ArrayBuffer),
        encryptedMasterKey: bufferToBase64(newCiphertext),
        iv: bufferToBase64(newIv.buffer as ArrayBuffer)
    };
};
