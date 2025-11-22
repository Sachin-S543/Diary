import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { User, DiaryEntry } from '@secret-capsule/types';
import bcrypt from 'bcryptjs';

interface DiaryDB extends DBSchema {
    users: {
        key: string;
        value: User & { passwordHash: string };
        indexes: { 'by-email': string; 'by-username': string };
    };
    entries: {
        key: string;
        value: DiaryEntry;
        indexes: { 'by-user': string };
    };
}

class ClientDatabase {
    private dbPromise: Promise<IDBPDatabase<DiaryDB>>;

    constructor() {
        this.dbPromise = openDB<DiaryDB>('secret-capsule-db', 1, {
            upgrade(db) {
                // Users store
                const userStore = db.createObjectStore('users', { keyPath: 'id' });
                userStore.createIndex('by-email', 'email', { unique: true });
                userStore.createIndex('by-username', 'username', { unique: true });

                // Entries store
                const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
                entryStore.createIndex('by-user', 'userId');
            },
        });
    }

    // User operations
    async createUser(user: User, password: string): Promise<void> {
        const db = await this.dbPromise;
        const passwordHash = await bcrypt.hash(password, 10);
        await db.add('users', { ...user, passwordHash });
    }

    async findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | undefined> {
        const db = await this.dbPromise;
        return await db.getFromIndex('users', 'by-email', email);
    }

    async findUserByUsername(username: string): Promise<(User & { passwordHash: string }) | undefined> {
        const db = await this.dbPromise;
        return await db.getFromIndex('users', 'by-username', username);
    }

    async findUserById(id: string): Promise<(User & { passwordHash: string }) | undefined> {
        const db = await this.dbPromise;
        return await db.get('users', id);
    }

    async verifyPassword(storedHash: string, password: string): Promise<boolean> {
        return await bcrypt.compare(password, storedHash);
    }

    // Entry operations
    async createEntry(entry: DiaryEntry): Promise<void> {
        const db = await this.dbPromise;
        await db.add('entries', entry);
    }

    async getEntries(userId: string): Promise<DiaryEntry[]> {
        const db = await this.dbPromise;
        const entries = await db.getAllFromIndex('entries', 'by-user', userId);
        return entries.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    async deleteEntry(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('entries', id);
    }

    async updateEntry(entry: DiaryEntry): Promise<void> {
        const db = await this.dbPromise;
        await db.put('entries', entry);
    }
}

export const clientDb = new ClientDatabase();
