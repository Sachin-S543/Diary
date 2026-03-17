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

const DB_NAME = 'SecretCapsuleEncryptedDB';
const STORE_NAME = 'records';
const DB_VERSION = 1;

export class EncryptedStore {
    private dbPromise: Promise<IDBDatabase>;

    constructor(dbName: string = DB_NAME) {
        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private applyPadding(plaintext: Uint8Array): Uint8Array {
        const blockSize = 4096;
        const currentLength = plaintext.length;
        const paddingLength = blockSize - (currentLength % blockSize);
        
        // Even if remainder is 0, we add a full 4096 bytes block
        // Wait, the standard ISO/IEC 7816-4 says we must append 0x80 and then 0x00.
        // If currentLength % 4096 == 0, we still append a full block. Wait!
        // The prompt: "expand the content to the nearest multiple of 4096 bytes (4KB). Append a 0x80 byte immediately after the content. Fill with 0x00 bytes until the total length is a multiple of 4096."
        
        // If we just need it to be a multiple of 4096, and it's strictly > currentLength:
        const paddedLength = currentLength + paddingLength;
        const padded = new Uint8Array(paddedLength);
        padded.set(plaintext, 0);
        padded[currentLength] = 0x80;
        // Remaining bytes are already 0x00 because of new Uint8Array
        return padded;
    }

    private removePadding(padded: Uint8Array): Uint8Array {
        // Find the last 0x80 byte
        for (let i = padded.length - 1; i >= 0; i--) {
            if (padded[i] === 0x80) {
                return padded.slice(0, i);
            }
        }
        throw new Error("Invalid padding");
    }

    async put(key: string, plainObject: any, encryptionKey: CryptoKey): Promise<void> {
        const jsonStr = JSON.stringify(plainObject);
        const encoder = new TextEncoder();
        const plaintextBytes = encoder.encode(jsonStr);
        
        const paddedPlaintext = this.applyPadding(plaintextBytes);

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ciphertextBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv as unknown as BufferSource },
            encryptionKey,
            paddedPlaintext as unknown as BufferSource
        );

        const ciphertext = new Uint8Array(ciphertextBuffer);
        const combined = new Uint8Array(iv.length + ciphertext.length);
        combined.set(iv, 0);
        combined.set(ciphertext, iv.length);

        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(combined, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async get(key: string, encryptionKey: CryptoKey): Promise<any> {
        const db = await this.dbPromise;
        const record = await new Promise<Uint8Array | undefined>((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (!record) return null;

        const iv = record.slice(0, 12);
        const ciphertext = record.slice(12);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv as unknown as BufferSource },
            encryptionKey,
            ciphertext as unknown as BufferSource
        );

        const decryptedBytes = new Uint8Array(decryptedBuffer);
        const unpaddedBytes = this.removePadding(decryptedBytes);
        
        const decoder = new TextDecoder();
        const jsonStr = decoder.decode(unpaddedBytes);
        return JSON.parse(jsonStr);
    }

    async delete(key: string): Promise<void> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async listKeys(): Promise<string[]> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAllKeys();
            request.onsuccess = () => resolve(request.result as string[]);
            request.onerror = () => reject(request.error);
        });
    }
}
