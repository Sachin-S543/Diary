import Database from 'better-sqlite3';
import { User, DiaryEntry } from "@secret-capsule/types";
import path from 'path';

const dbPath = path.resolve(__dirname, '../database.sqlite');
const sql = new Database(dbPath);

// Initialize Tables
sql.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        passwordHash TEXT,
        createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        userId TEXT,
        title TEXT,
        content TEXT,
        tags TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
    );
`);

class SQLiteDB {
    async findUserByEmail(email: string): Promise<User & { passwordHash: string } | undefined> {
        const stmt = sql.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email) as User & { passwordHash: string } | undefined;
    }

    async findUserByUsername(username: string): Promise<User & { passwordHash: string } | undefined> {
        const stmt = sql.prepare('SELECT * FROM users WHERE username = ?');
        return stmt.get(username) as User & { passwordHash: string } | undefined;
    }

    async findUserById(id: string): Promise<User & { passwordHash: string } | undefined> {
        const stmt = sql.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id) as User & { passwordHash: string } | undefined;
    }

    async createUser(user: User, passwordHash: string): Promise<void> {
        const stmt = sql.prepare(`
            INSERT INTO users (id, username, email, passwordHash, createdAt)
            VALUES (@id, @username, @email, @passwordHash, @createdAt)
        `);
        stmt.run({ ...user, passwordHash });
    }

    async getEntries(userId: string): Promise<DiaryEntry[]> {
        const stmt = sql.prepare('SELECT * FROM entries WHERE userId = ? ORDER BY createdAt DESC');
        const rows = stmt.all(userId) as any[];
        return rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
        }));
    }

    async createEntry(entry: DiaryEntry): Promise<void> {
        const stmt = sql.prepare(`
            INSERT INTO entries (id, userId, title, content, tags, createdAt, updatedAt)
            VALUES (@id, @userId, @title, @content, @tags, @createdAt, @updatedAt)
        `);
        stmt.run({
            ...entry,
            tags: JSON.stringify(entry.tags)
        });
    }
}

export const db = new SQLiteDB();
