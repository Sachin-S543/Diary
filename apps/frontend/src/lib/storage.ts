import { openDB, DBSchema } from 'idb';
import { Capsule } from '@secret-capsule/types';
import { V3VaultHeader } from '@secret-capsule/crypto-utils';

export interface PendingSyncItem {
    id?: number;
    action: 'create' | 'update' | 'delete';
    capsule: Capsule;
    timestamp: string;
}

interface InkryptLocalDB extends DBSchema {
    encrypted_cache: {
        key: string;
        value: Capsule;
        indexes: { 'by-date': string; 'by-updated': string };
    };
    pending_sync_queue: {
        key: number;
        value: PendingSyncItem;
        indexes: { 'by-timestamp': string };
    };
    vault_metadata: {
        key: string;
        value: V3VaultHeader;
    };
}

const DB_NAME = 'inkrypt_encrypted_local_cache';
const DB_VERSION = 3;

const dbPromise = openDB<InkryptLocalDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
        if (oldVersion < 2) {
            if (db.objectStoreNames.contains('capsules' as any)) {
                db.deleteObjectStore('capsules' as any);
            }
            if (db.objectStoreNames.contains('syncQueue' as any)) {
                db.deleteObjectStore('syncQueue' as any);
            }
        }

        if (!db.objectStoreNames.contains('encrypted_cache')) {
            const cacheStore = db.createObjectStore('encrypted_cache', { keyPath: 'id' });
            cacheStore.createIndex('by-date', 'createdAt');
            cacheStore.createIndex('by-updated', 'updatedAt');
        }

        if (!db.objectStoreNames.contains('pending_sync_queue')) {
            const queueStore = db.createObjectStore('pending_sync_queue', { keyPath: 'id', autoIncrement: true });
            queueStore.createIndex('by-timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('vault_metadata')) {
            db.createObjectStore('vault_metadata');
        }
    },
});

export const encryptedCache = {
    /**
     * Store encrypted entry in local IndexedDB cache
     */
    async putCapsule(capsule: Capsule): Promise<string> {
        const db = await dbPromise;
        await db.put('encrypted_cache', capsule);
        return capsule.id;
    },

    /**
     * Batch save multiple encrypted entries from server/Drive sync
     */
    async putAllCapsules(capsules: Capsule[]): Promise<void> {
        const db = await dbPromise;
        const tx = db.transaction('encrypted_cache', 'readwrite');
        await Promise.all([
            ...capsules.map(c => tx.store.put(c)),
            tx.done,
        ]);
    },

    /**
     * Retrieve all encrypted entries from local cache
     */
    async getAllEncryptedCapsules(): Promise<Capsule[]> {
        const db = await dbPromise;
        const all = await db.getAllFromIndex('encrypted_cache', 'by-updated');
        return all.filter(c => !c.deleted);
    },

    /**
     * Retrieve single encrypted capsule by ID
     */
    async getEncryptedCapsuleById(id: string): Promise<Capsule | undefined> {
        const db = await dbPromise;
        return db.get('encrypted_cache', id);
    },

    /**
     * Soft delete or remove encrypted entry
     */
    async deleteEncryptedCapsule(id: string): Promise<void> {
        const db = await dbPromise;
        const existing = await db.get('encrypted_cache', id);
        if (existing) {
            existing.deleted = true;
            existing.updatedAt = new Date().toISOString();
            await db.put('encrypted_cache', existing);
        }
    },

    /**
     * Enqueue offline mutation into pending sync queue
     */
    async queueOfflineMutation(action: 'create' | 'update' | 'delete', capsule: Capsule): Promise<number> {
        const db = await dbPromise;
        return db.add('pending_sync_queue', {
            action,
            capsule,
            timestamp: new Date().toISOString(),
        });
    },

    /**
     * Get all pending sync queue items ordered by timestamp
     */
    async getPendingSyncItems(): Promise<PendingSyncItem[]> {
        const db = await dbPromise;
        return db.getAllFromIndex('pending_sync_queue', 'by-timestamp');
    },

    /**
     * Clear specific pending sync queue item after successful upload
     */
    async removePendingSyncItem(queueId: number): Promise<void> {
        const db = await dbPromise;
        await db.delete('pending_sync_queue', queueId);
    },

    /**
     * Clear entire pending sync queue
     */
    async clearPendingSyncQueue(): Promise<void> {
        const db = await dbPromise;
        await db.clear('pending_sync_queue');
    },

    /**
     * Persist V3 Vault Header in local IndexedDB metadata store
     */
    async saveV3VaultHeader(header: V3VaultHeader): Promise<void> {
        const db = await dbPromise;
        await db.put('vault_metadata', header, 'v3_vault_header');
    },

    /**
     * Retrieve V3 Vault Header from local IndexedDB metadata store
     */
    async getV3VaultHeader(): Promise<V3VaultHeader | undefined> {
        const db = await dbPromise;
        return db.get('vault_metadata', 'v3_vault_header');
    },

    /**
     * Clear V3 Vault Header from local metadata store
     */
    async clearV3VaultHeader(): Promise<void> {
        const db = await dbPromise;
        await db.delete('vault_metadata', 'v3_vault_header');
    },

    /**
     * Purge local encrypted cache upon logout or lock
     */
    async purgeAllLocalCache(): Promise<void> {
        const db = await dbPromise;
        await db.clear('encrypted_cache');
        await db.clear('pending_sync_queue');
        await db.clear('vault_metadata');
    }
};

export const storage = {
    saveCapsule: (capsule: Capsule) => encryptedCache.putCapsule(capsule),
    getCapsules: () => encryptedCache.getAllEncryptedCapsules(),
    deleteCapsule: (id: string) => encryptedCache.deleteEncryptedCapsule(id),
    addToSyncQueue: (item: any) => encryptedCache.queueOfflineMutation(item.type, item.payload),
    getSyncQueue: () => encryptedCache.getPendingSyncItems(),
    clearSyncQueue: () => encryptedCache.clearPendingSyncQueue()
};

