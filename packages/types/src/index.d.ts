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

export interface DecryptedEntryPayload {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
}

export interface Capsule {
    id: string;
    userId: string;
    encryptedPayload: string;  // Base64 ciphertext of DecryptedEntryPayload JSON
    iv: string;                // Base64 12-byte IV
    salt: string;              // Base64 per-entry salt
    hmac?: string;             // Optional HMAC for legacy v1 compatibility
    version: number;           // Payload format version (e.g., 2)
    rev: number;               // Monotonic revision counter for sync conflict resolution
    deleted: boolean;          // Soft-deletion flag for multi-device sync
    createdAt: string;
    updatedAt: string;
    unlockAt?: string;
    aura?: string;
    encryptedTitle?: string;
    encryptedContent?: string;
    size?: number;
    category?: string;
    tags?: string[];
}

export interface UserSession {
    id: string;
    userId: string;
    userAgent: string;
    ipAddress: string;
    expiresAt: string;
    createdAt: string;
    lastActiveAt: string;
    isCurrent?: boolean;
}

export interface OtpRecord {
    id: string;
    email: string;
    codeHash: string;
    expiresAt: string;
    used: boolean;
    attempts: number;
    createdAt: string;
}

export interface AuthResponse {
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
    otpCode: string;
}

export interface GoogleDriveConfig {
    connected: boolean;
    userEmail?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    lastSyncedAt?: string;
}

export type DriveSyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error' | 'revoked';

export interface V3VaultHeader {
    v: 3;
    vaultId: string;
    vaultSalt: string;
    encryptedVMK_pass: string;
    vmkPassIv: string;
    encryptedVMK_rec: string;
    vmkRecIv: string;
    updatedAt: string;
}

export interface V3CapsuleBlob {
    v: 3;
    p: number;
    c: string;
    civ: string;
    k: string;
    kiv: string;
}