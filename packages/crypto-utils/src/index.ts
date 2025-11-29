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

// 1. Generate Random Salt (128-bit)
export const generateSalt = (): string => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return bufferToBase64(salt.buffer);
};

// 2. Derive Key Material (512 bits)
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

// 4. Derive Keys (Standard Flow)
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
