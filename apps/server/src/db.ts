import { Pool } from 'pg';
import { User, Capsule } from "@secret-capsule/types";
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize Tables
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password_hash TEXT,
                salt TEXT,
                created_at TEXT
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS capsules (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                encrypted_title TEXT,
                encrypted_content TEXT,
                iv TEXT,
                salt TEXT,
                hmac TEXT,
                size INTEGER,
                created_at TEXT,
                updated_at TEXT,
                unlock_at TEXT,
                aura TEXT
            );
        `);
        console.log("Database tables initialized successfully.");
    } catch (err) {
        console.error("Failed to initialize database tables:", err);
    }
};

initDb();

class PostgresDB {
    async findUserByEmail(email: string): Promise<User | undefined> {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length === 0) return undefined;
        return this.mapUser(res.rows[0]);
    }

    async findUserByUsername(username: string): Promise<User | undefined> {
        const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (res.rows.length === 0) return undefined;
        return this.mapUser(res.rows[0]);
    }

    async findUserById(id: string): Promise<User | undefined> {
        const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (res.rows.length === 0) return undefined;
        return this.mapUser(res.rows[0]);
    }

    async createUser(user: User): Promise<void> {
        await pool.query(
            `INSERT INTO users (id, username, email, password_hash, salt, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.id, user.username, user.email, user.passwordHash, user.salt, user.createdAt]
        );
    }

    async getCapsules(userId: string): Promise<Capsule[]> {
        const res = await pool.query('SELECT * FROM capsules WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows.map(this.mapCapsule);
    }

    async createCapsule(capsule: Capsule): Promise<void> {
        await pool.query(
            `INSERT INTO capsules (id, user_id, encrypted_title, encrypted_content, iv, salt, hmac, size, created_at, updated_at, unlock_at, aura)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                capsule.id,
                capsule.userId,
                capsule.encryptedTitle,
                capsule.encryptedContent,
                capsule.iv,
                capsule.salt,
                capsule.hmac,
                capsule.size,
                capsule.createdAt,
                capsule.updatedAt,
                capsule.unlockAt || null,
                capsule.aura || null
            ]
        );
    }

    async deleteCapsule(id: string): Promise<void> {
        await pool.query('DELETE FROM capsules WHERE id = $1', [id]);
    }

    async updateCapsule(capsule: Capsule): Promise<void> {
        await pool.query(
            `UPDATE capsules 
             SET encrypted_title = $1,
                 encrypted_content = $2,
                 iv = $3,
                 salt = $4,
                 hmac = $5,
                 size = $6,
                 updated_at = $7,
                 unlock_at = $8,
                 aura = $9
             WHERE id = $10`,
            [
                capsule.encryptedTitle,
                capsule.encryptedContent,
                capsule.iv,
                capsule.salt,
                capsule.hmac,
                capsule.size,
                capsule.updatedAt,
                capsule.unlockAt || null,
                capsule.aura || null,
                capsule.id
            ]
        );
    }

    // Helpers to map DB snake_case to TS camelCase
    private mapUser(row: any): User {
        return {
            id: row.id,
            username: row.username,
            email: row.email,
            passwordHash: row.password_hash,
            salt: row.salt,
            createdAt: row.created_at
        };
    }

    private mapCapsule(row: any): Capsule {
        return {
            id: row.id,
            userId: row.user_id,
            encryptedTitle: row.encrypted_title,
            encryptedContent: row.encrypted_content,
            iv: row.iv,
            salt: row.salt,
            hmac: row.hmac,
            size: row.size,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            unlockAt: row.unlock_at || undefined,
            aura: row.aura || undefined
        };
    }
}

export const db = new PostgresDB();
