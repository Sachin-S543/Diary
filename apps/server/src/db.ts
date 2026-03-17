/*
 * Inkrypt
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { Pool } from 'pg';
import { User, Capsule, OtpRecord } from '@secret-capsule/types';
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

        // Add email_verified column if migrating from old schema
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS capsules (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                encrypted_title TEXT,
                encrypted_content TEXT,
                iv TEXT,
                salt TEXT,
                hmac TEXT,
                size INTEGER,
                category TEXT NOT NULL DEFAULT '',
                tags TEXT NOT NULL DEFAULT '[]',
                created_at TEXT,
                updated_at TEXT,
                unlock_at TEXT,
                aura TEXT
            );
        `);

        // Migrate existing capsules tables that may lack category/tags
        await pool.query(`ALTER TABLE capsules ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';`);
        await pool.query(`ALTER TABLE capsules ADD COLUMN IF NOT EXISTS tags TEXT NOT NULL DEFAULT '[]';`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS otps (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TEXT NOT NULL
            );
        `);

        // Clean up expired OTPs on startup
        await pool.query(`DELETE FROM otps WHERE expires_at < $1`, [new Date().toISOString()]);

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
        // Invalidate any previous unused OTPs for this email
        await pool.query('UPDATE otps SET used = TRUE WHERE email = LOWER($1) AND used = FALSE', [record.email]);
        await pool.query(
            `INSERT INTO otps (id, email, code_hash, expires_at, used, created_at)
             VALUES ($1, LOWER($2), $3, $4, $5, $6)`,
            [record.id, record.email, record.codeHash, record.expiresAt, record.used, record.createdAt]
        );
    }

    async findLatestOtp(email: string): Promise<OtpRecord | undefined> {
        const res = await pool.query(
            `SELECT * FROM otps WHERE email = LOWER($1) AND used = FALSE ORDER BY created_at DESC LIMIT 1`,
            [email]
        );
        return res.rows.length === 0 ? undefined : this.mapOtp(res.rows[0]);
    }

    async markOtpUsed(id: string): Promise<void> {
        await pool.query('UPDATE otps SET used = TRUE WHERE id = $1', [id]);
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

        // Tag filtering (done in app layer since tags are stored as JSON)
        if (filters?.tag) {
            capsules = capsules.filter(c => c.tags.includes(filters.tag!));
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
             (id, user_id, encrypted_title, encrypted_content, iv, salt, hmac, size, category, tags, created_at, updated_at, unlock_at, aura)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [
                capsule.id, capsule.userId, capsule.encryptedTitle, capsule.encryptedContent,
                capsule.iv, capsule.salt, capsule.hmac, capsule.size,
                capsule.category || '',
                JSON.stringify(capsule.tags || []),
                capsule.createdAt, capsule.updatedAt,
                capsule.unlockAt || null, capsule.aura || null,
            ]
        );
    }

    async updateCapsule(capsule: Capsule): Promise<void> {
        await pool.query(
            `UPDATE capsules SET
                encrypted_title=$1, encrypted_content=$2, iv=$3, salt=$4, hmac=$5,
                size=$6, category=$7, tags=$8, updated_at=$9, unlock_at=$10, aura=$11
             WHERE id=$12 AND user_id=$13`,
            [
                capsule.encryptedTitle, capsule.encryptedContent, capsule.iv, capsule.salt,
                capsule.hmac, capsule.size, capsule.category || '',
                JSON.stringify(capsule.tags || []),
                capsule.updatedAt, capsule.unlockAt || null, capsule.aura || null,
                capsule.id, capsule.userId,
            ]
        );
    }

    async deleteCapsule(id: string, userId: string): Promise<void> {
        await pool.query('DELETE FROM capsules WHERE id = $1 AND user_id = $2', [id, userId]);
    }

    async getUserCategories(userId: string): Promise<string[]> {
        const res = await pool.query(
            `SELECT DISTINCT category FROM capsules WHERE user_id = $1 AND category != '' ORDER BY category`,
            [userId]
        );
        return res.rows.map(r => r.category);
    }

    async getUserTags(userId: string): Promise<string[]> {
        const res = await pool.query(
            `SELECT DISTINCT tags FROM capsules WHERE user_id = $1`,
            [userId]
        );
        const allTags = new Set<string>();
        for (const row of res.rows) {
            const tags: string[] = JSON.parse(row.tags || '[]');
            tags.forEach(t => allTags.add(t));
        }
        return Array.from(allTags).sort();
    }

    // ── Mappers ────────────────────────────────────────────────────────────
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
            createdAt: row.created_at,
        };
    }

    private mapCapsule(row: any): Capsule {
        let tags: string[] = [];
        try { tags = JSON.parse(row.tags || '[]'); } catch { tags = []; }
        return {
            id: row.id,
            userId: row.user_id,
            encryptedTitle: row.encrypted_title,
            encryptedContent: row.encrypted_content,
            iv: row.iv,
            salt: row.salt,
            hmac: row.hmac,
            size: row.size,
            category: row.category || '',
            tags,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            unlockAt: row.unlock_at || undefined,
            aura: row.aura || undefined,
        };
    }
}

export const db = new PostgresDB();
