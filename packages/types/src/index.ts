export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string; // bcrypt hash
    salt: string; // Random user salt for PBKDF2
    createdAt: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface Capsule {
    id: string;
    userId: string;
    encryptedTitle: string;
    encryptedContent: string;
    iv: string; // Base64
    salt: string; // Base64 (Per-capsule salt)
    hmac: string; // Base64 (HMAC-SHA256)
    createdAt: string;
    updatedAt: string;
    unlockAt?: string; // ISO Date string for time-lock
    size: number; // Size in bytes (approx)
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
    ciphertext: string;
    iv: string;
    salt: string;
    hmac: string;
}
