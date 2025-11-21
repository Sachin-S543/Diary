export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: string;
}

export interface DiaryEntry {
    id: string;
    userId: string;
    title: string; // Encrypted
    content: string; // Encrypted
    tags: string[]; // Encrypted or Plaintext (Privacy choice: Encrypted usually, but harder to search) -> Let's keep them encrypted for now, or plaintext for server-side filtering if user allows. Requirement says "client-side search", so encrypted is fine.
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ApiError {
    message: string;
    code?: string;
}

export interface EncryptedData {
    ciphertext: string; // Base64
    iv: string; // Base64
    salt: string; // Base64 (for key derivation if per-entry, but usually per-user)
}
