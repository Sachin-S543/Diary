// Utility to encode/decode
const enc = new TextEncoder();
const dec = new TextDecoder();

export const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

export const base64ToBuffer = (base64: string): ArrayBuffer => {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
};

export interface CapsuleKeys {
    encKey: CryptoKey;
    macKey: CryptoKey;
}

export interface EncryptedContent {
    ciphertext: string;
    iv: string;
    hmac: string;
}

export * from './kdf.js';
export * from './encryptedStore.js';
export * from './v3Vault.js';
export * from './v3Capsule.js';
export * from './v3Migration.js';

// ─── V3 Base64URL & Recovery Key Utilities ──────────────────────────────────

export const toBase64Url = (buffer: ArrayBuffer | Uint8Array): string => {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

export const fromBase64Url = (base64url: string): Uint8Array => {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

export const formatRecoveryKeyV3 = (rawBytes: Uint8Array): string => {
    if (rawBytes.byteLength !== 32) {
        throw new Error(`Invalid recovery key byte length: expected 32, got ${rawBytes.byteLength}`);
    }
    const b64url = toBase64Url(rawBytes); // Dynamically calculated 43 chars
    // Format into 4 hyphenated blocks: 11-11-11-10 (total 43 chars + 3 hyphens = 46 chars)
    return `${b64url.slice(0, 11)}-${b64url.slice(11, 22)}-${b64url.slice(22, 33)}-${b64url.slice(33)}`;
};

export const parseRecoveryKeyV3 = (input: string): Uint8Array => {
    const trimmed = input.trim();
    let cleaned = trimmed;
    if (trimmed.length === 46 && trimmed[11] === '-' && trimmed[23] === '-' && trimmed[35] === '-') {
        cleaned = trimmed.slice(0, 11) + trimmed.slice(12, 23) + trimmed.slice(24, 35) + trimmed.slice(36);
    } else if (trimmed.length !== 43) {
        // Fallback for user input with whitespace/hyphens around blocks
        cleaned = trimmed.replace(/\s+/g, '');
        if (cleaned.length === 46 && cleaned[11] === '-' && cleaned[23] === '-' && cleaned[35] === '-') {
            cleaned = cleaned.slice(0, 11) + cleaned.slice(12, 23) + cleaned.slice(24, 35) + cleaned.slice(36);
        }
    }

    if (cleaned.length !== 43) {
        throw new Error(`Invalid V3 Recovery Key length: expected 43 unpadded Base64URL characters, got ${cleaned.length}`);
    }
    const bytes = fromBase64Url(cleaned);
    if (bytes.byteLength !== 32) {
        throw new Error(`Invalid V3 Recovery Key byte size: expected 32 bytes, got ${bytes.byteLength}`);
    }
    return bytes;
};

export const buildAadV3 = (domain: 'vmk' | 'capsule_key' | 'payload', resourceId: string): Uint8Array => {
    return enc.encode(`inkrypt:${domain}:v3:${resourceId}`);
};

export const zeroBuffer = (buffer: Uint8Array | ArrayBuffer): void => {
    if (buffer instanceof Uint8Array) {
        buffer.fill(0);
    } else {
        new Uint8Array(buffer).fill(0);
    }
};


// 1. Generate Random Salt (128-bit)
export const generateSalt = (): string => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return bufferToBase64(salt.buffer);
};

// V1 Key Derivation Material (for backward compatibility if needed directly, though kdf.ts has derivePBKDF2Key)
export const deriveKeyMaterial = async (password: string, salt: string): Promise<ArrayBuffer> => {
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
        512 // 256 bits for AES + 256 bits for HMAC
    );
};

// 3. Import Keys from Material
export const importKeysFromMaterial = async (material: ArrayBuffer): Promise<CapsuleKeys> => {
    const encKeyBuffer = material.slice(0, 32);
    const macKeyBuffer = material.slice(32, 64);

    const encKey = await window.crypto.subtle.importKey(
        "raw",
        encKeyBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );

    const macKey = await window.crypto.subtle.importKey(
        "raw",
        macKeyBuffer,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );

    return { encKey, macKey };
};

// 4. Derive Keys (Standard Flow - V1 Legacy)
export const deriveCapsuleKeys = async (password: string, salt: string): Promise<CapsuleKeys> => {
    const material = await deriveKeyMaterial(password, salt);
    return importKeysFromMaterial(material);
};

// 5. Recovery Key Helpers
export const exportRecoveryKey = async (password: string, salt: string): Promise<string> => {
    const material = await deriveKeyMaterial(password, salt);
    return bufferToBase64(material);
};

export const importRecoveryKey = async (recoveryKey: string): Promise<CapsuleKeys> => {
    const material = base64ToBuffer(recoveryKey);
    if (material.byteLength !== 64) {
        throw new Error("Invalid recovery key length");
    }
    return importKeysFromMaterial(material);
};

// 3. Encrypt Data (AES-GCM + HMAC)
export const encryptCapsule = async (text: string, keys: CapsuleKeys): Promise<EncryptedContent> => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encoded = enc.encode(text);

    // Encrypt
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        keys.encKey,
        encoded
    );

    // HMAC (IV + Ciphertext)
    const dataToMac = new Uint8Array(iv.byteLength + ciphertextBuffer.byteLength);
    dataToMac.set(iv, 0);
    dataToMac.set(new Uint8Array(ciphertextBuffer), iv.byteLength);

    const hmacBuffer = await window.crypto.subtle.sign(
        "HMAC",
        keys.macKey,
        dataToMac
    );

    return {
        ciphertext: bufferToBase64(ciphertextBuffer),
        iv: bufferToBase64(iv.buffer),
        hmac: bufferToBase64(hmacBuffer),
    };
};

// 4. Decrypt Data (Verify HMAC + AES-GCM)
export const decryptCapsule = async (
    encrypted: EncryptedContent,
    keys: CapsuleKeys
): Promise<string> => {
    const ivBuffer = base64ToBuffer(encrypted.iv);
    const ciphertextBuffer = base64ToBuffer(encrypted.ciphertext);
    const hmacBuffer = base64ToBuffer(encrypted.hmac);

    // Verify HMAC
    const dataToVerify = new Uint8Array(ivBuffer.byteLength + ciphertextBuffer.byteLength);
    dataToVerify.set(new Uint8Array(ivBuffer), 0);
    dataToVerify.set(new Uint8Array(ciphertextBuffer), ivBuffer.byteLength);

    const isValid = await window.crypto.subtle.verify(
        "HMAC",
        keys.macKey,
        hmacBuffer,
        dataToVerify
    );

    if (!isValid) {
        throw new Error("Integrity check failed: HMAC invalid");
    }

    // Decrypt
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivBuffer,
        },
        keys.encKey,
        ciphertextBuffer
    );

    return dec.decode(decrypted);
};
