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

export interface EncryptedAttachmentResult {
    encryptedBlob: Blob;
    attachmentKey: Uint8Array;
    iv: Uint8Array;
}

export const encryptAttachment = async (file: File): Promise<EncryptedAttachmentResult> => {
    // Generate a fresh random 32-byte AES-GCM key (Attachment Key)
    const attachmentKeyBuffer = crypto.getRandomValues(new Uint8Array(32));
    
    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        attachmentKeyBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    // Generate a fresh random 12-byte IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Get the file's ArrayBuffer content
    const fileBuffer = await file.arrayBuffer();

    // Encrypt the content
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        fileBuffer
    );

    // Create the Blob
    const encryptedBlob = new Blob([ciphertextBuffer], { type: 'application/octet-stream' });

    return {
        encryptedBlob,
        attachmentKey: attachmentKeyBuffer,
        iv
    };
};

export const decryptAttachment = async (
    encryptedBlob: Blob,
    attachmentKey: Uint8Array,
    iv: Uint8Array
): Promise<ArrayBuffer> => {
    
    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        attachmentKey as unknown as BufferSource,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    const ciphertextBuffer = await encryptedBlob.arrayBuffer();

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as unknown as BufferSource },
        cryptoKey,
        ciphertextBuffer
    );

    return decryptedBuffer;
};
