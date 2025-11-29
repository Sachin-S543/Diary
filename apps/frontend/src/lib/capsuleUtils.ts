import { Capsule } from '@secret-capsule/types';

export interface V2CapsuleBlob {
    v: number;
    p: number; // 0 = Open Note, 1 = Password Protected
    c: string; // Content Ciphertext
    civ: string; // Content IV
    k: string; // Key Ciphertext (or raw key if p=0)
    kiv: string; // Key IV (empty if p=0)
}

export function parseV2Blob(encryptedContent: string): V2CapsuleBlob | null {
    try {
        if (encryptedContent.startsWith('{')) {
            const blob = JSON.parse(encryptedContent);
            if (blob.v === 2) return blob as V2CapsuleBlob;
        }
    } catch { }
    return null;
}

export function isPasswordProtected(capsule: Capsule): boolean {
    const blob = parseV2Blob(capsule.encryptedContent);
    if (blob) {
        return blob.p !== 0;
    }
    return true; // V1 is always password protected
}

export function fromBase64(str: string): Uint8Array {
    return new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
}

export function toBase64(arr: Uint8Array): string {
    return btoa(String.fromCharCode(...arr));
}
