// Utility to encode/decode
const enc = new TextEncoder();
const dec = new TextDecoder();

export const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

export const base64ToBuffer = (base64: string): ArrayBuffer => {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
};

// 1. Derive Key from Password (PBKDF2)
export const deriveKey = async (password: string, salt: string): Promise<CryptoKey> => {
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: base64ToBuffer(salt),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true, // extractable? No, keep it internal usually, but for now true for debugging
        ["encrypt", "decrypt"]
    );
};

// 2. Encrypt Data
export const encryptData = async (text: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = enc.encode(text);

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encoded
    );

    return {
        ciphertext: bufferToBase64(ciphertext),
        iv: bufferToBase64(iv.buffer),
    };
};

// 3. Decrypt Data
export const decryptData = async (ciphertext: string, iv: string, key: CryptoKey): Promise<string> => {
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: base64ToBuffer(iv),
        },
        key,
        base64ToBuffer(ciphertext)
    );

    return dec.decode(decrypted);
};

// 4. Generate Random Salt
export const generateSalt = (): string => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return bufferToBase64(salt.buffer);
};
