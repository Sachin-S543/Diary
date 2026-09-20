/*
 * Inkrypt
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { Pool } from 'pg';
import { User, Capsule, OtpRecord, UserSession, V3VaultHeader } from '@secret-capsule/types';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ─── Schema Initialization ─────────────────────────────────────────────────
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password_hash TEXT,
                salt TEXT,
                email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TEXT
            );
        `);

        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS capsules (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                encrypted_payload TEXT,
                encrypted_title TEXT,
                encrypted_content TEXT,
                iv TEXT,
                salt TEXT,
                hmac TEXT,
                size INTEGER,
                category TEXT NOT NULL DEFAULT '',
                tags TEXT NOT NULL DEFAULT '[]',
                version INTEGER NOT NULL DEFAULT 2,
                rev INTEGER NOT NULL DEFAULT 1,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TEXT,
                updated_at TEXT,
                unlock_at TEXT,
                aura TEXT
            );
        `);

        await pool.query(`ALTER TABLE capsules ADD COLUMN IF NOT EXISTS encrypted_payload TEXT;`);
        await pool.query(`ALTER TABLE capsules ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 2;`);
        await pool.query(`ALTER TABLE capsules ADD COLUMN IF NOT EXISTS rev INTEGER NOT NULL DEFAULT 1;`);
        await pool.query(`ALTER TABLE capsules ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;`);
        await pool.query(`ALTER TABLE capsules ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';`);
        await pool.query(`ALTER TABLE capsules ADD COLUMN IF NOT EXISTS tags TEXT NOT NULL DEFAULT '[]';`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS otps (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used BOOLEAN NOT NULL DEFAULT FALSE,
                attempts INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
        `);

        await pool.query(`ALTER TABLE otps ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                user_agent TEXT NOT NULL DEFAULT 'Unknown',
                ip_address TEXT NOT NULL DEFAULT 'Unknown',
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_active_at TEXT NOT NULL
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS vault_headers (
                user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                vault_id TEXT NOT NULL,
                vault_salt TEXT NOT NULL,
                encrypted_vmk_pass TEXT NOT NULL,
                vmk_pass_iv TEXT NOT NULL,
                encrypted_vmk_rec TEXT NOT NULL,
                vmk_rec_iv TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        `);

        // Clean up expired OTPs and sessions on startup
        const nowStr = new Date().toISOString();
        await pool.query(`DELETE FROM otps WHERE expires_at < $1`, [nowStr]);
        await pool.query(`DELETE FROM sessions WHERE expires_at < $1`, [nowStr]);

        console.log('[DB] Tables initialized successfully.');
    } catch (err) {
        console.error('[DB] Failed to initialize tables:', err);
    }
};

initDb();

// ─── Database Class ────────────────────────────────────────────────────────
class PostgresDB {
    // ── Users ──────────────────────────────────────────────────────────────
    async findUserByEmail(email: string): Promise<User | undefined> {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        return res.rows.length === 0 ? undefined : this.mapUser(res.rows[0]);
    }

    async findUserByUsername(username: string): Promise<User | undefined> {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
        return res.rows.length === 0 ? undefined : this.mapUser(res.rows[0]);
    }

    async findUserById(id: string): Promise<User | undefined> {
        const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return res.rows.length === 0 ? undefined : this.mapUser(res.rows[0]);
    }

    async createUser(user: User): Promise<void> {
        await pool.query(
            `INSERT INTO users (id, username, email, password_hash, salt, email_verified, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [user.id, user.username, user.email, user.passwordHash, user.salt, user.emailVerified, user.createdAt]
        );
    }

    async setEmailVerified(email: string): Promise<void> {
        await pool.query('UPDATE users SET email_verified = TRUE WHERE LOWER(email) = LOWER($1)', [email]);
    }

    // ── OTPs ───────────────────────────────────────────────────────────────
    async createOtp(record: OtpRecord): Promise<void> {
        await pool.query('UPDATE otps SET used = TRUE WHERE email = LOWER($1) AND used = FALSE', [record.email]);
        await pool.query(
            `INSERT INTO otps (id, email, code_hash, expires_at, used, attempts, created_at)
             VALUES ($1, LOWER($2), $3, $4, $5, $6, $7)`,
            [record.id, record.email, record.codeHash, record.expiresAt, record.used, record.attempts || 0, record.createdAt]
        );
    }

    async findLatestOtp(email: string): Promise<OtpRecord | undefined> {
        const res = await pool.query(
            `SELECT * FROM otps WHERE email = LOWER($1) AND used = FALSE ORDER BY created_at DESC LIMIT 1`,
            [email]
        );
        return res.rows.length === 0 ? undefined : this.mapOtp(res.rows[0]);
    }

    async incrementOtpAttempts(id: string): Promise<number> {
        const res = await pool.query(
            `UPDATE otps SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts`,
            [id]
        );
        return res.rows[0]?.attempts || 0;
    }

    async markOtpUsed(id: string): Promise<void> {
        await pool.query('UPDATE otps SET used = TRUE WHERE id = $1', [id]);
    }

    // ── Sessions ───────────────────────────────────────────────────────────
    async createSession(session: UserSession): Promise<void> {
        await pool.query(
            `INSERT INTO sessions (id, user_id, user_agent, ip_address, expires_at, created_at, last_active_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                session.id,
                session.userId,
                session.userAgent || 'Unknown',
                session.ipAddress || 'Unknown',
                session.expiresAt,
                session.createdAt,
                session.lastActiveAt,
            ]
        );
    }

    async findSessionById(id: string): Promise<UserSession | undefined> {
        const res = await pool.query('SELECT * FROM sessions WHERE id = $1 AND expires_at > $2', [id, new Date().toISOString()]);
        return res.rows.length === 0 ? undefined : this.mapSession(res.rows[0]);
    }

    async findSessionsByUserId(userId: string): Promise<UserSession[]> {
        const res = await pool.query(
            'SELECT * FROM sessions WHERE user_id = $1 AND expires_at > $2 ORDER BY last_active_at DESC',
            [userId, new Date().toISOString()]
        );
        return res.rows.map(this.mapSession);
    }

    async updateSessionLastActive(id: string): Promise<void> {
        await pool.query('UPDATE sessions SET last_active_at = $1 WHERE id = $2', [new Date().toISOString(), id]);
    }

    async deleteSession(id: string, userId?: string): Promise<void> {
        if (userId) {
            await pool.query('DELETE FROM sessions WHERE id = $1 AND user_id = $2', [id, userId]);
        } else {
            await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
        }
    }

    async deleteAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
        await pool.query('DELETE FROM sessions WHERE user_id = $1 AND id != $2', [userId, currentSessionId]);
    }

    async deleteAllSessionsForUser(userId: string): Promise<void> {
        await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    }

    // ── Capsules ───────────────────────────────────────────────────────────
    async getCapsules(userId: string, filters?: { category?: string; tag?: string }): Promise<Capsule[]> {
        let query = 'SELECT * FROM capsules WHERE user_id = $1';
        const params: any[] = [userId];

        if (filters?.category) {
            params.push(filters.category);
            query += ` AND category = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC';
        const res = await pool.query(query, params);

        let capsules = res.rows.map(this.mapCapsule);

        if (filters?.tag) {
            capsules = capsules.filter(c => c.tags?.includes(filters.tag!));
        }

        return capsules;
    }

    async getCapsuleById(id: string, userId: string): Promise<Capsule | undefined> {
        const res = await pool.query('SELECT * FROM capsules WHERE id = $1 AND user_id = $2', [id, userId]);
        return res.rows.length === 0 ? undefined : this.mapCapsule(res.rows[0]);
    }

    async createCapsule(capsule: Capsule): Promise<void> {
        await pool.query(
            `INSERT INTO capsules
             (id, user_id, encrypted_payload, encrypted_title, encrypted_content, iv, salt, hmac, size, category, tags, version, rev, deleted, created_at, updated_at, unlock_at, aura)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
            [
                capsule.id, capsule.userId,
                capsule.encryptedPayload || '',
                capsule.encryptedTitle || '',
                capsule.encryptedContent || '',
                capsule.iv, capsule.salt, capsule.hmac || '', capsule.size || 0,
                capsule.category || '',
                JSON.stringify(capsule.tags || []),
                capsule.version || 2,
                capsule.rev || 1,
                capsule.deleted || false,
                capsule.createdAt, capsule.updatedAt,
                capsule.unlockAt || null, capsule.aura || null,
            ]
        );
    }

    async updateCapsule(capsule: Capsule): Promise<void> {
        await pool.query(
            `UPDATE capsules SET
                encrypted_payload=$1, encrypted_title=$2, encrypted_content=$3, iv=$4, salt=$5, hmac=$6,
                size=$7, category=$8, tags=$9, version=$10, rev=$11, deleted=$12, updated_at=$13, unlock_at=$14, aura=$15
             WHERE id=$16 AND user_id=$17`,
            [
                capsule.encryptedPayload || '',
                capsule.encryptedTitle || '', capsule.encryptedContent || '', capsule.iv, capsule.salt,
                capsule.hmac || '', capsule.size || 0, capsule.category || '',
                JSON.stringify(capsule.tags || []),
                capsule.version || 2,
                capsule.rev || 1,
                capsule.deleted || false,
                capsule.updatedAt, capsule.unlockAt || null, capsule.aura || null,
                capsule.id, capsule.userId,
            ]
        );
    }

    async deleteCapsule(id: string, userId: string): Promise<void> {
        // Soft-delete to preserve sync revocation state across clients
        await pool.query('UPDATE capsules SET deleted = TRUE, updated_at = $1 WHERE id = $2 AND user_id = $3', [new Date().toISOString(), id, userId]);
    }

    async getUserCategories(userId: string): Promise<string[]> {
        const res = await pool.query(
            `SELECT DISTINCT category FROM capsules WHERE user_id = $1 AND category != '' AND deleted = FALSE ORDER BY category`,
            [userId]
        );
        return res.rows.map(r => r.category);
    }

    async getUserTags(userId: string): Promise<string[]> {
        const res = await pool.query(
            `SELECT DISTINCT tags FROM capsules WHERE user_id = $1 AND deleted = FALSE`,
            [userId]
        );
        const allTags = new Set<string>();
        for (const row of res.rows) {
            const tags: string[] = JSON.parse(row.tags || '[]');
            tags.forEach(t => allTags.add(t));
        }
        return Array.from(allTags).sort();
    }

    // ── Vault Headers (V3) ──────────────────────────────────────────────────
    async getVaultHeader(userId: string): Promise<V3VaultHeader | undefined> {
        const res = await pool.query('SELECT * FROM vault_headers WHERE user_id = $1', [userId]);
        return res.rows.length === 0 ? undefined : this.mapVaultHeader(res.rows[0]);
    }

    async saveVaultHeader(userId: string, header: V3VaultHeader): Promise<void> {
        await pool.query(
            `INSERT INTO vault_headers (user_id, vault_id, vault_salt, encrypted_vmk_pass, vmk_pass_iv, encrypted_vmk_rec, vmk_rec_iv, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (user_id) DO UPDATE SET
                vault_id = EXCLUDED.vault_id,
                vault_salt = EXCLUDED.vault_salt,
                encrypted_vmk_pass = EXCLUDED.encrypted_vmk_pass,
                vmk_pass_iv = EXCLUDED.vmk_pass_iv,
                encrypted_vmk_rec = EXCLUDED.encrypted_vmk_rec,
                vmk_rec_iv = EXCLUDED.vmk_rec_iv,
                updated_at = EXCLUDED.updated_at`,
            [
                userId,
                header.vaultId,
                header.vaultSalt,
                header.encryptedVMK_pass,
                header.vmkPassIv,
                header.encryptedVMK_rec,
                header.vmkRecIv,
                header.updatedAt,
            ]
        );
    }

    // ── Mappers ────────────────────────────────────────────────────────────
    private mapVaultHeader(row: any): V3VaultHeader {
        return {
            v: 3,
            vaultId: row.vault_id,
            vaultSalt: row.vault_salt,
            encryptedVMK_pass: row.encrypted_vmk_pass,
            vmkPassIv: row.vmk_pass_iv,
            encryptedVMK_rec: row.encrypted_vmk_rec,
            vmkRecIv: row.vmk_rec_iv,
            updatedAt: row.updated_at,
        };
    }
    private mapUser(row: any): User {
        return {
            id: row.id,
            username: row.username,
            email: row.email,
            passwordHash: row.password_hash,
            salt: row.salt,
            emailVerified: row.email_verified,
            createdAt: row.created_at,
        };
    }

    private mapOtp(row: any): OtpRecord {
        return {
            id: row.id,
            email: row.email,
            codeHash: row.code_hash,
            expiresAt: row.expires_at,
            used: row.used,
            attempts: row.attempts || 0,
            createdAt: row.created_at,
        };
    }

    private mapSession(row: any): UserSession {
        return {
            id: row.id,
            userId: row.user_id,
            userAgent: row.user_agent,
            ipAddress: row.ip_address,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            lastActiveAt: row.last_active_at,
        };
    }

    private mapCapsule(row: any): Capsule {
        let tags: string[] = [];
        try { tags = JSON.parse(row.tags || '[]'); } catch { tags = []; }
        return {
            id: row.id,
            userId: row.user_id,
            encryptedPayload: row.encrypted_payload || '',
            encryptedTitle: row.encrypted_title,
            encryptedContent: row.encrypted_content,
            iv: row.iv,
            salt: row.salt,
            hmac: row.hmac,
            size: row.size,
            category: row.category || '',
            tags,
            version: row.version || 2,
            rev: row.rev || 1,
            deleted: row.deleted || false,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            unlockAt: row.unlock_at || undefined,
            aura: row.aura || undefined,
        };
    }
}

export const db = new PostgresDB();

