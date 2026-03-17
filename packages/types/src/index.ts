// @inkrypt/types — shared TypeScript interfaces
// AGPL-3.0-or-later — Copyright (C) 2025 Sachin-S543

export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    salt: string;         // 16-byte random salt for client-side KDF
    emailVerified: boolean;
    createdAt: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface Capsule {
    id: string;
    userId: string;
    encryptedTitle: string;
    encryptedContent: string;  // V2: JSON blob, V1: raw ciphertext
    iv: string;                // Base64 (legacy V1 field)
    salt: string;              // Base64 – per-capsule KDF salt
    hmac: string;              // Base64
    size: number;
    category: string;          // User-defined category string
    tags: string[];            // Array of tag strings
    createdAt: string;
    updatedAt: string;
    unlockAt?: string;
    aura?: string;
}

export interface OtpRecord {
    id: string;
    email: string;
    codeHash: string;    // bcrypt hash of the 6-digit code
    expiresAt: string;   // ISO date string
    used: boolean;
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    user: SafeUser;
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

export interface SendOtpRequest {
    email: string;
}

export interface VerifyOtpRequest {
    email: string;
    code: string;
}

export interface SignupRequest {
    email: string;
    username: string;
    password: string;
    otpCode: string;   // must be verified before account creation
}
