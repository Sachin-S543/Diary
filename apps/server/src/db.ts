import Database from 'better-sqlite3';
import { User, Capsule } from "@secret-capsule/types";
import path from 'path';

const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH, 'database.sqlite')
    : path.resolve(__dirname, '../database.sqlite');
const sql = new Database(dbPath);

// Initialize Tables
sql.exec(`
    DROP TABLE IF EXISTS entries; -- Legacy
    
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        passwordHash TEXT,
        salt TEXT, -- User salt for client-side key derivation
        createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS capsules (
        id TEXT PRIMARY KEY,
        userId TEXT,
        encryptedTitle TEXT,
        encryptedContent TEXT,
        iv TEXT,
        salt TEXT,
        hmac TEXT,
        size INTEGER,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
    );
`);

class SQLiteDB {
    async findUserByEmail(email: string): Promise<User | undefined> {
        const stmt = sql.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email) as User | undefined;
    }

    async findUserByUsername(username: string): Promise<User | undefined> {
        const stmt = sql.prepare('SELECT * FROM users WHERE username = ?');
        return stmt.get(username) as User | undefined;
    }

    async findUserById(id: string): Promise<User | undefined> {
        const stmt = sql.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id) as User | undefined;
    }

    async createUser(user: User): Promise<void> {
        const stmt = sql.prepare(`
            INSERT INTO users (id, username, email, passwordHash, salt, createdAt)
            VALUES (@id, @username, @email, @passwordHash, @salt, @createdAt)
        `);
        stmt.run(user);
    }

    async getCapsules(userId: string): Promise<Capsule[]> {
        const stmt = sql.prepare('SELECT * FROM capsules WHERE userId = ? ORDER BY createdAt DESC');
        return stmt.all(userId) as Capsule[];
    }

    async createCapsule(capsule: Capsule): Promise<void> {
        const stmt = sql.prepare(`
            INSERT INTO capsules (id, userId, encryptedTitle, encryptedContent, iv, salt, hmac, size, createdAt, updatedAt)
            VALUES (@id, @userId, @encryptedTitle, @encryptedContent, @iv, @salt, @hmac, @size, @createdAt, @updatedAt)
        `);
        stmt.run(capsule);
    }

    async deleteCapsule(id: string): Promise<void> {
        const stmt = sql.prepare('DELETE FROM capsules WHERE id = ?');
        stmt.run(id);
    }

    async updateCapsule(capsule: Capsule): Promise<void> {
        const stmt = sql.prepare(`
            UPDATE capsules 
            SET encryptedTitle = @encryptedTitle,
                encryptedContent = @encryptedContent,
                iv = @iv,
                salt = @salt,
                hmac = @hmac,
                size = @size,
                updatedAt = @updatedAt
            WHERE id = @id
        `);
        stmt.run(capsule);
    }
}

export const db = new SQLiteDB();
